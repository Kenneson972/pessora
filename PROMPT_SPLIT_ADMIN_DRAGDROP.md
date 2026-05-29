# Prompt Cursor — Split Admin Formulaires + Drag & Drop Images (Boissons + Gamme)

**Date :** 2026-05-29
**Contexte :** `AdminProductEditorForm.tsx` (837 lignes) mélange édition produit et édition carrousel. Aucun drag & drop pour réordonner les images. Les produits n'ont qu'une seule image (`image_url`), pas de galerie.

---

## Architecture cible

```
src/components/admin/
├── AdminProductForm.tsx          ← extrait de AdminProductEditorForm (infos produit pures)
├── AdminCarouselToggle.tsx       ← extrait de AdminProductEditorForm (carrousel réutilisable)
├── AdminProductGallery.tsx       ← NOUVEAU — galerie d'images avec drag & drop
├── DrinkDetailAdminEdit.tsx      ← existe déjà, à modifier (remplacer image unique par AdminProductGallery)
├── GammeProductDetailAdminEdit.tsx ← existe déjà, à modifier (idem)

src/pages/admin/
├── AdminProduits.tsx             ← modifié (utilise AdminProductForm + AdminCarouselToggle + AdminProductGallery)
├── AdminCarousel.tsx             ← déjà OK (drag & drop existant)

src/pages/
├── DrinkDetail.tsx               ← modifié (affiche la galerie multi-images)
├── GammeProductDetail.tsx        ← modifié (idem)

src/components/home/
├── HomeGammesProductCarousel.tsx  ← modifié (utilise images DB + ordre drag & drop)
```

---

## Phase 1 — Split AdminProductEditorForm

### 1A. Créer `AdminProductForm.tsx`

Extraire TOUS les champs produit sans le carrousel :
- Nom, slug (auto), catégorie, emoji, description, pitch
- Prix, prix par taille (small/medium/large)
- Calories, protéines
- Tags ingrédients, bénéfices
- Badges (vegan, glutenfree, vitamins)
- Image principale (upload unique)
- Visibilité (active)

**Props :**
```ts
interface Props {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  busy: boolean
  isEdit: boolean  // true = édition, false = création
}
```

**Ne pas toucher** à `EMPTY_FORM`, `productToForm`, `payloadFromForm` — ils restent dans un fichier partagé ou dans AdminProduits.tsx.

### 1B. Créer `AdminCarouselToggle.tsx`

Composant réutilisable indépendant. Sera utilisé pour les boissons ET les produits gamme.

**Props :**
```ts
interface Props {
  included: boolean
  onIncludeChange: (v: boolean) => void
  position: string
  onPositionChange: (v: string) => void
  badge: string  // '' | 'nouveaute' | 'coup-de-coeur'
  onBadgeChange: (v: string) => void
  busy: boolean
  existingPositions: number[]  // positions déjà prises (pour validation)
}
```

**UI :**
- Checkbox "Ajouter au carrousel d'accueil"
- Si coché → champ position (number), dropdown pastille (Aucune / Nouveauté / Coup de cœur)
- Si décoché → les champs position/pastille sont masqués

### 1C. Modifier `AdminProduits.tsx`

Remplacer le render de `AdminProductEditorForm` par :
```tsx
<AdminProductForm form={form} onChange={patchForm} busy={busy} isEdit={!!editProduct} />
<AdminCarouselToggle ... />
<AdminProductGallery productId={editProduct?.id} images={gallery} onReorder={handleReorder} />
```

---

## Phase 2 — Galerie multi-images (DB)

### 2A. Ajouter colonne `gallery` aux tables

Le projet a déjà ce pattern sur `events.gallery` (`string[]`).

