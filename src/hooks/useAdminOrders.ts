import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithItems } from './useOrders';

export type OrderFilterStatus = 'all' | 'pending' | 'paid' | 'preparing' | 'ready' | 'completed';

const POLL_INTERVAL = 10_000; // 10s — fallback si Realtime decroche (inspire de DALCIELO)

export function useAdminOrders(filterStatus: OrderFilterStatus = 'all') {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<OrderWithItems | null>(null);
  const [paidAlert, setPaidAlert] = useState<OrderWithItems | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let query = db
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        query = query.in('status', ['completed', 'cancelled']);
      } else {
        query = query.eq('status', filterStatus);
      }
    }

    const { data, error } = await query;
    if (error) return;
    const fresh = (data ?? []) as OrderWithItems[];

    // Detection des nouvelles commandes via polling (comme DALCIELO)
    if (!isFirstLoadRef.current) {
      for (const o of fresh) {
        if (!knownIdsRef.current.has(o.id)) {
          if (o.status === 'paid') {
            setPaidAlert(o);
          } else if (o.status === 'pending') {
            setNewOrderAlert(o);
          }
        }
      }
    }

    // Mise a jour des IDs connus
    knownIdsRef.current = new Set(fresh.map((o) => o.id));
    isFirstLoadRef.current = false;

    setOrders(fresh);
    setLoading(false);
  }, [filterStatus]);

  // Fetch initial + polling fallback
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    isFirstLoadRef.current = true;

    fetchOrders();

    const interval = setInterval(() => {
      if (!cancelled) fetchOrders();
    }, POLL_INTERVAL);

    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchOrders]);

  // Realtime — instantane, complementaire au polling
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as OrderWithItems;
          knownIdsRef.current.add(newOrder.id);
          if (newOrder.status === 'paid') {
            setPaidAlert(newOrder);
          } else {
            setNewOrderAlert(newOrder);
          }
          setOrders((prev) => [newOrder, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.paid' },
        (payload) => {
          if (payload.old.status === 'pending' && payload.new.status === 'paid') {
            const paidOrder = payload.new as OrderWithItems;
            knownIdsRef.current.add(paidOrder.id);
            setPaidAlert(paidOrder);
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === paidOrder.id);
              if (exists) {
                return prev.map((o) => (o.id === paidOrder.id ? paidOrder : o));
              }
              return [paidOrder, ...prev];
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useAdminOrders] Realtime deconnecte, reconnexion…');
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
  }, []);

  const clearAlert = () => setNewOrderAlert(null);
  const clearPaidAlert = () => setPaidAlert(null);

  const kpis = {
    paid: orders.filter((o) => o.status === 'paid').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    todayCompleted: orders.filter((o) => {
      if (o.status !== 'completed') return false;
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    todayRevenue: orders
      .filter((o) => {
        if (o.status !== 'completed') return false;
        const d = new Date(o.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0),
    activeCount: orders.filter((o) => ['pending', 'paid', 'preparing', 'ready'].includes(o.status)).length,
  };

  return { orders, loading, kpis, newOrderAlert, clearAlert, paidAlert, clearPaidAlert };
}
