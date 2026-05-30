import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Images, ClipboardList } from 'lucide-react';
import { cn } from '@heroui/react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { AdminDashboardBottomNav } from '../../components/dashboard/DashboardBottomNav';

const NAV: {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  path: string;
  exact?: boolean;
}[] = [
  { label: "Vue d'ensemble", shortLabel: 'Vue', icon: LayoutDashboard, path: '/admin', exact: true },
  { label: 'Membres', shortLabel: 'Membres', icon: Users, path: '/admin/membres' },
  { label: 'Événements', shortLabel: 'Évén.', icon: CalendarDays, path: '/admin/evenements' },
  { label: 'Produits & Gammes', shortLabel: 'Prod.', icon: Package, path: '/admin/produits-gammes' },
  { label: 'Bilans', shortLabel: 'Bilans', icon: Heart, path: '/admin/bilans' },
  { label: 'Commandes', shortLabel: 'Cmd.', icon: ClipboardList, path: '/admin/commandes' },
  { label: 'Communication', shortLabel: 'Comm.', icon: Megaphone, path: '/admin/communication' },
  { label: 'Contenu', shortLabel: 'Contenu', icon: Images, path: '/admin/contenu' },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center rounded-[12px] transition-all shrink-0',
      'md:w-11 md:h-11 md:justify-center',
      'lg:h-auto lg:min-h-[44px] lg:w-full lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5',
      active
        ? 'bg-sapin text-white'
        : 'bg-transparent text-black/40 hover:text-sapin hover:bg-sapin-subtle',
    );

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted md:flex-row">
      <aside
        className={cn(
          'hidden md:flex shrink-0 bg-white border-r border-noir/[0.06] sticky top-0 self-start h-screen flex-col',
          'md:w-[76px] md:items-center md:py-[22px] md:gap-[10px]',
          'lg:w-[220px] lg:items-stretch lg:px-0 lg:py-6 lg:gap-4',
        )}
        aria-label="Navigation admin"
      >
        <div className="flex flex-col items-center lg:w-full lg:items-stretch lg:px-4">
          <Link to="/" className="flex justify-center lg:justify-start" aria-label="Accueil">
            <BrandLogo height={24} />
          </Link>
          <p className="mt-3 hidden lg:block text-[9px] font-medium uppercase tracking-[0.2em] text-black/35">
            Administration
          </p>
          <div
            className="text-[8.5px] uppercase tracking-[0.22em] font-medium text-black/30 select-none md:flex lg:hidden"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: 4, marginBottom: 8 }}
          >
            ADMIN
          </div>
        </div>

        <nav className="flex flex-col gap-[6px] flex-1 w-full lg:px-2 min-h-0 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className={navLinkClass(active)}
              >
                <item.icon size={18} strokeWidth={1.5} className="shrink-0" aria-hidden />
                <span className="hidden lg:inline truncate text-left text-[10px] font-medium uppercase tracking-[0.07em] leading-tight">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-[6px] mt-auto lg:px-2">
          <button
            type="button"
            onClick={handleLogout}
            title="Déconnexion"
            aria-label="Déconnexion"
            className={cn(
              'flex items-center justify-center rounded-[12px] text-black/35 hover:text-noir hover:bg-noir/[0.05] transition-all shrink-0',
              'md:w-11 md:h-11',
              'lg:h-auto lg:min-h-[44px] lg:w-full lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5',
            )}
          >
            <LogOut size={18} strokeWidth={1.5} className="shrink-0" aria-hidden />
            <span className="hidden lg:inline text-left text-[10px] font-medium uppercase tracking-[0.07em] text-black/40">
              Déconnexion
            </span>
          </button>
          <div
            title={email}
            className={cn(
              'flex items-center justify-center rounded-full bg-noir text-white shrink-0 select-none',
              'md:w-11 md:h-11',
              'lg:h-auto lg:min-h-[44px] lg:w-full lg:rounded-[12px] lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5',
            )}
            style={{ fontSize: 13 }}
          >
            <span className="lg:hidden">{initials}</span>
            <span className="hidden lg:inline truncate text-[10px] font-medium uppercase tracking-[0.06em]">
              {email ? email.split('@')[0] : '—'}
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-noir/[0.06] bg-white/95 px-4 backdrop-blur-md md:hidden">
          <Link
            to="/"
            className="inline-flex min-h-[44px] min-w-0 items-center gap-2 text-noir transition-opacity hover:opacity-75"
            aria-label="Retour au site PessÓra — accueil"
          >
            <ArrowLeft size={18} strokeWidth={1.5} className="shrink-0 text-black/55" aria-hidden />
            <BrandLogo height={22} />
          </Link>
          <span className="max-w-[45%] truncate text-[9px] font-medium uppercase tracking-[0.18em] text-black/35">
            Administration
          </span>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
      </div>

      <AdminDashboardBottomNav />
    </div>
  );
};

export default AdminLayout;
