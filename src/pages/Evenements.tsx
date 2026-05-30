import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';
import { useStaggerReveal } from '../lib/motionReveal';
import { OraPlusTeaserStrip } from '../components/common/OraPlusTeaserStrip';
import { PageHero } from '../components/layout/PageHero';

interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: 'Course',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
};

const TYPE_ORDER: Event['type'][] = ['run_club', 'popup', 'atelier', 'event', 'partenariat', 'bilan'];


function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const MONTHS_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function splitDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()], year: d.getFullYear() };
}

function regCount(ev: EventWithCount): number {
  return Number(ev.event_registrations?.[0]?.count ?? 0);
}

function EventRow({
  ev,
  reverse = false,
  index,
}: {
  ev: EventWithCount;
  reverse?: boolean;
  index: number;
}) {
  const count = regCount(ev);
  const spots = ev.places_max ? ev.places_max - count : null;
  const isFull = spots !== null && spots <= 0;
  const { day, month, year } = splitDate(ev.date);

  return (
    <Link
      to={`/evenements/${ev.slug}`}
      aria-label={`${ev.title} — ${formatDate(ev.date)}`}
      className={`group relative grid min-w-0 grid-cols-1 items-center gap-6 outline-none ring-offset-4 focus-visible:ring-2 focus-visible:ring-noir/60 md:grid-cols-12 md:gap-10 lg:gap-16 ${
        isFull ? 'opacity-55' : ''
      }`}
    >
      {/* Image landscape — alternance de côté sur desktop */}
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-neutral-100 md:col-span-7 md:aspect-[16/10] ${
          reverse ? 'md:col-start-6' : 'md:col-start-1'
        }`}
      >
        {ev.image_url ? (
          <img
            src={ev.image_url}
            alt=""
            width={1200}
            height={900}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 via-neutral-300 to-anthracite" />
        )}

        {/* Voile bas pour date */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noir/75 via-noir/25 to-transparent" />

        {/* Numéro de série discret, haut-gauche */}
        <span className="absolute left-5 top-5 text-[10px] font-light uppercase tracking-[0.24em] text-white/65">
          № {String(index + 1).padStart(2, '0')} · {TYPE_LABELS[ev.type]}
        </span>

        {/* Badge complet */}
        {isFull && (
          <span className="absolute right-5 top-5 rounded-[1px] border border-white/30 px-2.5 py-1 text-[9px] font-light uppercase tracking-[0.24em] text-white/90">
            Complet
          </span>
        )}

        {/* Date éditoriale superposée — bas-gauche */}
        <div className="absolute bottom-6 left-5 flex items-baseline gap-3 text-white md:left-7">
          <span
            className="font-display font-normal leading-[0.9]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 6vw, 84px)' }}
          >
            {day}
          </span>
          <span className="pb-2 text-[11px] font-light uppercase tracking-[0.26em] text-white/75">
            {month} {year}
            {ev.heure ? (
              <>
                <br />
                {ev.heure.slice(0, 5)}
              </>
            ) : null}
          </span>
        </div>
      </div>

      {/* Colonne texte — côté opposé à l'image */}
      <div
        className={`md:col-span-5 ${
          reverse ? 'md:col-start-1 md:row-start-1 md:pr-4' : 'md:col-start-8 md:pl-4'
        }`}
      >
        <p className="mb-4 text-[11px] font-light uppercase tracking-[0.24em] text-black/45">
          {formatDate(ev.date)}
          {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
        </p>
        <h3
          className="font-display font-normal leading-[0.98] tracking-[-0.02em] text-black"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.6vw, 48px)' }}
        >
          {ev.title}
        </h3>

        {ev.location && (
          <p className="mt-5 text-[14px] font-light leading-relaxed text-black/60">{ev.location}</p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-noir/[0.1] pt-5">
          <p className="text-[11px] font-light uppercase tracking-[0.22em] text-black/55">
            {spots !== null ? (
              isFull ? (
                'Complet'
              ) : (
                <>
                  <span className="font-normal text-black">{spots}</span> places
                </>
              )
            ) : ev.is_free ? (
              'Entrée libre'
            ) : (
              ev.price && ev.price > 0 ? `${ev.price.toLocaleString('fr-FR', {minimumFractionDigits: 2})}€` : 'Payant'
            )}
          </p>
          <span className="inline-flex items-center gap-2.5 text-[11px] font-light uppercase tracking-[0.22em] text-black transition-transform duration-300 group-hover:translate-x-1.5">
            S'inscrire
            <ArrowRight size={14} strokeWidth={1.3} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventCardCompact({ ev }: { ev: EventWithCount }) {
  const { day, month } = splitDate(ev.date);

  return (
    <Link
      to={`/evenements/${ev.slug}`}
      aria-label={`${ev.title} — ${formatDate(ev.date)}`}
      className="group block min-w-0 opacity-75 outline-none ring-offset-2 transition-opacity duration-300 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-noir/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {ev.image_url ? (
          <img
            src={ev.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 via-neutral-300 to-anthracite" />
        )}
        <div className="absolute inset-0 bg-white/35 mix-blend-lighten" />
        <span className="absolute right-3 top-3 rounded-[1px] bg-noir/75 px-2 py-1 text-[9px] font-light uppercase tracking-[0.22em] text-white/85">
          Passé
        </span>
      </div>
      <div className="pt-4">
        <p className="mb-1.5 text-[10px] font-light uppercase tracking-[0.22em] text-black/40">
          {day} {month}
          {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
        </p>
        <h3
          className="font-display font-normal leading-[1.05] text-black/85"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 1.8vw, 22px)' }}
        >
          {ev.title}
        </h3>
        {ev.location && (
          <p className="mt-1.5 text-[11px] font-light text-black/45">{ev.location}</p>
        )}
      </div>
    </Link>
  );
}

const Evenements = () => {
  useEffect(() => { document.title = 'Événements — PessÓra'; }, []);
  const { container, item, isReducedMotion } = useStaggerReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('active', true)
      .order('date', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) setError('Impossible de charger les événements.');
        else if (data) setEvents(data as EventWithCount[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcoming = useMemo(
    () => events.filter((ev) => ev.date >= todayStr),
    [events, todayStr],
  );
  const past = useMemo(
    () => [...events.filter((ev) => ev.date < todayStr)].reverse(),
    [events, todayStr],
  );

  const availableTypes = useMemo(() => {
    const set = new Set<Event['type']>();
    events.forEach((ev) => set.add(ev.type));
    return TYPE_ORDER.filter((t) => set.has(t));
  }, [events]);

  const typeFromUrl = searchParams.get('type') as Event['type'] | null;
  const activeType = typeFromUrl && availableTypes.includes(typeFromUrl) ? typeFromUrl : null;

  const filteredUpcoming = activeType ? upcoming.filter((ev) => ev.type === activeType) : upcoming;
  const filteredPast = activeType ? past.filter((ev) => ev.type === activeType) : past;

  const setTypeFilter = (type: Event['type'] | null) => {
    if (!type) setSearchParams({});
    else setSearchParams({ type });
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Communauté · Fort-de-France"
        title="Événements"
        subtitle="Ateliers, run clubs, pop-ups et rencontres autour de Pessóra. Filtrez par catégorie ou parcourez les éditions passées."
      />

      {/* Filtres par type — inline dans la page, pas dans le header */}
      {availableTypes.length > 0 && (
        <div className="border-b border-noir/[0.06] bg-white px-4 py-4 md:px-10 lg:px-[72px]">
          <Segment
            size="sm"
            selectedKey={activeType ?? 'all'}
            onSelectionChange={(k) =>
              setTypeFilter(k === 'all' ? null : ((k as Event['type']) ?? null))
            }
            aria-label="Filtrer par type d'événement"
          >
            <Segment.Item id="all">
              <Segment.Separator />
              Tous
            </Segment.Item>
            {availableTypes.map((t) => (
              <Segment.Item key={t} id={t}>
                <Segment.Separator />
                {TYPE_LABELS[t]}
              </Segment.Item>
            ))}
          </Segment>
        </div>
      )}

      {/* Section : À venir */}
      <section className="px-4 py-12 md:px-10 md:py-14 lg:px-[72px]">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[10px] font-light uppercase tracking-[0.22em] text-black/35">
              À venir
            </p>
            <h2
              className="font-display font-normal leading-none text-black"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 36px)' }}
            >
              Prochains rendez-vous
            </h2>
          </div>
          {!loading && (
            <p className="hidden text-[11px] font-light text-black/40 md:block">
              {filteredUpcoming.length}{' '}
              {filteredUpcoming.length > 1 ? 'événements' : 'événement'}
            </p>
          )}
        </div>

        {error && (
          <p className="mb-6 rounded-[2px] border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] font-light text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-y-16 md:gap-y-24">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="grid animate-pulse grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-10"
              >
                <div className="aspect-[4/3] w-full bg-noir/[0.06] md:col-span-7 md:aspect-[16/10]" />
                <div className="md:col-span-5">
                  <div className="mb-4 h-3 w-1/3 rounded bg-noir/[0.06]" />
                  <div className="mb-3 h-10 w-4/5 rounded bg-noir/[0.06]" />
                  <div className="h-3 w-2/3 rounded bg-noir/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUpcoming.length === 0 ? (
          <EmptyState
            size="lg"
            className="rounded-[2px] border border-noir/[0.08] bg-neutral-50 px-6 py-12 md:px-10 md:py-16"
          >
            <EmptyState.Header>
              <p className="text-[11px] font-light uppercase tracking-[0.22em] text-black/35">
                Prochainement
              </p>
              <EmptyState.Title
                className="mx-auto max-w-md font-display font-normal leading-[1.15] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.4vw, 28px)' }}
              >
                {activeType
                  ? `Aucun événement « ${TYPE_LABELS[activeType]} » à venir`
                  : 'Aucun événement programmé pour le moment'}
              </EmptyState.Title>
              <EmptyState.Description className="mx-auto max-w-md text-[13px] font-light leading-relaxed text-black/50">
                Les prochaines éditions seront publiées ici. En attendant, écris-nous pour proposer
                un partenariat ou être prévenu·e en avant-première.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content className="flex-row flex-wrap items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex h-11 items-center rounded-full bg-[#1E3529] px-6 text-[11px] font-light uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-[#1E3529]/80"
              >
                Nous contacter
              </Link>
              {activeType && (
                <button
                  type="button"
                  onClick={() => setTypeFilter(null)}
                  className="inline-flex h-11 items-center rounded-full border border-noir/20 px-6 text-[11px] font-light uppercase tracking-[0.18em] text-black/65 transition-colors duration-200 hover:border-noir hover:text-black"
                >
                  Voir tous les types
                </button>
              )}
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <motion.div
            className="flex flex-col gap-y-20 md:gap-y-28"
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.05, margin: '0px 0px -32px 0px' }}
          >
            {filteredUpcoming.map((ev, i) => (
              <motion.div key={ev.id} variants={item} className="min-w-0">
                <EventRow ev={ev} reverse={i % 2 === 1} index={i} />
                {i < filteredUpcoming.length - 1 && (
                  <div className="mt-20 hidden h-px bg-noir/[0.08] md:block md:mt-28" />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Section : Passés (seulement si au moins un passé) */}
      {!loading && filteredPast.length > 0 && (
        <section className="border-t border-noir/[0.06] bg-neutral-50/60 px-4 py-12 md:px-10 md:py-14 lg:px-[72px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-light uppercase tracking-[0.22em] text-black/35">
                Archives
              </p>
              <h2
                className="font-display font-normal leading-none text-black/75"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 2.6vw, 30px)' }}
              >
                Événements passés
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPast((s) => !s)}
              className="inline-flex h-11 items-center rounded-full border border-noir/15 px-4 text-[11px] font-light tracking-[0.08em] text-black/55 transition-colors duration-200 hover:border-noir/35 hover:text-black"
            >
              {showPast ? 'Masquer' : `Voir (${filteredPast.length})`}
            </button>
          </div>

          {showPast && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
              {filteredPast.map((ev) => (
                <EventCardCompact key={ev.id} ev={ev} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Teaser Óra+ — en bas, après la liste, pas en tête de page */}
      <section className="border-t border-noir/[0.06] bg-white px-4 py-12 md:px-10 md:py-14 lg:px-[72px]">
        <div className="mx-auto max-w-3xl">
          <OraPlusTeaserStrip variant="muted" heading="Óra+ & événements" />
        </div>
      </section>
    </div>
  );
};

export default Evenements;
