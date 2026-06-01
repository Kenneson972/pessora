import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { PageShell } from '../components/layout/PageShell';
import {
  oraPlusHero,
  oraPlusFinalCta,
  oraPlusPrivilegeCards,
} from '../data/oraPlusData';

const OraPlus = () => {
  useEffect(() => { document.title = 'Óra+ — PessÓra'; }, []);
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const isOraPlusActive = subscription?.plan === 'ora_plus' && subscription?.status === 'active';
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (isOraPlusActive) {
      navigate('/mon-espace/abonnement');
      return;
    }
    if (!user) {
      navigate('/inscription?plan=ora_plus');
      return;
    }
    setSubLoading(true);
    setSubError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-session', {
        body: { email: user?.email },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error ?? 'URL manquante');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Impossible de démarrer le paiement');
      setSubLoading(false);
    }
  };

  const fadeBlock = useFadeUpWhenVisible();
  const { container, isReducedMotion } = useStaggerReveal();

  useEffect(() => { document.title = 'Óra+ · PessÓra'; }, []);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* ───────────────────────────── 1 · HERO ───────────────────────────── */}
      <section className="border-b border-noir/[0.06] bg-white">
        <PageShell className="pb-9 pt-10 md:pb-11 md:pt-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-[9px] font-normal uppercase tracking-[0.22em] text-noir/35">
                {oraPlusHero.eyebrow}
              </p>
              <h1
                className="font-display font-normal text-noir"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
              >
                {oraPlusHero.titleHead}
                <em className="font-light italic text-noir/55">{oraPlusHero.titleEmphasis}</em>
              </h1>
              <p className="mt-3 max-w-xl text-[13px] font-light leading-relaxed text-noir/45">
                {oraPlusHero.sub}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {isOraPlusActive ? (
                  <Button
                    variant="ghost"
                    size="md"
                    onPress={() => navigate('/mon-espace/abonnement')}
                    className="inline-flex items-center gap-2 rounded-[2px] bg-noir px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:bg-anthracite"
                  >
                    Accéder à mon abonnement <ArrowRight size={14} strokeWidth={1.5} />
                  </Button>
                ) : (
                <Button
                  variant="ghost"
                  size="md"
                  onPress={() => navigate(oraPlusHero.ctaSecondary.href)}
                  className="inline-flex items-center gap-2 rounded-[2px] border border-noir/15 px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-noir/70 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  {oraPlusHero.ctaSecondary.label}
                </Button>
                )}
              </div>
            </div>
            <div className="block aspect-[16/9] overflow-hidden rounded-[2px] md:aspect-[4/3] lg:block lg:aspect-auto">
              <img
                src={oraPlusHero.image.src}
                alt={oraPlusHero.image.alt}
                className="h-full w-full object-cover bg-surface-product-well"
                loading="eager"
              />
            </div>
          </div>
        </PageShell>
      </section>


      {/* ───────────────────────────── 3 · PRIVILÈGES (CARDS VISUELLES) ───────────────────────────── */}
      <section className="border-b border-noir/[0.06] bg-white py-20 md:py-28">
        <PageShell>
          <motion.header {...fadeBlock} className="mb-14 grid items-end gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="mb-4 block text-[10px] font-normal uppercase tracking-[0.28em] text-noir/60">
                Les privilèges
              </span>
              <h2
                className="m-0 font-display font-normal text-noir"
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                En tant que{' '}
                <em className="font-light italic text-editorial-badge">membre Óra+,</em>
                <br />
                vous recevez…
              </h2>
            </div>
            <p
              className="m-0 max-w-[460px] sm:max-w-none font-display font-light italic text-noir/65"
              style={{ fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.55 }}
            >
              −50 % sur les boissons, bilan offert, événements prioritaires — sans engagement.
            </p>
          </motion.header>

          <motion.div
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
          >
            {oraPlusPrivilegeCards.map((card) => (
              <div
                key={card.num}
                className="group relative overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white transition-shadow hover:shadow-editorial-sm"
              >
                <div className="grid md:grid-cols-[1fr_1fr]">
                  {/* Image side */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-product-well md:aspect-auto">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{ backgroundImage: `url(${card.image.src})` }}
                      role="img"
                      aria-label={card.image.alt}
                    />
                  </div>

                  {/* Content side */}
                  <div className="flex flex-col justify-between p-6 md:p-7">
                    <div>
                      <span className="mb-3 inline-block rounded-[2px] border border-noir/15 bg-surface-muted px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-noir/70">
                        {card.accent}
                      </span>
                      <h3
                        className="m-0 mb-3 font-display font-normal text-noir"
                        style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}
                      >
                        {card.titleHead}
                        <em className="font-light italic text-editorial-badge">{card.titleEmphasis}</em>
                        {card.titleTail}
                      </h3>
                      <p className="text-[12.5px] leading-[1.6] text-noir/60">
                        {card.body}
                      </p>
                    </div>

                    <div className="mt-6 flex items-baseline gap-2 border-t border-noir/[0.06] pt-4">
                      <span className="font-display text-[26px] font-normal leading-none text-noir">
                        {card.metric.value}
                        {card.metric.unit ? (
                          <em className="font-light italic text-editorial-badge">{card.metric.unit}</em>
                        ) : null}
                      </span>
                      <span className="text-[9px] font-normal uppercase tracking-[0.2em] text-noir/55">
                        {card.metric.sublabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── CTA Privilèges ── */}
          <motion.div {...fadeBlock} className="mt-12 text-center">
            <Button
              variant="primary"
              size="md"
              onPress={() => void handleSubscribe()}
              isDisabled={subLoading}
              className="group inline-flex items-center gap-3 rounded-[2px] bg-noir px-8 py-4 text-[10px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:bg-anthracite"
            >
              {isOraPlusActive ? 'Accéder à mon abonnement' : 'Rejoindre Óra+'}
              <ArrowRight size={13} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Button>
            {subError && (
              <p className="mt-3 text-[11px] text-red-500">{subError}</p>
            )}
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────────────────────── STICKY CTA MOBILE ───────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-noir/[0.08] bg-white/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <PageShell className="py-3">
          <Button
            variant="ghost"
            size="md"
            onPress={() => void handleSubscribe()}
            isDisabled={subLoading}
            className="flex w-full items-center justify-center gap-3 rounded-[2px] border border-noir/20 bg-noir px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:bg-anthracite"
          >
            {isOraPlusActive ? 'Mon abonnement' : oraPlusFinalCta.cta.label}
            <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
          </Button>
        </PageShell>
      </div>
    </div>
  );
};

export default OraPlus;
