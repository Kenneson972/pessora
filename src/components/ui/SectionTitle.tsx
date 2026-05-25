import { Link } from 'react-router-dom';

interface SectionTitleProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
}

export const SectionTitle = ({ title, eyebrow, subtitle, linkLabel, linkTo }: SectionTitleProps) => (
  <div className="mb-8 md:mb-10">
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <p className="text-editorial-kicker mb-4 text-black/40">{eyebrow}</p>
        ) : null}
        <h2
          className="font-display font-normal leading-[0.95] tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
        >
          {title}
        </h2>
        {subtitle && <p className="text-editorial-product-meta mt-2.5 max-w-prose">{subtitle}</p>}
      </div>
      {linkLabel && linkTo && (
        <Link
          to={linkTo}
          className="text-editorial-link-underline inline-block flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 rounded-[1px]"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  </div>
);
