# Page détail produit gamme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer les pages détail produit pour chaque produit des gammes (Wellness, Sport, Skin), accessibles via `/nos-produits/:rangeId/:slug`.

**Architecture:** Nouveau composant de page `GammeProductDetail.tsx` inspiré de `DrinkDetail.tsx` mais simplifié (pas de lait/boosters/tabs). Les données viennent de `productsData.ts` (statiques). Le slug est généré côté client via `toSlug()`. Le bouton "Renseignements" dans `RangeDetail.tsx` devient un lien vers la page détail.

**Tech Stack:** React + Vite, React Router, Tailwind v4, HeroUI v3, Framer Motion, lucide-react.

---

## File Structure

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `src/pages/GammeProductDetail.tsx` | Créer | Page détail produit gamme (breadcrumb, split image/infos, sélecteur quantité, CTA panier, caractéristiques, cross-sell, CTA final) |
| `src/pages/RangeDetail.tsx` | Modifier | Remplacer le bouton "Renseignements" par un `<Link>` vers `/nos-produits/:rangeId/:slug` |
| `src/lib/toSlug.ts` | Existe déjà | Utilitaire `toSlug(name)` pour générer les slugs |
| `src/data/productsData.ts` | Aucun changement | Source de données statiques, déjà structurée |

---

### Task 1: Créer le composant helper `getGammeProduct`

**Files:**
- Create: `src/lib/getGammeProduct.ts`

Cette fonction utilitaire trouve un produit dans `productsData.ts` par `rangeId` et `slug`. Elle sera importée par `GammeProductDetail.tsx`.

```typescript
import { toSlug } from './toSlug';
import { rangesData } from '../data/productsData';

export type GammeProductStatic = {
  name: string;
  description: string;
  price: string;
  image?: string;
  ingredients?: string[];
  benefits?: string[];
};

export type RangeEntry = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  heroImage: string;
  products: GammeProductStatic[];
};

export function getGammeProduct(
  rangeId: string,
  slug: string,
): { product: GammeProductStatic; range: RangeEntry; index: number } | null {
  const range = rangesData[rangeId as keyof typeof rangesData] as RangeEntry | undefined;
  if (!range) return null;

  const index = range.products.findIndex((p) => toSlug(p.name) === slug);
  if (index === -1) return null;

  return { product: range.products[index]!, range, index };
}
```

- [ ] Créer `src/lib/getGammeProduct.ts` avec le contenu ci-dessus

---

### Task 2: Créer la page `GammeProductDetail.tsx`

**Files:**
- Create: `src/pages/GammeProductDetail.tsx`

Page complète suivant le design spec. Structure :

```tsx
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button, cn } from '@heroui/react';
import {
  ArrowLeft, ArrowRight,
  Minus, Plus, Check, ShoppingBag,
  Sparkles, Zap, Droplet,
  MapPin,
} from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { getGammeProduct } from '../lib/getGammeProduct';
import { rangesData } from '../data/productsData';
import { useFadeUpWhenVisible } from '../lib/motionReveal';
import { barInfo } from '../data/infoData';
import { useCart } from '../store/cartStore';

const RANGE_ICONS: Record<string, LucideIcon> = {
  wellness: Sparkles,
  sport: Zap,
  skin: Droplet,
};

const RANGE_LABELS: Record<string, string> = {
  wellness: 'Wellness',
  sport: 'Sport',
  skin: 'Skin',
};

const GammeProductDetail = () => {
  const { rangeId, slug } = useParams<{ rangeId: string; slug: string }>();
  const navigate = useNavigate();
  const addLine = useCart((s) => s.addLine);

  const data = useMemo(() => {
    if (!rangeId || !slug) return null;
    return getGammeProduct(rangeId, slug);
  }, [rangeId, slug]);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!data) return <Navigate to="/nos-produits" replace />;

  const { product, range, index } = data;

  // Parse price: "35€" => { simple: 35 } | "29€ / 39€" => { simple: 29, alt: 39 }
  const parsedPrice = useMemo(() => {
    const parts = product.price.replace('€', '').split('/');
    const simple = parseFloat(parts[0]!.trim());
    const alt = parts[1] ? parseFloat(parts[1].trim()) : null;
    return { simple, alt };
  }, [product.price]);

  const totalPrice = parsedPrice.simple * quantity;

  // Cross-sell : les autres produits de la même gamme
  const crossSell = range.products
    .map((p, i) => ({ ...p, slug: toSlug(p.name), index: i }))
    .filter((p) => p.index !== index)
    .slice(0, 3);

  const RangeIcon = RANGE_ICONS[rangeId!] ?? Sparkles;
  const fadeUp = useFadeUpWhenVisible();

  const handleAddToCart = () => {
    addLine({
      productId: `${rangeId}-${toSlug(product.name)}`,
      name: product.name,
      unitPrice: parsedPrice.simple,
      quantity,
      category: rangeId!,
      source: 'gamme',
      image: product.image || product.name.charAt(0),
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const displayPrice = parsedPrice.alt
    ? `${parsedPrice.simple}€ / ${parsedPrice.alt}€`
    : `${parsedPrice.simple}€`;

  // ... render
};

export default GammeProductDetail;
```

