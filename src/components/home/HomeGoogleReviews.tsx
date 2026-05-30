import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
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
    <section className="bg-white section-vertical-padding">
      <div className="section-wrapper">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionTitle title="Avis clients" />
          <div className="flex items-end gap-3">
            <span className="text-[22px] font-light leading-none tracking-[-0.02em] text-black md:text-[26px]">
              {roundedRating}
            </span>
            <span className="pb-[2px] text-[9px] font-light tracking-[0.12em] text-black/40">
              {googleReviewsData.reviewCountLabel}
            </span>
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
              className="snap-start shrink-0 w-[min(80vw,400px)] rounded-[2px] border border-noir/[0.06] bg-surface-card py-5 pl-5 pr-5 shadow-editorial-sm md:w-[min(40vw,440px)] md:py-6 md:pl-6 md:pr-6"
            >
              <Card.Content className="p-0">
                <p className="mb-4 text-[15px] font-light leading-[1.38] text-black/82 md:text-[17px]">
                  "{review.quote}"
                </p>
                <p className="text-[8px] font-normal uppercase tracking-[0.18em] text-black/56">{review.author}</p>
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
                  idx === activeIdx ? 'w-7 bg-[#1E3529]/70' : 'w-3 bg-noir/16 hover:bg-noir/30'
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
