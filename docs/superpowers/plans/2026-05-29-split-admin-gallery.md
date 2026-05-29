# Split Admin + Galerie Multi-Images — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Découper `AdminProductEditorForm` en composants ciblés et ajouter une galerie d'images (max 3) par produit, visible côté admin et côté public.

**Architecture:** Split AdminProductEditorForm → AdminProductForm + AdminCarouselToggle + thin wrapper. Nouveau composant AdminProductGallery (drag & drop, save explicite). Colonne `gallery text[]` ajoutée sur `products` et `gamme_products`. Section "Photos" ajoutée sur DrinkDetail et GammeProductDetail.

**Tech Stack:** React, TypeScript, Supabase (`supabase as any`), HeroUI, Tailwind, HTML5 drag & drop natif, `uploadPublicImage` (existant)

---

## Références rapides

```ts
// src/types/database.ts — products.Row (ligne 135)
// src/types/database.ts — gamme_products.Row (ligne 279)

// src/components/admin/AdminProductEditorForm.tsx (837 lignes à splitter)
// Exports actuels utilisés par AdminProduits.tsx :
//   AdminProductEditorForm, payloadFromForm, productToForm, CAT_LABEL, CATEGORIES

// src/components/admin/EventGalleryManager.tsx — pattern de référence (galerie événements)
// src/lib/storageUpload.ts — uploadPublicImage(bucket, file, prefix): Promise<string>
// src/lib/menuCatalog.ts — productRowToMenuItem() : mapper Product → MenuItem

// UUID regex (même pattern que DrinkDetailAdminEdit.tsx) :
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/AdminProductForm.tsx` |
| Créer | `src/components/admin/AdminCarouselToggle.tsx` |
| Créer | `src/components/admin/AdminProductGallery.tsx` |
| Modifier | `src/components/admin/AdminProductEditorForm.tsx` |
| Modifier | `src/components/admin/DrinkDetailAdminEdit.tsx` |
| Modifier | `src/components/admin/GammeProductDetailAdminEdit.tsx` |
| Modifier | `src/pages/DrinkDetail.tsx` |
| Modifier | `src/pages/GammeProductDetail.tsx` |
| Modifier | `src/types/database.ts` |
| Modifier | `src/data/menuData.ts` |
| Modifier | `src/lib/menuCatalog.ts` |
| SQL | Migration `gallery` sur `products` + `gamme_products` |

---

## Task 1 — DB Migration + TypeScript types

**Files:**
- Modify: `src/types/database.ts`
- SQL: migration via Supabase MCP

- [ ] **Appliquer la migration SQL**

Via Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`) ou CLI :

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE gamme_products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
```

- [ ] **Mettre à jour `src/types/database.ts` — products.Row**

Ajouter `gallery: string[]` après `carousel_badge: string | null` (ligne ~155) :

```ts
// Avant
carousel_badge: string | null
created_at: string

// Après
carousel_badge: string | null
gallery: string[]
created_at: string
```

- [ ] **Mettre à jour `src/types/database.ts` — gamme_products.Row**

Ajouter `gallery: string[]` après `active: boolean` (ligne ~290) :

```ts
// Avant
active: boolean
created_at: string

// Après
active: boolean
gallery: string[]
created_at: string
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur liée à `gallery`.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/types/database.ts && git commit -m "feat: add gallery column to products + gamme_products DB types"
```

---

## Task 2 — AdminProductGallery.tsx

**Files:**
- Create: `src/components/admin/AdminProductGallery.tsx`

Composant autonome de galerie (max 3 images), drag & drop natif HTML5, bouton save explicite. S'inspire de `EventGalleryManager.tsx` (même projet).

- [ ] **Créer le fichier**

```tsx
// src/components/admin/AdminProductGallery.tsx
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

  // Sync local order when parent images change (e.g. after delete)
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

  // Drag & drop handlers
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
          {saving ? 'Enregistrement…' : 'Enregistrer l\'ordre'}
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
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | grep -i "AdminProductGallery\|error" | head -20
```

