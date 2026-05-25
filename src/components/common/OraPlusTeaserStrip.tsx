import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@heroui/react';
import { oraPlusPricing } from '../../data/oraPlusData';
import { useAuth } from '../../contexts/AuthContext';

type Variant = 'default' | 'muted' | 'onDark';

const shell: Record<Variant, string> = {
  default:
    'border border-noir/[0.08] bg-surface-muted',
  muted:
    'border border-noir/[0.06] bg-white',
  onDark:
    'border border-white/[0.12] bg-white/[0.06]',
};

const text: Record<Variant, string> = {
  default: 'text-black/75',
  muted: 'text-black/70',
  onDark: 'text-white/85',
};

const sub: Record<Variant, string> = {
  default: 'text-black/45',
  muted: 'text-black/40',
  onDark: 'text-white/55',
};

/**
 * Bandeau conversion Óra+ — sans lien imbriqué (usage dans des cartes déjà cliquables).
 * Se masque automatiquement si l'utilisateur connecté est déjà abonné Óra+ actif.
 */
export function OraPlusTeaserStrip({
  variant = 'default',
  className,
  heading = 'Óra+',
}: {
  variant?: Variant;
  className?: string;
  heading?: string;
}) {
  const { subscription } = useAuth();
  const isOraPlusActive = subscription?.plan === 'ora_plus' && subscription?.status === 'active';

  if (isOraPlusActive) return null;
  
  return (
    <aside
      className={cn(
        'flex flex-col gap-3 rounded-[2px] px-4 py-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:py-4 sm:pl-6',
        shell[variant],
        className
      )}
    >
      <div className="min-w-0">
        <p className={cn('text-[11px] font-normal leading-snug', text[variant])}>
          <span className="font-medium">{heading}</span>
          {' — '}
          {oraPlusPricing.price}
          {oraPlusPricing.period} · jusqu’à −50&nbsp;% sur les boissons.
        </p>
        <p className={cn('mt-1 text-[10px] font-light leading-relaxed', sub[variant])}>
          Bilan &amp; événements prioritaires.
        </p>
      </div>
      <Link
        to="/ora-plus"
        className={cn(
          'inline-flex shrink-0 items-center gap-2 self-start text-[10px] font-normal uppercase tracking-[0.14em] transition-opacity sm:self-auto',
          variant === 'onDark'
            ? 'text-white/90 hover:opacity-80'
            : 'text-noir hover:opacity-70'
        )}
      >
        Découvrir Óra+
        <ArrowRight size={14} strokeWidth={1.35} aria-hidden />
      </Link>
    </aside>
  );
}
