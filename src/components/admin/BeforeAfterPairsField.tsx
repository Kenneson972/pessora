import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadPublicImage } from '../../lib/storageUpload';
import { formatMutationError } from '../../lib/userFacingError';
import { toJpegSiHeic } from '../../lib/heicToJpeg';
import { paireComplete, type BeforeAfterPair } from '../../lib/beforeAfter';

const PAIRES_MAX = 6;
const labelBase = 'text-[10px] font-medium uppercase tracking-[0.2em] text-black/60';

/**
 * Un emplacement photo — « AVANT » ou « APRÈS ».
 *
 * L'étiquette est écrite **dans l'emplacement de son image** : c'est ce qui rend
 * impossible d'attacher « Avant » au fichier d'après. Un avant/après inversé ne se voit
 * pas en relecture et se voit publiquement — donc l'écran ne doit pas pouvoir le produire
 * par étourderie.
 */
function Emplacement({
  etiquette,
  pathPrefix,
  url,
  onUrl,
  onError,
}: {
  etiquette: string;
  pathPrefix: string;
  url: string;
  onUrl: (url: string) => void;
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    onError(null);
    try {
      onUrl(await uploadPublicImage('gamme-gallery-images', await toJpegSiHeic(file), pathPrefix));
    } catch (err) {
      onError(err instanceof Error ? formatMutationError(err.message) : 'Envoi impossible. Réessaie.');
    }
    setUploading(false);
  };

  return (
    <div className="min-w-0">
      <p className={`${labelBase} mb-1.5`}>{etiquette}</p>
      {url ? (
        <div className="group relative aspect-square overflow-hidden rounded-[2px] border border-noir/[0.06] bg-surface-muted">
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onUrl('')}
            aria-label={`Retirer la photo ${etiquette.toLowerCase()}`}
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-red-600 opacity-0 backdrop-blur-[2px] transition-opacity hover:bg-red-600 hover:text-white group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={11} strokeWidth={1.6} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-noir/15 bg-white text-black/60 transition-colors hover:border-noir/30 hover:text-noir disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ImagePlus size={18} strokeWidth={1.5} />
          )}
          <span className="text-[11px] font-light">{uploading ? 'Envoi…' : 'Ajouter'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        className="sr-only"
        disabled={uploading}
        onChange={handleFile}
      />
    </div>
  );
}

/**
 * Dépôt d'un avant/après — **une paire à la fois**, deux photos de la même personne.
 *
 * Le dépôt se fait par paire (et non photo par photo) parce que c'est la paire qui est
 * vraie ou fausse : une photo seule ne dit pas de qui elle est. Si l'une des deux manque,
 * l'écran le dit **ici** — et le bloc public ne publiera rien (une seule photo présentée
 * comme un avant/après serait exactement le faux qu'on veut éviter).
 */
export function BeforeAfterPairsField({
  value,
  gamme,
  onChange,
}: {
  value: BeforeAfterPair[];
  gamme: string;
  onChange: (pairs: BeforeAfterPair[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const majPaire = (index: number, champ: 'avant' | 'apres' | 'legende', v: string) =>
    onChange(
      value.map((p, i) =>
        i === index
          ? { ...p, [champ]: champ === 'legende' ? v || null : v }
          : p,
      ),
    );

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-[13px] leading-snug text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-6">
        {value.map((paire, index) => {
          const complete = paireComplete(paire);
          return (
            <div key={index} className="rounded-[2px] border border-noir/[0.06] p-4">
              <div className="grid grid-cols-2 gap-3">
                <Emplacement
                  etiquette="Avant"
                  pathPrefix={`gammes/${gamme}/avant`}
                  url={paire.avant}
                  onUrl={(url) => majPaire(index, 'avant', url)}
                  onError={setError}
                />
                <Emplacement
                  etiquette="Après"
                  pathPrefix={`gammes/${gamme}/apres`}
                  url={paire.apres}
                  onUrl={(url) => majPaire(index, 'apres', url)}
                  onError={setError}
                />
              </div>

              <input
                type="text"
                value={paire.legende ?? ''}
                onChange={(e) => majPaire(index, 'legende', e.target.value)}
                placeholder="Légende (optionnelle) — décrit le protocole suivi, jamais un résultat"
                className="mt-3 w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2 text-[13px] text-noir placeholder:text-black/60 focus:border-noir/40 focus:outline-none"
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {complete ? (
                  <span className="text-[11px] font-light text-sapin">
                    Paire complète : elle s'affichera sur le site.
                  </span>
                ) : (
                  <span className="text-[11px] font-light text-black/60">
                    {paire.avant || paire.apres
                      ? 'Paire incomplète : il manque une des deux photos — rien ne sera publié pour cette paire.'
                      : 'Aucune photo : cette paire ne s’affichera pas.'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="text-[11px] font-light text-red-600 underline-offset-2 hover:underline"
                >
                  Retirer cette paire
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {value.length < PAIRES_MAX && (
        <button
          type="button"
          onClick={() => onChange([...value, { avant: '', apres: '', legende: null }])}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-noir/15 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
        >
          <ImagePlus size={12} strokeWidth={1.5} />
          Ajouter une paire ({value.length}/{PAIRES_MAX})
        </button>
      )}
      <p className="mt-2 text-[10px] text-black/60">
        Les fichiers sont rangés sous <code>gammes/{gamme}/</code> dans le stockage, séparés
        en <code>avant/</code> et <code>apres/</code>.
      </p>
    </div>
  );
}

export default BeforeAfterPairsField;