Expected : aucune erreur sur ce fichier.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/AdminProductGallery.tsx && git commit -m "feat: AdminProductGallery — drag & drop galerie produit, max 3 images"
```

---

## Task 3 — AdminProductForm.tsx

**Files:**
- Create: `src/components/admin/AdminProductForm.tsx`
- Read first: `src/components/admin/AdminProductEditorForm.tsx` (pour extraire le code)

Ce fichier contient tout ce qui était dans AdminProductEditorForm **sauf** la section carrousel et sauf le composant AdminProductEditorForm lui-même. Le composant AdminProductForm est un composant contrôlé (state géré par le parent).

- [ ] **Créer `src/components/admin/AdminProductForm.tsx`**

```tsx
// src/components/admin/AdminProductForm.tsx
import { useState, useCallback, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@heroui/react';
import type { Product } from '../../types/database';
import { uploadPublicImage } from '../../lib/storageUpload';
import { DRINK_BENEFIT_PRESETS, DRINK_INGREDIENT_PRESETS } from '../../data/drinkTagPresets';

export const CATEGORIES = ['wellness', 'energie', 'shakes', 'coffee'] as const;

export const CAT_LABEL: Record<string, string> = {
  wellness: 'Wellness',
  energie: 'Énergie',
  shakes: 'Shakes',
  coffee: 'Coffee',
};

export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTagLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').replace(/^(.)/, (_, c) => c.toUpperCase());
}

