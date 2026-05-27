# Photo Sections Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter 5 nouvelles sections photo sur la Home (carrousel éditorial, split gammes boissons, tuiles gammes produits, carrousel produits, nettoyage texte) + 2 sections sur Nos Produits + une interface admin pour gérer le carrousel éditorial.

**Architecture:** Nouveaux composants React autonomes dans `src/components/home/` et `src/components/nosproduits/`, alimentés soit par `rangesData`/`menuData` existants (sections statiques), soit par une nouvelle table Supabase `home_carousel_cards` (carrousel éditorial admin). Les sections avec photos utilisent des placeholders visuels jusqu'à la livraison des assets réels.

**Tech Stack:** React 18 + TypeScript, HeroUI v3, Framer Motion, Tailwind CSS v4, Supabase (PostgreSQL + Storage), Vite.

---

## File Map

**Nouveaux fichiers :**
- `supabase/migrations/20260522000000_home_carousel_cards.sql` — Table + RLS
- `src/types/homeCarousel.ts` — Type `HomeCarouselCard`
- `src/hooks/useFeaturedCarousel.ts` — Fetch `home_carousel_cards` depuis Supabase
- `src/data/homeSplitGammes.ts` — Config statique photos split (Wellness/Énergie/Shakes/Coffee)
- `src/components/home/HomeFeaturedCarousel.tsx` — Carrousel éditorial (section 2)
- `src/components/home/HomeSplitGammes.tsx` — Split modèle + tabs (section 5)
- `src/components/home/HomeGammesProductTiles.tsx` — Tuiles 3 gammes produits (section 7)
- `src/components/home/HomeGammesProductCarousel.tsx` — Carrousel produits par gamme (section 8)
- `src/components/nosproduits/NosProduitsFeaturedCarousel.tsx` — Carrousel gammes (Nos Produits)
- `src/components/nosproduits/NosProduitsTiles.tsx` — Tuiles 3 gammes (Nos Produits)
- `src/pages/admin/AdminCarousel.tsx` — Interface admin CRUD carrousel

**Fichiers modifiés :**
- `src/components/home/HomeProductCarousel.tsx` — Supprimer sous-titre + ligne Óra+
- `src/pages/Home.tsx` — Intégrer 4 nouvelles sections + Nutrition→Shakes + padding Événements
- `src/pages/NosProduits.tsx` — Ajouter carrousel + tuiles en tête de page
- `src/pages/admin/AdminLayout.tsx` — Ajouter "Carrousel" dans la nav admin
- `src/App.tsx` — Ajouter route `/admin/carousel` + lazy import

---

## Task 1 — Migration Supabase : table home_carousel_cards

**Files:**
- Create: `supabase/migrations/20260522000000_home_carousel_cards.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/20260522000000_home_carousel_cards.sql

create table public.home_carousel_cards (
  id         uuid primary key default gen_random_uuid(),
  position   integer not null default 0,
  eyebrow    text    not null default '',
  title      text    not null default '',
  image_url  text,
  link_to    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Lecture publique (page Home)
alter table public.home_carousel_cards enable row level security;
create policy "public read" on public.home_carousel_cards
  for select using (true);

-- Écriture admin uniquement
create policy "admin write" on public.home_carousel_cards
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Index pour l'ordre d'affichage
create index home_carousel_cards_position_idx on public.home_carousel_cards (position asc);

-- 3 cartes de démo (placeholders)
insert into public.home_carousel_cards (position, eyebrow, title, image_url, link_to, active) values
  (1, 'Wellness · Coup de cœur', 'Ton moment bien-être', null, '/menu?gamme=wellness', true),
  (2, 'Shakes · Protéinés', 'Shake Mangue Passion', null, '/menu?gamme=shakes', true),
  (3, 'Coffee · Martinique', 'Coffee glacé maison', null, '/menu?gamme=coffee', true);
```

- [ ] **Appliquer la migration**

```bash
npx supabase db push
```

Expected: `Applied 1 migration` sans erreur.

- [ ] **Vérifier dans Supabase Studio** que la table existe avec les 3 lignes de démo.

- [ ] **Commit**

```bash
git add supabase/migrations/20260522000000_home_carousel_cards.sql
git commit -m "feat: migration home_carousel_cards table + RLS"
```

