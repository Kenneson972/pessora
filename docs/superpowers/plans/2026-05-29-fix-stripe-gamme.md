# Fix Stripe Checkout Produits Gamme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger le checkout Stripe pour les produits gamme en remplaçant les données statiques par un fetch Supabase qui retourne un UUID valide.

**Architecture:** Créer `useGammeProduct` (hook DB), réécrire `GammeProductDetail` pour utiliser les données DB (`product.id` UUID, `product.price: number`), adapter `GammeProductDetailAdminEdit` pour le nouveau type. L'edge function `create-checkout-session` n'est pas modifiée — elle attend déjà un UUID pour `source: 'gamme'`.

**Tech Stack:** React, TypeScript, Supabase (`supabase as any`, pattern `useGammeCatalog`), HeroUI, Zustand (`useCart`)

---

## Références rapides

```ts
// src/types/database.ts — type GammeProduct (ligne 384)
export type GammeProduct = Database['public']['Tables']['gamme_products']['Row']
// {
//   id: string           ← UUID à utiliser comme productId dans le cart
//   gamme: 'sport' | 'skin' | 'wellness'
//   name: string
//   description: string | null
//   price: number        ← déjà un number, plus de parsing "35€"
//   price_alt: number | null
//   image_url: string | null
//   slug: string | null
//   active: boolean
//   sort_order: number
//   created_at: string
// }

// Pattern useGammeCatalog (src/hooks/useGammeCatalog.ts) :
// - cancelled flag dans useEffect
// - (supabase as any).from(...).then(({ data, error }) => ...)
// - maybeSingle() pour un seul résultat

// barInfo utilisé dans le CTA bas de page (src/data/infoData.ts)
// toSlug utilisé pour le cross-sell (src/lib/toSlug.ts)
// rangesData utilisé pour le cross-sell statique (src/data/productsData.ts)
```

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer  | `src/hooks/useGammeProduct.ts` |
| Réécrire | `src/pages/GammeProductDetail.tsx` |
| Réécrire | `src/components/admin/GammeProductDetailAdminEdit.tsx` |

---

## Task 1 — Créer useGammeProduct

**Files:**
- Create: `src/hooks/useGammeProduct.ts`

- [ ] **Créer le fichier**

```ts
// src/hooks/useGammeProduct.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GammeProduct } from '../types/database';

export function useGammeProduct(
  gamme: string | undefined,
  slug: string | undefined,
): { product: GammeProduct | null; loading: boolean; error: string | null } {
  const [product, setProduct] = useState<GammeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gamme || !slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', gamme)
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
      .then(
        ({
          data,
          error: err,
        }: {
          data: GammeProduct | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (err) {
            setError(err.message);
            setProduct(null);
          } else {
            setProduct(data);
          }
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme, slug]);

  return { product, loading, error };
}
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | grep useGammeProduct
```

Expected : aucune ligne (= aucune erreur sur ce fichier).

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/hooks/useGammeProduct.ts && git commit -m "feat: useGammeProduct hook — fetch produit gamme depuis Supabase"
```

---

## Task 2 — Réécrire GammeProductDetail

**Files:**
- Modify: `src/pages/GammeProductDetail.tsx`

Ce fichier est réécrit entièrement. Les changements clés :
- `getGammeProduct()` → `useGammeProduct()` (hook DB)
- `product.price: string` → `product.price: number`
- `product.image` → `product.image_url`
- `productId: ${rangeId}-${slug}` → `productId: product.id` (UUID)
- `parsedPrice` useMemo supprimé
- Loading skeleton + error state ajoutés
- `productOverride` type : `GammeProductStatic` → `GammeProduct`
- `CrossSellItem` type inliné (plus de dépendance sur `GammeProductStatic`)

- [ ] **Remplacer le fichier complet**

```tsx
// src/pages/GammeProductDetail.tsx
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GammeProductDetailAdminEdit } from '../components/admin/GammeProductDetailAdminEdit';
import { Button } from '@heroui/react';
import {
  ArrowRight,
  Minus, Plus, Check, ShoppingBag,
  Sparkles, Zap, Droplet,
  MapPin,
} from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useGammeProduct } from '../hooks/useGammeProduct';
import { toSlug } from '../lib/toSlug';
import { rangesData } from '../data/productsData';
import { barInfo } from '../data/infoData';
import { useCart } from '../store/cartStore';
import type { GammeProduct } from '../types/database';

