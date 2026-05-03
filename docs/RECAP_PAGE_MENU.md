# Récap Page Menu — Design, layout, couleurs, contenu

Dernière mise à jour : **2026-04-22** (état code actuel).

---

## 1) Positionnement visuel

La page `Menu` suit la direction **minimaliste luxe éditoriale** du projet :

- fond majoritairement blanc ;
- contrastes subtils (noir chaud + gris légers) ;
- typographie très structurée ;
- grille dense, propre, sans effets lourds.

L'objectif est d'avoir une carte lisible, premium et rapide à parcourir, sans surcharge graphique.

---

## 2) Typographie

Définie globalement dans `src/index.css` :

- **Texte interface** : `Akkurat Pro` (`--font-sans`)
- **Titres / éditorial** : `Berthold Baskerville Book` (`--font-display`)

Utilitaires éditoriaux utilisés dans l'écosystème menu/home :

- `text-editorial-section-title`
- `text-editorial-product-name`
- `text-editorial-product-meta`
- `text-editorial-price`
- `text-editorial-link-underline`

=> Résultat : hiérarchie fine, ton premium, lecture rapide.

---

## 3) Palette & codes couleur

Tokens principaux (dans `@theme`, `src/index.css`) :

- `--color-noir`: noir chaud principal
- `--color-surface-page`: fond global blanc
- `--color-surface-muted`: bande très claire pour respirations visuelles
- `--color-surface-product-well`: puits produit neutre chaud
- `--color-editorial-badge`: accent éditorial

Usage visible dans `Menu.tsx` :

- fond page : `bg-white`
- bande recherche : `bg-surface-muted`
- bordures : `border-noir/[0.06]` et `border-noir/12`
- CTA final : `bg-surface-muted`
- liens CTA : `text-editorial-link-underline`

Rayons : design volontairement net (`--radius-card` / `--radius-product` = `2px`).

---

## 4) Structure de layout (ordre visuel)

Dans `src/pages/Menu.tsx`, la page s'organise en 4 blocs :

1. **Barre de recherche contextuelle** (uniquement si `?q=`)
   - compteur de résultats,
   - bouton "Effacer".
2. **Strip Ora+** (`OraPlusTeaserStrip variant="muted"`)
3. **Section produits**
   - par catégories en mode "Tout",
   - ou section unique si filtre de gamme actif,
   - ou sections filtrées en mode recherche.
4. **Bloc CTA Bilan Bien-être**
   - "30 minutes offertes"
   - lien `/bilan-bien-etre`.

Largeur et respiration :

- conteneur `max-w-7xl`
- paddings progressifs : `px-4`, `md:px-10`, `lg:px-[72px]`
- spacing vertical généreux pour garder l'effet éditorial.

---

## 5) Grille produits

La grille est optimisée pour éviter les colonnes "gonflées" quand il y a peu de produits :

```ts
const PRODUCT_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,148px),220px))] justify-start ...'
```

Caractéristiques :

- `auto-fill` responsive ;
- largeur carte min/max (`148px` -> `220px`) ;
- `justify-start` pour empêcher l'étirement fantôme ;
- densité homogène entre gammes (`Wellness`, `Énergie`, `Shakes`, `Coffee`).

---

## 6) Navigation, filtres, URL state

La page est pilotée par les query params :

- `?gamme=wellness|energie|shakes|coffee`
- `?q=motcle`

Mappings internes :

- `TAB_TO_CATEGORY` : libellé UI -> clé catégorie
- `GAMME_TO_TAB` : query param -> onglet actif

Comportement :

- sans recherche : affichage normal par onglet/catégorie ;
- avec recherche : filtrage accent-insensitive (`normalize('NFD')`) sur :
  - nom produit,
  - description,
  - nom de catégorie ;
- si aucun résultat : message de fallback UX.

---

## 7) Cartes produit (contenu affiché)

Chaque item passe par `ProductCard` (mode `density="compact"`) avec :

- tag catégorie (`categoryNames`)
- nom
- description
- macros (`Xg protéines · Y kcal` si dispo)
- prix (`formatPrice`)
- hint prix membre Ora+ (`oraMemberUnitPrice` + `formatEurFr`)
- icône emoji
- lien vers détail : `/menu/:id`

La page garde donc une logique à la fois commerciale (prix, Ora+) et informative (macros).

---

## 8) Contenu métier actuel (gammes)

Source principale : `useMenuCatalog()`.

- Priorité : chargement depuis Supabase (`products` actifs)
- Fallback : données statiques `src/data/menuData.ts` si indisponible

Gamme/catégories exposées :

- **Wellness**
- **Énergie Drink**
- **Shakes Protéinés**
- **Coffee**

Ordre visuel forcé en mode "Tout" via `CATEGORY_GROUPS`.

Résumé prix (fallback statique actuel) :

- Wellness : ~10 EUR
- Énergie Drink : ~10 EUR
- Shakes : ~14 EUR
- Coffee : à partir de 2.50 EUR

---

## 9) Motion & ressenti UX

Animations Framer Motion :

- reveal en cascade des cartes (`useStaggerReveal`)
- fade-up du bloc CTA (`useFadeUpWhenVisible`)

Accessibilité/perception :

- respect `prefers-reduced-motion` (réduction animation)
- `h1` présent en `sr-only` (structure sémantique)
- messages vides explicites en recherche/filtre.

---

## 10) Bloc conversion final

Le bas de page menu pousse une conversion douce vers le bilan :

- promesse courte : **"30 minutes offertes"**
- ton premium (display serif + italique discret)
- CTA sobre souligné : **"Réserver mon bilan"**

Cohérent avec Home : même langage éditorial, même niveau de subtilité visuelle.

---

## 11) Fichiers de référence

- `src/pages/Menu.tsx`
- `src/components/ui/ProductCard.tsx`
- `src/components/ui/SectionTitle.tsx`
- `src/components/common/OraPlusTeaserStrip.tsx`
- `src/hooks/useMenuCatalog.ts`
- `src/lib/menuCatalog.ts`
- `src/data/menuData.ts`
- `src/index.css`

---

## 12) Résumé exécutif

La page `Menu` est une carte premium orientée lecture rapide :

- visuel sobre noir/blanc chaud,
- grille compacte et stable,
- contenu data-driven (Supabase + fallback),
- recherche robuste,
- CTA de conversion doux vers le bilan,
- cohérence forte avec la DA éditoriale globale PessOra.
