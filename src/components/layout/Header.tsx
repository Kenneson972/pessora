import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Chip, cn } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { User, ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../store/cartStore';
import { PRIMARY_NAV, isPrimaryNavActive, getSubNavForPath } from '../../data/headerNav';
import { HeaderSubNavSmart } from './HeaderSubNav';
import { BrandLogo } from '../common/BrandLogo';
import { HeaderSearch } from './HeaderSearch';

const navFocusLight =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const navFocusDark =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0';

// Parcours desktop — inclut Óra+ (conversion) + la carte & services clés
const DESKTOP_NAV = PRIMARY_NAV.filter((i) =>
  ['/menu', '/nos-produits', '/ora-plus', '/evenements', '/bilan-bien-etre', '/concept'].includes(i.path)
);

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const itemCount = useCart((s) => s.items.reduce((n, x) => n + x.quantity, 0));
  const toggleCart = useCart((s) => s.toggleCart);
  const reduceMotion = useReducedMotion();
  const prevCartCount = useRef(0);
  const [cartPulse, setCartPulse] = useState(false);

  const accountHref = !isAuthenticated ? '/connexion' : isAdmin ? '/admin' : '/mon-espace';
  const accountFirstName =
    user?.firstName?.trim() || user?.email?.split('@')[0]?.trim() || 'Compte';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);

  useEffect(() => {
    let rafId: number | undefined;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const isDarkHeroRoute = location.pathname === '/';
  const isSolid = scrolled;
  const useLightTransparentChrome = !isSolid && !isDarkHeroRoute;
  const chromeDark = isSolid || (!isSolid && isDarkHeroRoute);

  const headerSurfaceClass = isSolid
    ? 'border-b border-white/[0.08] bg-[#1E3529] shadow-[0_1px_0_rgba(0,0,0,0.12)]'
    : useLightTransparentChrome
      ? 'border-b border-noir/[0.06] bg-white/92 shadow-[0_1px_0_rgba(0,0,0,0.04)]'
      : 'border-b border-transparent bg-transparent';
  const hasSubNav = getSubNavForPath(location.pathname) != null;
  const showSubNav = hasSubNav;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (reduceMotion) {
      prevCartCount.current = itemCount;
      return;
    }
    if (itemCount > prevCartCount.current) {
      setCartPulse(true);
      const t = window.setTimeout(() => setCartPulse(false), 480);
      prevCartCount.current = itemCount;
      return () => clearTimeout(t);
    }
    prevCartCount.current = itemCount;
  }, [itemCount, reduceMotion]);

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={cn(
        'fixed top-0 z-50 w-full transition-[background,border-color,box-shadow] duration-300',
        headerSurfaceClass,
      )}
    >
      <div
        className={cn(
          'grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:h-20 md:gap-4 md:px-10 lg:px-[72px]',
          showSubNav && 'shadow-none',
        )}
      >
        {/* Gauche : logo */}
        <Link
          to="/"
          className={cn(
            chromeDark ? navFocusDark : navFocusLight,
            'flex shrink-0 items-center justify-self-start transition-opacity duration-200 hover:opacity-80',
          )}
        >
          <BrandLogo variant={chromeDark ? 'onDark' : 'onLight'} height={36} />
        </Link>

        {/* Centre : navigation desktop — centrée dans l’espace entre logo et actions */}
        <nav
          aria-label="Navigation principale"
          className={cn(
            'hidden min-w-0 items-center justify-center gap-3 self-center justify-self-center lg:flex xl:gap-6',
            chromeDark ? navFocusDark : navFocusLight,
          )}
        >
          {DESKTOP_NAV.map((item) => {
            const isActive = isPrimaryNavActive(location.pathname, item.path, item.matchExact);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap py-1.5 text-[10px] font-normal uppercase tracking-[0.16em] transition-colors duration-200 rounded-[1px]',
                  isActive
                    ? chromeDark
                      ? 'text-white'
                      : 'text-black'
                    : chromeDark
                      ? 'text-white/60 hover:text-white'
                      : 'text-black/72 hover:text-black',
                  isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:content-[""]',
                  isActive && (chromeDark ? 'after:bg-white' : 'after:bg-noir'),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Droite : recherche (desktop) + compte + panier + menu mobile */}
        <div className="flex min-w-0 items-center justify-end justify-self-end gap-2 md:gap-3 lg:gap-4">
          <div className="hidden md:block">
            <HeaderSearch
              surface={chromeDark ? 'dark' : 'light'}
              stackedBelowHeader={showSubNav}
            />
          </div>

          <Link
            to={accountHref}
            className={cn(
              chromeDark ? navFocusDark : navFocusLight,
              'inline-flex min-w-0 max-w-[min(100%,9rem)] items-center gap-1.5 py-1.5 text-[10px] font-normal uppercase tracking-[0.16em] transition-colors rounded-[1px] sm:max-w-[11rem] sm:gap-2',
              chromeDark ? 'text-white/70 hover:text-white' : 'text-black/72 hover:text-black',
              isAuthenticated && 'normal-case tracking-wide',
            )}
            aria-label={
              isAuthenticated ? `Compte — ${accountFirstName}` : 'Connexion'
            }
          >
            <User size={15} strokeWidth={1.35} aria-hidden className="shrink-0" />
            {!isAuthenticated ? (
              <span className="hidden sm:inline">Connexion</span>
            ) : (
              <span className="truncate text-[11px] font-normal normal-case tracking-wide">
                {accountFirstName}
              </span>
            )}
          </Link>

          <div className="relative">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={toggleCart}
              className={cn(
                chromeDark ? navFocusDark : navFocusLight,
                '!min-h-[44px] !min-w-[44px] border-none !bg-transparent !shadow-none px-2 py-2 hover:!bg-transparent',
                chromeDark ? 'text-white/85 hover:text-white' : 'text-black/75 hover:text-black',
                cartPulse && 'origin-center scale-110 transition-transform duration-300 ease-out',
              )}
              aria-label={`Panier${itemCount > 0 ? `, ${itemCount} article${itemCount > 1 ? 's' : ''}` : ', vide'}`}
            >
              <ShoppingBag size={16} strokeWidth={1.35} />
            </Button>
            {itemCount > 0 && (
              <Chip
                className="pointer-events-none absolute -right-1 -top-1 h-4 min-h-4 min-w-4 px-1 text-[8px] !bg-[#1E3529] !text-white"
                size="sm"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Chip>
            )}
          </div>

          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className={cn(
              chromeDark ? navFocusDark : navFocusLight,
              '!min-h-[44px] !min-w-[44px] border-none !bg-transparent !shadow-none p-2 hover:!bg-transparent lg:hidden',
              chromeDark ? 'text-white hover:text-white/85' : 'text-black/80 hover:text-black',
            )}
            onPress={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            <span className="relative inline-flex h-[19px] w-[19px] items-center justify-center" aria-hidden>
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.85 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <X size={19} strokeWidth={1.3} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={reduceMotion ? false : { opacity: 0, rotate: 45, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, rotate: -45, scale: 0.85 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <MenuIcon size={19} strokeWidth={1.3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </Button>
        </div>
      </div>

      {showSubNav && <HeaderSubNavSmart />}

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            className="flex flex-col overflow-hidden border-t border-noir/[0.05] bg-white px-6 py-4 lg:hidden"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: reduceMotion ? 0 : 0.22 },
            }}
          >
            <HeaderSearch
              className="mb-4"
              inputClassName="h-12 min-h-12 w-full rounded-full border border-noir/[0.1] bg-noir/[0.02] pl-10 pr-4 text-base font-light leading-normal text-black/80 placeholder:text-black/30 outline-none transition-colors focus:border-noir/20 focus:bg-white"
              onAfterNavigate={() => setMobileOpen(false)}
            />
            {PRIMARY_NAV.map((item, i) => {
              const isActive = isPrimaryNavActive(location.pathname, item.path, item.matchExact);
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.path}
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    ease: [0.22, 1, 0.36, 1],
                    delay: reduceMotion ? 0 : 0.06 + i * 0.035,
                  }}
                >
                  <Link
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-4 border-b border-noir/[0.05] py-4 text-black/85 last:border-0 hover:text-black"
                  >
                    <Icon className="h-6 w-6 shrink-0 text-black/60" strokeWidth={1.25} aria-hidden />
                    <span className="text-[12px] font-medium uppercase tracking-[0.12em]">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
