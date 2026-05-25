import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatSupabaseDataError } from '../lib/userFacingError';

export interface MemberWithSub {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'member' | 'admin' | null;
  created_at: string;
  subscriptions: Array<{
    plan: string;
    status: string;
    end_date: string | null;
  }>;
}

/**
 * Charge la liste des membres (profiles) + leurs abonnements en deux requêtes
 * séparées, puis les fusionne manuellement.
 * Le nested select Supabase (select('*, subscriptions(...))') ne fonctionne pas
 * si la FK n'est pas déclarée dans le schéma Supabase — on contourne le problème.
 */
export function useAdminMembers() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<MemberWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('subscriptions').select('user_id, plan, status, end_date'),
    ]).then(([profilesRes, subsRes]: any[]) => {
      if (cancelled) return;

      if (profilesRes.error) {
        setError(formatSupabaseDataError(profilesRes.error.message, 'members'));
        setLoading(false);
        return;
      }

      const subsByUserId = new Map<string, { plan: string; status: string; end_date: string | null }>();
      if (!subsRes.error && Array.isArray(subsRes.data)) {
        for (const sub of subsRes.data) {
          if (sub.user_id && !subsByUserId.has(sub.user_id)) {
            subsByUserId.set(sub.user_id, { plan: sub.plan, status: sub.status, end_date: sub.end_date });
          }
        }
      }

      const merged: MemberWithSub[] = (profilesRes.data ?? []).map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        role: p.role,
        created_at: p.created_at,
        subscriptions: subsByUserId.has(p.id)
          ? [subsByUserId.get(p.id)!]
          : [],
      }));

      setMembers(merged);
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      console.error('[useAdminMembers]', err);
      setError('Erreur de chargement des membres.');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const refetch = useCallback(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  return { members, loading, error, refetch };
}
