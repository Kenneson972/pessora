import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@heroui/react';
import {
  ArrowRight,
  Minus, Plus, Check, ShoppingBag,
  Sparkles, Zap, Droplet,
  MapPin,
} from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { getGammeProduct, type GammeProductStatic } from '../lib/getGammeProduct';
import { toSlug } from '../lib/toSlug';
import { rangesData } from '../data/productsData';
import { barInfo } from '../data/infoData';
import { useCart } from '../store/cartStore';

type CrossSellItem = GammeProductStatic & { slug: string };

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

  const data = useMemo(() => {
    if (!rangeId || !slug) return null;
    return getGammeProduct(rangeId, slug);
  }, [rangeId, slug]);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!data) return <Navigate to="/nos-produits" replace />;

  const { product } = data;

  // Parse price: "35€" => { simple: 35 } | "29€ / 39€" => { simple: 29, alt: 39 }
  const parsedPrice = useMemo(() => {
    const parts = product.price.replace('€', '').split('/');
    const simple = parseFloat(parts[0]!.trim());
    const alt = parts[1] ? parseFloat(parts[1].trim()) : null;
    return { simple, alt };
  }, [product.price]);

  const totalPrice = parsedPrice.simple * quantity;

  const displayPrice = parsedPrice.alt
    ? `${parsedPrice.simple}€ / ${parsedPrice.alt}€`
    : `${parsedPrice.simple}€`;

  // Cross-sell : les autres produits de la même gamme
  const range = rangesData[rangeId as keyof typeof rangesData];
  const crossSell: CrossSellItem[] = useMemo(() => {
    if (!range) return [];
    return range.products
      .filter((p) => (p.slug || toSlug(p.name)) !== slug)
      .map((p) => ({ ...p, slug: p.slug || toSlug(p.name) }))
      .slice(0, 3);
  }, [range, slug]);

  const RangeIcon = range ? RANGE_ICONS[rangeId!] ?? Sparkles : Sparkles;

  const handleAddToCart = () => {
    addLine({
      productId: `${rangeId}-${toSlug(product.name)}`,
      name: product.name,
      unitPrice: parsedPrice.simple,
      quantity,
      category: rangeId!,
      source: 'gamme',
      optionsKey: 'default',
      optionLabels: [],
      image: product.image || product.name.charAt(0),
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

              <p className="mx-auto mb-4 max-w-xl text-center text-[13px] font-light leading-relaxed text-black/50 sm:mx-0 sm:text-left">
                {product.description}
              </p>

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
                      Ingrédients clés
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
    </div>
  );
};

export default GammeProductDetail;
