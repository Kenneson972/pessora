import { useState, useEffect, ReactNode } from 'react';
import { Suspense } from 'react';

interface LazyWidgetProps {
  children: ReactNode;
  /** Délai en ms avant de rendre (attend aussi idle si onIdle) */
  delay?: number;
  /** Charger après requestIdleCallback pour ne pas bloquer le thread principal */
  onIdle?: boolean;
}

/**
 * Widget lazy : ne rend les enfants qu'après delay + idle (si onIdle).
 * Utilisé pour Chatbot, scripts tiers, etc. — améliore FCP et TBT.
 */
export default function LazyWidget({ children, delay = 1500, onIdle = true }: LazyWidgetProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const show = () => setShouldRender(true);

    if (onIdle && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(show, { timeout: delay });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(show, delay);
    return () => clearTimeout(t);
  }, [delay, onIdle]);

  if (!shouldRender) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