function uniqueTagsPreserveOrder(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags.filter((t) => {
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function badgesFromProduct(badges: string[] | null): { vegan: boolean; glutenfree: boolean; vitamins: boolean } {
  const s = new Set(badges ?? []);
  return { vegan: s.has('vegan'), glutenfree: s.has('glutenfree'), vitamins: s.has('vitamins') };
}

function badgesToPayload(v: { vegan: boolean; glutenfree: boolean; vitamins: boolean }): string[] {
  const out: string[] = [];
  if (v.vegan) out.push('vegan');
  if (v.glutenfree) out.push('glutenfree');
  if (v.vitamins) out.push('vitamins');
  return out;
}

export const EMPTY_FORM = {
  slug: '',
  name: '',
  category: 'shakes',
  price: '',
  price_small: '',
  price_medium: '',
  price_large: '',
  calories: '',
  protein: '',
  description: '',
  pitch: '',
  icon_emoji: '',
  ingredients_tags: [] as string[],
  benefits_tags: [] as string[],
  badge_vegan: false,
  badge_glutenfree: false,
  badge_vitamins: false,
  image_url: '',
  carousel_include: false,
  carousel_sort: '',
  carousel_badge: '',
  active: true,
};

export type FormState = typeof EMPTY_FORM;

export function productToForm(p: Product): FormState {
  const bd = badgesFromProduct(p.badges);
  return {
    slug: p.slug ?? '',
    name: p.name,
    category: p.category,
    price: p.price != null ? String(p.price) : '',
    price_small: p.price_small != null ? String(p.price_small) : '',
    price_medium: p.price_medium != null ? String(p.price_medium) : '',
    price_large: p.price_large != null ? String(p.price_large) : '',
    calories: p.calories != null ? String(p.calories) : '',
    protein: p.protein != null ? String(p.protein) : '',
    description: p.description ?? '',
    pitch: p.pitch ?? '',
    icon_emoji: p.icon_emoji ?? '',
    ingredients_tags: [...(p.ingredients ?? [])],
    benefits_tags: [...(p.benefits ?? [])],
    badge_vegan: bd.vegan,
    badge_glutenfree: bd.glutenfree,
    badge_vitamins: bd.vitamins,
    image_url: p.image_url ?? '',
    carousel_include: p.carousel_sort != null,
    carousel_sort: p.carousel_sort != null ? String(p.carousel_sort) : '',
    carousel_badge: p.carousel_badge === 'nouveaute' || p.carousel_badge === 'coup-de-coeur' ? p.carousel_badge : '',
    active: p.active,
  };
}

export function payloadFromForm(form: FormState) {
  const slug = form.slug.trim() || slugify(form.name);
  return {
    slug,
    name: form.name.trim(),
    category: form.category,
    price: form.price ? Number(form.price) : null,
    price_small: form.price_small ? Number(form.price_small) : null,
    price_medium: form.price_medium ? Number(form.price_medium) : null,
    price_large: form.price_large ? Number(form.price_large) : null,
    calories: form.calories ? Number(form.calories) : null,
    protein: form.protein ? Number(form.protein) : null,
    description: form.description.trim() || null,
    pitch: form.pitch.trim() || null,
    icon_emoji: form.icon_emoji.trim() || null,
    ingredients: uniqueTagsPreserveOrder(form.ingredients_tags),
    benefits: uniqueTagsPreserveOrder(form.benefits_tags),
    badges: badgesToPayload({
      vegan: form.badge_vegan,
      glutenfree: form.badge_glutenfree,
      vitamins: form.badge_vitamins,
    }),
    image_url: form.image_url.trim() || null,
    carousel_badge:
      form.carousel_include &&
      (form.carousel_badge === 'nouveaute' || form.carousel_badge === 'coup-de-coeur')
        ? form.carousel_badge
        : null,
    active: form.active,
  };
}

const sectionTitleClass = 'mb-1 font-display text-[14px] font-normal tracking-[0.02em] text-black';
const sectionHintClass = 'mb-4 text-[11px] font-light leading-relaxed text-black/45';
const labelClass = 'mb-1.5 block text-[10px] font-normal uppercase tracking-[0.14em] text-black/45';
const inputClass =
  'w-full min-h-11 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-3 py-2 text-base sm:text-[13px] text-black placeholder:text-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';
const chipRemoveBtnClass =
  'ml-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2px] text-black/40 transition-colors hover:bg-noir/[0.08] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25';

// ─── TagChipPicker (interne) ───────────────────────────────────────────────
// [Copier intégralement la fonction TagChipPicker depuis AdminProductEditorForm.tsx lignes 163-292]
// Aucun changement — copie exacte.

// ─── ProductImageDropzone (interne) ───────────────────────────────────────
// [Copier intégralement la fonction ProductImageDropzone depuis AdminProductEditorForm.tsx lignes 295-388]
// Aucun changement — copie exacte.

interface AdminProductFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  busy: boolean;
  isEdit: boolean;
}

export function AdminProductForm({ form, onChange, busy, isEdit }: AdminProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(isEdit);

  const set = (key: keyof FormState, value: string | boolean) => onChange({ [key]: value });

  const uploadFolder = form.slug.trim() || slugify(form.name) || 'nouveau';

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadPublicImage('product-images', file, uploadFolder);
      set('image_url', url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

  const slugPreview = (form.slug.trim() || slugify(form.name) || 'nom-du-produit').replace(/^-+|-+$/g, '');
  const detailUrl = `/menu/${slugPreview}`;

  return (
    <div className="flex flex-col gap-8 pb-2">
      {/* ─── JSX vient des sections suivantes de AdminProductEditorForm.tsx ─── */}
      {/* Copier les lignes 447-629 (Bloc 1 complet) en appliquant ces transformations : */}
      {/*   1. set('name', e.target.value) → onChange({ name: e.target.value, slug: slugify(e.target.value) }) */}
      {/*   2. set(key, value) → onChange({ [key]: value })  (toutes les autres occurrences) */}
      {/*   3. setForm(prev => ({ ...prev, ingredients_tags: val })) → onChange({ ingredients_tags: val }) */}
      {/*   4. setForm(prev => ({ ...prev, benefits_tags: val })) → onChange({ benefits_tags: val }) */}
      {/*   5. Supprimer entièrement la <div className="md:col-span-2 space-y-4 ... carrousel"> */}
      {/*      (lignes 562-629 dans AdminProductEditorForm.tsx — la section "Carrousel d'accueil") */}
      {/* ─── Copier les lignes 632-657 (Bloc 2 Photo) en appliquant : */}
      {/*   6. disabled={saving}  → disabled={busy} */}
      {/*   7. set('image_url', e.target.value) → onChange({ image_url: e.target.value }) */}
      {/* ─── Copier les lignes 659-768 (Bloc 3 Détail) en appliquant transformations 2, 3, 4 ci-dessus */}
      {/* ─── Copier les lignes 770-808 (Réglages avancés) — showAdvanced/setShowAdvanced sont locaux, aucun changement */}

      {uploadError && (
        <p className="text-[12px] text-red-600" role="alert">{uploadError}</p>
      )}
    </div>
  );
}

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -30
```

Expected : zéro erreur sur AdminProductForm.tsx.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/AdminProductForm.tsx && git commit -m "feat: AdminProductForm — champs produit purs extraits de AdminProductEditorForm"
```

---

## Task 4 — AdminCarouselToggle.tsx

**Files:**
- Create: `src/components/admin/AdminCarouselToggle.tsx`
- Read first: `src/components/admin/AdminProductEditorForm.tsx` lignes 562-628

Extrait la section carrousel de AdminProductEditorForm.

- [ ] **Créer le fichier**

```tsx
// src/components/admin/AdminCarouselToggle.tsx
import { cn } from '@heroui/react';

const labelClass = 'mb-1.5 block text-[10px] font-normal uppercase tracking-[0.14em] text-black/45';
const inputClass =
  'w-full min-h-11 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-3 py-2 text-base sm:text-[13px] text-black placeholder:text-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

interface Props {
  included: boolean;
  onIncludeChange: (v: boolean) => void;
  position: string;
  onPositionChange: (v: string) => void;
  badge: string;
  onBadgeChange: (v: string) => void;
  busy: boolean;
  existingPositions?: number[];
}

export function AdminCarouselToggle({
  included,
  onIncludeChange,
  position,
  onPositionChange,
  badge,
  onBadgeChange,
  busy,
}: Props) {
  return (
    <div className="space-y-4 rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] px-4 py-4">
      <div>
        <p className={labelClass}>Carrousel d'accueil</p>
        <label className="mt-2 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={included}
            onChange={(e) => {
              const on = e.target.checked;
              onIncludeChange(on);
              if (!on) {
                onPositionChange('');
                onBadgeChange('');
              }
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-black"
            disabled={busy}
          />
          <span>
            <span className="block text-[13px] font-normal text-black/85">
              Ajouter cette boisson au carrousel d'accueil
            </span>
            <span className="mt-0.5 block text-[11px] font-light leading-relaxed text-black/42">
              Rien à taper : laissez « Position » vide pour placer automatiquement en dernier (nouveau produit) ou
              conserver la position actuelle à l'édition.
            </span>
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Position dans le carrousel</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            disabled={!included || busy}
            className={cn(inputClass, (!included || busy) && 'cursor-not-allowed opacity-45')}
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            placeholder="Automatique si vide"
          />
          <p className="mt-1.5 text-[10px] font-light leading-relaxed text-black/38">
            Optionnel : 1 = première slide. Vide = ordre auto ou inchangé selon le cas.
          </p>
        </div>
        <div>
          <label className={labelClass}>Pastille sur l'accueil</label>
          <select
            disabled={!included || busy}
            className={cn(inputClass, (!included || busy) && 'cursor-not-allowed opacity-45')}
            value={badge}
            onChange={(e) => onBadgeChange(e.target.value)}
          >
            <option value="">—</option>
            <option value="nouveaute">Nouveauté</option>
            <option value="coup-de-coeur">Coup de cœur</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | grep "AdminCarouselToggle\|error" | head -10
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/AdminCarouselToggle.tsx && git commit -m "feat: AdminCarouselToggle — section carrousel extraite en composant"
```

---

## Task 5 — AdminProductEditorForm.tsx refactor (thin wrapper)

**Files:**
- Modify: `src/components/admin/AdminProductEditorForm.tsx`

Remplace le contenu actuel (837 lignes) par un thin wrapper qui :
1. Re-exporte tout ce qu'AdminProduits.tsx importe (aucun changement côté appelant)
2. Compose AdminProductForm + AdminCarouselToggle + AdminProductGallery

- [ ] **Réécrire le fichier**

```tsx
// src/components/admin/AdminProductEditorForm.tsx
import { useState } from 'react';
import {
  AdminProductForm,
  EMPTY_FORM,
  FormState,
  productToForm,
  payloadFromForm,
  CATEGORIES,
  CAT_LABEL,
} from './AdminProductForm';
import { AdminCarouselToggle } from './AdminCarouselToggle';
import { AdminProductGallery } from './AdminProductGallery';

// Re-exports pour backward compat (AdminProduits.tsx importe depuis ici)
export { EMPTY_FORM, FormState, productToForm, payloadFromForm, CATEGORIES, CAT_LABEL };

export function AdminProductEditorForm({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Indiquez le nom de la boisson.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-2">
      <AdminProductForm
        form={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        busy={saving}
        isEdit={mode === 'edit'}
      />

      <AdminCarouselToggle
        included={form.carousel_include}
        onIncludeChange={(v) =>
          setForm((prev) => ({
            ...prev,
            carousel_include: v,
            carousel_sort: v ? prev.carousel_sort : '',
            carousel_badge: v ? prev.carousel_badge : '',
          }))
        }
        position={form.carousel_sort}
        onPositionChange={(v) => setForm((prev) => ({ ...prev, carousel_sort: v }))}
        badge={form.carousel_badge}
        onBadgeChange={(v) => setForm((prev) => ({ ...prev, carousel_badge: v }))}
        busy={saving}
      />

      <AdminProductGallery
        productId={initial?.id as string | undefined}
        table="products"
        images={gallery}
        onReorder={setGallery}
        busy={saving}
      />

      {error && (
        <p className="text-[12px] text-red-600" role="alert">{error}</p>
      )}

      <div className="sticky bottom-0 z-[1] flex flex-wrap gap-3 border-t border-noir/[0.06] bg-white pt-4 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 min-h-11 rounded-[2px] bg-noir px-8 text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le produit' : 'Enregistrer les modifications'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-11 min-h-11 rounded-[2px] border border-noir/15 px-8 text-[11px] font-light uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir/30 hover:text-black disabled:opacity-40"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
```

**Note :** `initial?.id` — le type `Partial<FormState>` n'a pas de champ `id`. Ajouter `id?: string` à `EMPTY_FORM` dans AdminProductForm.tsx (valeur `''`) pour que le type soit compatible, OU caster `initial` avec `(initial as any)?.id`. Choisir le cast `as any` pour éviter de modifier FormState (champ non-formulaire).

Remplacer `productId={initial?.id as string | undefined}` par :
```tsx
productId={(initial as Record<string, unknown>)?.id as string | undefined}
```

- [ ] **Vérifier TypeScript — zéro erreur**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -30
```

Expected : aucune erreur.

- [ ] **Vérifier que AdminProduits.tsx compile sans changement**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | grep "AdminProduits\|error" | head -10
```

Expected : aucune erreur liée à AdminProduits.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/AdminProductEditorForm.tsx && git commit -m "refactor: AdminProductEditorForm → thin wrapper (AdminProductForm + AdminCarouselToggle + AdminProductGallery)"
```

---

## Task 6 — DrinkDetailAdminEdit.tsx + menuData + menuCatalog

**Files:**
- Modify: `src/components/admin/DrinkDetailAdminEdit.tsx`
- Modify: `src/data/menuData.ts`
- Modify: `src/lib/menuCatalog.ts`

Ajoute la galerie dans le modal inline boissons + assure que MenuItem transporte gallery.

- [ ] **Ajouter `gallery` au type MenuItem dans `src/data/menuData.ts`**

Trouver l'interface `MenuItem` (ligne ~1) et ajouter :

```ts
// Avant
  badges?: ('vegan' | 'glutenfree' | 'vitamins')[];
}

// Après
  badges?: ('vegan' | 'glutenfree' | 'vitamins')[];
  gallery?: string[];
}
```

- [ ] **Mapper `gallery` dans `productRowToMenuItem` dans `src/lib/menuCatalog.ts`**

Dans la fonction `productRowToMenuItem` (ligne ~53), ajouter après `badges` :

```ts
// Avant
    badges: badges.length ? badges : undefined,
  };

