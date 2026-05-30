import { useState, useCallback, useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@heroui/react';
import { uploadPublicImage } from '../../lib/storageUpload';

export function ProductImageDropzone({
  imageUrl,
  uploading,
  disabled,
  onFile,
}: {
  imageUrl: string;
  uploading: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptTypes = 'image/jpeg,image/png,image/webp,image/gif';

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f || disabled || uploading) return;
      if (!f.type.startsWith('image/')) return;
      onFile(f);
    },
    [disabled, uploading, onFile],
  );

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Glissez une image ou cliquez pour choisir un fichier"
        aria-disabled={disabled || uploading}
        onClick={() => !(disabled || uploading) && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-dashed px-4 py-10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-noir/25',
          dragOver ? 'border-noir/35 bg-noir/[0.04]' : 'border-noir/[0.12] bg-white hover:border-noir/25 hover:bg-noir/[0.02]',
          (disabled || uploading) && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-noir/[0.06] text-black/45">
          {uploading ? (
            <span className="text-[11px] font-normal text-black/40">…</span>
          ) : (
            <ImagePlus size={26} strokeWidth={1.35} aria-hidden />
          )}
        </div>
        <div className="text-center">
          <p className="text-[12px] font-normal text-black">
            {uploading ? "Envoi de l'image…" : 'Glissez une image ici ou cliquez'}
          </p>
          <p className="mt-1 text-[10px] font-light text-black/38">JPG, PNG, WebP ou GIF · recommandé carré ou portrait</p>
        </div>
      </div>

      {imageUrl ? (
        <div className="overflow-hidden rounded-[2px] border border-noir/[0.08] bg-noir/[0.03]">
          <img src={imageUrl} alt="" className="mx-auto aspect-[4/3] max-h-48 w-auto max-w-full object-contain" loading="lazy" />
        </div>
      ) : null}
    </div>
  );
}

export function useImageUpload(bucket: 'product-images' | 'event-images' | 'carousel-images' | 'split-gammes-images') {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadPublicImage(bucket, file, folder);
      return url;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload impossible');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadError, uploadFile, setUploadError };
}
