// src/pages/admin/AdminEvenements.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Download,
  CalendarDays,
  MapPin,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextMenu, EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { downloadCsv } from '../../lib/csvExport';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { usePersistentAdminState } from '../../hooks/usePersistentAdminState';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { EventForm } from '../../components/admin/EventForm';
import { EventRegistrationsList } from '../../components/admin/EventRegistrationsList';
import { syncEventPopup } from '../../lib/eventPopup';
import type { Event } from '../../types/database';

// ─── Types ──────────────────────────────────────────────────────────────────
interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'event' as Event['type'],
  date: '',
  heure: '',
  location: '',
  meeting_point: '',
  description: '',
  places_max: '',
  image_url: '',
  gallery: [] as string[],
  price: '',
  is_free: true,
  registration_open: true,
  active: true,
  popup_id: null as string | null,
  popup_enabled: false,
  popup_active: true,
  popup_title: '',
  popup_subtitle: '',
  popup_message: '',
  popup_cta_label: "S'inscrire",
};

type FormState = typeof EMPTY_FORM;

const TYPE_OPTIONS: Event['type'][] = ['event', 'popup', 'atelier', 'partenariat', 'bilan', 'run_club'];
const TYPE_LABELS: Record<Event['type'], string> = {
  event: 'Événement',
  popup: 'Pop-up',
  atelier: 'Atelier',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
  run_club: 'Course',
};

function formatLongDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type EventCardProps = {
  ev: EventWithCount;
  expanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRegistrations: () => void;
  onRelance: () => void;
};

