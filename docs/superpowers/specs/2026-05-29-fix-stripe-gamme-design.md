# Design — Fix Stripe checkout produits gamme

**Date :** 2026-05-29
**Scope :** `GammeProductDetail` (`/nos-produits/:rangeId/:slug`) + hook `useGammeProduct`

---

## Problème

`GammeProductDetail.tsx` charge les données depuis `productsData.ts` (statique). Le `productId` envoyé au panier est `"${rangeId}-${toSlug(product.name)}"` (ex: `"wellness-aloe-vera"`), pas un UUID.

L'edge function `create-checkout-session` vérifie `UUID_RE.test(productId)` pour les items `source: 'gamme'`. Si ce n'est pas un UUID, elle cherche dans la table `products` (bar) au lieu de `gamme_products` → erreur "Produit bar introuvable" → checkout échoue.

Les 36 produits gamme ont leurs UUIDs + slugs en DB (migrations appliquées). Il manque juste le branchement frontend.

---

## Architecture

**Approche : migration complète vers les données DB**

- Créer `src/hooks/useGammeProduct.ts` — fetch Supabase par `gamme` + `slug`
- Modifier `src/pages/GammeProductDetail.tsx` — utilise le hook, `productId: product.id` (UUID)
- Modifier `src/components/admin/GammeProductDetailAdminEdit.tsx` — adapte le type `GammeProductStatic` → `GammeProduct`

Aucun changement sur l'edge function. Aucun changement sur les données statiques `productsData.ts` (utilisées ailleurs).

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/hooks/useGammeProduct.ts` |
| Modifier | `src/pages/GammeProductDetail.tsx` |
| Modifier | `src/components/admin/GammeProductDetailAdminEdit.tsx` |

---

## `useGammeProduct`

```ts
// Signature
function useGammeProduct(
  rangeId: string | undefined,
  slug: string | undefined,
): { product: GammeProduct | null; loading: boolean; error: string | null }
```

- Fetch : `supabase.from('gamme_products').select('*').eq('gamme', rangeId).eq('slug', slug).eq('active', true).maybeSingle()`
- Si `rangeId` ou `slug` absent : `product = null, loading = false`
- Si DB retourne `null` (produit inexistant) : `product = null`
- Si erreur réseau : `error = message`
- Pattern identique à `useGammeCatalog` (cancelled flag, `supabase as any`)
- Pas de fallback statique — si absent en DB, c'est un vrai 404

---

## `GammeProductDetail` — changements

### Données

| Avant | Après |
|-------|-------|
| `getGammeProduct(rangeId, slug)` statique | `useGammeProduct(rangeId, slug)` hook DB |
| `product.price: string` ("35€") | `product.price: number` (35) |
| `product.price_alt` inexistant | `product.price_alt: number \| null` |
| `product.image?: string` | `product.image_url: string \| null` |
| Rendu immédiat | Loading skeleton → rendu |

### États

- `loading = true` → skeleton (3 blocs gris animés, même style que `RangeDetail`)
- `product = null` après load → `<Navigate to={"/nos-produits/" + rangeId} replace />`
- `error` non null → message d'erreur + bouton "Retour à la gamme"
- Bouton "Ajouter au panier" : `disabled={loading}` (page visible, cart bloqué pendant fetch)

### `handleAddToCart` — fix Stripe

```ts
// AVANT (cassé)
productId: `${rangeId}-${toSlug(product.name)}`,
unitPrice: parsedPrice.simple,  // parsé depuis string "35€"

// APRÈS (fix)
productId: product.id,          // UUID ✓
unitPrice: product.price,        // number direct ✓
image: product.image_url || product.name.charAt(0),
```

### Prix — simplification

```ts
// AVANT — parser un string
const parsedPrice = useMemo(() => {
  const parts = product.price.replace('€', '').split('/');
  ...
}, [product.price]);

// APRÈS — déjà des numbers
const displayPrice = product.price_alt !== null
  ? `${product.price}€ / ${product.price_alt}€`
  : `${product.price}€`;
const totalPrice = product.price * quantity;
```

### Cross-sell

Reste statique (`rangesData`) — juste visuel, pas de Stripe. Pas de changement.

### `rangeName` / `rangeHeroImage`

Non utilisés dans le fichier actuel (grep confirme). Dérivés depuis `RANGE_LABELS[rangeId]` et `rangesData[rangeId].heroImage` — restent inchangés.

---

## `GammeProductDetailAdminEdit` — adaptation type

Le composant accepte maintenant `GammeProduct` (DB) au lieu de `GammeProductStatic`.

| Champ | Avant | Après |
|-------|-------|-------|
| `product.price` | `string` "35€" | `number` 35 |
| `product.image` | `string \| undefined` | `product.image_url: string \| null` |
| `parseStaticPrice()` | nécessaire | supprimée |
| Init `price` state | `parseStaticPrice(product.price).price` | `String(product.price)` |
| Init `priceAlt` state | `parseStaticPrice(...).priceAlt` | `product.price_alt !== null ? String(product.price_alt) : ''` |
| `onSaved` callback | `Partial<GammeProductStatic>` | `Partial<GammeProduct>` |

L'optimistic update dans `GammeProductDetail` reste identique (merge dans le state local).

---

## Ce qui n'est PAS inclus

- Fallback statique si DB indisponible (produits gamme sans UUID en DB = 404 assumé)
- Mise à jour du cross-sell vers DB (hors scope, juste visuel)
- Changement de l'edge function (aucun nécessaire)
- Migration de `NosProduits.tsx` (liste des gammes — hors scope)
