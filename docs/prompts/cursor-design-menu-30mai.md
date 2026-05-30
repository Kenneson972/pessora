# Cursor Prompt — Design Menu + Hero + Cross-sell DB (30 Mai 2026)

## Contexte

Audit design. Le site a deux visages : les pages gamme (RangeDetail, GammeProductDetail) sont magnifiques avec hero images, mais la page Menu — la plus visitée — est utilitaire, sans âme, sans hero. On lui donne la même qualité.

---

## 🔴 PROBLÈME 1 : Page Menu — refonte complète du header

**Fichier :** `src/pages/Menu.tsx`

### Direction créative

Le hero Menu doit donner faim, poser l'ambiance, et guider vers les 4 gammes. On s'inspire de ce que `RangeDetail` fait bien — section immersive, titre élégant, navigation intégrée.

### Layout : Split asymétrique (desktop) / empilé (mobile)

```
┌──────────────────────────────────────────────────────────────┐
│  bg-sapin (#1E3529 — le vert marque)                         │
│                                                              │
│  ┌─────────────────────┐  ┌────────────────────────────────┐ │
│  │                     │  │                                │ │
│  │   Photo d'ambiance  │  │  LA CARTE                      │ │
│  │   smoothie bowl /   │  │  Boissons protéinées, shakes   │ │
│  │   comptoir du bar   │  │  & coffee — préparés minute    │ │
│  │                     │  │  à Fort-de-France              │ │
│  │   object-cover      │  │                                │ │
│  │   aspect-[4/3]      │  │  [🧘 Wellness] [⚡ Énergie]    │ │
│  │   md:aspect-[3/4]   │  │  [🥤 Shakes]   [☕ Coffee]     │ │
│  └─────────────────────┘  └────────────────────────────────┘ │
│                                                              │
│  Mobile : image en haut (aspect-[16/9]), texte + pastilles   │
│           en dessous, le tout centré                         │
└──────────────────────────────────────────────────────────────┘
```

### Spécifications

#### Conteneur hero
```tsx
<section className="bg-sapin">
  <div className="mx-auto grid max-w-7xl md:grid-cols-2 md:gap-8 lg:gap-12">
    {/* image à gauche, texte à droite */}
  </div>
</section>
```

#### Colonne image (gauche)
- Ratio : `aspect-[4/3]` desktop, `aspect-[16/9]` mobile
- Image source : utiliser l'URL d'une des gammes comme fallback initial (ex: `rangesData.wellness.heroImage`), avec un attribut optionnel pour override futur
- `object-cover`, `loading="eager"`, `fetchpriority="high"`, `decoding="async"`
- Un léger overlay dégradé en bas pour transition visuelle : `bg-gradient-to-t from-sapin/40 to-transparent`

#### Colonne texte (droite)
```tsx
<div className="flex flex-col justify-center px-6 py-12 md:px-10 md:py-16 lg:px-14">
  <h1
    className="font-display font-normal leading-[0.92] tracking-[-0.02em] text-white"
    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 5.5vw, 62px)' }}
  >
    La Carte
  </h1>
  <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-white/60">
    Boissons protéinées, shakes & coffee — préparés minute à Fort-de-France
  </p>
  {/* pastilles gamme ici */}
</div>
```

#### Pastilles gamme — 4 liens ronds
```tsx
import { Sparkles, Zap, Milk, Coffee } from 'lucide-react';

const CATEGORY_CHIPS = [
  { label: 'Wellness', key: 'wellness', Icon: Sparkles },
  { label: 'Énergie',   key: 'energie',  Icon: Zap },
  { label: 'Shakes',    key: 'shakes',   Icon: Milk },
  { label: 'Coffee',    key: 'coffee',   Icon: Coffee },
];

<div className="mt-6 flex flex-wrap gap-2">
  {CATEGORY_CHIPS.map(({ label, key, Icon }) => (
    <Link
      key={key}
      to={`/menu?gamme=${key}`}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 
                 px-4 py-2 text-[11px] font-normal text-white/80 
                 hover:bg-white/10 hover:border-white/40 hover:text-white
                 transition-colors duration-200"
    >
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {label}
    </Link>
  ))}
</div>
```

#### Variante B (si pas d'image) — Hero purement typographique

Si `rangesData.wellness.heroImage` n'est pas jugé approprié, faire un hero centré 100% typo :

```
┌──────────────────────────────────────────────┐
│  bg-sapin                                     │
│                                              │
│           LA CARTE                           │
│           Boissons protéinées, shakes        │
│           & coffee — préparés minute         │
│           à Fort-de-France                   │
│                                              │
│        [🧘] [⚡] [🥤] [☕]                    │
│        pastilles plus larges, centrées       │
└──────────────────────────────────────────────┘
```

