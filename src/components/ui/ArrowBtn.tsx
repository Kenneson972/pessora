import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';

interface ArrowBtnProps {
  onDark?: boolean;
  /** Fond transparent, flèche claire (ex. hero vidéo) */
  ghost?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
  ariaLabel?: string;
}

// sm = 44px pour respecter la taille cible tactile minimale (WCAG 2.5.5)
const sizes = { sm: 'w-11 h-11', md: 'w-11 h-11', lg: 'w-14 h-14' };
const iconSizes = { sm: 13, md: 15, lg: 18 };

export const ArrowBtn = ({
  onDark = false,
  ghost = false,
  size = 'md',
  onPress,
  className = '',
  ariaLabel,
}: ArrowBtnProps) => (
  <Button
    isIconOnly
    onPress={onPress}
    className={`${sizes[size]} min-w-0 rounded-full transition-colors duration-200 ${
      ghost && onDark
        ? '!border-0 !bg-transparent !shadow-none text-white hover:!bg-white/[0.08] active:!bg-white/[0.12]'
        : onDark
          ? 'bg-white/92 text-noir hover:bg-white'
          : 'bg-noir text-white hover:bg-anthracite'
    } ${className}`}
    aria-label={ariaLabel ?? 'Voir plus'}
  >
    <ArrowRight size={iconSizes[size]} strokeWidth={1.3} className={ghost && onDark ? 'text-white' : undefined} />
  </Button>
);
