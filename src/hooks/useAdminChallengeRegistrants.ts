import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { matchBilanBooking, type BilanBookingLike } from '../lib/challengeRegistrantMatch';
import type { EventRegistration } from '../types/database';

export interface ChallengeRegistrantRow {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  created_at: string;
  objectif: string | null;
  complementRevenus: string | null;
  bilan: { date: string; heure: string } | null;
}

function readDetail(details: unknown, key: string): string | null {
  if (!details || typeof details !== 'object') return null;
  const value = (details as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function useAdminChallengeRegistrants(challengeEventId: string | null) {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<ChallengeRegistrantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin || !challengeEventId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    Promise.all([
      db.from('event_registrations').select('*').eq('event_id', challengeEventId).order('created_at', { ascending: true }),
      db.from('bilan_bookings').select('telephone, date_rdv, heure_rdv, statut').eq('challenge_event_id', challengeEventId),
    ]).then(
      ([regRes, bookRes]: [
        { data: EventRegistration[] | null; error: { message: string } | null },
        { data: BilanBookingLike[] | null; error: { message: string } | null },
      ]) => {
        if (regRes.error) { setError(regRes.error.message); setLoading(false); return; }
        if (bookRes.error) { setError(bookRes.error.message); setLoading(false); return; }
        const bookings = bookRes.data ?? [];
        const enriched: ChallengeRegistrantRow[] = (regRes.data ?? []).map((r) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const details = (r as any).post_registration_details;
          const match = matchBilanBooking({ telephone: r.telephone }, bookings);
          return {
            id: r.id,
            prenom: r.prenom,
            nom: r.nom,
            telephone: r.telephone,
            created_at: r.created_at,
            objectif: readDetail(details, 'objectif_principal'),
            complementRevenus: readDetail(details, 'complement_revenus'),
            bilan: match ? { date: match.date_rdv, heure: match.heure_rdv } : null,
          };
        });
        setRows(enriched);
        setLoading(false);
      },
    );
  }, [isAdmin, challengeEventId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, error, refetch };
}
