// src/hooks/useAdminEventRegistrations.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { EventRegistration } from '../types/database';

export interface NewRegistrantData {
  prenom: string;
  nom: string;
  telephone: string;
  nb_personnes: string;
  souhait_info: string;
}

export function useAdminEventRegistrations(eventId: string | null) {
  const { isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = () => {
    if (!isAdmin || !eventId) { setRegistrations([]); return; }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: EventRegistration[] | null }) => {
        setRegistrations(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { refetch(); }, [isAdmin, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRegistrant = async (id: string, data: Partial<NewRegistrantData>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('event_registrations').update(data).eq('id', id);
    refetch();
  };

  const deleteRegistrant = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('event_registrations').delete().eq('id', id);
    refetch();
  };

  const addRegistrant = async (data: NewRegistrantData) => {
    if (!eventId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('event_registrations').insert({
      event_id: eventId,
      user_id: null,
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone,
      nb_personnes: data.nb_personnes,
      souhait_info: data.souhait_info || 'Ajout manuel',
    });
    refetch();
  };

  return { registrations, loading, refetch, updateRegistrant, deleteRegistrant, addRegistrant };
}
