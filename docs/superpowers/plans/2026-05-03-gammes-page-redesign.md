# Gammes Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `NosProduits.tsx` to remove products from the main page and adopt an editorial alternance layout matching the site's design language.

**Architecture:** Single page component rewrite. No new files needed. The component imports existing `PageHero`, `PageShell`, and animation hooks. Data comes from `productsData.ts` as before but only uses range metadata (title, description, heroImage, icon) — not the products array.

**Tech Stack:** React, Tailwind, Framer Motion, HeroUI (Button for section CTA), react-router-dom (Link, useNavigate)

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Rewrite | `src/pages/NosProduits.tsx` | Page component — hero + 3 editorial sections + footer CTA |
| Unchanged | `src/pages/RangeDetail.tsx` | Detail page with product grid (remains as-is) |
| Unchanged | `src/data/productsData.ts` | Data source (unchanged) |

---

### Task 1: Rewrite `NosProduits.tsx`

**Files:**
- Rewrite: `src/pages/NosProduits.tsx` (entire file)

- [ ] **Step 1: Replace the page with the new editorial layout**

Replace the entire content of `src/pages/NosProduits.tsx` with this component:

```tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { PageShell } from '../components/layout/PageShell';
import { PageHero } from '../components/layout/PageHero';
import { rangesData } from '../data/productsData';

const ranges = Object.values(rangesData);

const BADGE_LABELS: Record<string, string> = {
  wellness: 'COMPLÉMENTS NUTRITION',
  sport: 'SPORT & PERFORMANCE',
  skin: 'SOINS VISAGE',
};

const COLLECTION_NUMS: Record<string, string> = {
  wellness: '01',
  sport: '02',
  skin: '03',
};

const NosProduits = () => {
  const fadeUp = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Catalogue"
        title="Les gammes PessÓra"
        subtitle="Nutrition, sport et soins — chaque gamme a été composée avec une exigence précise. Découvrez celle qui vous correspond."
      />

      <motion.div
        variants={container}
        initial={isReducedMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.12, margin: '0px 0px -60px 0px' }}
      >
        {ranges.map((range) => (
          <motion.section
            key={range.id}
            variants={item}
            className="border-b border-black/[0.06] py-16 md:py-24"
          >
            <PageShell>
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-20">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 md:col-span-7">
                  <img
                    src={range.heroImage}
                    alt={`Visuel de la gamme ${range.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <span className="absolute bottom-5 left-5 text-[10px] font-light uppercase tracking-[0.22em] text-white/75">
                    {BADGE_LABELS[range.id] ?? ''}
                  </span>
                </div>

                {/* Texte */}
                <div className="md:col-span-5">
                  <p className="text-editorial-tagline mb-3">
                    Collection {COLLECTION_NUMS[range.id] ?? ''}
                  </p>
                  <h2
                    className="mb-2 font-display font-normal tracking-[-0.02em] text-black"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(26px, 3vw, 34px)',
                    }}
                  >
                    {range.title}
                  </h2>
                  <p className="mb-4 font-display text-[13px] font-light italic leading-snug text-black/55">
                    « {range.subtitle} »
                  </p>
                  <p className="mb-8 text-[13px] font-light leading-relaxed text-black/50">
                    {range.description}
                  </p>
                  <Link
                    to={`/nos-produits/${range.id}`}
                    className="inline-flex items-center gap-2 border-b border-black/20 pb-0.5 text-[10px] font-normal uppercase tracking-[0.12em] text-black transition-colors hover:border-black/50"
                  >
                    Découvrir la collection
                    <ArrowRight size={14} strokeWidth={1.25} aria-hidden />
                  </Link>
                </div>
              </div>
            </PageShell>
          </motion.section>
        ))}
      </motion.div>

      {/* Section finale — En boutique */}
      <section className="border-t border-noir/[0.05] bg-surface-muted py-16 text-center">
        <PageShell>
          <motion.div className="mx-auto max-w-xl" {...fadeUp}>
            <p className="text-editorial-tagline mb-2">En boutique</p>
            <p className="text-[14px] font-light leading-relaxed text-black/55">
              Disponibilité et conseils personnalisés sur place. La carte des boissons du bar reste sur{' '}
              <Link to="/menu" className="text-editorial-link-underline inline-block">
                le menu
              </Link>
              .
            </p>
          </motion.div>
        </PageShell>
      </section>
    </div>
  );
};

export default NosProduits;
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build` from project root
Expected: exit code 0, no TypeScript errors

- [ ] **Step 3: Verify the page renders in dev**

The dev server should be running on `localhost:5173`. Navigate to `/nos-produits` in the browser and visually confirm:
1. Hero with title "Les gammes PessÓra"
2. 3 sections with image and text stacked vertically on mobile, side-by-side on desktop
3. No products listed on the page
4. Each section has a "Découvrir la collection" link that navigates to the correct detail page
5. Footer "En boutique" section renders correctly
6. Mobile: stack vertical, image full width, text below (responsive test)
