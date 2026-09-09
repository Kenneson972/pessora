# DIRECTIVE CLAUDE — Fix split hostname par Edge Middleware (admin.pessora.fr)

*Date : 09/09/2026 · Source : recette QA @vela + verdict technique @alcyone · Branche : `fix/middleware-host-split`*

## Bug constaté (recette QA, preuves en main)
`admin.pessora.fr/` et `admin.pessora.fr/index.html` servent encore le **site public** (index.html), même après le fix `has header host` dans `vercel.json` (`9b8503f`).
Cause racine : sur un site statique Vercel, le **check filesystem passe AVANT les rewrites** de `vercel.json` → un fichier statique réel (`/` = `index.html`) est servi tel quel, le rewrite ne s'applique jamais. Ce n'est pas du cache (reproduit en URL unique `?cb=`).

## Solution validée : Edge Middleware (framework-agnostic)
Le middleware tourne sur l'edge **avant** la livraison statique et le cache → il peut forcer `admin.html` même sur `/`.

### Implémentation
- Fichier **`middleware.ts` à la racine** du repo (à côté de `vite.config.ts`), export default.
- Host check : si le hostname commence par `admin.` → rewrite vers `/admin.html`.
- Transposition Vite du pattern existant : `/opt/data/repos/dalcielo/src/middleware.ts` (Next.js : `NextResponse.redirect` vers `/admin`) — ici en **Routing Middleware framework-agnostic** :
  - Option recommandée : `import { rewrite } from '@vercel/functions'` → `rewrite('/admin.html')`.
  - Fallback sans dépendance : header `x-middleware-rewrite` (standard Vercel).
- Config `matcher` si nécessaire (voir doc Vercel Routing Middleware).

### ⚠️ PIÈGE ABSOLU — ne réécrire QUE le document HTML
Le rewrite doit viser **uniquement le document HTML**, PAS `/assets/*` ni aucun fichier avec extension (`.js`, `.css`, `.png`, `.webp`, `.woff2`, …). Sinon les chunks JS/CSS de l'admin (chargés sous le host `admin.`) seraient réécrits vers `admin.html` à leur tour → **bundle cassé**.
- Matcher d'exclusion des assets, ou garde sur `pathname` sans extension.
- Les assets de l'admin sont servis depuis `/assets/...` — ils doivent passer tels quels.

## Règles
- Branche dédiée `fix/middleware-host-split` (créée depuis `main`).
- `tsc` vert + build vert (2 bundles préservés).
- **NE PAS MERGER SEUL.** Le merge n'aura lieu qu'après la recette QA de @vela : critère = `admin.pessora.fr/` rend « Admin — PessÓra ».
- Ne pas toucher au reste (pas de réintro ORA+, pas de refonte, pas de secrets).

## Contexte utile
- Repo de référence à analyser (lecture seule) : `/opt/data/repos/dalcielo/src/middleware.ts` — split par hostname déjà en prod chez un autre client.
- Doc Vercel : Routing Middleware (framework-agnostic, non-Next.js) — `https://vercel.com/docs/functions/routing-middleware` (à vérifier).
