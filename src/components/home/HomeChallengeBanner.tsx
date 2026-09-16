import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { todayInMartinique } from '../../lib/martiniqueDate';
import { ChallengeCountdown } from '../events/ChallengeCountdown';
import type { Event } from '../../types/database';

const MONTHS_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function splitDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()], year: d.getFullYear() };
}

/**
 * Bannière Challenge 21j sur la home — même bloc visuel que la rubrique
 * Challenge de /evenements (Evenements.tsx), réutilisé ici avec le
 * prochain challenge à venir uniquement. Invisible si aucun challenge à
 * venir — pas de fallback vide.
 */
export function HomeChallengeBanner() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const todayStr = todayInMartinique();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*')
      .eq('type', 'challenge')
      .eq('active', true)
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .limit(1)
      .then(({ data }: { data: Event[] | null }) => {
        if (cancelled) return;
        setEvent(data && data.length > 0 ? data[0] : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !event) return null;

  const { day, month, year } = splitDate(event.date);

  return (
    <section className="border-b border-noir/[0.06] bg-white px-4 py-12 md:px-10 md:py-14 lg:px-[72px]">
      <div className="mx-auto max-w-6xl">
        <Link
          to={`/evenements/${event.slug}`}
          className="group relative block overflow-hidden rounded-[2px]"
        >
          <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
            <img
              src="/challenge-21j/banniere-evenements.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/35 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-9">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-light uppercase tracking-[0.28em] text-white/60">
                  Challenge 21 jours
                </p>
                <ArrowRight size={18} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1.5" />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-light uppercase tracking-[0.2em] text-white/60">
                    {day} {month} {year}
                  </p>
                  <h2
                    className="mt-1 font-display font-normal leading-[1.02] text-white"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
                  >
                    {event.title}
                  </h2>
                </div>
                <div className="shrink-0 sm:pb-1">
                  <p className="mb-2 text-[8px] font-light uppercase tracking-[0.24em] text-white/45">
                    Démarre dans
                  </p>
                  <ChallengeCountdown targetDate={event.date} variant="light" compact />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