// Après
    badges: badges.length ? badges : undefined,
    gallery: p.gallery ?? [],
  };
```

- [ ] **Modifier `DrinkDetailAdminEdit.tsx` — ajouter la section galerie**

Lire le fichier complet d'abord. Puis appliquer ces changements :

**Import :**
```ts
// Ajouter en haut
import { AdminProductGallery } from './AdminProductGallery';
```

**State :**
```tsx
// Ajouter après les useState existants (dans la fonction DrinkDetailAdminEdit)
const [gallery, setGallery] = useState<string[]>(drink.gallery ?? []);
```

**Reset dans useEffect (réouverture de modal) :**
```tsx
// Dans le useEffect existant, ajouter après setImagePreview(''):
setGallery(drink.gallery ?? []);
if (fileRef.current) fileRef.current.value = '';
```

**JSX — dans Modal.Body, après la section image existante, avant le champ Nom :**
```tsx
{/* Photos supplémentaires */}
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
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/DrinkDetailAdminEdit.tsx src/data/menuData.ts src/lib/menuCatalog.ts && git commit -m "feat: galerie inline boissons — DrinkDetailAdminEdit + MenuItem gallery"
```

---

## Task 7 — GammeProductDetailAdminEdit.tsx

**Files:**
- Modify: `src/components/admin/GammeProductDetailAdminEdit.tsx`

Ajoute la galerie dans le modal inline produits gamme.

- [ ] **Lire le fichier actuel**

Chemin : `src/components/admin/GammeProductDetailAdminEdit.tsx`

- [ ] **Modifier le fichier**

**Import :**
```ts
import { AdminProductGallery } from './AdminProductGallery';
```

**State :**
```tsx
// Ajouter après les useState existants
const [gallery, setGallery] = useState<string[]>(product.gallery ?? []);
```

**Reset dans useEffect :**
```tsx
// Ajouter dans le bloc if (isOpen) du useEffect
setGallery(product.gallery ?? []);
```

**JSX — dans Modal.Body, après la section image `image_url` existante, avant le champ Nom :**
```tsx
{/* Photos supplémentaires */}
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
```

- [ ] **Vérifier TypeScript — zéro erreur**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/GammeProductDetailAdminEdit.tsx && git commit -m "feat: galerie inline gamme — GammeProductDetailAdminEdit"
```

