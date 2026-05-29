# Prompt Cursor — Fix Stripe produits gamme Pessora

## Contexte
Le checkout Stripe échoue pour les produits gamme (sport/skin/wellness). La cause : `GammeProductDetail.tsx` utilise des données statiques de `productsData.ts` au lieu de la DB Supabase. Résultat : le `productId` est un string composite (`"sport-formula-1"`) au lieu d'un UUID, et la Edge Function Stripe ne peut pas faire le lookup.

Le hook `useGammeProduct` existe déjà et fetche depuis Supabase avec le vrai UUID. Il faut juste l'utiliser.

---

## Tâche : Réécrire GammeProductDetail.tsx

Fichier : `src/pages/GammeProductDetail.tsx`

### 1. Remplacer les données statiques par le hook DB

```typescript
// AVANT (statique)
import { getGammeProduct } from '../../data/productsData';
const product = getGammeProduct(rangeId, slug);

// APRÈS (DB)
import { useGammeProduct } from '../../hooks/useGammeProduct';
const { product, loading, error } = useGammeProduct(rangeId, slug);
```

### 2. Adapter le type

Les données DB ont un format différent :
- `product.id` → UUID (à utiliser comme `productId`)
- `product.price` → `number` (déjà en nombre, pas besoin de parser)
- `product.price_alt` → `number | null`
- `product.image_url` → string URL
- `product.name`, `product.description`, `product.slug` → string

### 3. Corriger handleAddToCart

```typescript
// AVANT (buggé)
productId: `${rangeId}-${toSlug(product.name)}`,
unitPrice: typeof product.price === 'string' ? parseInt(/*...*/) : product.price,

// APRÈS (fix)
productId: product.id,  // UUID !
unitPrice: product.price,  // déjà number
```

### 4. Gérer le loading/error du hook

Ajouter un état de chargement (skeleton) et un état d'erreur (message + bouton retour). Le composant a déjà des skeletons partiels.

### 5. Vérifier que l'image fonctionne

Si `product.image_url` est null, afficher un placeholder élégant. Si présent, utiliser `<img>` avec lazy loading.

---

## Notes
- Ne pas supprimer `productsData.ts` — il est peut-être utilisé ailleurs
- Le hook `useGammeProduct` est dans `src/hooks/useGammeProduct.ts`, il appelle `supabase.from('gamme_products').select('*').eq('gamme', rangeId).eq('slug', slug).maybeSingle()`
- Une fois ce fix fait, tout le pipeline Stripe fonctionne automatiquement
