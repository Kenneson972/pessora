import { useEffect, useRef } from 'react';

/**
 * Autoplay fiable mobile (iOS Safari) : muted + playsInline + retry sur canplay /
 * visibility / intersection. MP4 requis côté Safari (pas de WebM).
 */
export function useVideoAutoplay(enabled = true) {
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) tryPlay();
        else el.pause();
      },
      { threshold: 0.08 },
    );
    observer.observe(el);

    return () => {
      el.removeEventListener('canplay', tryPlay);
      el.removeEventListener('loadeddata', tryPlay);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
    };
  }, [enabled]);

  return ref;
}
