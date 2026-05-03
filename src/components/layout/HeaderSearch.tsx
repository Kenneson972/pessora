import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type Key,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Package } from 'lucide-react';
import { Kbd } from '@heroui/react';
import { Command, EmptyState } from '@heroui-pro/react';
import { menuItems as staticMenuItems } from '../../data/menuData';
import type { MenuItem } from '../../data/menuData';
import { loadMenuCatalog } from '../../lib/menuCatalog';
import { supabase } from '../../lib/supabaseClient';
import { useSearch } from '../../hooks/useSearch';
import type { SearchEvent } from '../../hooks/useSearch';

const CAT_LABELS: Record<string, string> = {
  wellness: 'Wellness',
  energie: 'Énergie',
  shakes: 'Shake',
  coffee: 'Coffee',
};

const TYPE_LABELS: Record<string, string> = {
  run_club: 'Course',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
};

type HeaderSearchProps = {
  className?: string;
  inputClassName?: string;
  onAfterNavigate?: () => void;
  /** Fond clair (défaut) ou barre sombre / transparente sur hero */
  surface?: 'light' | 'dark';
  /** Conservé pour compat API — ignoré par la palette (modal fullscreen) */
  stackedBelowHeader?: boolean;
};

/* ─── Mobile inline (inside mobile nav) ─── */
function SearchInline({ className, inputClassName, onAfterNavigate }: HeaderSearchProps) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    navigate(t ? `/menu?q=${encodeURIComponent(t)}` : '/menu');
    onAfterNavigate?.();
  };

  return (
    <form role="search" onSubmit={onSubmit} className={className}>
      <label htmlFor="mobile-search" className="sr-only">Rechercher</label>
      <div className="relative w-full">
        <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/28" strokeWidth={1.35} aria-hidden />
        <input
          id="mobile-search"
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Chercher sur la carte…"
          autoComplete="off"
          className={inputClassName ?? 'h-12 min-h-12 w-full rounded-full border border-noir/[0.1] bg-noir/[0.02] pl-10 pr-4 text-base font-light leading-normal text-black/80 placeholder:text-black/30 outline-none transition-colors focus:border-noir/20 focus:bg-white'}
        />
      </div>
    </form>
  );
}

