# Recommandations : React Best Practices → Client Builder Karibloom

Analyse croisée des **rules** Vercel (skills-react-best-practices) et des **client-builder-rules** Karibloom pour proposer quelles règles intégrer et comment.

---

## 1. Vue d’ensemble des deux dossiers

### 1.1 React Best Practices (Vercel) – 8 sections

| Section              | Impact   | Contenu principal                                      |
|----------------------|----------|--------------------------------------------------------|
| **async**            | CRITICAL | Promise.all, parallélisation, éviter les waterfalls     |
| **bundle**           | CRITICAL | Dynamic imports, barrel imports, third-party différé   |
| **server**           | HIGH     | RSC, fetch parallèle, cache, sérialisation              |
| **client**           | MEDIUM+  | SWR, event listeners, localStorage                    |
| **rerender**         | MEDIUM   | memo, derived state, dépendances, transitions         |
| **rendering**        | MEDIUM   | Hydration, content-visibility, SVG, useTransition      |
| **js**               | LOW–MED  | Cache, early exit, Set/Map, boucles                   |
| **advanced**         | LOW      | Refs, useLatest, init-once                             |

### 1.2 Client Builder Karibloom – déjà couvert

- **Performance** : Lighthouse 90+, lazy loading (React.lazy / next/dynamic), loader, scripts en idle, images (loading/decoding), bundle (source-map-explorer), requestIdleCallback.
- **Composants** : React.memo, structure pages, Cards, Hero, LazyWidget.
- **Architecture** : CRA/CRACO ou Next.js, data-driven, SEO, sécurité.

Les règles React best practices **complètent** le client builder sans dupliquer l’esprit (perf, composants, bundle).

---

## 2. Règles à intégrer en priorité (client builder)

À traduire/adapter en **.mdc** dans `client-builder-rules`, avec globs et description alignées sur le skill Karibloom.

### 2.1 CRITICAL – À faire en premier

| Règle source              | Fichier | Pourquoi c’est bien pour le client builder |
|---------------------------|---------|--------------------------------------------|
| **Promise.all**           | `async-parallel.md` | Toutes les stacks (SPA + API, Next.js). Évite 2–3 allers-retours séquentiels ; gain immédiat sur LCP/TTI. |
| **Dynamic imports**       | `bundle-dynamic-imports.md` | Renforce kb-performance : composants lourds (Chatbot, WebGL, éditeurs). Adapter exemples pour Next (`next/dynamic`) et CRA (`React.lazy`). |
| **Barrel imports**        | `bundle-barrel-imports.md` | lucide-react, MUI, Radix très utilisés ; imports barrel = 200–800 ms et gros bundles. Direct imports ou `optimizePackageImports` (Next). |

**Action suggérée :**  
Créer **kb-async-bundle.mdc** (ou 2 fichiers : kb-async.mdc + kb-bundle.mdc) qui reprennent ces 3 règles en format court (incorrect / correct + 1 phrase d’impact), avec globs du type `**/*.tsx`, `**/pages/**`, `**/components/**`.

### 2.2 HIGH – Très pertinent

| Règle source              | Fichier | Intérêt client builder |
|---------------------------|---------|-------------------------|
| **Parallel data fetching (RSC)** | `server-parallel-fetching.md` | Projets **Next.js** (ex. DALCIELO) : fetch en parallèle par composition (Header + Sidebar + Page), pas en série. |
| **Hydration sans flicker** | `rendering-hydration-no-flicker.md` | Thème, cookie consent, panier : éviter flash default → valeur client. Script synchrone avant hydratation. |
| **content-visibility**    | `rendering-content-visibility.md` | Listes longues (menu, panier, galerie) : `content-visibility: auto` + `contain-intrinsic-size` pour accélérer le premier rendu. |

**Action suggérée :**  
- **kb-server-fetching.mdc** (Next uniquement) : parallel fetching + éventuellement cache/serialization.  
- **kb-rendering.mdc** : hydration no flicker + content-visibility (exemples en Tailwind/CSS).

### 2.3 MEDIUM – Bon complément à kb-components / kb-performance

