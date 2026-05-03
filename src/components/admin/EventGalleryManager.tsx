import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { uploadPublicImage } from '../../lib/storageUpload';
import { formatMutationError } from '../../lib/userFacingError';

type Props = {
  cover: string;
  gallery: string[];
  slug: string;
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
};

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';

export function EventGalleryManager({
  cover,
  gallery,
  slug,
  onCoverChange,
  onGalleryChange,
}: Props) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const pathPrefix = slug || 'event';

  const uploadMany = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return [];
      const urls: string[] = [];
      for (const f of arr) {
        try {
          const url = await uploadPublicImage('event-images', f, pathPrefix);
          urls.push(url);
        } catch (err) {
          setError(
            err instanceof Error
              ? formatMutationError(err.message)
              : 'Envoi impossible. Réessayez.',
          );
        }
      }
      return urls;
    },
    [pathPrefix],
  );

  const handleCoverFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setCoverUploading(true);
      setError(null);
      const [url] = await uploadMany([file]);
      setCoverUploading(false);
      if (url) onCoverChange(url);
    },
    [uploadMany, onCoverChange],
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files || files.length === 0) return;
      setGalleryUploading(true);
      setError(null);
      const urls = await uploadMany(files);
      setGalleryUploading(false);
      if (urls.length > 0) onGalleryChange([...gallery, ...urls]);
    },
    [uploadMany, gallery, onGalleryChange],
  );

  const removeFromGallery = useCallback(
    (idx: number) => {
      const next = gallery.slice();
      next.splice(idx, 1);
      onGalleryChange(next);
    },
    [gallery, onGalleryChange],
  );

  const move = useCallback(
    (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= gallery.length) return;
      const next = gallery.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      onGalleryChange(next);
    },
    [gallery, onGalleryChange],
  );

  const promoteToCover = useCallback(
    (idx: number) => {
      const newCover = gallery[idx];
      if (!newCover) return;
      const rest = gallery.filter((_, i) => i !== idx);
      const next = cover ? [cover, ...rest] : rest;
      onCoverChange(newCover);
      onGalleryChange(next);
    },
    [gallery, cover, onCoverChange, onGalleryChange],
  );

  const removeCover = useCallback(() => {
    onCoverChange('');
  }, [onCoverChange]);

  return (
    <div className="flex flex-col gap-6">
      {/* Couverture */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-[9px] uppercase tracking-[0.22em] text-black/40">Couverture</label>
          <span className="text-[10px] text-black/35">16:9 · conseillé 1600×900</span>
        </div>
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] border border-dashed border-noir/15 bg-surface-muted"
        >
          {cover ? (
            <>
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-noir/75 to-transparent px-3 py-3">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-white backdrop-blur-[2px] transition-colors hover:bg-white/20"
                >
                  <ImagePlus size={12} strokeWidth={1.5} />
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={removeCover}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-white backdrop-blur-[2px] transition-colors hover:bg-red-500/70"
                  aria-label="Retirer la couverture"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                  Retirer
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black/45 transition-colors hover:bg-noir/[0.02] hover:text-black/70"
            >
              {coverUploading ? (
                <Loader2 size={22} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <ImagePlus size={22} strokeWidth={1.5} />
              )}
              <span className="text-[11px] font-light tracking-[0.04em]">
                {coverUploading ? 'Envoi…' : 'Ajouter une image de couverture'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-black/30">JPEG · PNG · WebP · 5 Mo max</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            disabled={coverUploading}
            onChange={handleCoverFile}
          />
        </div>
      </div>

      {/* Galerie */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-[9px] uppercase tracking-[0.22em] text-black/40">
            Galerie <span className="ml-1 text-black/30">({gallery.length})</span>
          </label>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={galleryUploading}
            className="inline-flex items-center gap-1.5 rounded-full border border-noir/15 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir disabled:opacity-50"
          >
            {galleryUploading ? (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <ImagePlus size={12} strokeWidth={1.5} />
            )}
            {galleryUploading ? 'Envoi…' : 'Ajouter'}
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="sr-only"
            disabled={galleryUploading}
            onChange={handleGalleryFiles}
          />
        </div>

        {gallery.length === 0 ? (
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-noir/15 bg-white text-black/40 transition-colors hover:border-noir/30 hover:text-black/60"
          >
            <ImagePlus size={20} strokeWidth={1.5} />
            <span className="text-[11px] font-light">Aucune photo additionnelle</span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-black/30">Cliquer pour ajouter</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="group relative aspect-square overflow-hidden rounded-[2px] border border-noir/[0.06] bg-surface-muted"
              >
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => promoteToCover(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-black/80 backdrop-blur-[2px] transition-colors hover:bg-white"
                    aria-label="Définir comme couverture"
                    title="Définir comme couverture"
                  >
                    <Star size={12} strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromGallery(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-red-500 backdrop-blur-[2px] transition-colors hover:bg-red-500 hover:text-white"
                    aria-label="Supprimer cette photo"
                    title="Supprimer"
                  >
                    <Trash2 size={12} strokeWidth={1.6} />
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-noir/75 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-[2px] transition-colors hover:bg-white/30 disabled:opacity-30"
                    aria-label="Déplacer à gauche"
                  >
                    <ArrowLeft size={12} strokeWidth={1.6} />
                  </button>
                  <span className="text-[9px] font-light uppercase tracking-[0.18em] text-white/80">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === gallery.length - 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-[2px] transition-colors hover:bg-white/30 disabled:opacity-30"
                    aria-label="Déplacer à droite"
                  >
                    <ArrowRight size={12} strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-[2px] border border-red-200 bg-red-50/60 px-3 py-2 text-[11px] text-red-600/80">
          {error}
        </p>
      )}
    </div>
  );
}
