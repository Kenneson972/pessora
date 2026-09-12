// src/hooks/useAdminChallenges.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { slugify } from '../components/admin/eventEditorTypes';
import type { Event } from '../types/database';

export interface ChallengeFormData {
  title: string;
  date: string;
  active: boolean;
}

export function useAdminChallenges() {
  const { isAdmin } = useAuth();
  const [challenges, setChallenges] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin) { setChallenges([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*')
      .eq('type', 'challenge')
      .order('date', { ascending: false })
      .then(({ data, error: err }: { data: Event[] | null; error: { message: string } | null }) => {
        if (err) setError(err.message);
        setChallenges(data ?? []);
        setLoading(false);
      });
  }, [isAdmin]);

  useEffect(() => { refetch(); }, [refetch]);

  const createChallenge = async (
    form: ChallengeFormData,
  ): Promise<{ data: Event | null; error: string | null }> => {
    const slug = slugify(form.title) || `challenge-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('events')
      .insert({ type: 'challenge', title: form.title, date: form.date, slug, active: form.active })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    refetch();
    return { data, error: null };
  };

  const updateChallenge = async (
    id: string,
    form: ChallengeFormData,
  ): Promise<{ error: string | null }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('events')
      .update({ title: form.title, date: form.date, active: form.active })
      .eq('id', id);
    if (error) return { error: error.message };
    refetch();
    return { error: null };
  };

  return { challenges, loading, error, refetch, createChallenge, updateChallenge };
}
