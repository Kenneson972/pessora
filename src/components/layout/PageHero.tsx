import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from './PageShell';

interface HeroCTA {
  label: string;
  href: string;
}

interface HeroImage {
  src: string;
  alt: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  ctaPrimary?: HeroCTA;
  ctaSecondary?: HeroCTA;
  image?: HeroImage;
}

export const PageHero = ({
  eyebrow,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  image,
}: PageHeroProps) => {
  const navigate = useNavigate();

  const hasImage = !!image?.src;
  const hasCtas = !!ctaPrimary || !!ctaSecondary;

  return (
    <section
      className={`relative overflow-hidden border-b border-black/[0.06] ${
        hasImage ? 'bg-noir text-white' : 'bg-white'
      }`}
    >
      {/* Image de fond si présente */}
      {hasImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${image!.src})` }}
            role="img"
            aria-label={image!.alt}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/80 to-noir/60" />
        </>
      )}

      <PageShell className={`relative z-10 ${hasImage ? 'py-20 md:py-28' : 'pb-9 pt-10 md:pb-11 md:pt-14'}`}>
        {eyebrow && (
          <p
            className={`mb-4 text-[9px] font-normal uppercase tracking-[0.22em] ${
              hasImage ? 'text-white/50' : 'text-black/35'
            }`}
          >
            {eyebrow}
          </p>
        )}

        <div className={`${hasCtas || hasImage ? 'grid gap-10 lg:grid-cols-2 lg:gap-16' : ''}`}>
          <div>
            <h1
              className={`font-display font-normal tracking-[-0.01em] ${
                hasImage ? 'text-white' : 'text-black'
              }`}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: hasImage ? 'clamp(36px, 5vw, 64px)' : 'clamp(28px, 3.5vw, 44px)',
                lineHeight: hasImage ? 1.05 : undefined,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`mt-4 max-w-xl text-[13px] font-light leading-relaxed ${
                  hasImage ? 'text-white/60' : 'text-black/45'
                }`}
              >
                {subtitle}
              </p>
            )}

            {/* CTAs dans le hero */}
            {hasCtas && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {ctaPrimary && (
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => navigate(ctaPrimary.href)}
                    className="group inline-flex items-center gap-2 rounded-[2px] bg-white px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-noir transition-colors hover:bg-white/90"
                  >
                    {ctaPrimary.label}
                    <ArrowRight size={13} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Button>
                )}
                {ctaSecondary && (
                  <Button
                    variant="ghost"
                    size="md"
                    onPress={() => navigate(ctaSecondary.href)}
                    className="inline-flex items-center gap-2 rounded-[2px] border border-white/25 px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-white/80 transition-colors hover:border-white/50 hover:text-white"
                  >
                    {ctaSecondary.label}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Placeholder image pour le hero (colonne de droite) */}
          {hasImage && (
            <div className="hidden aspect-[4/3] overflow-hidden rounded-[2px] lg:block">
              <img
                src={image!.src}
                alt={image!.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </PageShell>
    </section>
  );
};
