import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatMutationError, formatSupabaseDataError } from '../../lib/userFacingError';
import { GalleryField } from './GalleryField';

type GammeKey = 'sport' | 'skin' | 'wellness';

const LABELS: Record<GammeKey, string> = {
  sport: 'Sport',
  skin: 'Skin',
  wellness: 'Wellness',
};

/**
 * Écran de dépôt — photos partagées d'une gamme (avant/après).
 *
 * Catherine dépose et retire ses photos ICI, et nulle part ailleurs : sa galerie
 * n'est PAS celle des produits (`gamme_products.gallery`, les flacons). Si on
 * confondait les deux, ses crèmes s'afficheraient sous le titre « Photos partagées
 * par les participant·es » — une erreur qui se voit chez elle et pas chez nous.
 *
 * Deux principes :
 * - **la consigne d'accord vit ici**, à l'endroit où elle téléverse (pas dans un
 *   commentaire de code que personne ne lit) ;
 * - **rien n'est publié tant qu'elle n'a rien mis** — le bloc reste invisible sur la
 *   page, il n'y a jamais de cadre vide. Le dire ici, parce que c'est la question
 *   qu'elle se posera : « pourquoi je ne vois rien sur le site ? ».
 *
 * La lecture est en `maybeSingle()` (pas `.single()`) : la ligne peut être absente
 * (elle est pré-créée vide par la migration, mais un DELETE admin est autorisé) et
 * `.single()` jetterait. Ici, absent = liste vide, jamais une erreur à l'écran.
 */
export function GammeGalleryEditor({ gamme }: { gamme: GammeKey }) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: readError } = await (supabase as any)
      .from('gamme_galleries')
      .select('gallery')
      .eq('gamme', gamme)
      .maybeSingle();
    if (readError) {
      // ici, l'erreur DOIT se voir : le visiteur a le droit de ne rien voir, pas
      // Catherine — sinon elle dépose dans le vide sans comprendre pourquoi.
      setError(formatSupabaseDataError(readError.message));
      setGallery([]);
    } else {
      setGallery(Array.isArray(data?.gallery) ? (data!.gallery as string[]).filter(Boolean) : []);
    }
    setLoading(false);
  }, [gamme]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: writeError } = await (supabase as any)
      .from('gamme_galleries')
      .upsert({ gamme, gallery }, { onConflict: 'gamme' });
    setSaving(false);
    if (writeError) {
      setError(formatMutationError(writeError.message));
      return;
    }
    setSaved(true);
  };

  return (
    <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/60">
        Photos partagées — gamme {LABELS[gamme]}
      </p>
      <p className="mb-4 mt-2 text-[11px] font-light leading-relaxed text-black/60">
        Ces photos s'affichent en bas de la page « {LABELS[gamme]} », visibles par tout le monde.
        Demande l'accord des personnes avant de les envoyer, et n'affiche jamais de résultat chiffré
        (poids, centimètres, durée). Pour lire un avant/après, les deux photos doivent être prises
        sous la même lumière, le même angle et à la même distance.
      </p>

      {loading ? (
        <p className="text-[11px] font-light text-black/60">Chargement…</p>
      ) : (
        <GalleryField
          value={gallery}
          bucket="gamme-gallery-images"
          pathPrefix={`gammes/${gamme}`}
          label="Photos de la gamme"
          hint="Photos réelles de participantes uniquement — jamais de banque d'images. Tant qu'il n'y a aucune photo enregistrée, le bloc reste invisible sur la page."
          onChange={(urls) => {
            setGallery(urls);
            setSaved(false);
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] leading-snug text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-sapin px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-sapin/90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && <span className="text-[11px] font-light text-sapin">Enregistré.</span>}
        {!loading && gallery.length === 0 && !saved && (
          <span className="text-[11px] font-light text-black/60">
            Aucune photo : le bloc n'apparaît pas encore sur le site.
          </span>
        )}
      </div>
    </div>
  );
}

export default GammeGalleryEditor;
