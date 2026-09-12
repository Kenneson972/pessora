import { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';
import { todayInMartinique } from '../lib/martiniqueDate';
import { ChallengeLanding } from '../components/events/ChallengeLanding';
import { ChallengeClosedState } from '../components/events/ChallengeClosedState';

type EventWithCount = Event & { registrationCount: number };

const ChallengeLandingPage = () => {
  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Challenge 21 jours — PessÓra';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchNextChallenge = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, event_registrations!event_registrations_event_id_fkey(count)')
        .eq('type', 'challenge')
        .eq('active', true)
        .gte('date', todayInMartinique())
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle() as { data: (Event & { event_registrations: { count: number | string }[] }) | null; error: { code?: string } | null };

      if (cancelled) return;

      if (error) {
        setFetchError('Impossible de charger le challenge.');
      } else if (data) {
        setEvent({
          ...data,
          registrationCount: Number(data.event_registrations?.[0]?.count ?? 0),
        });
      }
      // Pas de challenge à venir : `event` reste `null`, ce qui rend
      // l'état fermé plus bas — ce n'est pas une erreur.
      setLoading(false);
    };
    fetchNextChallenge();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Chargement…</span>
        <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-32 text-center md:px-10 lg:px-[72px]">
          <p className="mb-4 text-[14px] text-black/50">{fetchError}</p>
        </div>
      </div>
    );
  }

  return event ? <ChallengeLanding event={event} /> : <ChallengeClosedState />;
};

export default ChallengeLandingPage;
