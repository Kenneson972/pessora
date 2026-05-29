# Édition Inline Admin — Pages Publiques

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un bouton flottant "✏️ Modifier" sur les pages produit publiques quand un admin est connecté, ouvrant un modal HeroUI pour éditer les champs et sauvegarder en Supabase.

**Architecture:** Deux composants admin séparés (`DrinkDetailAdminEdit` et `GammeProductDetailAdminEdit`) importés dans leurs pages hôtes respectives. Les pages restent propres — toute la logique d'édition est dans les composants. Mise à jour optimiste via callback pour GammeProductDetail (données statiques).

**Tech Stack:** React, HeroUI v3 (`Modal`, `useOverlayState`, `TextField`, `Input`, `TextArea`), Supabase, `uploadPublicImage` (storageUpload.ts), `invalidateMenuCatalogCache` (menuCatalog.ts)

---

## Références rapides

```ts
// AuthContext
const { isAdmin } = useAuth()

// storageUpload.ts
uploadPublicImage(
  bucket: 'product-images' | 'event-images' | 'carousel-images' | 'split-gammes-images',
  file: File,
  pathPrefix: string
): Promise<string>

// menuCatalog.ts
invalidateMenuCatalogCache(): void

// HeroUI Modal pattern (copié depuis AdminProduits.tsx)
import { Modal, useOverlayState } from '@heroui/react'
const overlay = useOverlayState({ isOpen, onOpenChange })
// <Modal state={overlay}>
//   <Modal.Backdrop variant="blur" isDismissable>
//     <Modal.Container scroll="inside" placement="center" size="full" className="mx-auto max-h-[92vh] w-[min(100vw-1rem,560px)]">
//       <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white">
//         <Modal.Header ...><Modal.Heading>...</Modal.Heading><Modal.CloseTrigger>Fermer</Modal.CloseTrigger></Modal.Header>
//         <Modal.Body className="flex-1 overflow-y-auto px-5 py-5">...</Modal.Body>
//       </Modal.Dialog>
//     </Modal.Container>
//   </Modal.Backdrop>
// </Modal>

// HeroUI Input/TextArea pattern (copié depuis Contact.tsx)
import { Button, Input, Label, TextArea, TextField } from '@heroui/react'
// <TextField className="space-y-1" name="x">
//   <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Label</Label>
//   <Input type="text" value={...} onChange={e => ...} variant="secondary"
//     className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir" />
// </TextField>

// Products DB columns: id, name, category, price, price_small, price_medium, price_large,
//   calories, protein, description, ingredients, benefits, image_url, active, slug,
//   pitch, icon_emoji, badges (text[]), carousel_sort, carousel_badge

// GammeProduct DB columns: id, gamme, subcategory, name, description,
//   price (number), price_alt (number|null), image_url, sort_order, slug, active
```

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/DrinkDetailAdminEdit.tsx` |
| Créer | `src/components/admin/GammeProductDetailAdminEdit.tsx` |
| Modifier | `src/pages/DrinkDetail.tsx` |
| Modifier | `src/pages/GammeProductDetail.tsx` |

---

## Task 1 — DrinkDetailAdminEdit

**Files:**
- Create: `src/components/admin/DrinkDetailAdminEdit.tsx`

- [ ] **Créer le fichier avec le squelette complet**

```tsx
// src/components/admin/DrinkDetailAdminEdit.tsx
import { useState, useRef, useEffect } from 'react';
import { Button, Modal, useOverlayState, TextField, Input, Label, TextArea } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { invalidateMenuCatalogCache } from '../../lib/menuCatalog';
import type { MenuItem } from '../../data/menuData';

interface Props {
  drinkId: string; // MenuItem.id === p.slug ?? p.id
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
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Réinitialiser le form à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setName(drink.name);
      setIconEmoji(drink.icon ?? '');
      setDescription(drink.description);
      setPrice(String(drink.price));
      setCalories(String(drink.calories ?? ''));
      setProtein(String(drink.protein ?? ''));
      setBadges((drink.badges ?? []).join(', '));
      setImageUrl('');
      setImagePreview('');
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

