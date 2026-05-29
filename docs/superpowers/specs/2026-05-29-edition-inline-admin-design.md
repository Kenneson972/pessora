# Design — Édition inline admin depuis les pages publiques

**Date :** 2026-05-29
**Scope :** DrinkDetail (`/menu/:slug`) + GammeProductDetail (`/nos-produits/:rangeId/:slug`)

---

## Objectif

Quand un admin est connecté, les pages produit publiques affichent un bouton flottant "✏️ Modifier". Au clic, un modal centré s'ouvre avec tous les champs éditables (dont upload image). L'enregistrement met à jour la table Supabase correspondante et invalide le cache.

---

## Architecture

**Approche : composants séparés par page**

- `src/components/admin/DrinkDetailAdminEdit.tsx` — modal + logique pour `/menu/:slug`
- `src/components/admin/GammeProductDetailAdminEdit.tsx` — modal + logique pour `/nos-produits/:rangeId/:slug`
- Les pages hôtes importent le composant et lui passent les données du produit en props
- Aucune logique d'édition dans les pages elles-mêmes

---

## Détection admin

```tsx
const { isAdmin } = useAuth()
```

`isAdmin` est déjà exporté depuis `AuthContext`. Si `isAdmin === false`, aucun bouton ni composant n'est rendu (zéro impact sur les visiteurs).

---

## Bouton déclencheur

- Position : fixe, coin bas droit (`fixed bottom-6 right-6 z-40`)
- Style : bouton pill vert `#1E3529`, texte blanc, `✏️ Modifier`
- Visible uniquement si `isAdmin === true`
- Absent du DOM si non-admin (pas juste `hidden`)

---

## Modal — DrinkDetailAdminEdit

### Champs éditables

| Champ | Input | Table / Colonne |
|-------|-------|-----------------|
| Image | Upload (`uploadPublicImage('product-images', ...)`) | `products.image_url` |
| Nom | `Input` HeroUI | `products.name` |
| Emoji | `Input` (1 char) | `products.emoji` |
| Description | `Textarea` HeroUI | `products.description` |
| Prix (€) | `Input` type number | `products.price` |
| Calories | `Input` type number | `products.calories` |
| Protéines (g) | `Input` type number | `products.proteins` |
| Badges | `Input` (CSV) | `products.badges` (text[] → join/split) |

### Comportement

1. Ouverture : `Modal` HeroUI, state local `isOpen`
2. Init : champs pré-remplis avec les valeurs actuelles du produit
3. Upload image : `<input type="file" accept="image/*">` → `uploadPublicImage('product-images', file, 'menu/')` → met à jour l'URL dans le form state
4. Enregistrement : `supabase.from('products').update(payload).eq('slug', slug)` puis `invalidateMenuCatalogCache()`
5. Succès : fermer le modal, toast de confirmation
6. Erreur : afficher un message d'erreur inline dans le modal
7. Annuler : fermer sans sauvegarder, reset du form state

---

## Modal — GammeProductDetailAdminEdit

### Champs éditables

| Champ | Input | Table / Colonne |
|-------|-------|-----------------|
| Image | Upload (`uploadPublicImage('product-images', ...)`) | `gamme_products.image_url` |
| Nom | `Input` HeroUI | `gamme_products.name` |
| Description | `Textarea` HeroUI | `gamme_products.description` |
| Prix | `Input` type number | `gamme_products.price` |
| Prix alt (ex: "29€ / 39€") | `Input` | `gamme_products.price_alt` |
| Ordre | `Input` type number | `gamme_products.order` |

### Comportement

Même logique que DrinkDetailAdminEdit, table cible : `gamme_products`, pas d'appel à `invalidateMenuCatalogCache()` (les gamme products ont leur propre fetch — pas de cache à invalider côté client).

---

## Gestion de l'image

- Utilise `uploadPublicImage` depuis `src/lib/storageUpload.ts`
- Bucket : `product-images`
- Path prefix : `menu/` pour boissons, `gammes/` pour gamme products
- Preview locale avec `URL.createObjectURL(file)` avant upload
- Si aucun nouveau fichier sélectionné : conserver l'URL existante

---

## États du modal

```
idle → uploading (image) → saving → success / error
```

- `uploading` : spinner sur le champ image, bouton Enregistrer désactivé
- `saving` : spinner sur le bouton Enregistrer, tous les champs désactivés
- `success` : fermeture auto + toast
- `error` : message inline en rouge sous le bouton, modal reste ouvert

---

## Ce qui n'est PAS inclus

- Édition des tailles/prix par taille (boissons multi-tailles) — trop complexe pour une V1, renvoyer vers l'admin classique
- Gestion des boosters — idem
- Historique des modifications
- Validation avancée des champs

---

## Fichiers à créer / modifier

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/DrinkDetailAdminEdit.tsx` |
| Créer | `src/components/admin/GammeProductDetailAdminEdit.tsx` |
| Modifier | `src/pages/DrinkDetail.tsx` — import + render conditionnel |
| Modifier | `src/pages/GammeProductDetail.tsx` — import + render conditionnel |
