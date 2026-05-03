import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { SectionTitle } from '../ui/SectionTitle';
import { googleReviewsData } from '../../data/googleReviews';

const AUTO_SCROLL_MS = 4200;

export function HomeGoogleReviews() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const roundedRating = useMemo(
    () =>
      googleReviewsData.rating.toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  );

  useEffect(() => {
    const reviews = googleReviewsData.highlights;
    if (reviews.length <= 1 || paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % reviews.length);
    }, AUTO_SCROLL_MS);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = scroller.querySelectorAll<HTMLElement>('[data-review-card]');
    const target = cards[activeIdx];
    if (!target) return;
    scroller.scrollTo({ left: target.offsetLeft - 6, behavior: 'smooth' });
  }, [activeIdx]);

  return (
    <section className="bg-white px-4 py-20 md:px-10 md:py-[var(--space-section-y-md)] lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex flex-col gap-4 border-b border-noir/[0.06] pb-7 md:flex-row md:items-end md:justify-between md:pb-8">
          <SectionTitle title="Avis clients" />
          <div className="flex items-end gap-6">
            <p className="text-[26px] font-light tracking-[-0.02em] text-black md:text-[32px]">
              {roundedRating}
              <span className="ml-1 text-[16px] text-black/42">/5</span>
            </p>
            <div className="mb-1 flex items-center gap-1.5 text-gold-dim">
              {[...Array(5)].map((_, idx) => (
                <Star key={idx} size={15} className="fill-current" strokeWidth={1} aria-hidden />
              ))}
              <span className="ml-2 text-[8px] uppercase tracking-[0.18em] text-black/40">
                {googleReviewsData.reviewCountLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {googleReviewsData.highlights.map((review, idx) => (
            <Card
              key={`${review.author}-${idx}`}
              data-review-card
              className="snap-start shrink-0 w-[min(88vw,560px)] rounded-[2px] border border-noir/[0.06] bg-surface-card py-6 pl-5 pr-5 shadow-editorial-sm md:w-[min(56vw,640px)] md:py-7 md:pl-7 md:pr-7 lg:w-[min(44vw,640px)]"
            >
              <Card.Content className="p-0">
                <p className="mb-5 line-clamp-6 text-[18px] font-light leading-[1.42] text-black/86 md:text-[21px]">
                  “{review.quote}”
                </p>
                <div className="flex items-center gap-4">
                <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/56">{review.author}</p>
                <span className="h-px w-6 bg-noir/[0.14]" aria-hidden />
                <p className="text-[8px] font-light uppercase tracking-[0.12em] text-black/35">{review.ageLabel}</p>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {googleReviewsData.highlights.map((_, idx) => (
              <Button
                key={`dot-${idx}`}
                type="button"
                isIconOnly
                variant="ghost"
                aria-label={`Aller à l'avis ${idx + 1}`}
                aria-pressed={idx === activeIdx}
                onClick={() => setActiveIdx(idx)}
                className={`!h-1.5 !min-h-1.5 !min-w-3 rounded-full px-0 transition-all ${
                  idx === activeIdx ? 'w-7 bg-noir/55' : 'w-3 bg-noir/16 hover:bg-noir/30'
                }`}
              />
            ))}
          </div>
          <a
            href={googleReviewsData.placeReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border-b border-noir/30 pb-px text-[9px] font-light uppercase tracking-[0.28em] text-black/60 transition-colors duration-200 hover:border-noir hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 rounded-[1px]"
          >
            Voir tous les avis Google
          </a>
        </div>
      </div>
    </section>
  );
}