      // drinkId peut être un slug ou un UUID
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
      {/* Bouton flottant */}
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
                <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                  ✏️ Modifier la fiche boisson
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black text-[11px] px-2 py-1">
                  Fermer
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* Image */}
                <div>
                  <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40 mb-2">Image</p>
                  <div className="flex items-center gap-4 rounded-[2px] border border-dashed border-noir/20 p-3">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-[2px] object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-[2px] bg-surface-muted flex items-center justify-center text-2xl">
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
                        className="cursor-pointer rounded-full border border-noir/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.1em] hover:bg-noir/[0.04] transition-colors"
                      >
                        {status === 'uploading' ? 'Upload…' : 'Choisir'}
                      </label>
                      <p className="mt-1 text-[9px] text-black/35">JPG, PNG, WebP · max 5 Mo</p>
                    </div>
                  </div>
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
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[18px] text-center focus-visible:border-noir"
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
                    className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir resize-none"
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

                {/* Erreur */}
                {status === 'error' && (
                  <p className="text-[11px] text-red-500 bg-red-50 rounded-[2px] px-3 py-2">{errorMsg}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onPress={handleSave}
                    isDisabled={busy}
                    className="flex-1 rounded-full bg-[#1E3529] text-white text-[10px] uppercase tracking-[0.14em] h-10 min-h-10"
                  >
                    {status === 'uploading' ? 'Upload image…' : status === 'saving' ? 'Enregistrement…' : '💾 Enregistrer'}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => setIsOpen(false)}
                    isDisabled={busy}
                    className="rounded-full border border-noir/15 text-black/55 text-[10px] uppercase tracking-[0.14em] h-10 min-h-10 px-5"
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
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | grep DrinkDetailAdminEdit
```

Expected : aucune erreur sur ce fichier.

- [ ] **Commit**

```bash
git add src/components/admin/DrinkDetailAdminEdit.tsx
git commit -m "feat: DrinkDetailAdminEdit — modal édition inline boissons"
```

---

## Task 2 — Wirer DrinkDetailAdminEdit dans DrinkDetail

**Files:**
- Modify: `src/pages/DrinkDetail.tsx`

- [ ] **Ajouter les imports en haut du fichier** (après les imports existants)

```tsx
import { useAuth } from '../contexts/AuthContext';
import { DrinkDetailAdminEdit } from '../components/admin/DrinkDetailAdminEdit';
```

- [ ] **Ajouter `isAdmin` dans le composant** (après la ligne `const addLine = useCart(...)`)

```tsx
const { isAdmin } = useAuth();
```

- [ ] **Rendre le composant conditionnel** — ajouter JUSTE AVANT le `</div>` final qui ferme le composant (la dernière `</div>` avant le `return` closing)

Chercher dans le fichier la ligne avec `</div>` qui clôt le return principal (autour de la ligne 769), puis ajouter :

```tsx
      {isAdmin && (
        <DrinkDetailAdminEdit drinkId={drinkId!} drink={drink} />
      )}
```

- [ ] **Vérifier TypeScript + pas de régression**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
git add src/pages/DrinkDetail.tsx
git commit -m "feat: wirer DrinkDetailAdminEdit dans DrinkDetail"
```

---

## Task 3 — GammeProductDetailAdminEdit

**Files:**
- Create: `src/components/admin/GammeProductDetailAdminEdit.tsx`

- [ ] **Créer le fichier**

```tsx
// src/components/admin/GammeProductDetailAdminEdit.tsx
import { useState, useRef, useEffect } from 'react';
import { Button, Modal, useOverlayState, TextField, Input, Label, TextArea } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import type { GammeProductStatic } from '../../lib/getGammeProduct';

interface Props {
  slug: string;
  product: GammeProductStatic;
  onSaved: (updated: Partial<GammeProductStatic>) => void;
}

type SaveStatus = 'idle' | 'uploading' | 'saving' | 'error';

// Parse "29€" ou "29€ / 39€" → { price: number, priceAlt: number | null }
function parseStaticPrice(raw: string): { price: number; priceAlt: number | null } {
  const parts = raw.replace(/€/g, '').split('/').map((s) => parseFloat(s.trim()));
  return {
    price: parts[0] ?? 0,
    priceAlt: parts.length > 1 ? (parts[1] ?? null) : null,
  };
}

export function GammeProductDetailAdminEdit({ slug, product, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const parsed = parseStaticPrice(product.price);
  const [price, setPrice] = useState(String(parsed.price));
  const [priceAlt, setPriceAlt] = useState(parsed.priceAlt !== null ? String(parsed.priceAlt) : '');
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(product.name);
      setDescription(product.description ?? '');
      const p = parseStaticPrice(product.price);
      setPrice(String(p.price));
      setPriceAlt(p.priceAlt !== null ? String(p.priceAlt) : '');
      setImagePreview('');
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

      // Mise à jour optimiste de l'affichage (données statiques ne se rechargent pas)
      const newPriceStr = priceAltNum !== null
        ? `${priceNum}€ / ${priceAltNum}€`
        : `${priceNum}€`;

      onSaved({
        name: name.trim(),
        description: description.trim() || undefined,
        price: newPriceStr,
        image: finalImageUrl ?? product.image,
      });

      setIsOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  };

  const busy = status === 'uploading' || status === 'saving';

  return (
    <>
      {/* Bouton flottant */}
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
                <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                  ✏️ Modifier le produit
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black text-[11px] px-2 py-1">
                  Fermer
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* Image */}
                <div>
                  <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40 mb-2">Image</p>
                  <div className="flex items-center gap-4 rounded-[2px] border border-dashed border-noir/20 p-3">
                    {imagePreview || product.image ? (
                      <img
                        src={imagePreview || product.image}
                        alt="preview"
                        className="h-14 w-14 rounded-[2px] object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-[2px] bg-surface-muted" />
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
                        className="cursor-pointer rounded-full border border-noir/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.1em] hover:bg-noir/[0.04] transition-colors"
                      >
                        {status === 'uploading' ? 'Upload…' : 'Choisir'}
                      </label>
                      <p className="mt-1 text-[9px] text-black/35">JPG, PNG, WebP · max 5 Mo</p>
                    </div>
                  </div>
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
                    className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir resize-none"
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

                {/* Erreur */}
                {status === 'error' && (
                  <p className="text-[11px] text-red-500 bg-red-50 rounded-[2px] px-3 py-2">{errorMsg}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onPress={handleSave}
                    isDisabled={busy}
                    className="flex-1 rounded-full bg-[#1E3529] text-white text-[10px] uppercase tracking-[0.14em] h-10 min-h-10"
                  >
                    {status === 'uploading' ? 'Upload image…' : status === 'saving' ? 'Enregistrement…' : '💾 Enregistrer'}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => setIsOpen(false)}
                    isDisabled={busy}
                    className="rounded-full border border-noir/15 text-black/55 text-[10px] uppercase tracking-[0.14em] h-10 min-h-10 px-5"
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
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep GammeProductDetailAdminEdit
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
git add src/components/admin/GammeProductDetailAdminEdit.tsx
git commit -m "feat: GammeProductDetailAdminEdit — modal édition inline produits gamme"
```

---

## Task 4 — Wirer GammeProductDetailAdminEdit dans GammeProductDetail

**Files:**
- Modify: `src/pages/GammeProductDetail.tsx`

- [ ] **Ajouter les imports** (après les imports existants ligne ~16)

```tsx
import { useAuth } from '../contexts/AuthContext';
import { GammeProductDetailAdminEdit } from '../components/admin/GammeProductDetailAdminEdit';
```

- [ ] **Lire le fichier pour trouver où `product` est défini et comment la page utilise ses champs**

```bash
grep -n "const product\|const \[product\|getGammeProduct\|rangeName\|rangeHeroImage" src/pages/GammeProductDetail.tsx | head -15
```

- [ ] **Ajouter le state pour l'optimistic update et `isAdmin`** — remplacer la ligne qui appelle `getGammeProduct` (repérer son numéro exact, autour de la ligne ~33) :

Avant (pattern existant) :
```tsx
const result = getGammeProduct(rangeId!, slug!);
if (!result) return <Navigate to="/nos-produits" replace />;
const { product, rangeName, rangeHeroImage } = result;
```

Après :
```tsx
const { isAdmin } = useAuth();
const result = getGammeProduct(rangeId!, slug!);
if (!result) return <Navigate to="/nos-produits" replace />;
const { product: baseProduct, rangeName, rangeHeroImage } = result;
const [product, setProduct] = useState(baseProduct);
```

> Note : si `useState` n'est pas encore importé depuis React dans ce fichier, l'ajouter à la ligne d'import existante.

- [ ] **Ajouter le handler `onSaved`** — juste après le `useState(baseProduct)` :

```tsx
const handleProductSaved = (updated: Partial<typeof baseProduct>) => {
  setProduct((prev) => ({ ...prev, ...updated }));
};
```

- [ ] **Rendre le composant conditionnel** — JUSTE AVANT le `</div>` final du return :

```tsx
      {isAdmin && (
        <GammeProductDetailAdminEdit
          slug={slug!}
          product={product}
          onSaved={handleProductSaved}
        />
      )}
```

- [ ] **Vérifier TypeScript + pas de régression**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
git add src/pages/GammeProductDetail.tsx
git commit -m "feat: wirer GammeProductDetailAdminEdit dans GammeProductDetail"
```

---

## Task 5 — Vérification finale

- [ ] **Build complet**

```bash
npm run build 2>&1 | tail -20
```

Expected : Build terminé sans erreur.

- [ ] **Test manuel en dev** — lancer le serveur si pas déjà actif :

```bash
node_modules/.bin/vite --port 3000
```

Checklist :
1. Se connecter avec un compte admin
2. Aller sur `/menu/wellness-boost` (ou n'importe quel slug valide)
3. Vérifier que le bouton flottant vert "✏️ Modifier" apparaît en bas à droite
4. Cliquer → modal s'ouvre avec les champs pré-remplis
5. Modifier le nom → Enregistrer → vérifier dans Supabase `products` que le nom a changé
6. Aller sur `/nos-produits/wellness/<slug>` → même vérification
7. Se déconnecter → vérifier que le bouton n'apparaît plus
8. Visiteur non-admin → bouton absent

- [ ] **Commit final si tout OK**

```bash
git add -A
git commit -m "feat: édition inline admin pages publiques — boissons + produits gamme"
git push
```