| Règle source              | Fichier | Intérêt client builder |
|---------------------------|---------|-------------------------|
| **Extract to memoized components** | `rerender-memo.md` | Déjà dans l’esprit kb-components ; formalise “extraire le coûteux dans un composant memo + early return”. |
| **Subscribe to derived state** | `rerender-derived-state.md` | `useWindowWidth()` → re-renders à chaque px ; préférer `useMediaQuery('(max-width: 767px)')` pour un booléen. Très utile pour Header/Footer/menu responsive. |
| **Dependencies (useMemo/useEffect)** | `rerender-dependencies.md` | Réduire re-renders et bugs de deps ; cohérent avec “useCallback pour handlers dans les deps” (kb-performance). |

**Action suggérée :**  
Une seule règle **kb-rerender.mdc** : memo (extract + early return), derived state (media query), dépendances. Globs : `**/components/**/*.tsx`, `**/hooks/**/*.ts`.

---

## 3. Règles à considérer (optionnel)

- **client-localstorage-schema.md** : si beaucoup d’état client (panier, préférences) avec schéma/clé partagée.  
- **async-suspense-boundaries.md** : où placer les Suspense pour un fallback propre.  
- **server-cache-react.md** : si vous utilisez le cache React (Next.js).  
- **js-early-exit.md**, **js-length-check-first.md** : micro-optimisations dans des boucles ou listes chaudes.

À intégrer soit dans des .mdc dédiés “optionnel”, soit en une section “Pour aller plus loin” dans un fichier existant (ex. kb-performance.mdc).

---

## 4. Règles à ne pas intégrer (ou plus tard)

- **client-swr-dedup**, **client-event-listeners** : basées sur **useSWRSubscription** ; la stack client builder n’utilise pas SWR par défaut.  
- **advanced-*** : refs, useLatest, init-once : cas particuliers ; à prendre au cas par cas si besoin.  
- **js-*** (tosorted, min-max-loop, index-maps, etc.) : micro-optimisations ; priorité basse après async/bundle/rerender/rendering.

---

## 5. Plan d’intégration proposé

1. **Créer 1–2 règles “fusion” dans client-builder-rules :**
   - **kb-async-bundle.mdc** : Promise.all + dynamic imports + barrel imports (avec exemples Next + CRA si pertinent).
   - **kb-rerender.mdc** : memo (extract), derived state (media), dépendances.

2. **Enrichir les règles existantes :**
   - **kb-performance.mdc** : ajouter une sous-section “React (compléments)” avec renvoi vers kb-async-bundle et kb-rerender + 1 paragraphe sur hydration (lien vers kb-rendering ou texte court).
   - **kb-components.mdc** : rappeler “extraire le coûteux dans un composant memo” (lien vers kb-rerender).

3. **Projets Next.js uniquement :**
   - **kb-server-fetching.mdc** (ou section dans kb-backend / kb-architecture) : parallel data fetching (RSC), éventuellement cache.
   - **kb-rendering.mdc** : hydration no flicker + content-visibility.

4. **Référence aux sources :**  
   Dans chaque nouveau .mdc, indiquer en fin de fichier :  
   `Référence: skills-react-best-practices (Vercel) – [nom du fichier].md`

---

## 6. Résumé : quelles rules pour le client builder ?

| Priorité | Règles React best practices à intégrer | Fichier client builder cible |
|----------|----------------------------------------|------------------------------|
| **P0**   | async-parallel, bundle-dynamic-imports, bundle-barrel-imports | **kb-async-bundle.mdc** (nouveau) |
| **P1**   | server-parallel-fetching, rendering-hydration-no-flicker, rendering-content-visibility | **kb-server-fetching.mdc** (Next), **kb-rendering.mdc** (nouveau) |
| **P2**   | rerender-memo, rerender-derived-state, rerender-dependencies | **kb-rerender.mdc** (nouveau) |
| **P3**   | client-localstorage-schema, async-suspense-boundaries, server-cache-react, js-early-exit | Optionnel : section “Pour aller plus loin” ou petits .mdc |
| **Non**  | client-swr-*, advanced-*, plupart des js-* | — |

En appliquant **P0 + P1 + P2**, le client builder reste aligné avec Karibloom (perf, composants, SEO) et gagne les bonnes pratiques React/Next (async, bundle, rerender, hydration) sans surcharge. Les règles **P0** sont les plus rentables (impact CRITICAL, applicable à tous les projets).
