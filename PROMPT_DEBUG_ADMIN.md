# Prompt Cursor — Débug Admin Produits & Gammes Pessora

## Contexte
L'admin peut modifier le carrousel mais pas les fiches produits ni les gammes. Le code React est complet et bien structuré, mais les opérations CRUD échouent silencieusement. Tous les appels Supabase utilisent `(supabase as any)` — aucune vérification TypeScript.

## Tâche

### 1. Ajoute des logs de debug dans AdminProduits.tsx
Dans `src/pages/admin/AdminProduits.tsx`, pour CHAQUE opération Supabase (fetch, create, update, delete, archive), ajoute un `console.log` ET un `console.error` :

```typescript
// Exemple pour le fetch
const { data, error } = await supabase.from('products').select('*')...
if (error) console.error('[AdminProduits] FETCH error:', error)
else console.log('[AdminProduits] FETCH success:', data?.length, 'products')
```

Fais la même chose pour toutes les opérations : CREATE, UPDATE, DELETE, ARCHIVE, upload image.

### 2. Vérifie les noms de colonnes
Dans `src/types/database.ts`, cherche la définition de la table `products` et vérifie que les colonnes utilisées dans `AdminProductEditorForm.tsx` (lignes ~200-837) correspondent EXACTEMENT à la base. Vérifie aussi `gamme_products`.

Points critiques à vérifier :
- `category` vs `gamme` (le filtre utilise `category`, la table utilise peut-être `gamme`)
- `active` (colonne d'archivage)
- `position`, `image_url`, `slug`

### 3. Test rapide
Ajoute un bouton "Test CRUD" temporaire dans AdminProduits qui :
1. Fetch les produits et log le résultat
2. Tente un UPDATE minimal sur le premier produit
3. Log l'erreur complète si échec

### 4. Vérifie les policies RLS (dernier recours)
Si les logs montrent des erreurs 401/403, vérifie dans Supabase Dashboard > Authentication > Policies que la table `products` a bien :
- Policy SELECT pour `authenticated`
- Policy INSERT pour `admin` (via `profiles.role`)
- Policy UPDATE pour `admin`
- Policy DELETE pour `admin`