/* ─── Desktop trigger + Command palette ⌘K ─── */
function SearchPalette({
  onAfterNavigate,
  surface = 'light',
}: {
  onAfterNavigate?: () => void;
  surface?: 'light' | 'dark';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [initialEvents, setInitialEvents] = useState<SearchEvent[]>([]);
  const [initialFetched, setInitialFetched] = useState(false);
  const [menuForGrid, setMenuForGrid] = useState<MenuItem[]>(staticMenuItems);

  const { boissons, evenements, produits, loading } = useSearch(query);
  const navigate = useNavigate();

  useEffect(() => {
    loadMenuCatalog().then(({ items }) => setMenuForGrid(items));
  }, []);

  // Fetch upcoming events once on first open
  useEffect(() => {
    if (!open || initialFetched) return;
    setInitialFetched(true);
    const today = new Date().toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('id,title,slug,date,type,heure')
      .gte('date', today)
      .order('date')
      .limit(6)
      .then(({ data }: { data: SearchEvent[] | null }) => setInitialEvents(data ?? []));
  }, [open, initialFetched]);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setQuery('');
  }, []);

  const handleAction = useCallback(
    (key: Key) => {
      const k = String(key);
      // Les id sont encodés en URL absolue (ex: "/menu/abc", "/evenements/slug", "/nos-produits?pid=...")
      setOpen(false);
      setQuery('');
      onAfterNavigate?.();
      navigate(k);
    },
    [navigate, onAfterNavigate],
  );

  const isSearching = query.trim().length >= 2;
  const hasResults = boissons.length + evenements.length + produits.length > 0;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir la recherche (Ctrl+K)"
        title="Rechercher · Ctrl+K"
        className={
          surface === 'dark'
            ? 'shrink-0 border-0 bg-transparent p-2 text-white/85 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0'
            : 'shrink-0 border-0 bg-transparent p-2 text-black/72 outline-none transition-opacity hover:text-black hover:opacity-90 focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
        }
      >
        <Search size={16} strokeWidth={1.35} className="shrink-0" aria-hidden />
      </button>

      <Command>
        <Command.Backdrop isOpen={open} variant="blur" onOpenChange={handleOpenChange}>
          <Command.Container size="lg">
            <Command.Dialog
              inputValue={query}
              onInputChange={setQuery}
              // Le filtrage est délégué au hook useSearch (Supabase + catalogue),
              // donc on désactive le filtre interne de l'Autocomplete.
              filter={() => true}
              aria-label="Palette de recherche"
            >
              <Command.InputGroup>
                <Command.InputGroup.Prefix>
                  <Search size={16} strokeWidth={1.4} aria-hidden />
                </Command.InputGroup.Prefix>
                <Command.InputGroup.Input placeholder="Rechercher une boisson, un événement, un produit…" />
                <Command.InputGroup.ClearButton />
                <Command.InputGroup.Suffix>
                  {loading ? (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-noir/20 border-t-black/60 animate-spin motion-reduce:animate-none"
                      aria-label="Recherche en cours"
                    />
                  ) : (
                    <Kbd className="text-[10px]">
                      <Kbd.Content>Esc</Kbd.Content>
                    </Kbd>
                  )}
                </Command.InputGroup.Suffix>
              </Command.InputGroup>

              <Command.List
                onAction={handleAction}
                renderEmptyState={() => (
                  <EmptyState size="sm" className="py-10">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <Search />
                      </EmptyState.Media>
                      <EmptyState.Title>
                        {isSearching
                          ? `Aucun résultat pour « ${query.trim()} »`
                          : 'Commencez à taper…'}
                      </EmptyState.Title>
                      <EmptyState.Description>
                        {isSearching
                          ? 'Essayez un autre mot-clé ou parcourez la carte.'
                          : 'Boissons, événements, produits — tapez au moins 2 lettres.'}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                )}
              >
                {!isSearching ? (
                  <>
                    <Command.Group heading="Suggestions · Boissons">
                      {menuForGrid.slice(0, 8).map(item => (
                        <Command.Item
                          key={`menu-${item.id}`}
                          id={`/menu/${item.id}`}
                          textValue={`${item.name} ${CAT_LABELS[item.category] ?? item.category}`}
                        >
                          <span
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[18px]"
                            aria-hidden
                          >
                            {item.icon ?? '·'}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13px] font-normal">{item.name}</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                              {CAT_LABELS[item.category] ?? item.category} · {item.price}€
                            </span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {initialEvents.length > 0 && (
                      <Command.Group heading="Événements à venir">
                        {initialEvents.map(ev => (
                          <EventPaletteItem key={`ev-${ev.id}`} ev={ev} />
                        ))}
                      </Command.Group>
                    )}
                  </>
                ) : hasResults ? (
                  <>
                    {boissons.length > 0 && (
                      <Command.Group heading={`Boissons · ${boissons.length}`}>
                        {boissons.map(item => (
                          <Command.Item
                            key={`b-${item.id}`}
                            id={`/menu/${item.id}`}
                            textValue={`${item.name} ${CAT_LABELS[item.category] ?? item.category}`}
                          >
                            <span
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[18px]"
                              aria-hidden
                            >
                              {item.icon ?? '·'}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[13px] font-normal">{item.name}</span>
                              <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                                {CAT_LABELS[item.category] ?? item.category} · {item.price}€
                              </span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {evenements.length > 0 && (
                      <Command.Group heading={`Événements · ${evenements.length}`}>
                        {evenements.map(ev => (
                          <EventPaletteItem key={`e-${ev.id}`} ev={ev} />
                        ))}
                      </Command.Group>
                    )}

                    {produits.length > 0 && (
                      <Command.Group heading={`Produits · ${produits.length}`}>
                        {produits.map(p => (
                          <Command.Item
                            key={`p-${p.id}`}
                            id={`/nos-produits?pid=${encodeURIComponent(p.id)}`}
                            textValue={`${p.name} ${p.category}`}
                          >
                            <span
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-black/40"
                              aria-hidden
                            >
                              <Package size={14} strokeWidth={1.4} />
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[13px] font-normal">{p.name}</span>
                              <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                                {CAT_LABELS[p.category] ?? p.category}
                                {p.price != null
                                  ? ` · ${p.price.toFixed(2).replace('.', ',')}€`
                                  : ''}
                              </span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                ) : null}
              </Command.List>

              <Command.Footer className="justify-between [&_kbd]:h-5 [&_kbd]:text-[10px]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Kbd className="text-[10px]"><Kbd.Abbr keyValue="up" /></Kbd>
                      <Kbd className="text-[10px]"><Kbd.Abbr keyValue="down" /></Kbd>
                    </div>
                    <span>Naviguer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Kbd className="text-[10px]"><Kbd.Abbr keyValue="enter" /></Kbd>
                    <span>Ouvrir</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd className="text-[10px]">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>K</Kbd.Content>
                  </Kbd>
                  <span>pour rouvrir</span>
                </div>
              </Command.Footer>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
}

/* ─── Sub-components ─── */

function EventPaletteItem({ ev }: { ev: SearchEvent }) {
  const d = new Date(ev.date + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('fr-FR', { month: 'short' });

  return (
    <Command.Item
      id={`/evenements/${ev.slug}`}
      textValue={`${ev.title} ${TYPE_LABELS[ev.type] ?? ev.type}`}
    >
      <span
        className="inline-flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-[2px] bg-noir text-white"
        aria-hidden
      >
        <span className="text-[13px] font-light leading-none">{day}</span>
        <span className="mt-0.5 text-[7px] font-normal uppercase tracking-[0.18em] text-white/55">
          {month.replace('.', '')}
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-normal">{ev.title}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
          {TYPE_LABELS[ev.type] ?? ev.type}
          {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
        </span>
      </div>
      <Calendar
        size={12}
        strokeWidth={1.4}
        className="ml-auto shrink-0 text-black/25"
        aria-hidden
      />
    </Command.Item>
  );
}

/* ─── Main export ─── */
export function HeaderSearch({
  className,
  inputClassName,
  onAfterNavigate,
  surface = 'light',
  stackedBelowHeader: _stackedBelowHeader = false,
}: HeaderSearchProps) {
  // Mobile : formulaire inline dans le menu hamburger
  if (onAfterNavigate !== undefined) {
    return (
      <SearchInline
        className={className}
        inputClassName={inputClassName}
        onAfterNavigate={onAfterNavigate}
      />
    );
  }

  // Desktop : déclencheur + palette Command ⌘K
  return (
    <div className={className}>
      <SearchPalette surface={surface} />
    </div>
  );
}