---

## Task 2 — Type TypeScript + hook useFeaturedCarousel

**Files:**
- Create: `src/types/homeCarousel.ts`
- Create: `src/hooks/useFeaturedCarousel.ts`

- [ ] **Créer le type**

```ts
// src/types/homeCarousel.ts
export interface HomeCarouselCard {
  id: string;
  position: number;
  eyebrow: string;
  title: string;
  image_url: string | null;
  link_to: string | null;
  active: boolean;
  created_at: string;
}
```

- [ ] **Créer le hook**

```ts
// src/hooks/useFeaturedCarousel.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { HomeCarouselCard } from '../types/homeCarousel';

export function useFeaturedCarousel() {
  const [cards, setCards] = useState<HomeCarouselCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('home_carousel_cards')
        .select('*')
        .eq('active', true)
        .order('position', { ascending: true });
      if (!cancelled) {
        setCards(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { cards, loading };
}
```

- [ ] **Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Commit**

```bash
git add src/types/homeCarousel.ts src/hooks/useFeaturedCarousel.ts
git commit -m "feat: HomeCarouselCard type + useFeaturedCarousel hook"
```

---

## Task 3 — Composant HomeFeaturedCarousel

**Files:**
- Create: `src/components/home/HomeFeaturedCarousel.tsx`

- [ ] **Créer le composant**

```tsx
// src/components/home/HomeFeaturedCarousel.tsx
import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { useFeaturedCarousel } from '../../hooks/useFeaturedCarousel';
import { publicAssetWithCache } from '../../lib/publicAsset';

function PlaceholderCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex-shrink-0 w-[280px] min-[400px]:w-[310px] h-[400px] rounded-[10px] overflow-hidden bg-noir/[0.06] relative snap-start">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-black/20">
        <span className="text-[40px]">📸</span>
        <span className="text-[9px] uppercase tracking-[0.18em]">Photo à venir</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/20 to-transparent flex flex-col justify-end p-5">
        <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/55 mb-1.5">{eyebrow}</p>
        <p className="text-[17px] font-light text-white leading-snug">{title}</p>
      </div>
    </div>
  );
}

function CardItem({ card }: { card: { id: string; eyebrow: string; title: string; image_url: string | null; link_to: string | null } }) {
  const inner = (
    <div className="relative h-full">
      {card.image_url ? (
        <img
          src={publicAssetWithCache(card.image_url)}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-noir/[0.06] text-black/20">
          <span className="text-[40px]">📸</span>
          <span className="text-[9px] uppercase tracking-[0.18em]">Photo à venir</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-noir/68 via-noir/10 to-transparent flex flex-col justify-end p-5">
        <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/55 mb-1.5">{card.eyebrow}</p>
        <p className="text-[17px] font-light text-white leading-snug">{card.title}</p>
      </div>
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full border border-white/28 bg-white/15 backdrop-blur-[6px] flex items-center justify-center text-white/80 text-sm">
        ›
      </div>
    </div>
  );

  const cls = "group flex-shrink-0 w-[280px] min-[400px]:w-[310px] h-[400px] rounded-[10px] overflow-hidden relative snap-start cursor-pointer block";

  return card.link_to ? (
    <Link to={card.link_to} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function HomeFeaturedCarousel({ title }: { title: string }) {
  const { cards, loading } = useFeaturedCarousel();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 324, behavior: 'smooth' });
  }, []);

  if (!loading && cards.length === 0) return null;

  return (
    <section className="bg-white px-4 py-14 md:px-10 md:py-16 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-editorial-section-title">{title}</h2>
          <div className="flex gap-2">
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(-1)} aria-label="Précédent"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-noir/25 hover:text-black">
              <ChevronLeft size={18} strokeWidth={1.25} />
            </Button>
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(1)} aria-label="Suivant"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-noir/25 hover:text-black">
              <ChevronRight size={18} strokeWidth={1.25} />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <PlaceholderCard key={i} eyebrow="Chargement…" title="—" />
              ))
            : cards.map((card) => <CardItem key={card.id} card={card} />)
          }
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add src/components/home/HomeFeaturedCarousel.tsx
git commit -m "feat: HomeFeaturedCarousel — carrousel éditorial photos"
```

