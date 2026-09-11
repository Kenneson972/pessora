import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Users, Calendar, ArrowLeft } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';
import { ChallengeRegistrationCard } from '../components/events/ChallengeRegistrationCard';
import { EventJsonLd } from '../components/seo/EventJsonLd';
import { formatDate } from '../lib/eventDateFormat';

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: 'Course',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
  challenge: 'Challenge 21 jours',
};

interface EventWithCount extends Event {
  registrationCount: number;
}

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${event?.title ?? 'Événement'} — PessÓra`;
  }, [event]);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchEvent = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, event_registrations!event_registrations_event_id_fkey(count)')
        .eq('slug', slug)
        .eq('active', true)
        .single() as { data: (Event & { event_registrations: { count: number | string }[] }) | null; error: { code?: string } | null };

      if (cancelled) return;

      if (error && !data) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          setFetchError('Impossible de charger cet événement.');
        }
      } else if (!data) {
        setNotFound(true);
      } else {
        setEvent({
          ...data,
          registrationCount: Number(data.event_registrations?.[0]?.count ?? 0),
        });
      }
      setLoading(false);
    };
    fetchEvent();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Chargement de l'événement…</span>
        <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-10 lg:px-[72px] text-center py-32">
          <h1
            className="font-display font-light text-noir mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            Événement introuvable
          </h1>
          <Link to="/evenements" className="text-gold-dim text-[12px] underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-10 lg:px-[72px] text-center py-32">
          <p className="text-black/50 text-[14px] mb-4">{fetchError}</p>
          <Link to="/evenements" className="text-gold-dim text-[12px] underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  const placesDispo = event.places_max ? event.places_max - event.registrationCount : null;

  return (
    <div className="min-h-screen bg-white">
      {event && (
        <EventJsonLd
          name={event.title}
          description={event.description}
          startDate={event.date}
          location={event.location}
          image={event.image_url}
          url={window.location.href}
        />
      )}

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-anthracite to-noir" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-10 lg:px-[72px] pb-10 md:pb-[48px]">
          <Link
            to="/evenements"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-normal uppercase tracking-[0.15em] mb-6 transition-colors"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Tous les événements
          </Link>
          <div>
            <span className="inline-block text-[8px] font-normal tracking-[0.2em] uppercase bg-noir text-white px-[10px] py-[4px] rounded-[3px] mb-4">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h1
              className="font-display font-light text-white leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 52px)' }}
            >
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 lg:px-[72px] py-10 md:py-[64px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Infos événement */}
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-black/55">
                <Calendar size={15} strokeWidth={1.5} aria-hidden="true" />
                <span className="capitalize text-[13px]">{formatDate(event.date)}</span>
              </div>
              {event.heure && (
                <div className="flex items-center gap-3 text-black/55">
                  <Clock size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.heure.slice(0, 5)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-black/55">
                  <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.location}</span>
                </div>
              )}
              {event.meeting_point && (
                <div className="flex items-center gap-3 text-black/55">
                  <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">Point de RDV : {event.meeting_point}</span>
                </div>
              )}
              {event.places_max && (
                <div className="flex items-center gap-3 text-black/55">
                  <Users size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">
                    {event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}
                    {placesDispo !== null && (
                      <span className={`ml-2 ${placesDispo <= 5 ? 'text-orange-500' : 'text-black/35'}`}>
                        · {placesDispo} place{placesDispo > 1 ? 's' : ''} restante{placesDispo > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-[14px] text-black/55 leading-[1.8]">
                {event.description}
              </p>
            )}
          </div>

          {/* Formulaire d'inscription */}
          <ChallengeRegistrationCard event={event} />
        </div>
      </div>
      {event.type !== 'challenge' && Array.isArray(event.gallery) && event.gallery.length > 0 && (
        <section className="border-t border-noir/[0.05]">
          <div className="mx-auto w-full max-w-6xl py-12">
            <h2 className="mb-6 font-display text-[22px] font-normal text-black">Photos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {event.gallery.map((url: string) => (
                <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
                  <img src={url} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EvenementDetail;
