import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Card, cn } from '@heroui/react';

interface ImageCardProps {
  eyebrow: string;
  title: string;
  titleEm?: string;
  bgClass?: string;
  bgImage?: string;
  /** Fond vidéo (ex. univers Communauté) — MP4 SDR, muet, boucle */
  bgVideoSrc?: string;
  /** Optionnel : WebM (Chrome/Firefox) ; Safari utilise le MP4. */
  bgVideoSrcWebm?: string;
  bgVideoPosterSrc?: string;
  aspectRatio?: string;
  /** 'dark' = fond sombre type campagne. 'light' = fond papier (défaut). */
  variant?: 'light' | 'dark';
  onPress?: () => void;
}

export const ImageCard = ({
  eyebrow,
  title,
  titleEm,
  bgClass,
  bgImage,
  bgVideoSrc,
  bgVideoSrcWebm,
  bgVideoPosterSrc,
  aspectRatio = 'aspect-[3/4]',
  variant = 'light',
  onPress,
}: ImageCardProps) => {
  const isDark = variant === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    setVideoPlaying(false);
  }, [bgVideoSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !bgVideoSrc || prefersReducedMotion) return;
    void el.play().catch(() => {});
  }, [bgVideoSrc, prefersReducedMotion]);

  const mediaBg =
    bgClass ??
    (isDark
      ? 'bg-gradient-to-b from-anthracite to-noir'
      : 'bg-surface-product-well');

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={[title, titleEm].filter(Boolean).join(' ')}
      className={cn(
        'relative overflow-hidden cursor-pointer group',
        isDark
          ? 'motion-safe:group-hover:ring-1 motion-safe:group-hover:ring-inset motion-safe:group-hover:ring-white/12'
          : 'motion-safe:group-hover:ring-1 motion-safe:group-hover:ring-inset motion-safe:group-hover:ring-[#1E3529]/10',
        aspectRatio,
        isDark
          ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset'
          : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3529]/20 focus-visible:ring-inset',
      )}
      onClick={onPress}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPress?.(); }}
    >
      {bgVideoSrc && prefersReducedMotion ? (
        bgVideoPosterSrc ? (
          <img
            src={bgVideoPosterSrc}
            alt={`Aperçu — ${eyebrow}`}
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]',
              mediaBg,
            )}
          />
        )
      ) : bgVideoSrc ? (
        <div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          {bgVideoPosterSrc ? (
            <img
              src={bgVideoPosterSrc}
              alt={`Aperçu — ${eyebrow}`}
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : null}
          <video
            ref={videoRef}
            className={cn(
              'pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-500 ease-out',
              videoPlaying ? 'opacity-100' : 'opacity-0',
            )}
            poster={undefined}
            muted
            loop
            playsInline
            preload="auto"
            autoPlay={!prefersReducedMotion}
            aria-hidden
            onPlaying={() => setVideoPlaying(true)}
          >
            {bgVideoSrcWebm ? <source src={bgVideoSrcWebm} type="video/webm" /> : null}
            <source src={bgVideoSrc} type="video/mp4" />
          </video>
        </div>
      ) : (
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]',
            mediaBg,
          )}
          style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
        />
      )}
      {/* Pas de calque noir sur la vidéo (lisibilité = ombres sur le texte uniquement) */}
      <div
        className={cn(
          'absolute inset-0 z-[2] pointer-events-none',
          isDark && !bgVideoSrc
            ? 'bg-gradient-to-t from-noir/72 via-noir/12 to-transparent'
            : !isDark
              ? 'bg-gradient-to-t from-noir/48 via-noir/[0.06] to-transparent'
              : null,
        )}
      />

      <Card.Content
        className={cn(
          'absolute inset-0 z-[3] flex flex-col justify-between p-0 px-7 pb-8 pt-6',
          isDark &&
            bgVideoSrc &&
            '[&_h3]:[text-shadow:0_2px_28px_rgba(0,0,0,0.88),0_1px_6px_rgba(0,0,0,0.95)] [&_span]:[text-shadow:0_1px_16px_rgba(0,0,0,0.8)]',
        )}
      >
        <p
          className={cn(
            isDark ? 'text-[8px] font-light uppercase tracking-[0.45em] text-white/45' : 'text-editorial-tagline',
            isDark && bgVideoSrc && 'text-white/72 [text-shadow:0_1px_18px_rgba(0,0,0,0.85)]',
          )}
        >
          {eyebrow}
        </p>
        <div>
          <h3
            className={cn(
              'mb-2.5 font-normal uppercase leading-none tracking-[0.06em]',
              isDark ? 'text-white' : 'text-white',
            )}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.6vw, 34px)' }}
          >
            {title}{titleEm ? <> {titleEm}</> : null}
          </h3>
          <span
            className={cn(
              'text-[9px] font-light uppercase tracking-[0.28em] transition-opacity duration-200',
              isDark ? 'text-white/55 group-hover:text-white/88' : 'text-white/68 group-hover:text-white',
            )}
          >
            Découvrir
          </span>
        </div>
      </Card.Content>
    </Card>
  );
};
