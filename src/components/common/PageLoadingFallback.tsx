import { Spinner } from '@heroui/react';

/**
 * Fallback Suspense — style sobre type Apple (spinner HeroUI + barre pulse décorative).
 * Utilise <Spinner> base @heroui/react : respect de prefers-reduced-motion
 * et teinte via var(--color-primary) préservée par color="current".
 */
export default function PageLoadingFallback() {
  return (
    <div
      className="flex min-h-[50vh] flex-grow flex-col items-center justify-center gap-6 bg-white px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Chargement de la page</span>
      <div className="flex flex-col items-center gap-4">
        <Spinner
          size="lg"
          color="current"
          className="text-primary/50"
          aria-hidden="true"
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/40">
          Chargement
        </p>
      </div>
      <div
        className="h-px w-32 max-w-full rounded-full bg-primary/10 motion-safe:animate-pulse motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  );
}
