// src/hooks/useOrders.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const POLL_INTERVAL = 30_000; // 30s fallback si Realtime décroche

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      if (import.meta.env.DEV) console.error('[useOrders]', err);
      setError('Impossible de charger vos commandes.');
    } else {
      const rows = (data ?? []) as OrderWithItems[];
      if (import.meta.env.DEV) {
        console.info('[useOrders] public.orders pour ce compte :', rows.length, 'ligne(s)');
      }
      setOrders(rows);
    }
    setLoading(false);
  }, [user]);

  // Fetch initial + polling fallback
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      await fetchOrders();
    };
    load();

    const interval = setInterval(() => {
      if (!cancelled) fetchOrders();
    }, POLL_INTERVAL);

    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchOrders]);

  // Realtime — mises à jour instantanées filtrées par user_id
  useEffect(() => {
    if (!user) {
      channelRef.current = null;
      return;
    }

    const channel = supabase
      .channel(`member-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => { fetchOrders(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.user_id !== user.id) return;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated, order_items: o.order_items } as OrderWithItems : o))
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useOrders] Realtime déconnecté, reconnexion…');
          setTimeout(() => {
            supabase.removeChannel(channel);
            channel.subscribe();
          }, 3000);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const totalThisMonth = orders
    .filter(o => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);

  const topProducts = Object.entries(
    orders.flatMap(o => o.order_items).reduce<Record<string, number>>((acc, item) => {
      acc[item.product_name] = (acc[item.product_name] ?? 0) + item.quantity;
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { orders, loading, error, totalThisMonth, topProducts };
}
