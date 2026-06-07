import { useCallback, useLayoutEffect, useRef } from 'react';

type UseVideoAutoplayOptions = {
  /** Met en pause hors viewport — désactivé par défaut (évite écran vide sur hero mobile). */
  pauseWhenOffscreen?: boolean;
};

const MAX_RETRIES = 30;

function primeForIosAutoplay(el: HTMLVideoElement) {
  el.muted = true;
  el.defaultMuted = true;
  el.volume = 0;
  el.playsInline = true;
  el.setAttribute('muted', '');
  el.setAttribute('autoplay', '');
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
}

function attemptPlay(el: HTMLVideoElement, retries = 0) {
  if (retries > MAX_RETRIES) return;

  primeForIosAutoplay(el);

  void el
    .play()
    .then(() => {
      el.removeAttribute('poster');
      el.dataset.autoplayOk = '1';
    })
    .catch(() => {
      window.setTimeout(() => attemptPlay(el, retries + 1), 100);
    });
}

/**
 * Autoplay fiable mobile (iOS Safari) : src direct sur <video>, muted + playsInline,
 * retry agressif + déblocage au premier scroll/touch si politique stricte (Low Power Mode).
 */
export function useVideoAutoplay(enabled = true, options: UseVideoAutoplayOptions = {}) {
  const { pauseWhenOffscreen = false } = options;
  const elRef = useRef<HTMLVideoElement | null>(null);

  const bindVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      elRef.current = el;
      if (!el || !enabled) return;

      primeForIosAutoplay(el);
      attemptPlay(el);

      const onReady = () => attemptPlay(el);
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'] as const;
      for (const evt of events) el.addEventListener(evt, onReady);

      const onVisibility = () => {
        if (document.visibilityState === 'visible') attemptPlay(el);
        else if (pauseWhenOffscreen) el.pause();
      };
      document.addEventListener('visibilitychange', onVisibility);

      /** iOS Low Power Mode : autoplay bloqué jusqu'à première interaction — scroll suffit */
      const unlock = () => attemptPlay(el);
      window.addEventListener('touchstart', unlock, { passive: true, capture: true, once: true });
      window.addEventListener('scroll', unlock, { passive: true, capture: true, once: true });

      let observer: IntersectionObserver | undefined;
      if (pauseWhenOffscreen) {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting) attemptPlay(el);
            else el.pause();
          },
          { threshold: 0.05 },
        );
        observer.observe(el);
      }

      return () => {
        for (const evt of events) el.removeEventListener(evt, onReady);
        document.removeEventListener('visibilitychange', onVisibility);
        observer?.disconnect();
      };
    },
    [enabled, pauseWhenOffscreen],
  );

  useLayoutEffect(() => {
    if (enabled && elRef.current) attemptPlay(elRef.current);
  }, [enabled]);

  return bindVideo;
}
