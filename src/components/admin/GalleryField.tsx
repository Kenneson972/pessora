import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadPublicImage } from '../../lib/storageUpload';
import { formatMutationError } from '../../lib/userFacingError';
import { toJpegSiHeic } from '../../lib/heicToJpeg';

const GALLERY_MAX = 12;
const labelBase = 'text-[10px] font-medium uppercase tracking-[0.2em] text-black/60';

/** Galerie de photos — plusieurs images, ni couverture ni réordonnancement (inutile ici). */
export function GalleryField({
  value,
  pathPrefix,
  bucket = 'event-images',
  label = 'Galerie avant / après',
  hint = "Photos réelles de participants uniquement — jamais de banque d'images. Section masquée sur la page tant qu'elle est vide.",
  onChange,
}: {
  value: string[];
  pathPrefix: string;
  bucket?: 'event-images' | 'gamme-gallery-images';
  label?: string;
  hint?: string;
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || files.length === 0) return;
    if (value.length >= GALLERY_MAX) {
      setError(`Maximum ${GALLERY_MAX} photos.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, GALLERY_MAX - value.length);
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    for (const file of toUpload) {
      try {
        urls.push(await uploadPublicImage(bucket, await toJpegSiHeic(file), pathPrefix));
      } catch (err) {
        setError(err instanceof Error ? formatMutationError(err.message) : 'Envoi impossible. Réessaie.');
      }
    }
    setUploading(false);
    if (urls.length > 0) onChange([...value, ...urls]);
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className={labelBase}>
          {label} <span className="ml-1 text-black/60">({value.length})</span>
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-noir/15 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={1.5} />}
          {uploading ? 'Envoi…' : 'Ajouter'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={handleFiles}
        />
      </div>
      <p className="mb-2 text-[10px] text-black/60">{hint}</p>
      {error && (
        <p role="alert" className="mb-2 text-[13px] leading-snug text-red-600">
          {error}
        </p>
      )}
      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-noir/15 bg-white text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
        >
          <ImagePlus size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-light">Aucune photo</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-[2px] border border-noir/[0.06] bg-surface-muted"
            >
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Retirer cette photo"
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-red-600 opacity-0 backdrop-blur-[2px] transition-opacity hover:bg-red-600 hover:text-white group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={11} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GalleryField;
