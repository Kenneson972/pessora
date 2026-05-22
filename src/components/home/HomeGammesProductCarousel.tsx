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
