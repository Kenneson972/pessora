import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { motion, useInView } from 'framer-motion';
import { useFeaturedCarousel } from '../../hooks/useFeaturedCarousel';
import { useFadeUpWhenVisible, SPRING_SMOOTH } from '../../lib/motionReveal';

function PlaceholderCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex-shrink-0 w-[280px] min-[400px]:w-[310px] h-[400px] rounded-[2px] overflow-hidden bg-noir/[0.06] relative snap-start">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-black/20">
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
          src={card.image_url}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-noir/[0.06] text-black/20">
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

  const cls = "group flex-shrink-0 w-[280px] min-[400px]:w-[310px] h-[400px] rounded-[2px] overflow-hidden relative snap-start cursor-pointer block";

  return card.link_to ? (
    <Link to={card.link_to} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function HomeFeaturedCarousel({ title }: { title: string }) {
  const { cards, loading } = useFeaturedCarousel();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerAnim = useFadeUpWhenVisible();

  // Observer sur la section elle-même (sans overflow) pour éviter les problèmes IO
  const isInView = useInView(sectionRef, { once: true, amount: 0 });

  const scrollBy = useCallback((dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 324, behavior: 'smooth' });
  }, []);

  if (!loading && cards.length === 0) return null;

  const items = loading
    ? Array.from({ length: 4 }).map((_, i) => ({ id: `placeholder-${i}`, eyebrow: 'Chargement…', title: '—', image_url: null, link_to: null }))
    : cards;

  return (
    <section ref={sectionRef} className="bg-white section-vertical-padding">
      <div className="section-wrapper">
        <motion.div className="mb-8 flex items-end justify-between" {...headerAnim}>
          <h2 className="text-editorial-section-title">{title}</h2>
          <div className="flex gap-2">
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(-1)} aria-label="Précédent"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-[#1E3529]/40 hover:text-[#1E3529]">
              <ChevronLeft size={18} strokeWidth={1.25} />
            </Button>
            <Button isIconOnly variant="ghost" onPress={() => scrollBy(1)} aria-label="Suivant"
              className="h-10 w-10 rounded-full border border-noir/[0.12] bg-white text-black/55 hover:border-[#1E3529]/40 hover:text-[#1E3529]">
              <ChevronRight size={18} strokeWidth={1.25} />
            </Button>
          </div>
        </motion.div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((card, i) => (
            <motion.div
              key={card.id}
              className="flex-shrink-0"
              initial={{ opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ ...SPRING_SMOOTH, delay: i * 0.07 }}
            >
              {loading
                ? <PlaceholderCard eyebrow={card.eyebrow} title={card.title} />
                : <CardItem card={card as typeof cards[number]} />
              }
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
