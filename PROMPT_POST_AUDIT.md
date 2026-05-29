# Prompt Cursor — Corrections Post-Audit Pessora (30/05/2026)

---

## 🔴 P0 — CRITIQUE

### 1. Vérifier RLS `products` et `events`

Le catalogue (menu boissons) et les événements sont stockés dans `products` et `events`. Les migrations ne contiennent pas de politiques RLS pour ces 2 tables.

**À faire :**
- Vérifier sur le dashboard Supabase si RLS est activé sur `products` et `events`
- Si RLS désactivé : l'activer + ajouter `SELECT` public pour les rows `active=true` + admin ALL
- Si RLS activé sans policies : ajouter les policies manquantes

---

## 🟠 P1 — IMPORTANT

### 2. Sitemap dynamique

**Fichier :** `public/sitemap.xml` (statique)

Le sitemap actuel est statique. Il manque :
- `/menu/:slug` pour chaque produit actif
- `/evenements/:slug` pour chaque événement
- `/nos-produits/:gamme/:slug` pour chaque gamme product

**À faire :**
- Créer un script `scripts/generate-sitemap.ts` qui fetch les slugs depuis Supabase et génère le XML
- Ou créer une route API dynamique `/sitemap.xml` côté Vite

---

### 3. `npm audit fix --force` (breaking changes)

2 dépendances à mettre à jour :
- **Vite 5 → 6** (esbuild advisory) — vérifier la compatibilité des plugins
- **ESLint 8 → 9** + **@typescript-eslint v6 → v8** (minimatch advisories) — migration config ESLint

---

### 4. Tests

**0 test dans le projet.** Priorité : tester les flows critiques.

**À faire (minimum) :**
- Installer Vitest
- Test : `create-checkout-session` → vérification prix serveur
- Test : `menuCatalog.ts` → mapping DB → MenuItem
- Test : `useCart` → ajout/suppression/calcul total

---

## 🟡 P2 — NICE TO HAVE

### 5. Refacto `AdminEvenements.tsx` (1622 lignes)

Composant monolithique. Extraire :
- `EventForm.tsx` (formulaire création/édition)
- `EventRegistrationsList.tsx` (liste des inscrits)
- `EventGalleryManager.tsx` (déjà fait ?)

### 6. Duplication CRUD admin

17 occurrences du pattern `const db = supabase as any` suivi de `.from().select/insert/update/delete`. Créer un hook `useAdminTable(tableName)` partagé.

### 7. WebP/AVIF + compression

- Ajouter `vite-plugin-compression` (Brotli)
- Convertir les images du storage en WebP (script ou politique storage)

### 8. og:image par page

Les pages produits/événements utilisent l'og:image globale. Générer des images spécifiques par page.

### 9. Fusionner migrations RLS events

`20260426120000` et `20260426123000` sont quasi identiques. Fusionner en une seule.

### 10. Nettoyer migrations baseline

3 migrations `remote_baseline` no-op. Supprimer les 2 plus anciennes.
