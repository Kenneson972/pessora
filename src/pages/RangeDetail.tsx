import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, Skeleton } from '@heroui/react';
import { rangesData } from '../data/productsData';
import { useGammeCatalog } from '../hooks/useGammeCatalog';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import type { GammeProduct } from '../types/database';
import { toSlug } from '../lib/toSlug';

const SUBCATEGORY_LABELS: Partial<Record<string, Record<string, string>>> = {
  sport: {
    sport: 'Performance',
    encas: 'Encas',
  },
  skin: {
    nettoyage: 'Nettoyage & Indispensables',
    korean: 'Korean Products',
    contour: 'Contour des Yeux',
    serum: 'Sérum & Anti-Âge',
  },
};

const SUBCATEGORY_ORDER: Partial<Record<string, (string | null)[]>> = {
  sport: ['sport', 'encas'],
  skin: ['nettoyage', 'korean', 'contour', 'serum'],
  wellness: [null],
};

function groupBySubcategory(
  products: GammeProduct[],
  gamme: string,
): { key: string | null; label: string | null; items: GammeProduct[] }[] {
  const order = SUBCATEGORY_ORDER[gamme] ?? [null];
  const map = new Map<string | null, GammeProduct[]>();
  for (const p of products) {
    const key = p.subcategory;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return order
    .map((key) => ({
      key,
      label: key ? (SUBCATEGORY_LABELS[gamme]?.[key] ?? key) : null,
      items: map.get(key) ?? [],
    }))
    .filter((g) => g.items.length > 0);
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-[2px] bg-noir/[0.06]" />
          <Skeleton className="h-5 w-2/3 rounded bg-noir/[0.05]" />
          <Skeleton className="h-4 w-1/2 rounded bg-noir/[0.04]" />
        </div>
      ))}
    </div>
  );
}

const RangeDetail = () => {
  const { rangeId } = useParams<{ rangeId: string }>();

  const range = rangesData[rangeId as keyof typeof rangesData];
  if (!range) return <Navigate to="/nos-produits" replace />;

  const { products, loading } = useGammeCatalog(rangeId as 'sport' | 'skin' | 'wellness');
  const groups = groupBySubcategory(products, rangeId!);

  const Icon = range.icon;
  const fadeIntro = useFadeUpWhenVisible();
  const fadeDesc = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-noir/[0.06] bg-white">
        <PageShell className="py-8 md:py-10">
          <Link
            to="/nos-produits"
            className="inline-flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Retour aux gammes
          </Link>
          <motion.div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center md:gap-12" {...fadeIntro}>
            <div className="relative aspect-[16/10] w-full max-w-md shrink-0 overflow-hidden rounded-[2px] md:aspect-[4/3] md:max-w-sm">
              <img
                src={range.heroImage}
                alt={`Visuel de la gamme ${range.title}`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="min-w-0 text-center md:text-left">
              <Icon size={40} strokeWidth={1} className="mx-auto mb-4 text-black/40 md:mx-0" aria-hidden />
              <p className="text-editorial-tagline mb-2">Collection</p>
              <h1
                className="mb-3 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 44px)' }}
              >
                {range.title}
              </h1>
              <p
                className="max-w-xl font-display text-[17px] font-light italic leading-snug text-black/55 md:text-[18px]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                « {range.subtitle} »
              </p>
            </div>
          </motion.div>
        </PageShell>
      </section>

      <section className="border-b border-noir/[0.05] py-16 md:py-20">
        <PageShell>
          <motion.p
            className="mx-auto max-w-4xl text-center font-display text-[clamp(20px,2.5vw,28px)] font-light leading-relaxed text-black/70"
            style={{ fontFamily: 'var(--font-display)' }}
            {...fadeDesc}
          >
            {range.description}
          </motion.p>
        </PageShell>
      </section>

      <section className="pb-20 pt-4 md:pb-28">
        <PageShell>
          {loading ? (
            <ProductSkeletonGrid />
          ) : (
            <div className="space-y-16">
              {groups.map(({ key, label, items }) => (
                <div key={key ?? 'main'}>
                  {label && (
                    <h2
                      className="mb-8 font-display text-[clamp(18px,2vw,24px)] font-normal text-black/70"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {label}
                    </h2>
                  )}
                  <motion.div
                    className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16"
                    variants={container}
                    initial={isReducedMotion ? false : 'hidden'}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1, margin: '0px 0px -48px 0px' }}
                  >
                    {items.map((product) => (
                      <motion.div key={product.id} variants={item} className="min-w-0">
                        <Card className="group overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white shadow-none transition-colors hover:border-noir/12">
                          <div className="relative aspect-[4/5] overflow-hidden bg-surface-product-well">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <>
                                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${range.bgColor}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="font-display text-8xl text-black opacity-[0.06]">
                                    {product.name.charAt(0)}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-5 opacity-80 transition-opacity duration-300 hover:opacity-100">
                              <Link
                                to={`/nos-produits/${rangeId}/${product.slug || toSlug(product.name)}`}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-noir py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite transition-colors"
                              >
                                Renseignements <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
                              </Link>
                            </div>
                          </div>
                          <CardContent className="gap-0 p-6 text-center">
                            <h3
                              className="mb-2 font-display text-[20px] font-normal text-black"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="mx-auto max-w-xs text-[12px] font-light leading-relaxed text-black/45">
                                {product.description}
                              </p>
                            )}
                            <p className={`mt-3 text-[16px] font-normal ${range.color}`}>
                              {product.price_alt
                                ? `${product.price}€ / ${product.price_alt}€`
                                : `${product.price}€`}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </PageShell>
      </section>
    </div>
  );
};

export default RangeDetail;
