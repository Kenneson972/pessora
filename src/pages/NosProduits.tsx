import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, cn } from '@heroui/react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { PageShell } from '../components/layout/PageShell';
import { PageHero } from '../components/layout/PageHero';
import { rangesData } from '../data/productsData';

const ranges = Object.values(rangesData);

const COLLECTION_META: Record<string, { num: string; label: string }> = {
  wellness: { num: '01', label: 'Compléments nutrition' },
  sport: { num: '02', label: 'Sport & performance' },
  skin: { num: '03', label: 'Soins visage' },
};

const NosProduits = () => {
  const navigate = useNavigate();
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
        {ranges.map((range, i) => {
          const meta = COLLECTION_META[range.id] ?? { num: '', label: '' };
          const reverse = i % 2 === 1;
          const count = range.products.length;

          return (
            <motion.section
              key={range.id}
              id={`collection-${range.id}`}
              variants={item}
              className="border-b border-black/[0.06]"
            >
              <PageShell>
                <div
                  className={cn(
                    'flex flex-col gap-8 pb-16 pt-12 md:pb-24 md:pt-16',
                    'md:flex-row md:items-center md:gap-14 lg:gap-24',
                    reverse && 'md:flex-row-reverse',
                  )}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-noir/[0.04] transition-shadow duration-500 md:w-[55%]">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <img
                      src={range.heroImage}
                      alt={`Visuel de la gamme ${range.title}`}
                      width={800}
                      height={600}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 55vw"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding={i === 0 ? 'sync' : 'async'}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-noir/70 via-noir/20 to-transparent" />

                    {/* Badge thématique */}
                    <span className="absolute bottom-6 left-6 rounded-[1px] border border-white/20 px-3 py-1 text-[10px] font-light uppercase tracking-[0.24em] text-white/85">
                      {meta.label}
                    </span>

                    {/* Compteur de produits */}
                    <span className="absolute right-5 top-5 text-[10px] font-light uppercase tracking-[0.22em] text-white/70">
                      {count} produits
                    </span>
                  </div>

                  {/* Texte */}
                  <div className="w-full md:w-[45%]">
                    <p className="mb-3 font-display text-[11px] font-normal uppercase tracking-[0.26em] text-black/40">
                      {meta.label}
                    </p>
                    <h2
                      className="mb-4 font-display font-normal leading-[1.02] tracking-[-0.02em] text-black"
                      style={{ fontSize: 'clamp(32px, 3.8vw, 46px)' }}
                    >
                      {range.title}
                    </h2>
                    <p className="mx-auto mb-3 max-w-[40ch] font-display text-[15px] font-light italic leading-snug text-black/60 md:mx-0">
                      « {range.subtitle} »
                    </p>
                    <p className="mx-auto mb-10 max-w-[42ch] text-[13px] font-light leading-relaxed text-black/50 md:mx-0">
                      {range.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => navigate(`/nos-produits/${range.id}`)}
                      className={cn(
                        'inline-flex h-10 min-h-10 items-center gap-2.5 rounded-full border border-noir/15 px-5',
                        'text-[10px] font-normal uppercase tracking-[0.14em] text-black',
                        'transition-[transform,border-color,background-color] duration-300',
                        'hover:-translate-y-0.5 hover:border-noir/30 hover:bg-noir/[0.02] shadow-sm',
                        'active:translate-y-0',
                      )}
                    >
                      Découvrir la collection
                      <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                    </Button>
                  </div>
                </div>
              </PageShell>
            </motion.section>
          );
        })}
      </motion.div>

      {/* Section finale — En boutique */}
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
              className={cn(
                'inline-flex h-10 min-h-10 items-center gap-2.5 rounded-full border border-noir/15 px-5',
                'text-[10px] font-normal uppercase tracking-[0.14em] text-black',
                'transition-[transform,border-color,background-color] duration-300',
                'hover:-translate-y-0.5 hover:border-noir/30 hover:bg-noir/[0.02] shadow-sm',
                'active:translate-y-0',
              )}
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
