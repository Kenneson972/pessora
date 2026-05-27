# Auto-Slug Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-générer les slugs dans tous les formulaires admin (événements, produits, gammes) sans bouton manuel.

**Architecture:** Slug auto-généré depuis le titre/nom via `slugify()` existant. Pour les gammes, ajout d'une colonne `slug` en base + migration Supabase + mise à jour des pages publiques pour utiliser le slug stocké (fallback `toSlug()` pour compatibilité).

**Tech Stack:** Supabase migration (SQL), React (slugify dans onChange), `toSlug()` de `src/lib/toSlug.ts`

---

### Task 1: Événements — slug auto-généré aussi en modification

**Files:**
- Modify: `src/pages/admin/AdminEvenements.tsx:288-291`

- [ ] **Step 1: Remove the `!existing` condition**

Current code (line 288-291):
```tsx
onChange={(e) => {
  set('title', e.target.value);
  if (!initial?.slug && !existing) set('slug', slugify(e.target.value));
}}
```

Replace with:
```tsx
onChange={(e) => {
  set('title', e.target.value);
  set('slug', slugify(e.target.value));
}}
```

This auto-generates the slug from the title during both creation and modification.

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminEvenements.tsx
git commit -m "feat: auto-slug evenements en modification depuis le titre"
```

---

### Task 2: Produits — slug auto-généré depuis le nom

**Files:**
- Modify: `src/components/admin/AdminProductEditorForm.tsx:460-466`

- [ ] **Step 1: Add slug auto-generation on name change**

Current name input onChange (line 464):
```tsx
onChange={(e) => set('name', e.target.value)}
```

Replace with:
```tsx
onChange={(e) => {
  set('name', e.target.value);
  set('slug', slugify(e.target.value));
}}
```

- [ ] **Step 2: Remove the manual "Générer automatiquement" button (lines 791-797)**

Remove this block:
```tsx
<button
  type="button"
  className="mt-2 text-[11px] font-normal text-black/45 underline underline-offset-2 hover:text-black"
  onClick={() => set('slug', slugify(form.name))}
>
  Générer automatiquement depuis le nom
</button>
```

The slug field stays editable with its current label and input — it just gets auto-filled now when the name changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminProductEditorForm.tsx
git commit -m "feat: auto-slug produits depuis le nom (remplace bouton manuel)"
```

---

### Task 3: Gammes — migration DB + slug auto + pages publiques

**Files:**
- Create: `supabase/migrations/20260525140000_gamme_products_add_slug.sql`
- Modify: `src/types/database.ts` (ajout slug dans GammeProduct)
- Modify: `src/pages/admin/AdminGammes.tsx` (slug field dans le formulaire)
- Modify: `src/pages/RangeDetail.tsx:179` (utiliser slug stocké)
- Modify: `src/pages/GammeProductDetail.tsx:67-68` (utiliser slug stocké)

- [ ] **Step 1: Create SQL migration**

File: `supabase/migrations/20260525140000_gamme_products_add_slug.sql`
```sql
-- Ajout d'un slug URL pour les produits de gamme.
-- Remplit automatiquement les lignes existantes via le nom.
ALTER TABLE public.gamme_products
  ADD COLUMN IF NOT EXISTS slug text;

-- Slug unique par gamme (pas de doublons de slug dans une même gamme)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gamme_products_slug ON public.gamme_products (slug);

COMMENT ON COLUMN public.gamme_products.slug IS
  'Slug URL unique — auto-généré depuis le nom. Utilisé par RangeDetail et GammeProductDetail.';
```

- [ ] **Step 2: Update GammeProduct type**

In `src/types/database.ts`, add `slug: string | null` to the `gamme_products.Row` type (after `sort_order`, before `active`):
```typescript
sort_order: number
slug: string | null
active: boolean
```

- [ ] **Step 3: Add slug to AdminGammes editor form**

In `src/pages/admin/AdminGammes.tsx`:

3a. Add `slug: ''` to `EMPTY_FORM` (after name):
```tsx
const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  // ...rest
};
```

3b. Update `productToForm()` to include slug:
```tsx
function productToForm(p: GammeProduct): FormState {
  return {
    name: p.name,
    slug: p.slug ?? '',
    description: p.description ?? '',
    price: String(p.price),
    price_alt: p.price_alt != null ? String(p.price_alt) : '',
    image_url: p.image_url ?? '',
    sort_order: String(p.sort_order),
  };
}
```

3c. Update `buildPayload()` to include slug:
```tsx
const buildPayload = (form: FormState) => ({
  gamme: gamme === 'all' ? 'sport' as const : gamme as GammeKey,
  subcategory: subcategory === 'all' ? null : subcategory,
  name: form.name.trim(),
  slug: form.slug.trim() || null,
  description: form.description.trim() || null,
  // ...rest
});
```

3d. Auto-generate slug from name on the name input onChange. Find the name field in GammeEditorForm and update onChange to also set slug:
```tsx
<input
  className={inputClass}
  value={form.name}
  onChange={(e) => {
    set('name', e.target.value);
    set('slug', slugify(e.target.value));
  }}
/>
```

3e. Add `slugify` import at the top of AdminGammes.tsx or define it locally. Since `slugify` is already exported from `AdminProductEditorForm`, import it:
```tsx
import { slugify } from '../../components/admin/AdminProductEditorForm';
```

3f. Add a slug field in the editor form (after name, before price):
```tsx
<label className="flex flex-col gap-1">
  <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Slug (URL)</span>
  <input className={inputClass} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-généré depuis le nom" />
</label>
```

- [ ] **Step 4: Update RangeDetail.tsx to use stored slug**

In `src/pages/RangeDetail.tsx:179`, replace:
```tsx
to={`/nos-produits/${rangeId}/${toSlug(product.name)}`}
```
With:
```tsx
to={`/nos-produits/${rangeId}/${product.slug || toSlug(product.name)}`}
```

- [ ] **Step 5: Update GammeProductDetail.tsx to use stored slug**

In `src/pages/GammeProductDetail.tsx:67-68`, replace:
```tsx
.filter((p) => toSlug(p.name) !== slug)
.map((p) => ({ ...p, slug: toSlug(p.name) }))
```
With:
```tsx
.filter((p) => (p.slug || toSlug(p.name)) !== slug)
.map((p) => ({ ...p, slug: p.slug || toSlug(p.name) }))
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260525140000_gamme_products_add_slug.sql src/types/database.ts src/pages/admin/AdminGammes.tsx src/pages/RangeDetail.tsx src/pages/GammeProductDetail.tsx
git commit -m "feat: add slug to gamme_products — migration, admin form, public pages"
```

---

## Self-Review Checklist

1. **Task 1** — Evenements slug auto en modification ✅
2. **Task 2** — Produits slug auto depuis nom, bouton manuel supprimé ✅
3. **Task 3** — Gammes: migration (add column + index), type update, form field with auto-gen, public pages with fallback ✅
4. **No placeholders:** Complete code in every step ✅
5. **Type consistency:** `slug: string | null` in GammeProduct, `slug: ''` in EMPTY_FORM, `slugify()` import consistent ✅