---

## Task 4 — Données statiques + composant HomeSplitGammes

**Files:**
- Create: `src/data/homeSplitGammes.ts`
- Create: `src/components/home/HomeSplitGammes.tsx`

- [ ] **Créer le fichier de données (placeholders — remplacés après séance photo)**

```ts
// src/data/homeSplitGammes.ts

export interface SplitGammeConfig {
  key: 'wellness' | 'energie' | 'shakes' | 'coffee';
  label: string;
  eyebrow: string;
  title: string;
  mainImage: string | null;
  sideImages: [string | null, string | null];
  linkTo: string;
}

export const splitGammesData: SplitGammeConfig[] = [
  {
    key: 'wellness',
    label: 'Wellness',
    eyebrow: 'Wellness · PessÓra',
    title: 'Un concentré de bien-être au naturel',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=wellness',
  },
  {
    key: 'energie',
    label: 'Énergie',
    eyebrow: 'Énergie · PessÓra',
    title: 'Ton boost pour la journée',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=energie',
  },
  {
    key: 'shakes',
    label: 'Shakes',
    eyebrow: 'Shakes · PessÓra',
    title: 'Protéines & gourmandise',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=shakes',
  },
  {
    key: 'coffee',
    label: 'Coffee',
    eyebrow: 'Coffee · Martinique',
    title: 'Café glacé à la martiniquaise',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=coffee',
  },
];
```

- [ ] **Créer le composant**

```tsx
// src/components/home/HomeSplitGammes.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { splitGammesData } from '../../data/homeSplitGammes';

function PhotoSlot({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover object-top ${className ?? ''}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className={`h-full w-full bg-noir/[0.06] flex flex-col items-center justify-center gap-2 text-black/25 ${className ?? ''}`}>
      <span className="text-[32px]">📸</span>
      <span className="text-[9px] uppercase tracking-[0.16em]">Photo à venir</span>
    </div>
  );
}

export function HomeSplitGammes() {
  const [activeKey, setActiveKey] = useState<string>('wellness');
  const navigate = useNavigate();
  const active = splitGammesData.find((g) => g.key === activeKey) ?? splitGammesData[0];

  return (
    <section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2
            className="mb-3 font-display font-normal leading-[1.02] text-black"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
          >
            Choisis ton moment
          </h2>
          <p className="mx-auto mb-6 max-w-[36ch] text-[13px] font-light leading-relaxed text-black/50">
            Chaque boisson PessÓra est pensée pour un instant précis.
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {splitGammesData.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveKey(g.key)}
                className={[
                  'px-5 py-2 rounded-full text-[11px] font-normal tracking-[0.06em] border transition-all duration-200',
                  activeKey === g.key
                    ? 'bg-noir text-white border-noir'
                    : 'bg-white text-black/55 border-noir/[0.15] hover:border-noir/30 hover:text-black',
                ].join(' ')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[3fr_2fr] gap-1 rounded-[12px] overflow-hidden h-[420px] md:h-[520px]">
          {/* Grande photo gauche */}
          <div className="relative overflow-hidden">
            <PhotoSlot src={active.mainImage} alt={active.eyebrow} />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
              <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/58 mb-1.5">{active.eyebrow}</p>
              <h3 className="text-[18px] md:text-[22px] font-light text-white leading-snug mb-4">{active.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => navigate(active.linkTo)}
                className="self-start h-9 min-h-9 rounded-full border border-white/30 bg-white/15 backdrop-blur-sm px-4 text-[9px] uppercase tracking-[0.14em] text-white hover:bg-white/25"
              >
                Voir la gamme
              </Button>
            </div>
          </div>

          {/* 2 photos droite */}
          <div className="flex flex-col gap-1">
            <div className="flex-1 overflow-hidden">
              <PhotoSlot src={active.sideImages[0]} alt={`${active.label} boisson 1`} />
            </div>
            <div className="flex-1 overflow-hidden">
              <PhotoSlot src={active.sideImages[1]} alt={`${active.label} boisson 2`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Vérifier compilation**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add src/data/homeSplitGammes.ts src/components/home/HomeSplitGammes.tsx
git commit -m "feat: HomeSplitGammes — split modèle + tabs gammes boissons"
```

