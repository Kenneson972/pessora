import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { generateSlotCandidates, dedupeSlotCandidates, type SlotCandidate } from '../lib/challengeSlotGenerator';

export interface ChallengeSlot {
  id: string;
  date: string;
  heure: string;
  disponible: boolean;
  challenge_event_id: string | null;
}

export interface GenerateSlotsParams {
  startDate: string;
  endDate: string;
  heures: string[];
  excludedWeekdays: number[];
}

export function useAdminChallengeSlots(challengeEventId: string | null) {
  const { isAdmin } = useAuth();
  const [slots, setSlots] = useState<ChallengeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin || !challengeEventId) { setSlots([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('bilan_slots')
      .select('id, date, heure, disponible, challenge_event_id')
      .eq('challenge_event_id', challengeEventId)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })
      .then(({ data, error: err }: { data: ChallengeSlot[] | null; error: { message: string } | null }) => {
        if (err) setError(err.message);
        setSlots(data ?? []);
        setLoading(false);
      });
  }, [isAdmin, challengeEventId]);

  useEffect(() => { refetch(); }, [refetch]);

  const generateSlots = async (
    params: GenerateSlotsParams,
  ): Promise<{ inserted: number; error: string | null }> => {
    const candidates = generateSlotCandidates(params.startDate, params.endDate, params.heures, params.excludedWeekdays);
    const existing = slots.map((s) => ({ date: s.date, heure: s.heure.slice(0, 5) }));
    const toInsert: SlotCandidate[] = dedupeSlotCandidates(candidates, existing);
    if (toInsert.length === 0) return { inserted: 0, error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bilan_slots')
      .insert(toInsert.map((c) => ({ date: c.date, heure: c.heure, disponible: true })));
    if (error) return { inserted: 0, error: error.message };
    refetch();
    return { inserted: toInsert.length, error: null };
  };

  const toggleDisponible = async (slot: ChallengeSlot) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_slots').update({ disponible: !slot.disponible }).eq('id', slot.id);
    refetch();
  };

  const deleteSlot = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_slots').delete().eq('id', id);
    refetch();
  };

  return { slots, loading, error, refetch, generateSlots, toggleDisponible, deleteSlot };
}
