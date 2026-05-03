import { motion } from 'framer-motion';
import { Zap, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@heroui/react';
import { PageShell, PAGE_GUTTER } from '../components/layout/PageShell';
import { useFadeUpWhenVisible } from '../lib/motionReveal';

/** Dimensions natives du fichier (export HD ~4K, même cadrage que le hero 21:9) */
const HERO_IMG = '/images/pessobot-hero.png';
const HERO_NATURAL_W = 4096;
const HERO_NATURAL_H = 1738;

const PessobotPage = () => {
  const fadeHero = useFadeUpWhenVisible();

  const openChatbot = () => {
    const fab = document.querySelector('.chatbot-fab') as HTMLElement;
    if (fab) fab.click();
  };

  const features = [
    {
      title: 'Expertise Sport',
      desc: "Besoin d'un boost avant votre séance ou d'une récupération optimale ? PessoBot vous conseille le meilleur mix selon votre workout.",
      icon: Zap,
    },
    {
      title: 'Bien-être & Beauté',
      desc: 'Collagène, antioxydants, vitamines... PessoBot connaît chaque ingrédient et ses bienfaits pour votre peau et votre vitalité.',
      icon: Heart,
    },
    {
      title: "Calculateur d'économies",
      desc: "Il vous explique en détail les avantages de l'abonnement Óra+ et calcule vos économies selon votre consommation mensuelle.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ─── Hero : image HD + léger flou discret ; texte aligné Bilan (sans boîtes) ─── */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-noir">
        <div
          className={cn(
            'relative isolate w-full',
            'sm:aspect-[21/9]',
            'max-sm:aspect-auto max-sm:min-h-[min(52svh,520px)]'
          )}
        >
          {/* Flou léger sur le visuel (scale pour éviter les bords clairs après blur) */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <img
              src={HERO_IMG}
              alt=""
              width={HERO_NATURAL_W}
              height={HERO_NATURAL_H}
              className="h-full w-full scale-[1.03] object-cover object-center blur-[0.5px] sm:blur-[1px] will-change-transform"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          {/* Lisibilité : dégradé gauche (texte) + léger voile bas — un peu plus doux car l’image est déjà adoucie */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: [
                'linear-gradient(90deg, color-mix(in oklch, var(--color-noir) 78%, transparent) 0%, color-mix(in oklch, var(--color-noir) 38%, transparent) 48%, transparent 76%)',
                'linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--color-noir) 42%, transparent) 100%)',
              ].join(', '),
            }}
          />

          <div
            className={cn(
              PAGE_GUTTER,
              'absolute inset-0 z-10 flex flex-col justify-center py-12 text-left text-white max-sm:py-14'
            )}
          >
            <motion.div {...fadeHero} className="w-full max-w-lg">
              <p className="mb-[14px] text-[9px] font-normal uppercase tracking-[0.42em] text-white/[0.38]">
                En ligne · 24/7
              </p>
              <h1
                className="font-display font-normal leading-[0.95] tracking-[-0.02em] text-white mb-5 [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(40px, 6.5vw, 64px)',
                }}
              >
                PessoBot
                <br />
                <em className="italic text-white/60">Assistant nutrition</em>
              </h1>
              <p className="mb-10 max-w-md text-[12px] font-light leading-[1.7] text-white/[0.42]">
                Conseils produits, horaires et Óra+ — ouvrez la bulle en bas à droite quand vous voulez.
              </p>

              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={openChatbot}
                  className={cn(
                    'inline-flex min-h-11 min-w-[44px] items-center gap-3 rounded-full border-0 bg-white px-7 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/90 md:px-8 md:py-3.5'
                  )}
                >
                  Ouvrir le chat <ArrowRight size={15} className="shrink-0 md:size-4" aria-hidden />
                </Button>
                <Link
                  to="/menu"
                  className="min-h-11 inline-flex items-center border-b border-white/25 pb-0.5 text-[10px] font-normal uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/50 hover:text-white"
                >
                  La carte
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Intro ─── */}
      <section className="border-b border-noir/[0.05]">
        <PageShell className="py-16 text-center">
          <h2
            className="font-display font-normal text-black leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 44px)' }}
          >
            Plus qu'un bot, un coach.
          </h2>
          <p className="text-[13px] font-light text-black/45 leading-relaxed max-w-2xl mx-auto">
            PessoBot a été conçu pour simplifier votre nutrition. Il connaît nos produits sur le bout des doigts et vous guide vers l'expérience la plus personnalisée possible.
          </p>
        </PageShell>
      </section>

      {/* ─── Features ─── */}
      <section className="border-b border-noir/[0.05]">
        <PageShell className="py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/[0.05]">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.35, ease: 'easeOut' }}
                className="px-0 md:px-10 py-10 md:py-0 first:pl-0 last:pr-0"
              >
                <div className="w-9 h-9 rounded-[2px] bg-noir/[0.05] flex items-center justify-center mb-5">
                  <feature.icon size={17} strokeWidth={1.3} className="text-black/55" />
                </div>
                <h3
                  className="font-display font-normal text-[20px] text-black mb-3"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-[12px] font-light leading-relaxed text-black/45">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="bg-noir">
        <PageShell className="py-20 text-center">
          <h2
            className="font-display font-normal text-white leading-tight mb-8"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)' }}
          >
            Une question ?<br />
            <em className="italic text-white/40">PessoBot répond 24/7.</em>
          </h2>
          <Button
            type="button"
            variant="ghost"
            onPress={openChatbot}
            className="inline-flex h-12 min-h-12 items-center gap-3 rounded-full bg-white text-[10px] font-normal uppercase tracking-[0.18em] text-black px-10 hover:bg-white/90 transition-colors duration-200"
          >
            Lancer la discussion <ArrowRight size={14} strokeWidth={1.3} />
          </Button>
        </PageShell>
      </section>

    </div>
  );
};

export default PessobotPage;
