// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardStats {
  eventsThisQuarter: number;
  bilansTotal: number;
  /** Répartition par mois civil du trimestre courant (3 valeurs). */
  eventsSparkline: number[];
  /** Commandes bilan confirmées par mois sur les 6 derniers mois civils. */
  bilansSparkline: number[];
}

function getQuarterStart(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
}

/** Mois du trimestre courant au format YYYY-MM (longueur 3). */
function quarterMonthKeys(): string[] {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const y = now.getFullYear();
  return [0, 1, 2].map((i) => {
    const d = new Date(y, qStartMonth + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/** Les `n` derniers mois civils au format YYYY-MM (du plus ancien au plus récent). */
function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function bucketCountsByMonth<T extends { ym: string }>(rows: T[], keys: string[]): number[] {
  const map = new Map<string, number>();
  for (const k of keys) map.set(k, 0);
  for (const r of rows) {
    if (map.has(r.ym)) map.set(r.ym, (map.get(r.ym) ?? 0) + 1);
  }
  return keys.map((k) => map.get(k) ?? 0);
}

const EMPTY_STATS: DashboardStats = {
  eventsThisQuarter: 0,
  bilansTotal: 0,
  eventsSparkline: [0, 0, 0],
  bilansSparkline: [0, 0, 0, 0, 0, 0],
};

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const quarterStart = getQuarterStart();
    const qKeys = quarterMonthKeys();
    const bilanKeys = lastNMonthKeys(6);

    Promise.all([
      db
        .from('event_registrations')
        .select('*, events!inner(date)')
        .eq('user_id', user.id)
        .gte('events.date', quarterStart),
      db
        .from('bilan_bookings')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('statut', 'confirme'),
    ]).then(([evRes, bilanRes]: [{ data: unknown[] | null }, { data: { created_at: string }[] | null }]) => {
      if (cancelled) return;

      const evRows = (evRes.data ?? []) as { events?: { date?: string } }[];
      const eventsYm = evRows
        .map((r) => r.events?.date?.slice(0, 7))
        .filter((ym): ym is string => typeof ym === 'string');
      const eventsSparkline = bucketCountsByMonth(
        eventsYm.map((ym) => ({ ym })),
        qKeys,
      );

      const bilanRows = bilanRes.data ?? [];
      const bilanYm = bilanRows.map((r) => ({
        ym: r.created_at.slice(0, 7),
      }));
      const bilansSparkline = bucketCountsByMonth(bilanYm, bilanKeys);

      setStats({
        eventsThisQuarter: evRows.length,
        bilansTotal: bilanRows.length,
        eventsSparkline,
        bilansSparkline,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { stats, loading };
}