const EventCard = ({
  ev,
  expanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleRegistrations,
  onRelance,
}: EventCardProps) => {
  const count = Number(ev.event_registrations?.[0]?.count ?? 0);
  const spots = ev.places_max ? ev.places_max - count : null;
  const cover = ev.image_url;
  const galleryCount = Array.isArray(ev.gallery) ? ev.gallery.length : 0;
  const totalPhotos = (cover ? 1 : 0) + galleryCount;

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="block overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white transition-colors hover:border-noir/20">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5">
        {/* Vignette cover */}
        <button
          type="button"
          onClick={onEdit}
          className="group relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[2px] bg-surface-muted sm:aspect-[4/3] sm:w-[180px] md:w-[220px]"
          aria-label={`Modifier ${ev.title}`}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-anthracite/60 to-noir text-white/40">
              <CalendarDays size={28} strokeWidth={1} />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-noir/70 px-2 py-0.5 text-[8px] font-light uppercase tracking-[0.22em] text-white backdrop-blur-[2px]">
            {TYPE_LABELS[ev.type]}
          </span>
          {totalPhotos > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-light text-black/70 backdrop-blur-[2px]">
              +{totalPhotos - 1} photos
            </span>
          )}
        </button>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="text-left text-[15px] font-normal leading-tight text-noir transition-colors hover:text-anthracite"
              >
                {ev.title}
              </button>
              {!ev.active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-noir/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-black/45">
                  <EyeOff size={10} strokeWidth={1.6} />
                  Masqué
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-light text-black/50">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={11} strokeWidth={1.6} />
                {formatLongDate(ev.date)}
                {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
              </span>
              {ev.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} strokeWidth={1.6} />
                  {ev.location}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleRegistrations}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-[10px] font-light uppercase tracking-[0.12em] transition-colors ${
                ev.registration_open
                  ? 'bg-sapin-subtle text-sapin hover:bg-sapin-muted'
                  : 'bg-noir/5 text-black/45 hover:bg-noir/10'
              }`}
            >
              {ev.registration_open ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
            </button>
            {spots !== null && (
              <span className="text-[10px] font-light text-black/45">
                {spots > 0 ? `${spots} places restantes` : 'Complet'}
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-[11px]">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-noir/15 px-4 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
            >
              <Users size={12} strokeWidth={1.5} /> {count} inscrit{count > 1 ? 's' : ''}
              {expanded ? <ChevronUp size={12} strokeWidth={1.5} /> : <ChevronDown size={12} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-light text-black/55 transition-colors hover:text-noir border-b border-noir/20 pb-px"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={onRelance}
              className="inline-flex items-center gap-1 text-[11px] font-light text-black/40 transition-colors hover:text-noir"
              title="Relancer cet événement avec une nouvelle date"
            >
              <RefreshCw size={11} strokeWidth={1.5} />
              Relancer
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-light text-red-400 transition-colors hover:text-red-600"
              aria-label="Supprimer"
            >
              <X size={13} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="registrants"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <EventRegistrationsList eventId={ev.id} />
          </motion.div>
        )}
      </AnimatePresence>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu
          aria-label={`Actions pour ${ev.title}`}
          onAction={(key) => {
            if (key === 'edit') onEdit();
            else if (key === 'relance') onRelance();
            else if (key === 'delete') onDelete();
          }}
        >
          <ContextMenu.Item id="edit" textValue="Modifier">
            <Pencil size={13} strokeWidth={1.6} aria-hidden />
            Modifier
          </ContextMenu.Item>
          <ContextMenu.Item id="relance" textValue="Relancer">
            <RefreshCw size={13} strokeWidth={1.6} aria-hidden />
            Relancer
          </ContextMenu.Item>
          <ContextMenu.Item id="delete" textValue="Supprimer" className="text-red-600">
            <Trash2 size={13} strokeWidth={1.6} aria-hidden />
            Supprimer
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
};

// ─── Page admin ─────────────────────────────────────────────────────────────
const DEFAULT_EV_FILTERS = {
  search: '',
  type: 'all' as 'all' | Event['type'],
  visibility: 'all' as 'all' | 'active' | 'inactive',
};

type ViewMode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string };

const AdminEvenements = () => {
  useEffect(() => { document.title = 'Événements — Admin PessÓra'; }, []);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>({ kind: 'list' });
  const [relanceInitial, setRelanceInitial] = useState<Partial<FormState> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = usePersistentAdminState('admin_events_filters_v1', DEFAULT_EV_FILTERS);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);

  const closeDeleteDialog = useCallback(() => setDeleteEventId(null), []);

  const goToList = useCallback(() => {
    setRelanceInitial(null);
    setView({ kind: 'list' });
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    setFetchError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*, event_registrations!event_registrations_event_id_fkey(count)')
      .order('date', { ascending: true })
      .then(({ data, error }: { data: EventWithCount[] | null; error: { message: string } | null }) => {
        setLoading(false);
        if (error) {
          setFetchError(formatSupabaseDataError(error.message, 'events'));
          setEvents([]);
          return;
        }
        // Normalize: ensure `gallery` is always a string[]
        const normalized = (data ?? []).map((ev) => ({
          ...ev,
          gallery: Array.isArray(ev.gallery) ? ev.gallery : [],
        })) as EventWithCount[];
        setEvents(normalized);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        (ev.slug?.toLowerCase().includes(q) ?? false) ||
        (ev.location?.toLowerCase().includes(q) ?? false);
      const matchType = filters.type === 'all' || ev.type === filters.type;
      const matchVis =
        filters.visibility === 'all' ||
        (filters.visibility === 'active' && ev.active) ||
        (filters.visibility === 'inactive' && !ev.active);
      return matchSearch && matchType && matchVis;
    });
  }, [events, filters]);

  const stats = useMemo(() => {
    const totalRegistrations = events.reduce(
      (acc, ev) => acc + Number(ev.event_registrations?.[0]?.count ?? 0),
      0,
    );
    const publishedCount = events.filter((e) => e.active).length;
    const upcoming = events.filter((e) => new Date(e.date + 'T00:00:00') >= new Date()).length;
    return { totalRegistrations, publishedCount, upcoming };
  }, [events]);

  const editingEvent = useMemo(() => {
    if (view.kind !== 'edit') return null;
    return events.find((e) => e.id === view.id) ?? null;
  }, [view, events]);

  const exportEventsCsv = () => {
    downloadCsv(
      `pessora-evenements-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Titre', 'Type', 'Date', 'Heure', 'Lieu', 'Actif', 'Inscriptions ouvertes', 'Slug', 'Nb inscrits', 'Nb photos'],
      filteredEvents.map((ev) => {
        const c = Number(ev.event_registrations?.[0]?.count ?? 0);
        const photos = (ev.image_url ? 1 : 0) + (Array.isArray(ev.gallery) ? ev.gallery.length : 0);
        return [
          ev.title,
          TYPE_LABELS[ev.type] ?? ev.type,
          ev.date,
          ev.heure ?? '',
          ev.location ?? '',
          ev.active ? 'oui' : 'non',
          ev.registration_open ? 'oui' : 'non',
          ev.slug,
          c,
          photos,
        ];
      }),
    );
  };

  const persistEvent = async (form: FormState, id?: string) => {
    const payload = {
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      gallery: form.gallery ?? [],
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    if (id) {
      const { error } = await db.from('events').update(payload).eq('id', id);
      if (error) throw new Error(formatMutationError(error.message));
    } else {
      const { error } = await db.from('events').insert(payload);
      if (error) throw new Error(formatMutationError(error.message));
    }

    try {
      await syncEventPopup({
        popupId: form.popup_id,
        enabled: form.popup_enabled,
        active: form.popup_active,
        slug: form.slug,
        eventDate: form.date,
        imageUrl: form.image_url || null,
        title: (form.popup_title || form.title).trim(),
        subtitle: (form.popup_subtitle || '').trim() || null,
        message: (form.popup_message || '').trim() || null,
        ctaLabel: (form.popup_cta_label || "S'inscrire").trim(),
      });
    } catch (e) {
      throw new Error(
        e instanceof Error
          ? `Événement sauvegardé, mais erreur pop-up : ${formatMutationError(e.message)}`
          : 'Événement sauvegardé, mais erreur pop-up.',
      );
    }
  };

  const handleCreate = async (form: FormState) => {
    await persistEvent(form);
    goToList();
    fetchEvents();
  };

  const handleUpdate = async (form: FormState) => {
    if (view.kind !== 'edit') return;
    await persistEvent(form, view.id);
    goToList();
    fetchEvents();
  };

  const handleRelance = useCallback((ev: EventWithCount) => {
    setRelanceInitial({
      title: ev.title,
      slug: '',
      type: ev.type,
      date: '',
      heure: ev.heure ?? '',
      location: ev.location ?? '',
      meeting_point: ev.meeting_point ?? '',
      description: ev.description ?? '',
      places_max: ev.places_max ? String(ev.places_max) : '',
      image_url: ev.image_url ?? '',
      gallery: Array.isArray(ev.gallery) ? ev.gallery : [],
      price: ev.price ? String(ev.price) : '',
      is_free: ev.is_free,
      registration_open: true,
      active: false,
      popup_enabled: false,
      popup_id: null,
    });
    setView({ kind: 'create' });
  }, []);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteEventId) return;
    setDeleteEventLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('events').delete().eq('id', deleteEventId);
      setExpandedId((prev) => (prev === deleteEventId ? null : prev));
      if (view.kind === 'edit' && view.id === deleteEventId) {
        goToList();
      }
      fetchEvents();
      setDeleteEventId(null);
    } finally {
      setDeleteEventLoading(false);
    }
  }, [deleteEventId, view]);

  const toggleRegistrationOpen = async (ev: EventWithCount) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('events')
      .update({ registration_open: !ev.registration_open })
      .eq('id', ev.id);
    fetchEvents();
  };

  // ─── Mode Édition ──────────────────────────────────────────────────────────
  if (view.kind !== 'list') {
    const initial: Partial<FormState> | undefined = editingEvent
      ? {
          title: editingEvent.title,
          slug: editingEvent.slug,
          type: editingEvent.type,
          date: editingEvent.date,
          heure: editingEvent.heure ?? '',
          location: editingEvent.location ?? '',
          meeting_point: editingEvent.meeting_point ?? '',
          description: editingEvent.description ?? '',
          places_max: editingEvent.places_max ? String(editingEvent.places_max) : '',
          image_url: editingEvent.image_url ?? '',
          gallery: Array.isArray(editingEvent.gallery) ? editingEvent.gallery : [],
          price: editingEvent.price ? String(editingEvent.price) : '',
          is_free: editingEvent.is_free,
          registration_open: editingEvent.registration_open,
          active: editingEvent.active,
        }
      : (relanceInitial ?? undefined);

    return (
      <div>
        <div className={DASH_MAIN_PAD}>
          <AnimatePresence mode="wait">
            <EventForm
              key={view.kind === 'edit' ? view.id : 'new'}
              initial={initial}
              existing={editingEvent}
              relanceFrom={relanceInitial ? (relanceInitial.title ?? undefined) : undefined}
              onSave={view.kind === 'edit' ? handleUpdate : handleCreate}
              onCancel={goToList}
              onDelete={editingEvent ? () => setDeleteEventId(editingEvent.id) : undefined}
              onRelance={editingEvent ? () => handleRelance(editingEvent) : undefined}
            />
          </AnimatePresence>
        </div>

        <ConfirmDialog
          open={deleteEventId !== null}
          title="Supprimer cet événement ?"
          description="Les inscriptions associées peuvent être impactées selon la base. Cette action est définitive."
          loading={deleteEventLoading}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteEvent}
        />
      </div>
    );
  }

  // ─── Mode Liste ────────────────────────────────────────────────────────────
  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Événements"
        subtitle="Pop-ups, ateliers, partenariats — créer, éditer, gérer les inscriptions et les photos."
        action={
          <button type="button"
            onClick={() => setView({ kind: 'create' })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir text-white px-4 text-[13px] font-medium hover:bg-anthracite transition-colors"
          >
            <Plus size={14} /> Nouvel événement
          </button>
        }
      />

      <div className={DASH_MAIN_PAD}>
        {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchEvents} />}

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Événements publiés', value: stats.publishedCount },
            { label: 'À venir', value: stats.upcoming },
            { label: 'Inscrits au total', value: stats.totalRegistrations },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[2px] border border-noir/[0.06] bg-white p-4 sm:p-5"
            >
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/40">
                {kpi.label}
              </p>
              <p
                className="mt-2 font-display leading-none text-noir"
                style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="mb-6 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <DashEyebrow className="mb-2">Recherche & filtres</DashEyebrow>
              <p className="text-[11px] text-black/40">
                Vos filtres sont mémorisés sur cet appareil et votre compte.
              </p>
            </div>
            {!loading && filteredEvents.length > 0 && (
              <button
                type="button"
                onClick={exportEventsCsv}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
              >
                <Download size={14} strokeWidth={1.5} aria-hidden />
                Exporter CSV ({filteredEvents.length})
              </button>
            )}
          </div>
          <input
            type="search"
            placeholder="Rechercher (titre, lieu, slug)…"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-11 w-full max-w-md rounded-[2px] border border-noir/[0.09] bg-white px-4 text-[12px] focus-visible:outline-none focus-visible:border-noir/35 focus-visible:ring-2 focus-visible:ring-noir/10"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
              Type
            </span>
            <Segment
              size="sm"
              selectedKey={filters.type}
              onSelectionChange={(k) =>
                setFilters({ type: ((k as (typeof DEFAULT_EV_FILTERS)['type']) ?? 'all') })
              }
              aria-label="Filtrer par type d'événement"
            >
              {(['all', ...TYPE_OPTIONS] as const).map((t) => (
                <Segment.Item key={t} id={t}>
                  <Segment.Separator />
                  {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
                </Segment.Item>
              ))}
            </Segment>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
              Statut
            </span>
            <Segment
              size="sm"
              selectedKey={filters.visibility}
              onSelectionChange={(k) =>
                setFilters({
                  visibility: ((k as (typeof DEFAULT_EV_FILTERS)['visibility']) ?? 'all'),
                })
              }
              aria-label="Filtrer par statut de publication"
            >
              {(
                [
                  ['all', 'Tous', null],
                  ['active', 'Publiés', Eye],
                  ['inactive', 'Masqués', EyeOff],
                ] as const
              ).map(([key, label, Icon]) => (
                <Segment.Item key={key} id={key}>
                  <Segment.Separator />
                  <span className="inline-flex items-center gap-1.5">
                    {Icon && <Icon size={12} strokeWidth={1.6} />}
                    {label}
                  </span>
                </Segment.Item>
              ))}
            </Segment>
          </div>
        </div>

        {loading ? (
          <p className="text-[11px] text-black/30">Chargement…</p>
        ) : filteredEvents.length === 0 ? (
          <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
            <EmptyState.Header>
              <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                {events.length === 0
                  ? 'Aucun événement pour le moment'
                  : 'Aucun événement ne correspond'}
              </EmptyState.Title>
              <EmptyState.Description className="text-[12px] font-light text-black/45">
                {events.length === 0
                  ? 'Crée ton premier événement pour l’afficher sur la page publique.'
                  : 'Ajuste la recherche ou réinitialise les filtres.'}
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              {events.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setView({ kind: 'create' })}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir px-4 text-[13px] font-medium text-white transition-colors hover:bg-anthracite"
                >
                  <Plus size={14} /> Créer le premier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_EV_FILTERS)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEvents.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                expanded={expandedId === ev.id}
                onToggleExpanded={() => setExpandedId((prev) => (prev === ev.id ? null : ev.id))}
                onEdit={() => setView({ kind: 'edit', id: ev.id })}
                onDelete={() => setDeleteEventId(ev.id)}
                onToggleRegistrations={() => toggleRegistrationOpen(ev)}
                onRelance={() => handleRelance(ev)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteEventId !== null}
        title="Supprimer cet événement ?"
        description="Les inscriptions associées peuvent être impactées selon la base. Cette action est définitive."
        loading={deleteEventLoading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
};

export default AdminEvenements;