---

## Task 5 — Composants HomeGammesProductTiles + HomeGammesProductCarousel

**Files:**
- Create: `src/components/home/HomeGammesProductTiles.tsx`
- Create: `src/components/home/HomeGammesProductCarousel.tsx`

- [ ] **Créer HomeGammesProductTiles**

```tsx
// src/components/home/HomeGammesProductTiles.tsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { rangesData } from '../../data/productsData';

const RANGES = [
  { id: 'wellness', sub: 'Compléments nutrition', image: rangesData.wellness.heroImage },
  { id: 'sport',   sub: 'Performance & récupération', image: rangesData.sport.heroImage },
  { id: 'skin',    sub: 'Beauté & éclat', image: rangesData.skin.heroImage },
] as const;

export function HomeGammesProductTiles({ onTabChange }: { onTabChange: (id: string) => void }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {RANGES.map((r, i) => (
        <motion.button
          key={r.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          onClick={() => {
            onTabChange(r.id);
            navigate(`/nos-produits#collection-${r.id}`);
          }}
          className="group relative aspect-[4/5] overflow-hidden rounded-[10px] text-left"
          aria-label={`Voir la gamme ${rangesData[r.id].title}`}
        >
          <img
            src={r.image}
            alt={rangesData[r.id].title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-noir/10" />
          <div className="absolute top-4 left-4">
            <span className="text-[13px] font-light text-white">{rangesData[r.id].title.replace('Gamme ', '')}</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/58">{r.sub}</span>
            <div className="w-7 h-7 rounded-full border border-white/30 bg-white/12 flex items-center justify-center">
              <ArrowRight size={12} className="text-white/80" />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
```

- [ ] **Créer HomeGammesProductCarousel**

```tsx
// src/components/home/HomeGammesProductCarousel.tsx
import { useState, useRef } from 'react';
import { rangesData } from '../../data/productsData';

type RangeId = 'wellness' | 'sport' | 'skin';

const TABS: { id: RangeId; label: string }[] = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'sport', label: 'Sport' },
  { id: 'skin', label: 'Skin' },
];

function ProductCard({ product }: { product: { name: string; description: string; price: string } }) {
  return (
    <div className="flex-shrink-0 w-[180px] md:w-[200px] rounded-[8px] overflow-hidden border border-noir/[0.08] bg-white snap-start">
      <div className="aspect-square bg-surface-product-well flex items-center justify-center">
        <span className="text-[9px] uppercase tracking-[0.18em] text-black/25">Photo à venir</span>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-medium tracking-[0.05em] text-black mb-1 line-clamp-1">{product.name}</p>
        <p className="text-[10px] font-light text-black/45 leading-snug line-clamp-2 mb-2">{product.description}</p>
        <p className="text-[11px] font-light text-black">{product.price}</p>
      </div>
    </div>
  );
}

