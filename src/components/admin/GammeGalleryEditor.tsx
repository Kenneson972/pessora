import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatMutationError, formatSupabaseDataError } from '../../lib/userFacingError';
import { BeforeAfterPairsField } from './BeforeAfterPairsField';
import { paireComplete, type BeforeAfterPair } from '../../lib/beforeAfter';
import { supprimerFichiersRetires } from '../../lib/storageCleanup';

type GammeKey = 'sport' | 'skin' | 'wellness';

const LABELS: Record<GammeKey, string> = {
  sport: 'Sport',
  skin: 'Skin',
  wellness: 'Wellness',
};

/**
 * Écran de dépôt — avant/après apparié d'une gamme.
 *
 * Catherine dépose **deux photos de la même personne** (avant, après) depuis son admin,
 * et nulle part ailleurs : ce n'est PAS la galerie des produits (`gamme_products.gallery`,
 * les flacons). Si on confondait les deux, ses crèmes s'afficheraient sous le titre
 * « Photos partagées par les participant·es » — une erreur qui se voit chez elle et pas
 * chez nous.
 *
 * Trois principes, chacun vérifiable à l'écran :
 * - **la consigne d'accord vit ici**, là où elle téléverse (autorisation écrite, même
 *   lumière / même angle / même distance, aucune légende qui promette un résultat) ;
 * - **une paire incomplète ne se publie pas** — et l'écran le dit au moment du dépôt
 *   plutôt que de laisser dormir une moitié en silence ;
 * - **rien n'est publié tant qu'aucune paire n'est complète** : le bloc reste invisible
 *   sur la page. On le dit, parce que c'est la question qu'elle se posera.
 *
 * Lecture en `maybeSingle()` (pas `.single()`) : la ligne peut être absente et `.single()`
 * jetterait. Côté admin, une erreur de lecture DOIT se voir : le visiteur a le droit de
 * ne rien voir, pas Catherine.
 */
export function GammeGalleryEditor({ gamme }: { gamme: GammeKey }) {
  const [pairs, setPairs] = useState<BeforeAfterPair[]>([]);
  /** Ce qui est RÉELLEMENT en base — sert à savoir quels fichiers sont devenus orphelins. */
  const [pairesEnregistrees, setPairesEnregistrees] = useState<BeforeAfterPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: readError } = await (supabase as any)
      .from('gamme_galleries')
      .select('pairs')
      .eq('gamme', gamme)
      .maybeSingle();
    if (readError) {
      setError(formatSupabaseDataError(readError.message));
      setPairs([]);
    } else {
      const brut = Array.isArray(data?.pairs) ? data!.pairs : [];
      // on garde les paires telles quelles (même incomplètes : c'est SON travail en
      // cours, on ne lui supprime rien) — c'est l'affichage public qui filtre.
      const chargees = (brut as unknown[])
        .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
        .map((p) => ({
          avant: typeof p.avant === 'string' ? p.avant : '',
          apres: typeof p.apres === 'string' ? p.apres : '',
          legende: typeof p.legende === 'string' && p.legende ? p.legende : null,
        }));
      setPairs(chargees);
      setPairesEnregistrees(chargees);
    }
    setLoading(false);
  }, [gamme]);

  useEffect(() => {
    void load();
  }, [load]);

  const completes = pairs.filter(paireComplete).length;

  const save = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    setSaved(false);
    // on n'enregistre QUE des paires complètes : une moitié ne doit pas partir en base
    // sans que l'écran l'ait dit.
    const aEcrire = pairs.filter(paireComplete);
    const urlsAvant = pairesEnregistrees.flatMap((p) => [p.avant, p.apres]).filter(Boolean);
    const urlsApres = aEcrire.flatMap((p) => [p.avant, p.apres]).filter(Boolean);
    const { error: writeError } = await (supabase as any)
      .from('gamme_galleries')
      .upsert({ gamme, pairs: aEcrire }, { onConflict: 'gamme' });
    if (writeError) {
      setSaving(false);
      setError(formatMutationError(writeError.message));
      return;
    }

    // Dépublication faite. Reste à **effacer** les fichiers retirés : sans ça, la photo
    // disparaît de la page mais reste téléchargeable par son URL — et la feuille signée
    // promet un « retrait à tout moment ». Mesuré @vela : la policy admin suffit.
    try {
      const effaces = await supprimerFichiersRetires('gamme-gallery-images', urlsAvant, urlsApres);
      if (effaces.length > 0) {
        setInfo(
          `${effaces.length} fichier${effaces.length > 1 ? 's' : ''} retiré${effaces.length > 1 ? 's' : ''} du stockage.`,
        );
      }
      // l'état de référence ne bouge QUE si l'effacement a réussi : sinon un nouvel
      // enregistrement doit recalculer le même écart et retenter l'effacement.
      setPairesEnregistrees(aEcrire);
    } catch (err) {
      setError(
        'Enregistré, mais les photos retirées n’ont pas pu être effacées du stockage. ' +
          'Réenregistre pour retenter — tant que ça n’a pas abouti, elles restent téléchargeables par leur lien. ' +
          `(${err instanceof Error ? formatMutationError(err.message) : 'erreur inconnue'})`,
      );
    }

    setPairs(aEcrire);
    setSaving(false);
    setSaved(true);
  };

  const incompletes = pairs.length - completes;

  return (
    <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/60">
        Avant / après — gamme {LABELS[gamme]}
      </p>
      <p className="mb-4 mt-2 text-[11px] font-normal leading-relaxed text-black/60">
        Deux photos de la <strong className="font-normal">même personne</strong>, prises sous la même
        lumière, le même angle et à la même distance. Demande l'accord écrit avant de les envoyer, et
        écris une légende qui décrit le <strong className="font-normal">protocole suivi</strong> —
        jamais un résultat. Ces photos s'affichent en bas de la page « {LABELS[gamme]} », visibles par
        tout le monde.
      </p>

      {loading ? (
        <p className="text-[11px] font-normal text-black/60">Chargement…</p>
      ) : (
        <BeforeAfterPairsField value={pairs} gamme={gamme} onChange={(p) => { setPairs(p); setSaved(false); }} />
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] leading-snug text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-sapin px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-sapin/90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && <span className="text-[11px] font-normal text-sapin">Enregistré.</span>}
        {info && <span className="text-[11px] font-normal text-black/60">{info}</span>}
        {!loading && completes === 0 && !saved && (
          <span className="text-[11px] font-normal text-black/60">
            Aucune paire complète : rien n'apparaît encore sur le site.
          </span>
        )}
        {incompletes > 0 && (
          <span className="text-[11px] font-normal text-black/60">
            {incompletes} paire{incompletes > 1 ? 's' : ''} incomplète{incompletes > 1 ? 's' : ''} :
            elle{incompletes > 1 ? 's' : ''} ne ser{incompletes > 1 ? 'ont' : 'a'} pas enregistrée
            {incompletes > 1 ? 's' : ''}.
          </span>
        )}
      </div>
    </div>
  );
}

export default GammeGalleryEditor;