---

## Task 8 — DrinkDetail.tsx — section galerie publique

**Files:**
- Modify: `src/pages/DrinkDetail.tsx`

Ajoute une section "Photos" sous le hero si `drink.gallery` contient des images.

- [ ] **Lire le fichier actuel**

Chemin : `src/pages/DrinkDetail.tsx`

- [ ] **Ajouter la section galerie après la section hero split**

Trouver l'endroit dans le JSX juste avant le CTA final (`<section className="bg-noir">`). Insérer :

```tsx
{/* ─── Galerie ─── */}
{drink.gallery && drink.gallery.length > 0 && (
  <section className="border-t border-noir/[0.05]">
    <PageShell className="py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h2
          className="mb-6 font-display font-normal text-black"
          style={{ fontSize: 'clamp(22px, 2.5vw, 30px)' }}
        >
          Photos
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {drink.gallery.map((url, i) => (
            <div
              key={url}
              className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well"
            >
              <img
                src={url}
                alt={`${drink.name} — photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  </section>
)}
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/pages/DrinkDetail.tsx && git commit -m "feat: section galerie publique sur DrinkDetail"
```

---

## Task 9 — GammeProductDetail.tsx — section galerie publique

**Files:**
- Modify: `src/pages/GammeProductDetail.tsx`

Même pattern que Task 8, pour les produits gamme.

- [ ] **Lire le fichier actuel**

Chemin : `src/pages/GammeProductDetail.tsx`

- [ ] **Ajouter la section galerie après la section hero split**

Trouver juste avant la section "Vous aimerez aussi" (`{crossSell.length > 0 &&`). Insérer :

```tsx
{/* ─── Galerie ─── */}
{product.gallery && product.gallery.length > 0 && (
  <section className="border-t border-noir/[0.05]">
    <PageShell className="py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h2
          className="mb-6 font-display font-normal text-black"
          style={{ fontSize: 'clamp(22px, 2.5vw, 30px)' }}
        >
          Photos
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {product.gallery.map((url, i) => (
            <div
              key={url}
              className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well"
            >
              <img
                src={url}
                alt={`${product.name} — photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  </section>
)}
```

- [ ] **Vérifier TypeScript — zéro erreur globale**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1
```

Expected : aucune erreur.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/pages/GammeProductDetail.tsx && git commit -m "feat: section galerie publique sur GammeProductDetail"
```

---

## Task 10 — Build + push

**Files:** aucun

- [ ] **Build de production**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npm run build 2>&1 | grep -E "error|Error|✓ built|built in"
```

Expected : `✓ built in Xs` sans ligne `error`.

- [ ] **Checklist manuelle**

1. Aller sur `/menu/glow-my-skin` (ou tout autre slug valide) en tant qu'admin → bouton "Modifier" → modal s'ouvre → section "Photos supplémentaires" visible avec grid vide
2. Ajouter une image via la section galerie → image apparaît dans le grid
3. Ajouter une 2ème image → OK. Ajouter une 3ème → OK. Bouton "+ Ajouter" disparaît à 3.
4. Drag une image → badge "Enregistrer l'ordre" apparaît → cliquer → feedback saving
5. Supprimer une image → disparaît du grid
6. Aller sur `/nos-produits/wellness/<slug>` → même test en admin
7. Naviguer sur `/menu/glow-my-skin` côté public → si gallery non vide, section "Photos" visible

- [ ] **Push**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git push
```