Code :
```tsx
<section className="bg-sapin px-4 py-20 md:py-28 text-center">
  <h1 className="font-display font-normal leading-[0.9] text-white"
      style={{ fontSize: 'clamp(48px, 7vw, 80px)' }}>
    La Carte
  </h1>
  <p className="mx-auto mt-5 max-w-lg text-[16px] font-light leading-relaxed text-white/55">
    Boissons protéinées, shakes & coffee — préparés minute à Fort-de-France
  </p>
  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
    {/* CATEGORY_CHIPS — en plus gros : px-6 py-3, text-[12px] */}
  </div>
</section>
```

Tu peux implémenter **la variante B d'abord** (zéro dépendance image), c'est déjà une énorme amélioration.

### Ce qui change dans le code existant

**AVANT :**
```
<div className="min-h-screen bg-ivory">
  <h1 className="sr-only">La carte</h1>       ← à supprimer
  {isSearchMode && ...}
  {!isSearchMode && <Segment .../>}            ← à descendre après le hero
  <OraPlusTeaserStrip />
  <div>grille produits...</div>
  <DrinkOptionsModal />
  <Bilan CTA />
</div>
```

**APRÈS :**
```
<div className="min-h-screen bg-white">        ← harmonisé avec le reste
  {/* NOUVEAU : Hero */}
  <section className="bg-sapin">...</section>

  {/* EXISTANT : Barre recherche (si recherche active) */}
  {isSearchMode && (...)}

  {/* EXISTANT : Filtres gamme — descendent sous le hero */}
  {!isSearchMode && (
    <div className="border-b border-noir/[0.06] bg-white px-4 md:px-10 lg:px-[72px]">
      <div className="mx-auto max-w-7xl py-4 md:py-5">
        <Segment .../>   {/* exactement le même code */}
      </div>
    </div>
  )}

  <div className="px-4 ...">  {/* padding wrapper existant */}
    <OraPlusTeaserStrip />
  </div>

  <div>grille produits inchangée...</div>
  <DrinkOptionsModal />
  <Bilan CTA inchangé />
</div>
```

### Règles à respecter
- Le `<h1>` n'est PLUS en `sr-only`, il est visible et dans le hero
- Les filtres Segment **descendent sous le hero**, pas au-dessus
- Le fond global passe de `bg-ivory` à `bg-white` (cohérent avec Home, RangeDetail, GammeProductDetail)
- Le code de la grille produit, du CTA bilan, et du modal reste **strictement inchangé**
- Importer `Sparkles, Zap, Milk, Coffee` depuis lucide-react
- Utiliser les tokens Tailwind existants : `bg-sapin`, `text-white/60`, etc.

### Points design
- **Mobile** : image plein largeur, texte centré en dessous, pastilles en wrap
- **Performance** : image hero `loading="eager"` + `fetchpriority="high"`
- **Accessibilité** : `h1` visible, contraste suffisant (blanc sur `#1E3529` = ok), liens avec icônes
- **SEO** : mots-clés "Fort-de-France", "boissons protéinées", "shakes" dans le sous-titre

---

## 🟡 PROBLÈME 2 : Cross-sell GammeProductDetail → données DB

**Fichier :** `src/pages/GammeProductDetail.tsx` (~lignes 57-64)

**État actuel :** cross-sell lit `rangesData` (statique, `src/data/productsData.ts`) au lieu de la DB.

**Correction :**
```tsx
// AVANT
const range = rangesData[rangeId as keyof typeof rangesData];
const crossSell = useMemo(() => {
  if (!range) return [];
  return range.products
    .filter((p) => toSlug(p.name) !== slug)
    .map((p) => ({ ...p, slug: toSlug(p.name) }))
    .slice(0, 3);
}, [range, slug]);

// APRÈS
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

Si `useGammeCatalog` est déjà appelé ailleurs dans le composant ou son parent, mutualiser l'appel pour éviter un double fetch.

---

## Checklist

- [ ] `Menu.tsx` : remplacer `h1 sr-only` par hero section complète
- [ ] `Menu.tsx` : fond `bg-white` (harmonisé)
- [ ] `Menu.tsx` : filtres Segment descendent sous le hero
- [ ] `GammeProductDetail.tsx` : cross-sell depuis DB (useGammeCatalog)
- [ ] `npm run build` passe
- [ ] Vérifier responsive mobile du hero Menu
- [ ] Vérifier que le `h1` n'est plus en sr-only nulle part ailleurs
