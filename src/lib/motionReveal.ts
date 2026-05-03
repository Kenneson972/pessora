import { useMemo } from 'react';
import type { Transition, Variants } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

/** Courbe type editorial / luxe — entrées courtes, lisible */
export const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

export function useStaggerReveal(): {
  isReducedMotion: boolean;
  container: Variants;
  item: Variants;
} {
  const rm = useReducedMotion();
  const isReducedMotion = rm === true;
  return useMemo(() => {
    if (isReducedMotion) {
      return {
        isReducedMotion: true,
        container: { hidden: {}, visible: {} },
        item: { hidden: {}, visible: {} },
      };
    }
    return {
      isReducedMotion: false,
      container: {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.09, delayChildren: 0.05 },
        },
      },
      item: {
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: EDITORIAL_EASE },
        },
      },
    };
  }, [isReducedMotion]);
}

const VIEWPORT_DEFAULT = { once: true, amount: 0.22 as const, margin: '0px 0px -40px 0px' as const };

export function useFadeUpWhenVisible(): {
  initial: false | { opacity: number; y: number };
  whileInView: { opacity: number; y: number };
  viewport: typeof VIEWPORT_DEFAULT;
  transition: Transition;
} {
  const rm = useReducedMotion();
  if (rm) {
    return {
      initial: false,
      whileInView: { opacity: 1, y: 0 },
      viewport: VIEWPORT_DEFAULT,
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: VIEWPORT_DEFAULT,
    transition: { duration: 0.34, ease: EDITORIAL_EASE },
  };
}
