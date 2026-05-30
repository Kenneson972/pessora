import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithItems } from './useOrders';

export type OrderFilterStatus = 'all' | 'paid' | 'preparing' | 'ready' | 'completed';

export function useAdminOrders(filterStatus: OrderFilterStatus = 'all') {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<OrderWithItems | null>(null);
  const [paidAlert, setPaidAlert] = useState<OrderWithItems | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let query = db
      .from('orders')
      .select('*, order_items(*)')
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        query = query.in('status', ['completed', 'cancelled']);
      } else {
        query = query.eq('status', filterStatus);
      }
    }

    query.then(({ data, error }: { data: OrderWithItems[] | null; error: { message: string } | null }) => {
      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[useAdminOrders]', error.message);
      } else {
        setOrders(data ?? []);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filterStatus]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as OrderWithItems;
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
            setPaidAlert(payload.new as OrderWithItems);
          }
        }
      )
      .subscribe();

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
    activeCount: orders.filter((o) => ['paid', 'preparing', 'ready'].includes(o.status)).length,
  };

  return { orders, loading, kpis, newOrderAlert, clearAlert, paidAlert, clearPaidAlert };
}
