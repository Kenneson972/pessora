import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Phone, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { motionInitial, motionTransition } from '../../lib/motionReveal';
import { supabase } from '../../lib/supabaseClient';
import { auditLog } from '../../lib/auditLog';
import type { OrderWithItems } from '../../hooks/useOrders';

const GAMME_STATUSES = ['paid', 'preparing', 'ready', 'confirmed'];

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function UnscheduledCard({ order, items, onScheduled }: { order: OrderWithItems; items: OrderWithItems['order_items']; onScheduled: () => void }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSchedule = async () => {
    if (!date || !time) return;
    setSaving(true);
    const pickupDate = new Date(`${date}T${time}:00`).toISOString();
    await (supabase as any).from('orders').update({ scheduled_pickup_date: pickupDate }).eq('id', order.id);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: order.id, details: { scheduled_pickup_date: pickupDate } });
    setSaving(false);
    onScheduled();
  };

  return (
    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] p-5 md:p-6 border border-amber-500/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1">{order.client_name || 'Client'}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
            {order.client_phone && (
              <span className="flex items-center gap-1.5"><Phone size={13} strokeWidth={1.3} />{order.client_phone}</span>
            )}
            <span className="font-mono text-xs text-white/25">#{order.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 mb-5">
        {items.map((item, i) => (
          <div key={item.id ?? i} className="flex justify-between text-sm">
            <span className="text-white/70">{item.quantity}&times; {item.product_name}</span>
            <span className="tabular-nums text-white/50">{(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}&euro;</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-white/[0.08] pt-2 mt-2">
          <span className="text-sm font-medium text-white/60">Total</span>
          <span className="text-sm font-bold tabular-nums">{order.total.toFixed(2).replace('.', ',')}&euro;</span>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-white/30">Date de retrait</p>
          <input type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)}
            className="rounded-[2px] border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-[13px] text-white" />
        </div>
        <div>
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-white/30">Heure</p>
          <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!date}
            className="rounded-[2px] border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-[13px] text-white disabled:opacity-30">
            <option value="">--</option>
            {Array.from({ length: 19 }, (_, i) => {
              const h = 9 + Math.floor(i / 2);
              const m = i % 2 === 0 ? '00' : '30';
              const v = `${String(h).padStart(2, '0')}:${m}`;
              return <option key={v} value={v}>{v}</option>;
            })}
          </select>
        </div>
        <button onClick={handleSchedule} disabled={!date || !time || saving}
          className="min-h-[38px] rounded-[2px] bg-sapin px-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white hover:bg-sapin/85 disabled:opacity-30 transition-colors">
          {saving ? '...' : 'Valider'}
        </button>
      </div>
    </div>
  );
}