**Migration SQL :**
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE gamme_products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
```

**Mettre à jour `src/types/database.ts` :**
- `products.Row` → ajouter `gallery: string[]`
- `gamme_products.Row` → ajouter `gallery: string[]`

### 2B. Créer `AdminProductGallery.tsx`

Composant drag & drop pour gérer les images d'un produit.

**Props :**
```ts
interface Props {
  productId: string | undefined  // undefined = création (pas encore d'ID)
  table: 'products' | 'gamme_products'
  images: string[]  // URLs actuelles
  onReorder: (newOrder: string[]) => void
  busy: boolean
}
```

**Fonctionnalités :**
- Upload d'image → `uploadPublicImage('product-images', file, prefix)` → ajout à `images[]`
- Suppression d'image (bouton X sur chaque thumbnail)
- Drag & drop natif HTML5 (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) pour réordonner
- Preview grid responsive (2-3 colonnes)
- Sauvegarde en DB : `supabase.from(table).update({ gallery: images }).eq('id', productId)`
- Bouton "Enregistrer l'ordre" (ou autosave au drop)

**Bucket Supabase :**
- Boissons → `product-images`, prefix `menu/`
- Gamme → `product-images`, prefix `gammes/`

---

## Phase 3 — Intégration dans les pages publiques

### 3A. `DrinkDetail.tsx` — afficher la galerie

Sous l'image principale actuelle, si `drink.gallery.length > 0` :
- Mini-grid de thumbnails (50×50, rounded)
- Au clic sur un thumbnail → remplace l'image principale affichée

### 3B. `GammeProductDetail.tsx` — afficher la galerie

Même comportement que DrinkDetail.

### 3C. `DrinkDetailAdminEdit.tsx` — remplacer l'upload unique

Supprimer le champ `image_url` unique. Le remplacer par `<AdminProductGallery table="products" ... />`.

### 3D. `GammeProductDetailAdminEdit.tsx` — idem

Remplacer l'upload unique par `<AdminProductGallery table="gamme_products" ... />`.

---

## Phase 4 — Carrousel gamme (HomeGammesProductCarousel)

Actuellement : statique (rangesData), placeholder "Photo à venir".

### À faire :
- Remplacer les données statiques par un fetch Supabase des produits gamme actifs
- Utiliser `image_url` (1ère image) ou `gallery[0]` comme image principale
- Ajouter un tri par `sort_order` ou position manuelle
- Dans l'admin gamme, permettre le drag & drop pour définir l'ordre d'apparition

### Admin gamme — drag & drop ordre des produits

Ajouter une section dans l'admin gamme produits :
- Liste verticale des produits avec poignée `GripVertical`
- Drag & drop natif pour réordonner
- Sauvegarde : `supabase.from('gamme_products').update({ sort_order: newIndex })` pour chaque produit

---

## Règles

- Code en français (comments, messages utilisateur)
- Utiliser les composants HeroUI pour les formulaires, modales, boutons
- Garder le design cohérent avec le reste de l'admin (taille de police 10px, uppercase tracking, bordures fines, radius 2px)
- `uploadPublicImage` existe déjà dans `src/lib/storageUpload.ts`
- Pattern drag & drop natif HTML5 (pas de librairie externe)
- Pattern gallery `string[]` déjà utilisé sur `events.gallery` — s'en inspirer
- Ne pas casser l'existant — AdminProductEditorForm.tsx reste en place tant que les nouveaux composants ne sont pas branchés
- Le drag & drop du carrousel d'accueil (`AdminCarousel.tsx`) ne doit PAS être modifié — il fonctionne déjà

---

## Fichiers créés / modifiés — récap

| Action | Fichier |
|--------|---------|
| CRÉER | `src/components/admin/AdminProductForm.tsx` |
| CRÉER | `src/components/admin/AdminCarouselToggle.tsx` |
| CRÉER | `src/components/admin/AdminProductGallery.tsx` |
| MODIFIER | `src/pages/admin/AdminProduits.tsx` |
| MODIFIER | `src/components/admin/DrinkDetailAdminEdit.tsx` |
| MODIFIER | `src/components/admin/GammeProductDetailAdminEdit.tsx` |
| MODIFIER | `src/pages/DrinkDetail.tsx` |
| MODIFIER | `src/pages/GammeProductDetail.tsx` |
| MODIFIER | `src/components/home/HomeGammesProductCarousel.tsx` |
| MODIFIER | `src/types/database.ts` |
| SQL | Migration `gallery` sur `products` et `gamme_products` |
