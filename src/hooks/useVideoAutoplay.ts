import { useEffect, useRef } from 'react';

type UseVideoAutoplayOptions = {
  /** Met en pause hors viewport — désactivé par défaut (évite écran vide sur hero mobile). */
  pauseWhenOffscreen?: boolean;
};

/**
 * Autoplay fiable mobile (iOS Safari) : muted + playsInline + retry sur canplay /
 * visibility. MP4 requis côté Safari (pas de WebM).
 */
export function useVideoAutoplay(enabled = true, options: UseVideoAutoplayOptions = {}) {
  const { pauseWhenOffscreen = false } = options;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const tryPlay = () => {
      if (document.visibilityState !== 'visible') return;
      void el.play().catch(() => {});
    };

    tryPlay();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tryPlay();
      else el.pause();
    };

    el.addEventListener('canplay', tryPlay);
    el.addEventListener('loadeddata', tryPlay);
    document.addEventListener('visibilitychange', onVisibility);

    let observer: IntersectionObserver | undefined;
    if (pauseWhenOffscreen) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) tryPlay();
          else el.pause();
        },
        { threshold: 0.05 },
      );
      observer.observe(el);
    }

    return () => {
      el.removeEventListener('canplay', tryPlay);
      el.removeEventListener('loadeddata', tryPlay);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [enabled, pauseWhenOffscreen]);

  return ref;
}
