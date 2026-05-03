import { cn } from '@heroui/react';

/** Logo monogramme Pessóra (PNG carré, fond transparent) */
const LOGO_SRC = '/logo-pessora.png';

export type BrandLogoProps = {
  className?: string;
  /** Fond clair (logo noir) ou sombre (logo blanc via filtre sur le PNG noir) */
  variant?: 'onLight' | 'onDark';
  /** Hauteur en px, largeur automatique */
  height?: number;
};

export function BrandLogo({ className, variant = 'onLight', height = 36 }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Pessóra"
      className={cn(
        'w-auto max-w-[min(100vw-2rem,320px)] shrink-0 select-none object-contain object-left',
        variant === 'onDark' && 'brightness-0 invert',
        className
      )}
      style={{ height, width: 'auto' }}
      decoding="async"
    />
  );
}