**Structure du render (complet) :**

```tsx
return (
  <div className="min-h-screen bg-white">

    {/* ─── Breadcrumb ─── */}
    <div>
      <PageShell className="py-5">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left mx-auto w-full max-w-6xl">
          <Link to="/nos-produits" className="hover:text-black transition-colors duration-200">Gammes</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/nos-produits/${rangeId}`} className="hover:text-black transition-colors duration-200">
            {RANGE_LABELS[rangeId!] ?? rangeId}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-black/70" aria-current="page">{product.name}</span>
        </nav>
      </PageShell>
    </div>

    {/* ─── Hero split ─── */}
    <section>
      <PageShell className="py-12 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16 mx-auto w-full max-w-6xl">

        {/* LEFT — Image */}
        <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
          <div className="relative mx-auto flex aspect-[3/4] w-full max-w-md items-center justify-center overflow-hidden rounded-[2px] bg-surface-product-well sm:max-w-lg lg:mx-0 lg:max-w-none">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <span className="pointer-events-none select-none font-display text-9xl text-black opacity-[0.06]">
                {product.name.charAt(0)}
              </span>
            )}
            <div className="absolute top-6 left-6">
              <span className="inline-flex items-center gap-2 bg-white/95 px-4 py-2 rounded-[2px] text-[10px] font-normal uppercase tracking-[0.08em] text-black/70">
                <RangeIcon size={14} strokeWidth={1.35} className="text-black/40" aria-hidden />
                {RANGE_LABELS[rangeId!] ?? rangeId}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Infos */}
        <div className="h-fit w-full min-w-0 lg:sticky lg:top-36">

          <h1 className="mb-3 text-center font-display font-normal leading-none tracking-[-0.01em] text-black sm:text-left"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>
            {product.name}
          </h1>

          <p className="mx-auto mb-4 max-w-xl text-center text-[13px] font-light leading-relaxed text-black/50 sm:mx-0 sm:text-left">
            {product.description}
          </p>

          {/* Prix */}
          <div className="mb-8">
            <p className="mb-1 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 sm:text-left">
              Prix
            </p>
            <span className="font-display font-normal tabular-nums text-black"
                  style={{ fontSize: 'clamp(32px, 3.5vw, 44px)' }}>
              {displayPrice}
            </span>
          </div>

          {/* Quantité + CTA */}
          <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center justify-center border border-noir/[0.1] rounded-full overflow-hidden sm:justify-start">
              <Button
                type="button" variant="ghost" isIconOnly
                aria-label="Diminuer la quantité"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                isDisabled={quantity === 1}
                className="flex h-12 w-12 min-w-12 items-center justify-center hover:bg-noir/[0.06] disabled:opacity-30"
              >
                <Minus size={14} strokeWidth={1.3} aria-hidden />
              </Button>
              <span className="w-12 text-center text-[16px] font-normal text-black" aria-live="polite" aria-atomic="true">
                {quantity}
              </span>
              <Button
                type="button" variant="ghost" isIconOnly
                aria-label="Augmenter la quantité"
                onPress={() => setQuantity(quantity + 1)}
                className="flex h-12 w-12 min-w-12 items-center justify-center hover:bg-noir/[0.06]"
              >
                <Plus size={14} strokeWidth={1.3} aria-hidden />
              </Button>
            </div>

            <Button
              type="button" variant="primary" fullWidth
              onPress={handleAddToCart}
              className="flex h-12 min-h-12 flex-1 items-center justify-center gap-3 rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite"
            >
              {justAdded ? (
                <><Check size={16} strokeWidth={2} aria-hidden /> Ajouté au panier</>
              ) : (
                <><ShoppingBag size={16} strokeWidth={1.3} aria-hidden /> Ajouter au panier · {totalPrice.toFixed(2)}€</>
              )}
            </Button>
          </div>

          <div className="flex items-start justify-center gap-3 border-t border-noir/[0.06] pt-5 sm:justify-start">
            <Check size={13} className="mt-0.5 shrink-0 text-black/45" strokeWidth={1.5} />
            <p className="max-w-md text-center text-[11px] font-light leading-relaxed text-black/45 sm:max-w-none sm:text-left">
              Paiement sécurisé en ligne. Retrait en boutique.
            </p>
          </div>

        </div>
      </div>
      </PageShell>
    </section>

    {/* ─── Caractéristiques ─── */}
    {(product.benefits || product.ingredients) && (
      <section className="border-t border-noir/[0.05] bg-white" aria-label="Caractéristiques">
        <PageShell className="py-16 lg:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <p className="mb-10 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/30 sm:text-left">
              Caractéristiques
            </p>
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              {product.benefits && product.benefits.length > 0 && (
                <div>
                  <p className="mb-6 text-[11px] font-normal uppercase tracking-[0.12em] text-black/50">
                    Bénéfices
                  </p>
                  <div className="divide-y divide-black/[0.05]">
                    {product.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-4 py-4">
                        <span className="text-[10px] font-normal tabular-nums text-black/25">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[13px] font-normal leading-relaxed text-black">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.ingredients && product.ingredients.length > 0 && (
                <div>
                  <p className="mb-6 text-[11px] font-normal uppercase tracking-[0.12em] text-black/50">
                    In压rédients clés
                  </p>
                  <ul className="space-y-3">
                    {product.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-black/20" aria-hidden />
                        <span className="text-[13px] font-light leading-relaxed text-black/60">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </PageShell>
      </section>
    )}

    {/* ─── Vous aimerez aussi ─── */}
    {crossSell.length > 0 && (
      <section className="border-t border-noir/[0.05] bg-white">
        <PageShell className="py-16 lg:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-12 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <h2 className="mb-2 font-display font-normal text-black"
                    style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                  Vous aimerez aussi
                </h2>
                <p className="text-[11px] text-black/40">D'autres produits de la gamme {RANGE_LABELS[rangeId!]}</p>
              </div>
              <Link to={`/nos-produits/${rangeId}`}
                    className="hidden items-center gap-2 text-[10px] font-normal uppercase tracking-[0.08em] text-black/40 hover:text-black md:inline-flex">
                Voir toute la gamme <ArrowRight size={12} strokeWidth={1.3} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {crossSell.map((item) => (
                <Link key={item.slug}
                      to={`/nos-produits/${rangeId}/${item.slug}`}
                      className="group block">
                  <div className="bg-surface-product-well rounded-[2px] aspect-[3/4] flex items-center justify-center mb-5 overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="font-display text-6xl text-black opacity-[0.06]">{item.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="font-display mb-1 font-normal text-black group-hover:text-black/55 transition-colors"
                      style={{ fontSize: '18px' }}>
                    {item.name}
                  </h3>
                  <span className="text-[18px] font-normal text-black">{item.price}</span>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Button type="button" variant="outline"
                      onPress={() => navigate(`/nos-produits/${rangeId}`)}
                      className="inline-flex h-11 min-h-11 items-center gap-2 rounded-full border-noir/15 px-8 text-[10px] font-normal uppercase tracking-[0.1em] text-black hover:border-noir/40">
                Voir toute la gamme <ArrowRight size={12} strokeWidth={1.3} />
              </Button>
            </div>
          </div>
        </PageShell>
      </section>
    )}

    {/* ─── CTA final ─── */}
    <section className="bg-noir">
      <PageShell className="py-20 text-center">
        <h2 className="font-display font-normal text-white mb-6"
            style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>
          Envie d'en savoir plus ?
        </h2>
        <p className="text-white/50 font-light mb-2 text-[13px]">Retrouvez-nous au :</p>
        <div className="flex items-center justify-center gap-2 text-white/80 mb-10">
          <MapPin size={16} strokeWidth={1.3} className="text-white/50" />
          <span className="font-light text-[13px]">{barInfo.address.fullAddress}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact"
                className="inline-block bg-white text-black px-10 py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[10px] hover:bg-noir/[0.06] transition-colors">
            Nous trouver
          </Link>
          <Link to={`/nos-produits/${rangeId}`}
                className="inline-block border border-white/25 text-white px-10 py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[10px] hover:bg-white/10 transition-colors">
            Retour à la gamme
          </Link>
        </div>
      </PageShell>
    </section>
  </div>
);
```

- [ ] Créer `src/pages/GammeProductDetail.tsx` avec le code complet ci-dessus
- [ ] Vérifier que tous les imports sont corrects (notamment `LucideIcon` depuis `lucide-react`)
- [ ] Vérifier que `toSlug` est importé correctement depuis `../lib/toSlug`

---

### Task 3: Modifier `RangeDetail.tsx` — lier "Renseignements" vers la page détail

**Files:**
- Modify: `src/pages/RangeDetail.tsx`

Dans `RangeDetail.tsx`, remplacer le `<Button>` "Renseignements" par un `<Link>` vers `/nos-produits/:rangeId/:slug`.

Changements :

1. Importer `toSlug` et `Link` (si pas déjà fait — `Link` est déjà importé)
2. Dans la boucle `items.map`, remplacer :

```tsx
// ANCIEN :
<Button type="button" variant="primary" fullWidth
        className="rounded-full bg-noir py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite">
  Renseignements <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
</Button>

// NOUVEAU :
<Link
  to={`/nos-produits/${rangeId}/${toSlug(product.name)}`}
  className="flex w-full items-center justify-center gap-2 rounded-full bg-noir py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite transition-colors"
>
  Renseignements <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
</Link>
```

3. Ajouter l'import de `toSlug` en haut du fichier si pas déjà :
```tsx
import { toSlug } from '../lib/toSlug';
```

- [ ] Modifier `src/pages/RangeDetail.tsx` pour lier le bouton "Renseignements" vers la page détail
- [ ] Ajouter l'import de `toSlug`

---

### Task 4: Vérifier le routing dans `App.tsx`

**Files:**
- Check: `src/App.tsx`

La route `/nos-produits/:rangeId/:slug` doit exister. Actuellement il y a `/nos-produits/:rangeId`. Vérifier que React Router ne confond pas les deux.

- [ ] Vérifier que la route `/nos-produits/:gamme/:slug` est bien définie **après** `/nos-produits/:rangeId` dans `App.tsx` (React Router match dans l'ordre, donc `:rangeId` avec 1 segment et `:gamme/:slug` avec 2 segments ne se chevauchent pas)
- [ ] Si la route `/nos-produits/:gamme/:slug` n'existe pas, l'ajouter avec `lazy(() => import('./pages/GammeProductDetail'))`

---

### Task 5: Build et vérification

- [ ] Lancer `npm run build` et corriger les éventuelles erreurs
- [ ] Vérifier manuellement le parcours : `/nos-produits` → clic Wellness → RangeDetail → clic "Renseignements" sur Aloe Vera → page détail
- [ ] Vérifier breadcrumb, prix, sélecteur quantité, ajout au panier, cross-sell, retour
