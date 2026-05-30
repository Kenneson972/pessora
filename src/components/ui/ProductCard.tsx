import type React from 'react';
import { Link } from 'react-router-dom';
import { Card, cn } from '@heroui/react';

interface ProductCardProps {
  tag: string;
  name: string;
  description?: string;
  macros?: string;
  price: string;
  /** Défaut : puits neutre type carrousel accueil */
  bgClass?: string;
  linkTo?: string;
  featured?: boolean;
  /** Emoji / picto menu — centré dans le puits si fourni */
  icon?: string;
  /** Prix indicatif membre Óra+ (ex. « 5,00 € »), affiché sous le prix public */
  oraMemberHint?: string;
  /** Grille dense (ex. page Menu) : puits moins haut, picto plus petit */
  density?: 'default' | 'compact';
  /** Contenu optionnel inséré après la description (ex. sélecteur de taille) */
  footer?: React.ReactNode;
}

const linkBaseClass = 'group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2';

export const ProductCard = ({
  tag,
  name,
  description,
  macros,
  price,
  bgClass,
  linkTo,
  featured = false,
  icon,
  oraMemberHint,
  density = 'default',
  footer,
}: ProductCardProps) => {
  const wellClass = bgClass ?? 'bg-surface-product-well';
  const compact = density === 'compact';

  const media = (
    <Card.Header
      className={cn(
        'relative flex items-center justify-center overflow-hidden p-0',
        featured ? 'min-h-[280px] md:min-h-0' : '',
        wellClass,
      )}
      style={{ aspectRatio: featured ? '3 / 4' : compact ? '4 / 3' : '3 / 4' }}
    >
      {icon ? (
        <span
          className={cn(
            'leading-none opacity-[0.88] transition-transform duration-500 ease-out group-hover:scale-[1.04]',
            compact ? 'text-[34px] sm:text-[38px]' : 'text-[52px]',
          )}
          aria-hidden
        >
          {icon}
        </span>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-product-well">
          <span className="h-px w-8 bg-noir/[0.08]" aria-hidden />
        </div>
      )}
    </Card.Header>
  );

  const content = (
    <Card.Content className={cn('space-y-2', compact ? 'px-3 pb-3 pt-2.5' : 'px-3.5 pb-4 pt-3')}>
      <span className="block text-[8px] font-normal uppercase tracking-[0.18em] text-[#1E3529]/45">
        {tag}
      </span>
      <div className="flex items-baseline justify-between gap-2 sm:gap-3">
        <Card.Title className="text-editorial-product-name min-w-0 flex-1 leading-snug">{name}</Card.Title>
        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span className="text-editorial-price whitespace-nowrap">{price}</span>
          {oraMemberHint && (
            <span className="whitespace-nowrap text-[9px] font-light tracking-[0.04em] text-gold-dim">
              Óra+ dès {oraMemberHint}
            </span>
          )}
        </div>
      </div>
      {macros && <p className="text-editorial-product-meta">{macros}</p>}
      {description ? (
        <Card.Description className="line-clamp-2 text-[11px] font-light leading-relaxed text-black/40">
          {description}
        </Card.Description>
      ) : null}
      {footer && (
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {footer}
        </div>
      )}
    </Card.Content>
  );

  const card = (
    <Card className={cn('overflow-hidden rounded-[2px] bg-white shadow-none transition-colors', featured ? 'h-full' : '')}>
      {media}
      {content}
    </Card>
  );

  if (!linkTo) return card;

  return (
    <Link to={linkTo} className={linkBaseClass} aria-label={`Voir ${name}`}>
      {card}
    </Link>
  );
};
