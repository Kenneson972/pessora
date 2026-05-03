import { Link } from 'react-router-dom';
import { cn } from '@heroui/react';
import { BrandLogo } from '../common/BrandLogo';
import { Instagram, MessageCircle } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';
import { useCookieConsent } from '../../contexts/CookieConsentContext';

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
    <div className={cn(end && 'lg:text-right')}>
      <p
        className={cn(
          'mb-4 text-[9px] font-light uppercase tracking-[0.42em] text-white/42 lg:mb-5',
          end && 'lg:text-right',
        )}
      >
        {title}
      </p>
      <nav className="flex flex-col gap-[11px]" aria-label={title}>
        {links.map((l) =>
          l.external ? (
            <a
              key={l.label}
              href={l.to}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex min-h-[44px] items-center text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80',
                end && 'lg:ml-auto lg:block lg:max-w-max',
              )}
            >
              {l.label}
            </a>
          ) : (
            <Link
              key={l.label}
              to={l.to}
              className={cn(
                'flex min-h-[44px] items-center text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80',
                end && 'lg:ml-auto lg:block lg:max-w-max',
              )}
            >
              {l.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
};

/** Contact : ligne fluide avec séparateurs (moins « liste ») sur tous les écrans ; aligné à droite sur grand desktop. */
const FooterContactNav = ({ align = 'start' }: { align?: 'start' | 'end' }) => {
  const end = align === 'end';
  return (
    <div className={cn(end && 'lg:text-right')}>
      <p
        className={cn(
          'mb-4 text-[9px] font-light uppercase tracking-[0.42em] text-white/42 lg:mb-5',
          end && 'text-center lg:text-right',
        )}
      >
        Contact
      </p>
      <nav
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-0 gap-y-2 sm:gap-y-2.5',
          end && 'lg:justify-end',
        )}
        aria-label="Contact et réseaux"
      >
        {CONTACT_LINKS.map((l, i) => (
          <span key={l.label} className="inline-flex items-center">
            {i > 0 ? (
              <span className="mx-2.5 text-[10px] text-white/25 select-none" aria-hidden>
                ·
              </span>
            ) : null}
            {l.external ? (
              <a
                href={l.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80"
              >
                {l.label}
              </a>
            ) : (
              <Link
                to={l.to}
                className="flex min-h-[44px] items-center text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80"
              >
                {l.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

const Footer = () => {
  const { openPreferences } = useCookieConsent();
  return (
  <footer className="relative">
    <div
      className="h-px w-full bg-gradient-to-r from-transparent via-white/14 to-transparent"
      aria-hidden
    />
    <div className="bg-noir px-4 pb-10 pt-12 sm:px-8 md:px-10 lg:px-[72px] lg:pb-12 lg:pt-[64px]">
      <div className="mx-auto max-w-[1280px]">
        {/* Mobile : 2-col grid (Menu + Espace), logo centré au-dessus, Contact en dessous */}
        <div className="flex flex-col items-center gap-10 sm:gap-12 lg:hidden">
          {/* Logo + accroche */}
          <div className="flex flex-col items-center text-center">
            <BrandLogo variant="onDark" height={112} className="max-w-[min(100vw-2rem,380px)]" />
            <p className="mt-4 max-w-[240px] text-[10px] font-light leading-[2.1] tracking-[0.04em] text-white/40">
              Bar protéiné
              <br />
              Fort-de-France, Martinique
            </p>
            <div className="mt-6 flex justify-center gap-5">
              <a
                href="https://instagram.com/pessora.mq"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pessóra sur Instagram (ouvre un nouvel onglet)"
                className="text-white/38 transition-colors duration-200 hover:text-white/65"
              >
                <Instagram size={15} strokeWidth={1.3} aria-hidden />
              </a>
              <a
                href="https://wa.me/596696000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter Pessóra sur WhatsApp (ouvre un nouvel onglet)"
                className="text-white/38 transition-colors duration-200 hover:text-white/65"
              >
                <MessageCircle size={15} strokeWidth={1.3} aria-hidden />
              </a>
            </div>
          </div>
          {/* Grille 2 colonnes : Menu | Espace */}
          <div className="grid w-full max-w-[400px] grid-cols-2 gap-x-8 gap-y-6 sm:gap-x-14">
            <FooterCol title="Menu" links={MENU_LINKS} />
            <FooterCol title="Espace" links={ESPACE_LINKS} />
          </div>
          {/* Contact + Newsletter */}
          <div className="flex w-full max-w-[400px] flex-col items-center gap-8 border-t border-white/[0.06] pt-8 text-center">
            <FooterContactNav />
            <NewsletterSignup align="center" className="w-full max-w-[360px]" />
            <p className="max-w-[260px] text-[9px] font-light italic leading-relaxed text-white/30">
              « Nourrir le meilleur de toi-même. »
            </p>
          </div>
        </div>

        {/* Desktop (lg+) : grille 3 colonnes équilibrée */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-16">
          {/* Colonne gauche : Menu */}
          <div>
            <FooterCol title="Menu" links={MENU_LINKS} />
          </div>

          {/* Centre : logo, accroche, réseaux, newsletter */}
          <div className="flex flex-col items-center text-center lg:px-2">
            <div className="flex flex-col items-center">
              <BrandLogo variant="onDark" height={112} className="max-w-[min(100vw-2rem,380px)]" />
              <p className="mt-4 max-w-[240px] text-[10px] font-light leading-[2.1] tracking-[0.04em] text-white/40">
                Bar protéiné
                <br />
                Fort-de-France, Martinique
              </p>
              <div className="mt-6 flex justify-center gap-5">
                <a
                  href="https://instagram.com/pessora.mq"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pessóra sur Instagram (ouvre un nouvel onglet)"
                  className="text-white/38 transition-colors duration-200 hover:text-white/65"
                >
                  <Instagram size={15} strokeWidth={1.3} aria-hidden />
                </a>
                <a
                  href="https://wa.me/596696000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contacter Pessóra sur WhatsApp (ouvre un nouvel onglet)"
                  className="text-white/38 transition-colors duration-200 hover:text-white/65"
                >
                  <MessageCircle size={15} strokeWidth={1.3} aria-hidden />
                </a>
              </div>
            </div>
            <NewsletterSignup align="center" className="mt-9 max-w-[min(100%,360px)] lg:mt-10" />
            <p className="mt-8 max-w-[260px] text-[9px] font-light italic leading-relaxed text-white/30">
              « Nourrir le meilleur de toi-même. »
            </p>
          </div>

          {/* Colonne droite : Espace + Contact */}
          <div className="flex flex-col items-end gap-10">
            <div className="w-full max-w-[220px]">
              <FooterCol title="Espace" links={ESPACE_LINKS} align="end" />
            </div>
            <div className="w-full max-w-[260px]">
              <FooterContactNav align="end" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] bg-noir px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] py-5 sm:flex-row md:px-10 lg:px-[72px]">
      <span className="text-center text-[10px] font-light tracking-[0.1em] text-white/28 sm:text-left">
        © {new Date().getFullYear()} Pessóra · Fort-de-France
      </span>
      <div className="flex flex-wrap justify-center gap-x-7 gap-y-1 sm:justify-end">
        <Link
          to="/mentions-legales"
          className="flex min-h-[44px] items-center text-[10px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52"
        >
          Mentions légales
        </Link>
        <Link
          to="/politique-confidentialite"
          className="flex min-h-[44px] items-center text-[10px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52"
        >
          Confidentialité
        </Link>
        <button
          type="button"
          onClick={openPreferences}
          className="flex min-h-[44px] items-center text-[10px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52"
        >
          Cookies
        </button>
        <Link
          to="/cgv"
          className="flex min-h-[44px] items-center text-[10px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52"
        >
          CGV
        </Link>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
