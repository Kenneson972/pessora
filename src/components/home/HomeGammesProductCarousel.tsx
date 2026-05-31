import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useGammeCatalog } from '../../hooks/useGammeCatalog';
import { toSlug } from '../../lib/toSlug';
import { SPRING_TAB, SPRING_SMOOTH, EDITORIAL_EASE } from '../../lib/motionReveal';
import type { GammeProduct } from '../../types/database';

type RangeId = 'wellness' | 'sport' | 'skin';

const TABS: { id: RangeId; label: string }[] = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'sport', label: 'Sport' },
  { id: 'skin', label: 'Skin' },
];

const formatEur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 });

function ProductCard({ product, index, rangeId }: { product: GammeProduct; index: number; rangeId: RangeId }) {
  const displayPrice = product.price_alt !== null
    ? `${formatEur(product.price)}€ / ${formatEur(product.price_alt)}€`
    : `${formatEur(product.price)}€`;
  const slug = product.slug ?? toSlug(product.name);

  return (
    <motion.div
      className="flex-shrink-0 w-[180px] md:w-[200px] rounded-[2px] overflow-hidden border border-noir/[0.08] bg-white snap-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SMOOTH, delay: index * 0.04 }}
    >
      <Link to={`/nos-produits/${rangeId}/${slug}`} className="block">
        <div className="aspect-square bg-surface-product-well flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-[9px] uppercase tracking-[0.18em] text-black/25">Photo à venir</span>
          )}
        </div>
        <div className="p-3">
          <p className="text-[10px] font-medium tracking-[0.05em] text-black mb-1 line-clamp-1">{product.name}</p>
          <p className="text-[11px] font-light text-black">{displayPrice}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomeGammesProductCarousel({ activeTab }: { activeTab: string }) {
  const [tab, setTab] = useState<RangeId>(
    TABS.some((t) => t.id === activeTab) ? (activeTab as RangeId) : 'wellness'
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useGammeCatalog(tab);

  const handleTabChange = (id: RangeId) => {
    setTab(id);
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <LayoutGroup id="gamme-carousel-tabs">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={[
                'relative overflow-hidden px-4 py-2 rounded-full text-[10px] font-normal tracking-[0.06em] border transition-colors duration-200',
                tab === t.id
                  ? 'border-noir text-white'
                  : 'bg-white text-black/55 border-noir/[0.15] hover:border-noir/30',
              ].join(' ')}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="gamme-tab-bg"
                  className="absolute inset-0 bg-sapin"
                  transition={SPRING_TAB}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[180px] md:w-[200px] rounded-[2px] border border-noir/[0.06] bg-white">
                    <div className="aspect-square bg-surface-product-well animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-3/4 bg-noir/[0.06] animate-pulse rounded" />
                      <div className="h-3 w-1/3 bg-noir/[0.06] animate-pulse rounded" />
                    </div>
                  </div>
                ))
              : products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} rangeId={tab} />
                ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
