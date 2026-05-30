import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Droplet } from 'lucide-react';
import { Button, cn } from '@heroui/react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { PageShell } from '../components/layout/PageShell';
import { rangesData } from '../data/productsData';
import { useGammeCatalog } from '../hooks/useGammeCatalog';
import type { GammeProduct } from '../types/database';

const RANGE_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  wellness: Sparkles,
  sport: Zap,
  skin: Droplet,
};

const RANGE_FILTERS = [
  { key: 'wellness', label: 'Wellness', Icon: Sparkles },
  { key: 'sport', label: 'Sport', Icon: Zap },
  { key: 'skin', label: 'Skin', Icon: Droplet },
];

function ProductPreview({ product }: { product: GammeProduct }) {
  const slug = product.slug ?? product.name.toLowerCase().replace(/\s+/g, '-');
  return (
    <Link
      to={`/nos-produits/${product.gamme}/${slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[2px] bg-surface-product-well mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl text-black/[0.06] select-none">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <h4 className="text-[13px] font-medium text-black group-hover:text-black/60 transition-colors truncate">
        {product.name}
      </h4>
      <p className="text-[12px] font-light text-black/40 mt-0.5">
        {product.price.toFixed(2).replace('.', ',')}€
      </p>
    </Link>
  );
}

function RangeSection({
  range,
  index,
  products,
}: {
  range: (typeof rangesData)[keyof typeof rangesData];
  index: number;
  products: GammeProduct[];
}) {
  const navigate = useNavigate();
  const reverse = index % 2 === 1;
  const Icon = RANGE_ICONS[range.id] ?? Sparkles;
  const previewProducts = products.slice(0, 3);

  return (
    <section id={`collection-${range.id}`} className="border-b border-black/[0.06]">
      <PageShell>
        <div
          className={cn(
            'flex flex-col gap-8 pb-16 pt-12 md:pb-24 md:pt-16',
            'md:flex-row md:items-center md:gap-14 lg:gap-24',
            reverse && 'md:flex-row-reverse',
          )}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] md:w-[55%]">
            {products[0]?.image_url ? (
              <img
                src={products[0].image_url}
                alt={range.title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 55vw"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <img
                src={range.heroImage}
                alt={range.title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 55vw"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-noir/70 via-noir/20 to-transparent" />
            <span className="absolute bottom-6 left-6 rounded-[1px] border border-white/20 px-3 py-1 text-[10px] font-light uppercase tracking-[0.24em] text-white/85">
              {range.subtitle}
            </span>
            <span className="absolute right-5 top-5 text-[10px] font-light uppercase tracking-[0.22em] text-white/70">
              {range.products.length} produits
            </span>
          </div>

          {/* Texte + previews */}
          <div className="w-full md:w-[45%]">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} strokeWidth={1.5} className="text-sapin/50" />
              <p className="font-display text-[11px] font-normal uppercase tracking-[0.26em] text-black/40">
                {range.subtitle}
              </p>
            </div>
            <h2
              className="mb-4 font-display font-normal leading-[1.02] tracking-[-0.02em] text-black"
              style={{ fontSize: 'clamp(32px, 3.8vw, 46px)' }}
            >
              {range.title}
            </h2>
            <p className="mb-3 max-w-[40ch] font-display text-[15px] font-light italic leading-snug text-black/60">
              « {range.subtitle} »
            </p>
            <p className="mb-6 max-w-[42ch] text-[13px] font-light leading-relaxed text-black/50">
              {range.description}
            </p>

            {previewProducts.length > 0 && (
              <div className="mb-6 grid grid-cols-3 gap-3">
                {previewProducts.map((p) => (
                  <ProductPreview key={p.id} product={p} />
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigate(`/nos-produits/${range.id}`)}
              className="inline-flex h-11 min-h-[44px] items-center gap-2.5 rounded-full border border-noir/15 px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-black hover:-translate-y-0.5 hover:border-noir/30 hover:bg-noir/[0.02] shadow-sm transition-all duration-300"
            >
              Voir la collection
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        </div>
      </PageShell>
    </section>
  );
}

const NosProduits = () => {
  const navigate = useNavigate();
  const fadeUp = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  const { products: wellnessProducts } = useGammeCatalog('wellness');
  const { products: sportProducts } = useGammeCatalog('sport');
  const { products: skinProducts } = useGammeCatalog('skin');

  const ranges = Object.values(rangesData);
  const productMap: Record<string, GammeProduct[]> = {
    wellness: wellnessProducts,
    sport: sportProducts,
    skin: skinProducts,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─── */}
      <section className="bg-sapin px-4 py-20 md:py-28 text-center">
        <h1
          className="font-display font-normal leading-[0.9] text-white"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 6vw, 72px)' }}
        >
          Nos Produits
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-[16px] font-light leading-relaxed text-white/55">
          Nutrition, sport et soins — chaque gamme a été composée avec une exigence précise
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {RANGE_FILTERS.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={`#collection-${key}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[12px] font-normal text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white transition-colors duration-200"
            >
              <Icon size={15} strokeWidth={1.5} aria-hidden />
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* ─── Gammes ─── */}
      <motion.div
        variants={container}
        initial={isReducedMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.08, margin: '0px 0px -40px 0px' }}
      >
        {ranges.map((range, i) => (
          <motion.section key={range.id} variants={item}>
            <RangeSection range={range} index={i} products={productMap[range.id] ?? []} />
          </motion.section>
        ))}
      </motion.div>

      {/* ─── En boutique ─── */}
      <section className="border-t border-noir/[0.05] bg-surface-muted">
        <PageShell>
          <motion.div className="mx-auto max-w-lg py-20 text-center md:py-24" {...fadeUp}>
            <p className="text-editorial-tagline mb-3">En boutique</p>
            <h3
              className="mb-4 font-display font-normal leading-[1.0] text-black"
              style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
            >
              Conseils personnalisés<br />
              <span className="italic text-black/45">sur place</span>
            </h3>
            <p className="mx-auto mb-8 max-w-sm text-[13px] font-light leading-relaxed text-black/50">
              Disponibilité des produits et recommandations adaptées à vos besoins. La carte complète des boissons est sur le menu.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigate('/menu')}
              className="inline-flex h-11 min-h-[44px] items-center gap-2.5 rounded-full border border-noir/15 px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-black hover:-translate-y-0.5 hover:border-noir/30 hover:bg-noir/[0.02] shadow-sm transition-all duration-300"
            >
              Voir le menu
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </Button>
          </motion.div>
        </PageShell>
      </section>
    </div>
  );
};

export default NosProduits;
