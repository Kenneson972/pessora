# Design — Split AdminProductEditorForm + Galerie multi-images

**Date :** 2026-05-29
**Scope :** Phase 1 (split AdminProductEditorForm) + Phase 2 (galerie DB + AdminProductGallery) + Phase 3 (intégration inline + pages publiques)
**Phase 4 (HomeGammesProductCarousel → DB) :** spec séparée, hors scope ici.

---

## Problème

`AdminProductEditorForm.tsx` (837 lignes) mélange champs produit, section carrousel et future galerie. Impossible d'ajouter `AdminProductGallery` proprement sans le découper d'abord. Par ailleurs, les produits n'ont qu'une seule image (`image_url`) — aucune galerie.

---

## Architecture

### Approche retenue

1. **Split** `AdminProductEditorForm` → `AdminProductForm` + `AdminCarouselToggle` + wrapper backward-compat
2. **Galerie DB** — colonne `gallery text[]` sur `products` et `gamme_products`
3. **`AdminProductGallery`** — composant drag & drop réutilisable, max 3 images, save explicite
4. **Intégration** — galerie dans `AdminProduits` (via wrapper) + `DrinkDetailAdminEdit` + `GammeProductDetailAdminEdit`
5. **Pages publiques** — section "Photos" sous le hero si `gallery.length > 0`

### Choix clés

