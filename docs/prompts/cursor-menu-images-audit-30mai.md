# PROMPT — Audit images catalogue produit + page Menu

## Contexte

Pessora — e-commerce bar protéiné Martinique. Stack : React / Tailwind / HeroUI Pro / Supabase.

Les produits ont des images dans Supabase Storage (`image_url` dans la table `products`) mais le front ne les affiche pas. La page Menu et les fiches produit (DrinkDetail) montrent uniquement des emojis à la place.

## 1. Audit — État actuel du catalogue visuel

### A. Comprendre le flux actuel

**Fichiers clés :**
- `src/data/menuData.ts` — interface `MenuItem` (champ `icon`: emoji, `gallery`: string[])
- `src/hooks/useMenuCatalog.ts` — charge depuis Supabase ou fallback statique
- `src/components/ui/ProductCard.tsx` — carte produit, prop `icon` uniquement (pas d'image)
- `src/pages/Menu.tsx` — page menu
- `src/pages/DrinkDetail.tsx` — fiche produit détaillée

**Questions à répondre :**
1. La table Supabase `products` a-t-elle un champ `image_url` ? Est-il remonté par le catalogue ?
2. Le hook `useMenuCatalog` référence-t-il ce champ ?
3. `ProductCard` peut-il recevoir une vraie image (prop `image` / `src`) ?
4. Y a-t-il déjà un mécanisme de gestion d'images (admin upload, storage public) ?

### B. Identifier les blocages

- Lister TOUS les endroits où une image produit pourrait s'afficher et ne s'affiche pas
- Vérifier si `gallery` (tableau de strings) est utilisé quelque part
- Vérifier les URLs des images dans Supabase Storage (bucket, visibilité publique)

## 2. Recommandation — Plan d'action

Si les images sont bien dans Supabase et juste pas câblées :

1. Ajouter `image_url?: string` dans `MenuItem`
2. Ajouter la prop `image?: string` dans `ProductCard` (afficher `<img>` si présente, fallback emoji)
3. Câbler `image_url` dans `menuCatalog.ts` (lire depuis Supabase)
4. S'assurer que les URLs sont publiques (storage bucket policy)
5. Appliquer aussi sur `DrinkDetail.tsx` pour la fiche produit

## Règles

- TypeScript strict, pas de `any`
- `npm run build` doit passer
- Ne pas toucher à l'admin (ProtectedAdminRoute, AdminProduits, etc.)
- Ne pas modifier les migrations Supabase existantes
- Commit atomique : un commit = une étape claire
- Si le bucket storage n'est pas public, le signaler — ne pas modifier les policies sans demander
