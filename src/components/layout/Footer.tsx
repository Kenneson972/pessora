import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@heroui/react';
import { BrandLogo } from '../common/BrandLogo';
import { Instagram, MessageCircle } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';
import { useCookieConsent } from '../../contexts/CookieConsentContext';

/** Mêmes gouttières horizontales que le header ; logo centré, colonnes de liens calées aux extrémités utiles. */
const FOOTER_GUTTER_X = 'px-4 md:px-10 lg:px-[72px]';

const BORDER_SOFT = 'border-[color:var(--color-footer-border-soft)]';

const MENU_LINKS = [
  { label: 'Shakes', to: '/menu' },
  { label: 'Boissons énergie', to: '/menu' },
  { label: 'Carte complète', to: '/menu' },
];
const ESPACE_LINKS = [
  { label: 'Óra+', to: '/ora-plus' },
  { label: 'Événements', to: '/evenements' },
  { label: 'Bilan Bien-être', to: '/bilan-bien-etre' },
];
const CONTACT_LINKS = [
  { label: 'Instagram', to: 'https://instagram.com/pessora.mq', external: true },
  { label: 'WhatsApp', to: 'https://wa.me/596696000000', external: true },
  { label: 'Fort-de-France', to: '/contact' },
  { label: 'Partenariats', to: '/contact-partenariat' },
];

type FooterLink = { label: string; to: string; external?: boolean };

const footerNavLinkClass = cn(
  'flex min-h-11 items-center text-[12px] font-light tracking-[0.04em]',
  'text-footer-text-muted transition-colors duration-200 hover:text-ivory/90',
  'lg:min-h-0 lg:py-1 lg:text-[13px] lg:leading-snug',
);

const footerLegalLinkClass = cn(
  'flex min-h-11 items-center text-[10px] font-light tracking-[0.12em]',
  'text-footer-text-quiet transition-colors duration-200 hover:text-footer-text-muted',
  'lg:min-h-0 lg:py-1.5',
);

