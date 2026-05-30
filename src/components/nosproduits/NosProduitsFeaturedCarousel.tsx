import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { rangesData } from '../../data/productsData';

const CARDS = [
  { id: 'wellness' as const, eyebrow: 'Gamme Wellness', title: 'Compléments\nnutrition' },
  { id: 'sport'   as const, eyebrow: 'Gamme Sport',    title: 'Performance\n& récupération' },
  { id: 'skin'    as const, eyebrow: 'Gamme Skin',      title: 'Beauté\n& éclat' },
  { id: 'boutique' as const, eyebrow: 'En boutique · Martinique', title: 'Conseils\npersonnalisés' },
];

type CardId = typeof CARDS[number]['id'];

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
              className="h-11 w-11 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-sapin/35 hover:text-sapin">
              <ChevronLeft size={18} strokeWidth={1.25} />
            </Button>
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(1)} aria-label="Suivant"
              className="h-11 w-11 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-sapin/35 hover:text-sapin">
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
            const image = card.id !== 'boutique'
              ? rangesData[card.id as Exclude<CardId, 'boutique'>].heroImage
              : null;
            const target = card.id !== 'boutique'
              ? `/nos-produits#collection-${card.id}`
              : '/contact';
            return (
              <button
                key={card.id}
                onClick={() => navigate(target)}
                className="group flex-shrink-0 w-[min(260px,80vw)] h-[360px] rounded-[10px] overflow-hidden relative snap-start text-left"
              >
                {image ? (
                  <img
                    src={image}
                    alt={card.eyebrow}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
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
