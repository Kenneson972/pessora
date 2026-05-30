# Cursor Prompt — Design Menu + Harmonisation Gamme (30 Mai 2026)

## Contexte

Audit design des pages produit. Le site a deux visages : les pages gamme (RangeDetail, GammeProductDetail) sont magnifiques avec hero images, mais la page Menu — la plus visitée — est utilitaire et sans âme. On harmonise.

---

## 🔴 PROBLÈME 1 : Page Menu sans hero

**Fichier :** `src/pages/Menu.tsx`

**État actuel :**
- `<h1 className="sr-only">La carte</h1>` — invisible
- On tombe directement sur la barre de filtres (Segment)
- Fond `bg-ivory`, pas de photo, pas d'ambiance
- Seul élément visuel = les cartes produit

**Ce qu'il faut :** Un hero header élégant, dans l'esprit de `RangeDetail` :

### Spec du hero Menu

```
┌─────────────────────────────────────────────┐
│ bg-surface-muted (ou bg-ivory)              │
│                                             │
│   <h1>La Carte</h1>                         │
│   <p>Boissons protéinées, shakes & coffee   │
│       préparés minute à Fort-de-France</p>   │
│                                             │
│   [Segment filtres gamme — déjà existant]   │
│                                             │
│   [OraPlusTeaserStrip — déjà existant]       │
└─────────────────────────────────────────────┘
```

**Spécifications :**
- Section `bg-surface-muted` avec padding généreux (`py-12 md:py-16`)
- Titre `<h1>` en `font-display`, taille `clamp(38px, 5vw, 56px)`, couleur `text-black`
- Sous-titre en `text-[14px] font-light text-black/50`, max-width 520px
- Optionnel : une image d'ambiance à droite (similaire au layout split de HomeBanner)
- Les filtres Segment existants viennent EN DESSOUS du hero, PAS au-dessus
- L'OraPlusTeaserStrip existant vient après les filtres (comme actuellement)

**Important :** 
- Sortir le `<h1>` du `sr-only`, le rendre visible
- Réutiliser le composant `SectionTitle` si possible, sinon faire inline
- Tout le code de la grille produit et du CTA bilan reste inchangé

---

## 🟡 PROBLÈME 2 : Cross-sell GammeProductDetail utilise des données statiques

**Fichier :** `src/pages/GammeProductDetail.tsx` (lignes ~57-64)

**État actuel :**
```tsx
const crossSell: CrossSellItem[] = useMemo(() => {
  if (!range) return [];
  return range.products
    .filter((p) => toSlug(p.name) !== slug)
    .map((p) => ({ ...p, slug: toSlug(p.name) }))
    .slice(0, 3);
}, [range, slug]);
```

Le `range` vient de `rangesData` (données statiques dans `src/data/productsData.ts`), pas de la DB.

**Ce qu'il faut :** Utiliser `useGammeCatalog` pour récupérer les vrais produits depuis Supabase.

```tsx
// Remplacer par :
const { products: allRangeProducts } = useGammeCatalog(rangeId as 'sport' | 'skin' | 'wellness');

const crossSell = useMemo(() => {
  if (!allRangeProducts.length) return [];
  return allRangeProducts
    .filter((p) => toSlug(p.name) !== slug)
    .slice(0, 3)
    .map((p) => ({
      name: p.name,
      description: p.description ?? '',
      price: p.price_alt ? `${p.price}€ / ${p.price_alt}€` : `${p.price}€`,
      image: p.image_url ?? undefined,
      slug: p.slug ?? toSlug(p.name),
    }));
}, [allRangeProducts, slug]);
```

**Bonus :** Si `useGammeCatalog` est déjà appelé dans le parent, passer les données en prop pour éviter un double fetch.

---

## 🟢 MINEUR : Page Menu — fond incohérent avec les pages gamme

**Constat :** 
- Menu → `bg-ivory`
- RangeDetail, GammeProductDetail → `bg-white`
- Home → `bg-white`

Proposition : harmoniser le Menu en `bg-white` pour correspondre au reste du site, OU garder `bg-ivory` mais ajouter le hero (le contraste hero/blanc en dessous fonctionnerait bien aussi).

**Recommandation :** Laisser `bg-ivory` pour le fond global, mais le hero utilise `bg-surface-muted` ou `bg-white`. Ça crée une hiérarchie visuelle naturelle. Pas de changement urgent.

---

## Checklist

- [ ] `Menu.tsx` : ajouter hero section avec `<h1>` visible
- [ ] `Menu.tsx` : déplacer les filtres Segment sous le hero
- [ ] `GammeProductDetail.tsx` : remplacer cross-sell statique par données DB
- [ ] Vérifier que `npm run build` passe
- [ ] Vérifier le responsive mobile du hero Menu
