import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  ShoppingBag,
  Star,
  User,
  Users,
  Package,
  Megaphone,
  Store,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@heroui/react';
import { useState, useRef, useEffect, useCallback } from 'react';

const itemClass = (active: boolean) =>
  cn(
    'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[2px] px-1 py-2 text-[9px] font-medium uppercase tracking-[0.08em] transition-colors',
    active ? 'text-sapin' : 'text-black/40 hover:text-sapin/70',
  );

const iconWrap = (active: boolean) =>
  cn(
    'flex h-11 w-11 items-center justify-center rounded-[12px] transition-colors',
    active ? 'bg-sapin text-white' : 'bg-transparent text-current',
  );

/** Navigation mobile espace membre (sidebar absente sous md) */
export function MemberDashboardBottomNav({ prefix }: { prefix: string }) {
  const { pathname } = useLocation();

  const is = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const links = [
    { to: prefix, exact: true, label: 'Accueil', icon: LayoutDashboard },
    { to: `${prefix}/evenements`, label: 'Événements', icon: CalendarDays },
    { to: `${prefix}/bilans`, label: 'Bilans', icon: Heart },
    { to: `${prefix}/historique`, label: 'Commandes', icon: ShoppingBag },
    { to: `${prefix}/abonnement`, label: 'Óra+', icon: Star },
    { to: `${prefix}/profil`, label: 'Profil', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-noir/[0.06] bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation espace membre"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {links.map(({ to, exact, label, icon: Icon }) => {
          const active = is(to, exact);
          return (
            <Link key={to + String(exact)} to={to} className={itemClass(active)}>
              <span className={iconWrap(active)}>
                <Icon size={18} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="max-w-[4.5rem] truncate text-center leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Navigation mobile admin — 4 raccourcis + menu “Plus” (bilans, communication, accueil) */
export function AdminDashboardBottomNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const is = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const mainLinks = [
    { to: '/admin', exact: true, label: 'Accueil', icon: LayoutDashboard },
    { to: '/admin/membres', label: 'Membres', icon: Users },
    { to: '/admin/evenements', label: 'Événements', icon: CalendarDays },
    { to: '/admin/produits', label: 'Produits', icon: Package },
  ];

  const moreLinks = [
    { to: '/admin/bilans', label: 'Bilans', icon: Heart },
    { to: '/admin/communication', label: 'Communication', icon: Megaphone },
    { to: '/admin/infos', label: 'Infos bar', icon: Store },
  ];

  const moreActive = moreLinks.some((l) => is(l.to));

  return (
    <div
      ref={ref}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-noir/[0.06] bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1" aria-label="Navigation admin">
        {mainLinks.map(({ to, exact, label, icon: Icon }) => {
          const active = is(to, exact);
          return (
            <Link key={to} to={to} className={itemClass(active)} onClick={() => setOpen(false)}>
              <span className={iconWrap(active)}>
                <Icon size={18} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="max-w-[3.75rem] truncate text-center leading-tight">{label}</span>
            </Link>
          );
        })}

        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          <button
            type="button"
            className={itemClass(open || moreActive)}
            onClick={toggleOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (!open) toggleOpen();
              }
              if (e.key === 'Escape') close();
            }}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label="Plus d’actions"
          >
            <span className={iconWrap(open || moreActive)}>
              <MoreHorizontal size={18} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-center leading-tight">Plus</span>
          </button>
          {open && (
            <div
              className="absolute bottom-full right-0 mb-2 w-52 rounded-[2px] border border-noir/[0.08] bg-white py-1 shadow-lg"
              role="menu"
              onKeyDown={(e) => {
                if (e.key === 'Escape') close();
              }}
            >
              {moreLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  role="menuitem"
                  tabIndex={0}
                  className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-black/70 hover:bg-noir/[0.04] hover:text-noir"
                  onClick={() => setOpen(false)}
                >
                  <Icon size={15} strokeWidth={1.5} className="text-black/45" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