function FooterGroupLabel({
  children,
  align = 'start',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'mb-2 text-[8px] font-light uppercase tracking-[0.34em] text-footer-text-subtle sm:text-[9px]',
        align === 'end' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Marque centrée entre les deux colonnes de liens (axe visuel du footer). */
function FooterLogoCenter({ context }: { context: 'mobile' | 'desktop' }) {
  const desktop = context === 'desktop';
  return (
    <div className="flex w-full max-w-[min(100%,20rem)] flex-col items-center text-center sm:max-w-[min(100%,22rem)] lg:max-w-none lg:px-2">
      <div className="flex flex-col items-center gap-2 sm:gap-2.5">
        {desktop ? (
          <BrandLogo variant="onDark" height={120} className="max-w-[min(100%,300px)]" />
        ) : (
          <BrandLogo variant="onDark" height={96} className="max-w-[min(100%,260px)]" />
        )}
        <p className="max-w-[18rem] text-[10px] font-light uppercase leading-snug tracking-[0.14em] text-footer-text-quiet sm:normal-case sm:text-[11px] sm:tracking-[0.08em] lg:max-w-[14rem] lg:normal-case lg:text-[12px] lg:leading-relaxed lg:tracking-[0.05em]">
          Bar&nbsp;protéiné · Fort-de-France, Martinique
        </p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-5">
        <a
          href="https://instagram.com/pessora.mq"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pessóra sur Instagram (ouvre un nouvel onglet)"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-[2px] text-footer-text-quiet transition-colors duration-200 hover:text-ivory/88"
        >
          <Instagram size={desktop ? 19 : 17} strokeWidth={1.35} aria-hidden />
        </a>
        <a
          href="https://wa.me/596696000000"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter Pessóra sur WhatsApp (ouvre un nouvel onglet)"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-[2px] text-footer-text-quiet transition-colors duration-200 hover:text-ivory/88"
        >
          <MessageCircle size={desktop ? 19 : 17} strokeWidth={1.35} aria-hidden />
        </a>
      </div>
    </div>
  );
}

const FooterCol = ({
  title,
  links,
  align = 'start',
}: {
  title: string;
  links: FooterLink[];
  align?: 'start' | 'end';
}) => {
  const end = align === 'end';
  return (
    <div className={cn('min-w-0', end ? 'text-right' : 'text-left')}>
      <p
        className={cn(
          'mb-2 text-[8px] font-light uppercase tracking-[0.32em] text-footer-text-subtle sm:text-[9px]',
          end ? 'text-right' : 'text-left',
        )}
      >
        {title}
      </p>
      <nav className={cn('flex flex-col gap-1', end && 'items-end')} aria-label={title}>
        {links.map((l) =>
          l.external ? (
            <a key={l.label} href={l.to} target="_blank" rel="noopener noreferrer" className={footerNavLinkClass}>
              {l.label}
            </a>
          ) : (
            <Link key={l.label} to={l.to} className={footerNavLinkClass}>
              {l.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
};

const FooterContactNav = ({
  align = 'start',
  showGroupLabel,
}: {
  align?: 'start' | 'end';
  showGroupLabel?: boolean;
}) => {
  const end = align === 'end';
  return (
    <div className="min-w-0 max-w-md">
      {showGroupLabel ? <FooterGroupLabel align={end ? 'end' : 'start'}>Nous rejoindre</FooterGroupLabel> : null}
      <nav
        className={cn('flex flex-wrap gap-x-0 gap-y-2', end ? 'justify-end' : 'justify-start')}
        aria-label="Contact et réseaux"
      >
        {CONTACT_LINKS.map((l, i) => (
          <span key={l.label} className="inline-flex items-center">
            {i > 0 ? (
              <span className="mx-2 text-[10px] text-footer-text-subtle select-none sm:mx-2.5" aria-hidden>
                ·
              </span>
            ) : null}
            {l.external ? (
              <a href={l.to} target="_blank" rel="noopener noreferrer" className={footerNavLinkClass}>
                {l.label}
              </a>
            ) : (
              <Link to={l.to} className={footerNavLinkClass}>
                {l.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

function FooterSignupBlock() {
  return <NewsletterSignup align="left" compact minimal className="mt-0 w-full max-w-sm" />;
}

/** Colonne gauche : navigation + newsletter, calée sur le bord utile. */
function FooterLeftRail() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-label="Navigation menu" className="flex flex-col gap-3">
        <FooterGroupLabel align="start">Sur le site</FooterGroupLabel>
        <FooterCol title="Menu" links={MENU_LINKS} />
      </section>
      <section aria-label="Newsletter">
        <FooterSignupBlock />
      </section>
    </div>
  );
}

/** Colonne droite : espace + contact, calée sur le bord opposé. */
function FooterRightRail() {
  return (
    <div className="flex min-w-0 flex-col items-end gap-8 text-right">
      <section aria-label="Espace membres et services" className="w-full">
        <FooterCol title="Espace" links={ESPACE_LINKS} align="end" />
      </section>
      <div className={cn(BORDER_SOFT, 'w-full max-w-lg border-t pt-8')}>
        <section aria-label="Contact et réseaux">
          <FooterContactNav align="end" showGroupLabel />
        </section>
      </div>
    </div>
  );
}

const Footer = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="relative">
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-[color:var(--color-footer-border-soft)] to-transparent"
        aria-hidden
      />

      <div className={cn('bg-noir pt-8 pb-6 lg:pt-10 lg:pb-8', FOOTER_GUTTER_X)}>
        {/* Mobile / tablette : logo centré, puis deux ailés gauche | droite */}
        <div className="flex w-full flex-col gap-12 lg:hidden">
          <section aria-label="Marque Pessóra" className="flex w-full justify-center">
            <FooterLogoCenter context="mobile" />
          </section>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10">
            <FooterLeftRail />
            <FooterRightRail />
          </div>
        </div>

        {/* Desktop : grille 1fr · auto · 1fr pour pousser les rails aux extrémités et le logo au centre réel */}
        <div className="hidden w-full lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start lg:gap-x-8 xl:gap-x-12">
          <div className="min-w-0 justify-self-start">
            <FooterLeftRail />
          </div>
          <div className="justify-self-center pt-1">
            <section aria-label="Marque Pessóra">
              <FooterLogoCenter context="desktop" />
            </section>
          </div>
          <div className="min-w-0 justify-self-end">
            <FooterRightRail />
          </div>
        </div>
      </div>

      <div className={cn('border-t', BORDER_SOFT, 'bg-noir py-3.5', FOOTER_GUTTER_X)}>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-[9px] font-light tracking-[0.12em] text-footer-text-quiet sm:text-left sm:text-[10px]">
            © {new Date().getFullYear()} Pessóra · Fort-de-France
          </span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-0.5 sm:justify-end">
            <Link to="/mentions-legales" className={footerLegalLinkClass}>
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className={footerLegalLinkClass}>
              Confidentialité
            </Link>
            <button type="button" onClick={openPreferences} className={footerLegalLinkClass}>
              Cookies
            </button>
            <Link to="/cgv" className={footerLegalLinkClass}>
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
