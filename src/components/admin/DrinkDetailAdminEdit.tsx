import { useState, useRef, useEffect } from 'react';
import { Button, Modal, useOverlayState, TextField, Input, Label, TextArea } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { invalidateMenuCatalogCache } from '../../lib/menuCatalog';
import { AdminProductGallery } from './AdminProductGallery';
import type { MenuItem } from '../../data/menuData';

interface Props {
  drinkId: string;
  drink: MenuItem;
}

type SaveStatus = 'idle' | 'uploading' | 'saving' | 'error';

export function DrinkDetailAdminEdit({ drinkId, drink }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(drink.name);
  const [iconEmoji, setIconEmoji] = useState(drink.icon ?? '');
  const [description, setDescription] = useState(drink.description);
  const [price, setPrice] = useState(String(drink.price));
  const [calories, setCalories] = useState(String(drink.calories ?? ''));
  const [protein, setProtein] = useState(String(drink.protein ?? ''));
  const [badges, setBadges] = useState((drink.badges ?? []).join(', '));
  const [imagePreview, setImagePreview] = useState('');
  const [gallery, setGallery] = useState<string[]>(drink.gallery ?? []);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(drink.name);
      setIconEmoji(drink.icon ?? '');
      setDescription(drink.description);
      setPrice(String(drink.price));
      setCalories(String(drink.calories ?? ''));
      setProtein(String(drink.protein ?? ''));
      setBadges((drink.badges ?? []).join(', '));
      setImagePreview('');
      setGallery(drink.gallery ?? []);
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen, drink]);

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
        finalImageUrl = await uploadPublicImage('product-images', file, 'menu/');
      }

      const col = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(drinkId)
        ? 'id'
        : 'slug';

      const payload: Record<string, unknown> = {
        name: name.trim(),
        icon_emoji: iconEmoji.trim() || null,
        description: description.trim(),
        price: parseFloat(price) || null,
        calories: parseInt(calories) || null,
        protein: parseInt(protein) || null,
        badges: badges.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (finalImageUrl) payload.image_url = finalImageUrl;

      setStatus('saving');
      const { error } = await (supabase as any)
        .from('products')
        .update(payload)
        .eq(col, drinkId);

      if (error) throw new Error(error.message);

      invalidateMenuCatalogCache();
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
        aria-label="Modifier cette fiche boisson"
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
            className="mx-auto max-h-[92vh] w-[min(100vw-1rem,560px)] shadow-2xl"
          >
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display pr-10 text-[17px] font-normal tracking-[0.02em] text-black">
                  ✏️ Modifier la fiche boisson
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
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-[2px] object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-[2px] bg-gray-100 text-2xl">
                        {drink.icon ?? '🥤'}
                      </div>
                    )}
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        id="drink-image-upload"
                        onChange={handleFileChange}
                        disabled={busy}
                      />
                      <label
                        htmlFor="drink-image-upload"
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
                    productId={drinkId}
                    table="products"
                    images={gallery}
                    onReorder={setGallery}
                    busy={busy}
                  />
                </div>

                {/* Nom + Emoji */}
                <div className="grid grid-cols-[1fr_80px] gap-3">
                  <TextField className="space-y-1" name="drink-name">
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
                  <TextField className="space-y-1" name="drink-emoji">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Emoji</Label>
                    <Input
                      type="text"
                      value={iconEmoji}
                      onChange={(e) => setIconEmoji(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-center text-[18px] focus-visible:border-noir"
                    />
                  </TextField>
                </div>

                {/* Description */}
                <TextField className="space-y-1" name="drink-description">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Description</Label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={busy}
                    className="w-full resize-none border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

                {/* Prix / Calories / Protéines */}
                <div className="grid grid-cols-3 gap-3">
                  <TextField className="space-y-1" name="drink-price">
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
                  <TextField className="space-y-1" name="drink-calories">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Calories</Label>
                    <Input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                  <TextField className="space-y-1" name="drink-protein">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Protéines (g)</Label>
                    <Input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                </div>

                {/* Badges */}
                <TextField className="space-y-1" name="drink-badges">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                    Badges (séparés par des virgules — ex: vegan, glutenfree)
                  </Label>
                  <Input
                    type="text"
                    value={badges}
                    onChange={(e) => setBadges(e.target.value)}
                    variant="secondary"
                    disabled={busy}
                    className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

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