export default function RetraitsGamme() {
  const reduceMotion = useReducedMotion();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [unscheduled, setUnscheduled] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_type', 'gamme')
      .in('status', GAMME_STATUSES)
      .gte('scheduled_pickup_date', startOfDay.toISOString())
      .lte('scheduled_pickup_date', endOfDay.toISOString())
      .order('scheduled_pickup_date', { ascending: true });

    if (!error) setOrders(data ?? []);
    setLoading(false);
  }, [selectedDate]);

  // Commandes gamme sans date de retrait (à planifier)
  const fetchUnscheduled = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_type', 'gamme')
      .in('status', GAMME_STATUSES)
      .is('scheduled_pickup_date', null)
      .order('created_at', { ascending: false });

    if (!error) setUnscheduled(data ?? []);
  }, []);

  useEffect(() => { fetchOrders(); fetchUnscheduled(); }, [fetchOrders, fetchUnscheduled]);

  useEffect(() => { document.title = 'Retraits Gamme — Admin PessÓra'; }, []);

  const goToDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const handleMarkPickedUp = async (orderId: string) => {
    await (supabase as any)
      .from('orders')
      .update({ status: 'completed', picked_up_at: new Date().toISOString() })
      .eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: 'completed' } });
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const isPast = (iso: string) => new Date(iso) < new Date();

  return (
    <div className="min-h-screen bg-noir text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/commandes"
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Retour aux commandes"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight md:text-xl">Retraits Gamme</h1>
            <p className="text-xs text-white/35">{orders.length} retrait{orders.length > 1 ? 's' : ''} prévu{orders.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation par jour */}
      <div className="flex items-center justify-center gap-4 border-b border-white/[0.06] px-4 py-4">
        <button
          onClick={() => goToDay(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
          aria-label="Jour précédent"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <p className="text-sm font-medium min-w-[200px] text-center">{formatDateFr(selectedDate)}</p>
        <button
          onClick={() => goToDay(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
          aria-label="Jour suivant"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Liste des retraits */}
      <div className="p-4 md:p-6 max-w-3xl mx-auto">

        {/* À planifier */}
        {unscheduled.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-400/80">
                {unscheduled.length} commande{unscheduled.length > 1 ? 's' : ''} &agrave; planifier
              </p>
            </div>
            <div className="space-y-3">
              {unscheduled.map((order) => {
                const items = order.order_items ?? [];
                return (
                  <UnscheduledCard key={order.id} order={order} items={items} onScheduled={() => { fetchOrders(); fetchUnscheduled(); }} />
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-white/30 text-sm py-12">Chargement…</p>
        ) : orders.length === 0 && unscheduled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={48} strokeWidth={1} className="text-white/10 mb-4" />
            <p className="text-white/30 text-sm">Aucun retrait pr&eacute;vu</p>
          </div>
        ) : orders.length > 0 && (
          <AnimatePresence mode="wait">
            <div className="space-y-4">
              {orders.map((order) => {
                const items = order.order_items ?? [];
                const overdue = order.scheduled_pickup_date && isPast(order.scheduled_pickup_date) && order.status !== 'completed';
                const hasSpoon = items.some((it) => it.product_name.toLowerCase().includes('cuillère'));

                return (
                  <motion.div
                    key={order.id}
                    initial={motionInitial(reduceMotion, { opacity: 0, y: 12 })}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    transition={motionTransition(reduceMotion, { duration: 0.2 })}
                    className={`rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] p-5 md:p-6 ${
                      overdue ? 'border-2 border-amber-500/50' : ''
                    }`}
                  >
                    {/* En-tête carte */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{order.client_name || 'Client'}</h3>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                              <AlertTriangle size={12} strokeWidth={1.5} />
                              En retard
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
                          {order.client_phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} strokeWidth={1.3} />
                              {order.client_phone}
                            </span>
                          )}
                          <span>
                            Retrait {order.scheduled_pickup_date ? formatTime(order.scheduled_pickup_date) : '—'}
                          </span>
                          <span className="font-mono text-xs text-white/25">#{order.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-5">
                      {items.map((item, i) => (
                        <div key={item.id ?? i} className="flex justify-between text-sm">
                          <span className="text-white/70">{item.quantity}× {item.product_name}</span>
                          <span className="tabular-nums text-white/50">
                            {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}€
                          </span>
                        </div>
                      ))}
                      {hasSpoon && (
                        <p className="text-[11px] text-purple-400/70 mt-1">✓ Cuillère doseuse incluse</p>
                      )}
                      <div className="flex justify-between border-t border-white/[0.08] pt-2 mt-2">
                        <span className="text-sm font-medium text-white/60">Total</span>
                        <span className="text-sm font-bold tabular-nums">{order.total.toFixed(2).replace('.', ',')}€</span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleMarkPickedUp(order.id)}
                      className="w-full flex items-center justify-center gap-2 min-h-[48px] bg-sapin hover:bg-sapin/85 active:bg-sapin/70 text-white rounded-2xl font-bold text-sm transition-colors"
                    >
                      <Check size={18} strokeWidth={2} />
                      Marquer comme remis
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
