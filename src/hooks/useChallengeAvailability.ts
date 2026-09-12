import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { todayInMartinique } from '../lib/martiniqueDate';
import { isWithinBookingWindow } from '../lib/slotChallengeLabel';

export type ChallengeAvailabilityCase = 'outside-window' | 'bookable' | 'full' | 'not-yet-created';

export interface ChallengeAvailability {
  loading: boolean;
  case: ChallengeAvailabilityCase;
}

/**
 * "Le CTA suit la FENÊTRE, pas isPast" (docs/CONSIGNES-CLAUDE.md, 12/09) —
 * un challenge à J+30 sans créneau rattaché affichait le CTA alors que la
 * RLS refuse toute réservation. Le décompte suit "challenge à venir" ; le
 * CTA suit "il existe au moins un créneau réservable" — deux conditions,
 * pas une.
 *
 * Hors fenêtre (avant J-14) : ni CTA ni compte, pas de requête (rien à
 * distinguer, la réponse est déjà connue).
 * Dans la fenêtre : bookable (RLS anon, bilan_slots_select_bookable) donne
 * directement le cas 2. Pour distinguer "complets" de "pas encore créés"
 * (bookable=0 dans les deux cas via RLS), on interroge
 * fn_bilan_slots_count (SECURITY DEFINER) qui voit aussi les créneaux pris.
 */
export function useChallengeAvailability(
  challengeEventId: string,
  challengeDate: string,
): ChallengeAvailability {
  const [state, setState] = useState<ChallengeAvailability>({ loading: true, case: 'outside-window' });

  useEffect(() => {
    let cancelled = false;
    const inWindow = isWithinBookingWindow(challengeDate, todayInMartinique());

    if (!inWindow) {
      setState({ loading: false, case: 'outside-window' });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [bookableRes, totalRes] = await Promise.all([
        db
          .from('bilan_slots')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_event_id', challengeEventId)
          .eq('disponible', true),
        db.rpc('fn_bilan_slots_count', { p_challenge_id: challengeEventId }),
      ]);
      if (cancelled) return;

      const bookableCount = bookableRes.count ?? 0;
      const totalCount = typeof totalRes.data === 'number' ? totalRes.data : 0;

      if (bookableCount > 0) {
        setState({ loading: false, case: 'bookable' });
      } else if (totalCount > 0) {
        setState({ loading: false, case: 'full' });
      } else {
        setState({ loading: false, case: 'not-yet-created' });
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [challengeEventId, challengeDate]);

  return state;
}