type CrossSellItem = {
  name: string;
  description: string;
  price: string;
  image?: string;
  slug: string;
};

const RANGE_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
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
  const { isAdmin } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [productOverride, setProductOverride] = useState<GammeProduct | null>(null);

  const { product: dbProduct, loading, error } = useGammeProduct(rangeId, slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PageShell className="py-12 lg:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-2">
            <div className="aspect-[3/4] animate-pulse rounded-[2px] bg-gray-100" />
            <div className="space-y-5 pt-4">
              <div className="h-12 w-3/4 animate-pulse rounded-[2px] bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded-[2px] bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded-[2px] bg-gray-100" />
              <div className="h-10 w-1/3 animate-pulse rounded-[2px] bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-[2px] bg-gray-100" />
            </div>
          </div>
        </PageShell>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="mb-6 text-[13px] text-black/50">Impossible de charger ce produit.</p>
          <Button
            variant="ghost"
            onPress={() => navigate(`/nos-produits/${rangeId ?? ''}`)}
            className="rounded-full border border-noir/15 px-6 py-3 text-[10px] uppercase tracking-[0.1em]"
          >
            Retour à la gamme
          </Button>
        </div>
      </div>
    );
  }

  if (!dbProduct) return <Navigate to={`/nos-produits/${rangeId ?? ''}`} replace />;

  const product = productOverride ?? dbProduct;

  const handleProductSaved = (updated: Partial<GammeProduct>) => {
    setProductOverride((prev) => ({ ...(prev ?? dbProduct), ...updated }));
  };

  // Prix : déjà des numbers en DB
  const displayPrice = product.price_alt !== null
    ? `${product.price}€ / ${product.price_alt}€`
    : `${product.price}€`;
  const totalPrice = product.price * quantity;

  // Cross-sell : données statiques (juste visuel, pas Stripe)
  const range = rangesData[rangeId as keyof typeof rangesData];
  const crossSell: CrossSellItem[] = useMemo(() => {
    if (!range) return [];
    return range.products
      .filter((p) => toSlug(p.name) !== slug)
      .map((p) => ({ ...p, slug: toSlug(p.name) }))
      .slice(0, 3);
  }, [range, slug]);

  const RangeIcon = range ? RANGE_ICONS[rangeId!] ?? Sparkles : Sparkles;

  const handleAddToCart = () => {
    addLine({
      productId: product.id,          // UUID ✓ — edge function accepte ça
      name: product.name,
      unitPrice: product.price,        // number ✓ — plus de parsing string
      quantity,
      category: rangeId!,
      source: 'gamme',
      optionsKey: 'default',
      optionLabels: [],
      image: product.image_url || product.name.charAt(0),
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Breadcrumb ─── */}
      <div>
        <PageShell className="py-5">
          <nav
            aria-label="Fil d'Ariane"
            className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left"
          >
            <Link to="/nos-produits" className="transition-colors duration-200 hover:text-black">
              Gammes
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/nos-produits/${rangeId}`}
              className="transition-colors duration-200 hover:text-black"
            >
              {RANGE_LABELS[rangeId!] ?? rangeId}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-black/70" aria-current="page">
              {product.name}
            </span>
          </nav>
        </PageShell>
      </div>

      {/* ─── Hero split ─── */}
      <section>
        <PageShell className="py-12 lg:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16">
            {/* LEFT — Image */}
            <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="relative mx-auto flex aspect-[3/4] w-full max-w-md items-center justify-center overflow-hidden rounded-[2px] bg-surface-product-well sm:max-w-lg lg:mx-0 lg:max-w-none">
                {product.image_url ? (
                  <img
                    src={product.image_url}
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
                <div className="absolute left-6 top-6">
                  <span className="inline-flex items-center gap-2 rounded-[2px] bg-white/95 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.08em] text-black/70">
                    <RangeIcon size={14} strokeWidth={1.35} className="text-black/40" aria-hidden />
                    {RANGE_LABELS[rangeId!] ?? rangeId}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT — Infos */}
            <div className="h-fit w-full min-w-0 lg:sticky lg:top-36">
              <h1
                className="mb-3 text-center font-display font-normal leading-none tracking-[-0.01em] text-black sm:text-left"
                style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
              >
                {product.name}
              </h1>

              {product.description && (
                <p className="mx-auto mb-4 max-w-xl text-center text-[13px] font-light leading-relaxed text-black/50 sm:mx-0 sm:text-left">
                  {product.description}
                </p>
              )}

              {/* Prix */}
              <div className="mb-8">
                <p className="mb-1 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 sm:text-left">
                  Prix
                </p>
                <span
                  className="font-display font-normal tabular-nums text-black"
                  style={{ fontSize: 'clamp(32px, 3.5vw, 44px)' }}
                >
                  {displayPrice}
                </span>
              </div>

              {/* Quantité + CTA */}
              <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-noir/[0.1] sm:justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    aria-label="Diminuer la quantité"
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    isDisabled={quantity === 1}
                    className="flex h-12 w-12 min-w-12 items-center justify-center hover:bg-noir/[0.06] disabled:opacity-30"
                  >
                    <Minus size={14} strokeWidth={1.3} aria-hidden />
                  </Button>
                  <span
                    className="w-12 text-center text-[16px] font-normal text-black"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    aria-label="Augmenter la quantité"
                    onPress={() => setQuantity(quantity + 1)}
                    className="flex h-12 w-12 min-w-12 items-center justify-center hover:bg-noir/[0.06]"
                  >
                    <Plus size={14} strokeWidth={1.3} aria-hidden />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onPress={handleAddToCart}
                  isDisabled={loading}
                  className="flex h-12 min-h-12 flex-1 items-center justify-center gap-3 rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite"
                >
                  {justAdded ? (
                    <>
                      <Check size={16} strokeWidth={2} aria-hidden /> Ajouté au panier
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.3} aria-hidden /> Ajouter au panier ·{' '}
                      {totalPrice.toFixed(2)}€
                    </>
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

      {/* ─── Vous aimerez aussi ─── */}
      {crossSell.length > 0 && (
        <section className="border-t border-noir/[0.05] bg-white">
          <PageShell className="py-16 lg:py-24">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-12 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
                <div>
                  <h2
                    className="mb-2 font-display font-normal text-black"
                    style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}
                  >
                    Vous aimerez aussi
                  </h2>
                  <p className="text-[11px] text-black/40">
                    D'autres produits de la gamme {RANGE_LABELS[rangeId!]}
                  </p>
                </div>
                <Link
                  to={`/nos-produits/${rangeId}`}
                  className="hidden items-center gap-2 text-[10px] font-normal uppercase tracking-[0.08em] text-black/40 transition-colors duration-200 hover:text-black md:inline-flex"
                >
                  Voir toute la gamme <ArrowRight size={12} strokeWidth={1.3} />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
                {crossSell.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/nos-produits/${rangeId}/${item.slug}`}
                    className="group block"
                  >
                    <div className="relative mb-5 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[2px] bg-surface-product-well">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-display text-6xl text-black opacity-[0.06]">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h3
                      className="mb-1 font-display text-[18px] font-normal text-black transition-colors group-hover:text-black/55"
                    >
                      {item.name}
                    </h3>
                    <span className="text-[18px] font-normal text-black">{item.price}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-10 text-center md:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => navigate(`/nos-produits/${rangeId}`)}
                  className="inline-flex h-11 min-h-11 items-center gap-2 rounded-full border-noir/15 px-8 text-[10px] font-normal uppercase tracking-[0.1em] text-black hover:border-noir/40"
                >
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
          <h2
            className="mb-6 font-display font-normal text-white"
            style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
          >
            Envie d'en savoir plus ?
          </h2>
          <p className="mb-2 text-[13px] font-light text-white/50">Retrouvez-nous au :</p>
          <div className="mb-10 flex items-center justify-center gap-2 text-white/80">
            <MapPin size={16} strokeWidth={1.3} className="text-white/50" />
            <span className="text-[13px] font-light">{barInfo.address?.fullAddress ?? barInfo.address}</span>
          </div>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-block rounded-full bg-white px-10 py-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black transition-colors hover:bg-noir/[0.06]"
            >
              Nous trouver
            </Link>
            <Link
              to={`/nos-produits/${rangeId}`}
              className="inline-block rounded-full border border-white/25 px-10 py-4 text-[10px] font-normal uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10"
            >
              Retour à la gamme
            </Link>
          </div>
        </PageShell>
      </section>

      {isAdmin && (
        <GammeProductDetailAdminEdit
          slug={slug!}
          product={product}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
};

export default GammeProductDetail;
```

- [ ] **Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1 | head -30
```

Expected : des erreurs sur `GammeProductDetailAdminEdit` (type mismatch — c'est normal, Task 3 corrige ça). Aucune autre erreur.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/pages/GammeProductDetail.tsx && git commit -m "feat: GammeProductDetail — données DB, productId UUID, prix number"
```

---

## Task 3 — Adapter GammeProductDetailAdminEdit

**Files:**
- Modify: `src/components/admin/GammeProductDetailAdminEdit.tsx`

Changements : `GammeProductStatic` → `GammeProduct`, suppression de `parseStaticPrice`, `product.image` → `product.image_url`, `onSaved` envoie `price: number` au lieu d'un string formaté.

- [ ] **Remplacer le fichier complet**

```tsx
// src/components/admin/GammeProductDetailAdminEdit.tsx
import { useState, useRef, useEffect } from 'react';
import { Button, Modal, useOverlayState, TextField, Input, Label, TextArea } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import type { GammeProduct } from '../../types/database';

interface Props {
  slug: string;
  product: GammeProduct;
  onSaved: (updated: Partial<GammeProduct>) => void;
}

type SaveStatus = 'idle' | 'uploading' | 'saving' | 'error';

export function GammeProductDetailAdminEdit({ slug, product, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [price, setPrice] = useState(String(product.price));
  const [priceAlt, setPriceAlt] = useState(
    product.price_alt !== null ? String(product.price_alt) : '',
  );
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(product.name);
      setDescription(product.description ?? '');
      setPrice(String(product.price));
      setPriceAlt(product.price_alt !== null ? String(product.price_alt) : '');
      setImagePreview('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen, product]);

  const overlay = useOverlayState({
    isOpen,
    onOpenChange: (open) => setIsOpen(open),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      let finalImageUrl: string | undefined;

      const file = fileRef.current?.files?.[0];
      if (file) {
        setStatus('uploading');
        finalImageUrl = await uploadPublicImage('product-images', file, 'gammes/');
      }

      const priceNum = parseFloat(price) || 0;
      const priceAltNum = priceAlt.trim() ? parseFloat(priceAlt) : null;

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        price_alt: priceAltNum,
      };
      if (finalImageUrl) payload.image_url = finalImageUrl;

      setStatus('saving');
      const { error } = await (supabase as any)
        .from('gamme_products')
        .update(payload)
        .eq('slug', slug);

      if (error) throw new Error(error.message);

      const update: Partial<GammeProduct> = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        price_alt: priceAltNum,
      };
      if (finalImageUrl) update.image_url = finalImageUrl;
      onSaved(update);

      setIsOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  };

  const busy = status === 'uploading' || status === 'saving';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#1E3529] px-4 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-white shadow-lg transition-opacity hover:opacity-90"
        aria-label="Modifier ce produit"
      >
        <Pencil size={13} strokeWidth={1.5} aria-hidden />
        Modifier
      </button>

      <Modal state={overlay}>
        <Modal.Backdrop variant="blur" isDismissable>
          <Modal.Container
            scroll="inside"
            placement="center"
            size="full"
            className="mx-auto max-h-[92vh] w-[min(100vw-1rem,520px)] shadow-2xl"
          >
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display pr-10 text-[17px] font-normal tracking-[0.02em] text-black">
                  ✏️ Modifier le produit
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 rounded-[2px] border border-transparent px-2 py-1 text-[11px] text-black/45 hover:bg-noir/[0.05] hover:text-black">
                  Fermer
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {/* Image */}
                <div>
                  <p className="mb-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Image</p>
                  <div className="flex items-center gap-4 rounded-[2px] border border-dashed border-noir/20 p-3">
                    {imagePreview || product.image_url ? (
                      <img
                        src={imagePreview || product.image_url!}
                        alt="preview"
                        className="h-14 w-14 rounded-[2px] object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-[2px] bg-gray-100" />
                    )}
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        id="gamme-image-upload"
                        onChange={handleFileChange}
                        disabled={busy}
                      />
                      <label
                        htmlFor="gamme-image-upload"
                        className="cursor-pointer rounded-full border border-noir/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-colors hover:bg-noir/[0.04]"
                      >
                        {status === 'uploading' ? 'Upload…' : 'Choisir'}
                      </label>
                      <p className="mt-1 text-[9px] text-black/35">JPG, PNG, WebP · max 5 Mo</p>
                    </div>
                  </div>
                </div>

                {/* Nom */}
                <TextField className="space-y-1" name="gamme-name">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Nom</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="secondary"
                    disabled={busy}
                    className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

                {/* Description */}
                <TextField className="space-y-1" name="gamme-description">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Description</Label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={busy}
                    className="w-full resize-none border-0 border-b border-noir/10 bg-transparent py-2 text-[13px] font-light text-black focus-visible:border-noir"
                  />
                </TextField>

                {/* Prix + Prix alt */}
                <div className="grid grid-cols-2 gap-3">
                  <TextField className="space-y-1" name="gamme-price">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Prix (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                  <TextField className="space-y-1" name="gamme-price-alt">
                    <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Prix alt (€) — optionnel</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceAlt}
                      onChange={(e) => setPriceAlt(e.target.value)}
                      variant="secondary"
                      disabled={busy}
                      placeholder="laisser vide si non applicable"
                      className="w-full border-0 border-b border-noir/10 bg-transparent py-2 text-[14px] font-light text-black focus-visible:border-noir"
                    />
                  </TextField>
                </div>

                {status === 'error' && (
                  <p className="rounded-[2px] bg-red-50 px-3 py-2 text-[11px] text-red-500">{errorMsg}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onPress={handleSave}
                    isDisabled={busy}
                    className="h-10 min-h-10 flex-1 rounded-full bg-[#1E3529] text-[10px] uppercase tracking-[0.14em] text-white"
                  >
                    {status === 'uploading' ? 'Upload image…' : status === 'saving' ? 'Enregistrement…' : '💾 Enregistrer'}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => setIsOpen(false)}
                    isDisabled={busy}
                    className="h-10 min-h-10 rounded-full border border-noir/15 px-5 text-[10px] uppercase tracking-[0.14em] text-black/55"
                  >
                    Annuler
                  </Button>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
```

- [ ] **Vérifier TypeScript — zéro erreur**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npx tsc --noEmit 2>&1
```

Expected : `TypeScript compilation completed` sans aucune erreur.

- [ ] **Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add src/components/admin/GammeProductDetailAdminEdit.tsx && git commit -m "feat: GammeProductDetailAdminEdit — adapte type GammeProduct DB"
```

---

## Task 4 — Build + vérification finale

**Files:** aucun

- [ ] **Build complet**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && npm run build 2>&1 | grep -E "error|Error|✓ built"
```

Expected : `✓ built in Xs` sans ligne `error`.

- [ ] **Commit plan + push**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA" && git add docs/superpowers/plans/2026-05-29-fix-stripe-gamme.md && git commit -m "docs: plan fix Stripe gamme — implémenté" && git push
```

- [ ] **Checklist manuelle**

1. Aller sur `/nos-produits/wellness/<slug-valide>` (ex: `/nos-produits/wellness/aloe-vera`)
2. Vérifier que la page charge (skeleton bref, puis produit)
3. Vérifier que le prix s'affiche en `€` sans parsing
4. Ajouter au panier → ouvrir le panier → vérifier que le `productId` dans le cart est un UUID (inspecter le Zustand store en console : `window.__cartStore?.getState().items`)
5. Aller sur `/nos-produits/wellness/slug-inexistant` → doit rediriger vers `/nos-produits/wellness`
6. En admin : bouton Modifier visible, modal s'ouvre avec le prix en number
