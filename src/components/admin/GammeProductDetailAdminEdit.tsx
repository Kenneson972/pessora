// src/components/admin/GammeProductDetailAdminEdit.tsx
import { useState, useRef, useEffect } from 'react';
import { Button, Modal, useOverlayState, TextField, Input, Label, TextArea } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { AdminProductGallery } from './AdminProductGallery';
import type { GammeProduct } from '../../types/database';

interface Props {
  slug: string;
  product: GammeProduct;
  onSaved: (updated: Partial<GammeProduct>) => void;
}

type SaveStatus = 'idle' | 'uploading' | 'saving' | 'error';

export function GammeProductDetailAdminEdit({ slug, product, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [price, setPrice] = useState(String(product.price));
  const [priceAlt, setPriceAlt] = useState(
    product.price_alt !== null ? String(product.price_alt) : '',
  );
  const [imagePreview, setImagePreview] = useState('');
  const [gallery, setGallery] = useState<string[]>(product.gallery ?? []);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(product.name);
      setDescription(product.description ?? '');
      setPrice(String(product.price));
      setPriceAlt(product.price_alt !== null ? String(product.price_alt) : '');
      setImagePreview('');
      setGallery(product.gallery ?? []);
      if (fileRef.current) fileRef.current.value = '';
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen, product]);

  const overlay = useOverlayState({
    isOpen,
    onOpenChange: (open) => setIsOpen(open),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      let finalImageUrl: string | undefined;

      const file = fileRef.current?.files?.[0];
      if (file) {
        setStatus('uploading');
        finalImageUrl = await uploadPublicImage('product-images', file, 'gammes/');
      }

      const priceNum = parseFloat(price) || 0;
      const priceAltNum = priceAlt.trim() ? parseFloat(priceAlt) : null;

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        price_alt: priceAltNum,
      };
      if (finalImageUrl) payload.image_url = finalImageUrl;

      setStatus('saving');
      const { error } = await (supabase as any)
        .from('gamme_products')
        .update(payload)
        .eq('slug', slug);

      if (error) throw new Error(error.message);

      const update: Partial<GammeProduct> = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        price_alt: priceAltNum,
      };
      if (finalImageUrl) update.image_url = finalImageUrl;
      onSaved(update);

      setIsOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  };

  const busy = status === 'uploading' || status === 'saving';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#1E3529] px-4 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-white shadow-lg transition-opacity hover:opacity-90"
        aria-label="Modifier ce produit"
      >
        <Pencil size={13} strokeWidth={1.5} aria-hidden />
        Modifier
      </button>

      <Modal state={overlay}>
        <Modal.Backdrop variant="blur" isDismissable>
          <Modal.Container
            scroll="inside"
            placement="center"
            size="full"
            className="mx-auto max-h-[92vh] w-[min(100vw-1rem,520px)] shadow-2xl"
          >
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display pr-10 text-[17px] font-normal tracking-[0.02em] text-black">
                  ✏️ Modifier le produit
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 rounded-[2px] border border-transparent px-2 py-1 text-[11px] text-black/45 hover:bg-noir/[0.05] hover:text-black">
                  Fermer
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {/* Image */}
                <div>
                  <p className="mb-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Image</p>
                  <div className="flex items-center gap-4 rounded-[2px] border border-dashed border-noir/20 p-3">
                    {imagePreview || product.image_url ? (
                      <img
                        src={imagePreview || product.image_url!}
                        alt="preview"
                        className="h-14 w-14 rounded-[2px] object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-[2px] bg-gray-100" />
                    )}
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        id="gamme-image-upload"
                        onChange={handleFileChange}
                        disabled={busy}
                      />
                      <label
                        htmlFor="gamme-image-upload"
                        className="cursor-pointer rounded-full border border-noir/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-colors hover:bg-noir/[0.04]"
                      >
                        {status === 'uploading' ? 'Upload…' : 'Choisir'}
                      </label>
                      <p className="mt-1 text-[9px] text-black/35">JPG, PNG, WebP · max 5 Mo</p>
                    </div>
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <p className="mb-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                    Photos supplémentaires (max 3)
                  </p>
                  <AdminProductGallery
                    productId={product.id}
                    table="gamme_products"
                    images={gallery}
                    onReorder={setGallery}
                    busy={busy}
                  />
                </div>

                {/* Nom */}
                <TextField className="space-y-1" name="gamme-name">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Nom</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="secondary"
                    disabled={busy}
                    className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

                {/* Description */}
                <TextField className="space-y-1" name="gamme-description">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Description</Label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={busy}
                    className="w-full resize-none border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

                {/* Prix + Prix alt */}
                <div className="grid grid-cols-2 gap-3">
                  <TextField className="space-y-1" name="gamme-price">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Prix (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                  <TextField className="space-y-1" name="gamme-price-alt">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Prix alt (€) — optionnel</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceAlt}
                      onChange={(e) => setPriceAlt(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      placeholder="laisser vide si non applicable"
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                </div>

                {status === 'error' && (
                  <p className="rounded-[2px] bg-red-50 px-3 py-2 text-[11px] text-red-500">{errorMsg}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onPress={handleSave}
                    isDisabled={busy}
                    className="h-10 min-h-10 flex-1 rounded-full bg-[#1E3529] text-[10px] uppercase tracking-[0.14em] text-white"
                  >
                    {status === 'uploading' ? 'Upload image…' : status === 'saving' ? 'Enregistrement…' : '💾 Enregistrer'}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => setIsOpen(false)}
                    isDisabled={busy}
                    className="h-10 min-h-10 rounded-full border border-noir/15 px-5 text-[10px] uppercase tracking-[0.14em] text-black/55"
                  >
                    Annuler
                  </Button>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