- `image_url` = image principale (hero, panier, carrousel) — **inchangé**
- `gallery[]` = images supplémentaires, max 3, concept séparé
- Drag & drop save : **bouton explicite** "Enregistrer l'ordre" (pas d'autosave)
- `AdminProductEditorForm.tsx` reste en place comme wrapper — aucune régression

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/AdminProductForm.tsx` |
| Créer | `src/components/admin/AdminCarouselToggle.tsx` |
| Créer | `src/components/admin/AdminProductGallery.tsx` |
| Modifier | `src/components/admin/AdminProductEditorForm.tsx` |
| Modifier | `src/pages/admin/AdminProduits.tsx` |
| Modifier | `src/components/admin/DrinkDetailAdminEdit.tsx` |
| Modifier | `src/components/admin/GammeProductDetailAdminEdit.tsx` |
| Modifier | `src/pages/DrinkDetail.tsx` |
| Modifier | `src/pages/GammeProductDetail.tsx` |
| Modifier | `src/types/database.ts` |
| SQL | Migration `gallery` sur `products` + `gamme_products` |

---

## Phase 1 — Split AdminProductEditorForm

### `AdminProductForm.tsx`

Extrait tous les champs produit purs depuis `AdminProductEditorForm`.

```ts
interface Props {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  busy: boolean
  isEdit: boolean
}
```

Champs inclus :
- Nom, slug (auto-généré), catégorie, emoji
- Description, pitch
- Prix, prix par taille (small/medium/large)
- Calories, protéines
- Tags ingrédients + bénéfices (avec presets)
- Badges (vegan, glutenfree, vitamins)
- Image principale `image_url` (upload unique — inchangé)
- Visibilité (active)

### `AdminCarouselToggle.tsx`

Extrait la section carrousel depuis `AdminProductEditorForm`.

```ts
interface Props {
  included: boolean
  onIncludeChange: (v: boolean) => void
  position: string
  onPositionChange: (v: string) => void
  badge: string  // '' | 'nouveaute' | 'coup-de-coeur'
  onBadgeChange: (v: string) => void
  busy: boolean
  existingPositions: number[]
}
```

UI : checkbox "Ajouter au carrousel d'accueil" → si coché, affiche champ position + dropdown pastille.

### `AdminProductEditorForm.tsx` — wrapper backward-compat

Après split, ce fichier compose les nouveaux composants :

```tsx
<AdminProductForm form={form} onChange={onChange} busy={busy} isEdit={mode === 'edit'} />
<AdminCarouselToggle
  included={form.carousel_include}
  onIncludeChange={...}
  position={form.carousel_sort}
  onPositionChange={...}
  badge={form.carousel_badge}
  onBadgeChange={...}
  busy={busy}
  existingPositions={existingPositions}
/>
<AdminProductGallery
  productId={initial?.id}
  table="products"
  images={gallery}
  onReorder={setGallery}
  busy={busy}
/>
```

`AdminProduits.tsx` continue d'appeler `AdminProductEditorForm` **exactement comme avant** — aucune modification nécessaire côté appelant.

`EMPTY_FORM`, `productToForm`, `payloadFromForm` restent dans `AdminProduits.tsx`.

---

## Phase 2 — DB + AdminProductGallery

### Migration SQL

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE gamme_products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
```

### `src/types/database.ts`

Ajouter `gallery: string[]` dans :
- `products.Row`
- `products.Insert` / `products.Update`
- `gamme_products.Row`
- `gamme_products.Insert` / `gamme_products.Update`

### `AdminProductGallery.tsx`

Composant autonome, réutilisable pour `products` et `gamme_products`.

```ts
interface Props {
  productId: string | undefined   // undefined = mode création, boutons désactivés
  table: 'products' | 'gamme_products'
  images: string[]                // gallery[] actuel (max 3)
  onReorder: (newOrder: string[]) => void
  busy: boolean
}
```

**Upload :**
- Bouton "+ Ajouter une photo" visible si `images.length < 3`
- `uploadPublicImage('product-images', file, prefix)` — prefix : `'menu/'` si `table === 'products'`, `'gammes/'` si `table === 'gamme_products'`
- Après upload → `supabase.update({ gallery: [...images, newUrl] }).eq('id', productId)` + callback `onReorder`

**Suppression :**
- Bouton ✕ sur chaque thumbnail
- `supabase.update({ gallery: images.filter(u => u !== url) }).eq('id', productId)` + callback `onReorder`
- Mise à jour DB immédiate (pas besoin de bouton save pour supprimer)

**Drag & drop (réordonnement) :**
- Attributs HTML5 natifs : `draggable`, `onDragStart`, `onDragOver`, `onDrop`
- État local `localOrder: string[]` — modifié à chaque drop
- Bouton "Enregistrer l'ordre" apparaît uniquement si `localOrder !== images` (ordre modifié)
- Au clic : `supabase.update({ gallery: localOrder }).eq('id', productId)` + callback `onReorder(localOrder)`

**Grid :**
- 3 colonnes, `aspect-square`, `rounded-[2px]`, cohérent avec le design admin existant
- Si `images.length === 0` : zone vide avec texte "Aucune photo supplémentaire"

**Pattern référence :** `EventGalleryManager.tsx` (galerie événements, même projet)

---

## Phase 3 — Intégration

### `DrinkDetailAdminEdit.tsx`

**Prérequis :** ajouter `gallery?: string[]` au type `MenuItem` dans `src/data/menuData.ts` (ou au type DB `Product` selon le chemin de données).

Dans la modal existante, après la section image principale `image_url`, ajouter :

```tsx
// State local initialisé depuis product.gallery
const [gallery, setGallery] = useState<string[]>(drink.gallery ?? []);

// Dans le Modal.Body, après la section image existante :
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

Le champ `image_url` existant (upload single) **est conservé** — gallery est une section distincte.

### `GammeProductDetailAdminEdit.tsx`

Même pattern, avec `table="gamme_products"` et `product.id` comme `productId`.

### `DrinkDetail.tsx` — section publique

Après la section hero split, avant le CTA final :

```tsx
{drink.gallery && drink.gallery.length > 0 && (
  <section className="border-t border-noir/[0.05]">
    <PageShell className="py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="mb-6 font-display text-[22px] font-normal text-black">Photos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {drink.gallery.map((url) => (
            <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
              <img src={url} alt={drink.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  </section>
)}
```

### `GammeProductDetail.tsx` — section publique

Même pattern que DrinkDetail, avec `product.gallery`.

---

## Ce qui n'est PAS inclus

- Phase 4 (HomeGammesProductCarousel → DB) — spec séparée
- Modification de `AdminCarousel.tsx` (carrousel d'accueil) — fonctionne déjà
- Lightbox ou interactivité sur les images galerie côté public — affichage statique uniquement
- Suppression physique des fichiers Supabase Storage lors du retrait d'une image galerie
