import { useState, useRef } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { rangesData } from '../../data/productsData';
import { SPRING_TAB, SPRING_SMOOTH, EDITORIAL_EASE } from '../../lib/motionReveal';

type RangeId = 'wellness' | 'sport' | 'skin';

const TABS: { id: RangeId; label: string }[] = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'sport', label: 'Sport' },
  { id: 'skin', label: 'Skin' },
];

function ProductCard({ product, index }: { product: { name: string; description: string; price: string }; index: number }) {
  return (
    <motion.div
      className="flex-shrink-0 w-[180px] md:w-[200px] rounded-[2px] overflow-hidden border border-noir/[0.08] bg-white snap-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SMOOTH, delay: index * 0.04 }}
    >
      <div className="aspect-square bg-surface-product-well flex items-center justify-center">
        <span className="text-[9px] uppercase tracking-[0.18em] text-black/25">Photo à venir</span>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-medium tracking-[0.05em] text-black mb-1 line-clamp-1">{product.name}</p>
        <p className="text-[11px] font-light text-black">{product.price}</p>
      </div>
    </motion.div>
  );
}

export function HomeGammesProductCarousel({ activeTab }: { activeTab: string }) {
  const [tab, setTab] = useState<RangeId>(
    TABS.some((t) => t.id === activeTab) ? (activeTab as RangeId) : 'wellness'
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const products = rangesData[tab].products;

  const handleTabChange = (id: RangeId) => {
    setTab(id);
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Tabs with layoutId sliding indicator */}
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
                  className="absolute inset-0 bg-[#1E3529]"
                  transition={SPRING_TAB}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* Products with AnimatePresence cross-fade */}
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
            {products.map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
