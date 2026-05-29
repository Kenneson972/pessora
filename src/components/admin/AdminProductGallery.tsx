import { useState, useRef, useCallback } from 'react';
import { ImagePlus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { uploadPublicImage } from '../../lib/storageUpload';
import { formatMutationError } from '../../lib/userFacingError';
import { supabase } from '../../lib/supabaseClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMAGES = 3;
const ACCEPTED = 'image/jpeg,image/png,image/webp';

interface Props {
  productId: string | undefined
  table: 'products' | 'gamme_products'
  images: string[]
  onReorder: (newOrder: string[]) => void
  busy?: boolean
}

export function AdminProductGallery({ productId, table, images, onReorder, busy = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[]>(images);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const prevImages = useRef(images);
  if (prevImages.current !== images) {
    prevImages.current = images;
    setLocalOrder(images);
  }

  const prefix = table === 'products' ? 'menu/' : 'gammes/';
  const orderChanged = JSON.stringify(localOrder) !== JSON.stringify(images);
  const disabled = busy || uploading || saving || !productId;

  const dbUpdate = useCallback(async (gallery: string[]) => {
    if (!productId) return;
    const col = UUID_RE.test(productId) ? 'id' : 'slug';
    const { error: err } = await (supabase as any)
      .from(table)
      .update({ gallery })
      .eq(col, productId);
    if (err) throw new Error(err.message);
  }, [productId, table]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !productId) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicImage('product-images', file, prefix);
      const next = [...images, url];
      await dbUpdate(next);
      onReorder(next);
    } catch (err) {
      setError(err instanceof Error ? formatMutationError(err.message) : 'Upload impossible.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!productId) return;
    setError(null);
    const next = images.filter((u) => u !== url);
    try {
      await dbUpdate(next);
      onReorder(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  const handleSaveOrder = async () => {
    if (!productId || !orderChanged) return;
    setSaving(true);
    setError(null);
    try {
      await dbUpdate(localOrder);
      onReorder(localOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (idx: number) => setDraggingIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const next = [...localOrder];
    const [item] = next.splice(draggingIdx, 1);
    next.splice(idx, 0, item);
    setLocalOrder(next);
    setDraggingIdx(idx);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingIdx(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
          Photos supplémentaires <span className="text-black/30">({localOrder.length}/{MAX_IMAGES})</span>
        </p>
        {localOrder.length < MAX_IMAGES && productId && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-full border border-noir/15 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={1.5} />}
            {uploading ? 'Envoi…' : 'Ajouter'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          disabled={disabled}
          onChange={handleFileChange}
        />
      </div>

      {localOrder.length === 0 ? (
        <div className="flex aspect-[3/1] w-full items-center justify-center rounded-[2px] border border-dashed border-noir/15 bg-white text-black/35">
          <span className="text-[11px] font-light">Aucune photo supplémentaire</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {localOrder.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-[2px] border border-noir/[0.06] bg-surface-muted ${draggingIdx === idx ? 'opacity-50' : ''}`}
            >
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-black/50">
                  <GripVertical size={11} strokeWidth={1.5} />
                </div>
              </div>
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleDelete(url)}
                  disabled={disabled}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                  aria-label="Supprimer cette photo"
                >
                  <Trash2 size={11} strokeWidth={1.6} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {orderChanged && (
        <button
          type="button"
          onClick={handleSaveOrder}
          disabled={saving || busy}
          className="mt-2 inline-flex h-8 items-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/70 transition-colors hover:border-noir/30 disabled:opacity-50"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : null}
          {saving ? 'Enregistrement…' : "Enregistrer l'ordre"}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-[2px] border border-red-200 bg-red-50/60 px-3 py-2 text-[11px] text-red-600/80">
          {error}
        </p>
      )}
    </div>
  );
}