export function HomeGammesProductCarousel({ activeTab }: { activeTab: string }) {
  const [tab, setTab] = useState<RangeId>(
    TABS.some((t) => t.id === activeTab) ? (activeTab as RangeId) : 'wellness'
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  const products = rangesData[tab].products;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
            }}
            className={[
              'px-4 py-2 rounded-full text-[10px] font-normal tracking-[0.06em] border transition-all',
              tab === t.id
                ? 'bg-noir text-white border-noir'
                : 'bg-white text-black/55 border-noir/[0.15] hover:border-noir/30',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => (
          <ProductCard key={p.name} product={p} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Vérifier compilation**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add src/components/home/HomeGammesProductTiles.tsx src/components/home/HomeGammesProductCarousel.tsx
git commit -m "feat: HomeGammesProductTiles + HomeGammesProductCarousel — gammes produits"
```

---

## Task 6 — Nettoyage HomeProductCarousel (texte)

**Files:**
- Modify: `src/components/home/HomeProductCarousel.tsx`

- [ ] **Supprimer le sous-titre à droite du header** (lignes 132-136)

Trouver et supprimer ce bloc dans `HomeProductCarousel.tsx` :

```tsx
// SUPPRIMER CE BLOC :
<p className="max-w-[14rem] text-[9px] font-light uppercase leading-relaxed tracking-[0.26em] text-black/38 sm:text-right">
  Sélection maison · recettes courantes
</p>
```

- [ ] **Supprimer la ligne Óra+ dans chaque carte** (lignes 101-103)

Trouver et supprimer ce bloc dans `HomeProductCarousel.tsx` :

```tsx
// SUPPRIMER CE BLOC :
<p className="text-[9px] font-light text-gold-dim">
  Óra+ dès {formatEurFr(effectiveUnitPrice(item.price))}
</p>
```

- [ ] **Supprimer l'import `useIsOraPlus`** et `formatEurFr` s'ils ne sont plus utilisés

Vérifier les lignes 8-9 de `HomeProductCarousel.tsx`. Si `effectiveUnitPrice` n'est plus utilisé :
```tsx
// SUPPRIMER :
import { formatEurFr } from '../../lib/oraPricing';
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
// ET dans le corps du composant :
const { effectiveUnitPrice } = useIsOraPlus();
```

- [ ] **Lancer le dev server et vérifier visuellement** que les cartes sont plus épurées

```bash
npm run dev
```

Ouvrir http://localhost:5173 et vérifier section "Nos coups de cœur".

- [ ] **Commit**

```bash
git add src/components/home/HomeProductCarousel.tsx
git commit -m "fix: supprimer sous-titre et ligne Óra+ du carrousel coups de cœur (Home)"
```

---

## Task 7 — Intégration Home.tsx

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Renommer "Nutrition" → "Shakes" dans le tableau UNIVERS** (ligne ~16)

```tsx
// AVANT
{ id: 'nutrition', eyebrow: 'Nutrition', title: 'Shakes', titleEm: '& gauffres', ... }

// APRÈS
{ id: 'nutrition', eyebrow: 'Shakes', title: 'Shakes', titleEm: '& gauffres', ... }
```

- [ ] **Réduire le padding de la section Événements** (ligne ~225)

```tsx
// AVANT
<section className="bg-white px-4 py-[104px] md:px-10 md:py-[132px] lg:px-[72px]">

// APRÈS
<section className="bg-white px-4 py-[52px] md:px-10 md:py-[64px] lg:px-[72px]">
```

- [ ] **Ajouter les imports en tête de fichier**

```tsx
import { HomeFeaturedCarousel } from '../components/home/HomeFeaturedCarousel';
import { HomeSplitGammes } from '../components/home/HomeSplitGammes';
import { HomeGammesProductTiles } from '../components/home/HomeGammesProductTiles';
import { HomeGammesProductCarousel } from '../components/home/HomeGammesProductCarousel';
```

- [ ] **Ajouter HomeFeaturedCarousel juste après la section hero** (avant `<HomeProductCarousel />`)

```tsx
{/* ─── Carrousel éditorial photos ─── */}
<HomeFeaturedCarousel title="À la une" />

{/* ─── Boissons — carrousel coups de cœur ─── */}
<HomeProductCarousel />
```

- [ ] **Ajouter HomeSplitGammes après le bloc OraPlusTeaser** (après `</div>` du block OraPlusTeaser)

```tsx
{/* ─── Split modèle + tabs gammes boissons ─── */}
<HomeSplitGammes />
```

- [ ] **Ajouter les sections gammes produits après "Nos univers"** (avant `<HomeGoogleReviews />`)

```tsx
{/* ─── Gammes produits — tuiles + carrousel ─── */}
<section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
  <div className="mx-auto max-w-[1400px]">
    <div className="mb-8 flex items-end justify-between">
      <h2 className="text-editorial-section-title">Nos gammes</h2>
      <a href="/nos-produits" className="text-[9px] uppercase tracking-[0.2em] text-black/40 border-b border-black/20 pb-px">
        Voir les produits
      </a>
    </div>
    <HomeGammesProductTiles onTabChange={() => {}} />
    <div className="mt-10">
      <HomeGammesProductCarousel activeTab="wellness" />
    </div>
  </div>
</section>
```

- [ ] **Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

- [ ] **Vérifier visuellement toute la Home** sur le dev server

```bash
npm run dev
```

Scroller de haut en bas, vérifier les 10 sections dans l'ordre.

- [ ] **Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: intégration nouvelles sections photo Home + nettoyage texte"
```

---

## Task 8 — Composants Nos Produits

**Files:**
- Create: `src/components/nosproduits/NosProduitsFeaturedCarousel.tsx`
- Create: `src/components/nosproduits/NosProduitsTiles.tsx`
- Modify: `src/pages/NosProduits.tsx`

- [ ] **Créer NosProduitsFeaturedCarousel**

```tsx
// src/components/nosproduits/NosProduitsFeaturedCarousel.tsx
import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { rangesData } from '../../data/productsData';

const CARDS = [
  { id: 'wellness', eyebrow: 'Gamme Wellness', title: 'Compléments\nnutrition' },
  { id: 'sport',   eyebrow: 'Gamme Sport',    title: 'Performance\n& récupération' },
  { id: 'skin',    eyebrow: 'Gamme Skin',      title: 'Beauté\n& éclat' },
  { id: 'boutique', eyebrow: 'En boutique · Martinique', title: 'Conseils\npersonnalisés' },
] as const;

export function NosProduitsFeaturedCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollBy = useCallback((dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }, []);

  return (
    <section className="bg-white px-4 pt-10 pb-8 md:px-10 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7 flex items-end justify-between">
          <h2 className="text-editorial-section-title">La collection</h2>
          <div className="flex gap-2">
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(-1)} aria-label="Précédent"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-noir/25">
              <ChevronLeft size={18} strokeWidth={1.25} />
            </Button>
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(1)} aria-label="Suivant"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-noir/25">
              <ChevronRight size={18} strokeWidth={1.25} />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CARDS.map((card) => {
            const image = card.id !== 'boutique' ? rangesData[card.id as 'wellness' | 'sport' | 'skin'].heroImage : null;
            const target = card.id !== 'boutique' ? `/nos-produits#collection-${card.id}` : '/contact';
            return (
              <button
                key={card.id}
                onClick={() => navigate(target)}
                className="group flex-shrink-0 w-[260px] h-[360px] rounded-[10px] overflow-hidden relative snap-start text-left"
              >
                {image ? (
                  <img src={image} alt={card.eyebrow} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" decoding="async" />
                ) : (
                  <div className="absolute inset-0 bg-noir/[0.06] flex items-center justify-center">
                    <span className="text-[9px] uppercase tracking-[0.16em] text-black/25">Photo à venir</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-noir/68 via-transparent to-transparent flex flex-col justify-end p-5">
                  <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/55 mb-1.5">{card.eyebrow}</p>
                  <p className="text-[16px] font-light text-white leading-snug whitespace-pre-line">{card.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Créer NosProduitsTiles**

```tsx
// src/components/nosproduits/NosProduitsTiles.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { rangesData } from '../../data/productsData';

const RANGES = [
  { id: 'wellness' as const, sub: 'Compléments nutrition' },
  { id: 'sport'   as const, sub: 'Performance & récupération' },
  { id: 'skin'    as const, sub: 'Beauté & éclat' },
];

export function NosProduitsTiles() {
  const navigate = useNavigate();
  return (
    <section className="bg-white px-4 pb-10 md:px-10 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <p className="mb-5 text-[9px] uppercase tracking-[0.26em] text-black/35">Explorer par gamme</p>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/nos-produits#collection-${r.id}`)}
              className="group relative aspect-[4/3] overflow-hidden rounded-[10px] text-left"
              aria-label={`Voir ${rangesData[r.id].title}`}
            >
              <img
                src={rangesData[r.id].heroImage}
                alt={rangesData[r.id].title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-transparent" />
              <span className="absolute top-4 left-4 text-[13px] font-light text-white">
                {rangesData[r.id].title.replace('Gamme ', '')}
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/55">{r.sub}</span>
                <div className="w-7 h-7 rounded-full border border-white/30 bg-white/12 flex items-center justify-center">
                  <ArrowRight size={11} className="text-white/80" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Intégrer dans NosProduits.tsx** — ajouter les 2 imports et insérer les composants juste après `<PageHero>` :

```tsx
// Ajouter les imports
import { NosProduitsFeaturedCarousel } from '../components/nosproduits/NosProduitsFeaturedCarousel';
import { NosProduitsTiles } from '../components/nosproduits/NosProduitsTiles';

// Dans le JSX, après </PageHero> :
<NosProduitsFeaturedCarousel />
<NosProduitsTiles />
```

- [ ] **Vérifier compilation + visuel**

```bash
npx tsc --noEmit
npm run dev
# Naviguer vers /nos-produits et vérifier les 2 nouvelles sections en tête
```

- [ ] **Commit**

```bash
git add src/components/nosproduits/ src/pages/NosProduits.tsx
git commit -m "feat: NosProduits — carrousel gammes + tuiles navigation"
```

---

## Task 9 — Interface Admin : gestion du carrousel éditorial

**Files:**
- Create: `src/pages/admin/AdminCarousel.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Créer AdminCarousel.tsx**

```tsx
// src/pages/admin/AdminCarousel.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import type { HomeCarouselCard } from '../../types/homeCarousel';

const EMPTY_FORM = { eyebrow: '', title: '', image_url: '', link_to: '', active: true };

export default function AdminCarousel() {
  const [cards, setCards] = useState<HomeCarouselCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HomeCarouselCard | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<HomeCarouselCard | null>(null);
  const modalState = useOverlayState();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await (supabase as any)
      .from('home_carousel_cards')
      .select('*')
      .order('position', { ascending: true });
    if (e) setError(e.message);
    else { setCards(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    modalState.open();
  };

  const openEdit = (card: HomeCarouselCard) => {
    setEditing(card);
    setForm({ eyebrow: card.eyebrow, title: card.title, image_url: card.image_url ?? '', link_to: card.link_to ?? '', active: card.active });
    modalState.open();
  };

  const save = async () => {
    const payload = {
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      image_url: form.image_url.trim() || null,
      link_to: form.link_to.trim() || null,
      active: form.active,
    };
    if (editing) {
      const { error: e } = await (supabase as any).from('home_carousel_cards').update(payload).eq('id', editing.id);
      if (e) { setError(e.message); return; }
    } else {
      const position = cards.length > 0 ? Math.max(...cards.map((c) => c.position)) + 1 : 1;
      const { error: e } = await (supabase as any).from('home_carousel_cards').insert({ ...payload, position });
      if (e) { setError(e.message); return; }
    }
    modalState.close();
    load();
  };

  const remove = async (card: HomeCarouselCard) => {
    const { error: e } = await (supabase as any).from('home_carousel_cards').delete().eq('id', card.id);
    if (e) setError(e.message);
    else { setDeleteTarget(null); load(); }
  };

  const move = async (card: HomeCarouselCard, dir: -1 | 1) => {
    const idx = cards.findIndex((c) => c.id === card.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cards.length) return;
    const swap = cards[swapIdx];
    await Promise.all([
      (supabase as any).from('home_carousel_cards').update({ position: swap.position }).eq('id', card.id),
      (supabase as any).from('home_carousel_cards').update({ position: card.position }).eq('id', swap.id),
    ]);
    load();
  };

  return (
    <div className={DASH_MAIN_PAD}>
      <DashEyebrow>Contenu</DashEyebrow>
      <DashPageHeader title="Carrousel éditorial" action={
        <Button size="sm" onPress={openCreate} className="gap-1.5">
          <Plus size={14} /> Ajouter une carte
        </Button>
      } />

      {error && <AdminErrorAlert message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <p className="text-sm text-black/45 mt-6">Chargement…</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {cards.map((card, idx) => (
            <div key={card.id} className="flex items-center gap-4 rounded-[8px] border border-noir/[0.08] bg-white p-4">
              {/* Miniature */}
              <div className="h-14 w-14 flex-shrink-0 rounded-[6px] overflow-hidden bg-noir/[0.05]">
                {card.image_url
                  ? <img src={card.image_url} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-[18px]">📸</div>
                }
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-black/40 truncate">{card.eyebrow}</p>
                <p className="text-[13px] font-light text-black truncate">{card.title}</p>
                {card.link_to && <p className="text-[10px] text-black/35 truncate">{card.link_to}</p>}
              </div>
              {/* Statut */}
              <span className={`text-[9px] uppercase tracking-[0.14em] px-2 py-1 rounded-full ${card.active ? 'bg-green-50 text-green-700' : 'bg-noir/[0.05] text-black/40'}`}>
                {card.active ? 'Actif' : 'Masqué'}
              </span>
              {/* Actions */}
              <div className="flex gap-1">
                <Button isIconOnly size="sm" variant="ghost" onPress={() => move(card, -1)} isDisabled={idx === 0} aria-label="Monter">
                  <ArrowUp size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => move(card, 1)} isDisabled={idx === cards.length - 1} aria-label="Descendre">
                  <ArrowDown size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => openEdit(card)} aria-label="Modifier">
                  <Pencil size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => setDeleteTarget(card)} aria-label="Supprimer" className="text-red-500 hover:text-red-600">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-sm text-black/40 py-8 text-center">Aucune carte. Cliquez "Ajouter une carte".</p>
          )}
        </div>
      )}

      {/* Modal création / édition */}
      <Modal state={modalState} title={editing ? 'Modifier la carte' : 'Nouvelle carte'}>
        <div className="flex flex-col gap-4 p-4">
          {[
            { label: 'Eyebrow (petit texte)', key: 'eyebrow', placeholder: 'Wellness · Coup de cœur' },
            { label: 'Titre', key: 'title', placeholder: 'Ton moment bien-être' },
            { label: "URL de l'image", key: 'image_url', placeholder: 'https://…' },
            { label: 'Lien (optionnel)', key: 'link_to', placeholder: '/menu?gamme=wellness' },
          ].map(({ label, key, placeholder }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
              <input
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="rounded-[6px] border border-noir/[0.15] px-3 py-2 text-[13px] outline-none focus:border-noir/40"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            <span className="text-[13px] text-black/70">Carte active (visible sur le site)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onPress={modalState.close}>Annuler</Button>
            <Button onPress={save} isDisabled={!form.eyebrow.trim() || !form.title.trim()}>
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer cette carte ?"
        description={`"${deleteTarget?.title}" sera supprimée définitivement.`}
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Ajouter "Carrousel" dans la nav admin** (`AdminLayout.tsx`, tableau NAV ligne ~20)

```tsx
// Ajouter après { label: 'Communication', ... } :
import { Images } from 'lucide-react'; // ajouter à l'import existant

{ label: 'Carrousel', shortLabel: 'Carrousel', icon: Images, path: '/admin/carousel' },
```

- [ ] **Ajouter le lazy import et la route dans App.tsx**

```tsx
// Avec les autres lazy imports admin :
const AdminCarousel = lazy(() => import('./pages/admin/AdminCarousel'));

// Avec les autres routes admin :
<Route path="/admin/carousel" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminCarousel /></AdminLayout>
  </ProtectedAdminRoute>
} />
```

- [ ] **Vérifier compilation**

```bash
npx tsc --noEmit
```

- [ ] **Tester dans le navigateur** : naviguer vers `/admin/carousel`, créer une carte test, vérifier qu'elle apparaît sur la Home.

- [ ] **Commit**

```bash
git add src/pages/admin/AdminCarousel.tsx src/pages/admin/AdminLayout.tsx src/App.tsx
git commit -m "feat: admin — interface CRUD carrousel éditorial Home"
```

---

## Self-Review

**Spec coverage :**
- ✅ Carrousel éditorial photos Home (Task 3) + admin (Task 9)
- ✅ "Nos coups de cœur" : suppression sous-titre + Óra+ (Task 6)
- ✅ Óra+ strip : inchangé (non touché)
- ✅ Split modèle + tabs gammes boissons (Task 4)
- ✅ Nos univers "Nutrition" → "Shakes" (Task 7)
- ✅ Tuiles 3 gammes produits Wellness/Sport/Skin (Task 5)
- ✅ Carrousel produits par gamme (Task 5)
- ✅ CTA Événements padding réduit (Task 7)
- ✅ Nos Produits — carrousel + tuiles (Task 8)
- ✅ Table Supabase + RLS (Task 1)
- ✅ Types TypeScript (Task 2)

**Titre du carrousel éditorial :** Valeur par défaut `"À la une"` dans `<HomeFeaturedCarousel title="À la une" />` — à modifier facilement dans Home.tsx une fois le titre définitif choisi par la gérante.

**Photos manquantes :** Toutes les sections gèrent proprement l'absence de photo (placeholder "📸 Photo à venir") — aucun bug visuel en attendant la séance photo.
