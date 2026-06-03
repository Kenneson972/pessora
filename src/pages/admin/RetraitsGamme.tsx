import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { auditLog } from '../../lib/auditLog';
import type { OrderWithItems } from '../../hooks/useOrders';

const GAMME_STATUSES = ['paid', 'scheduled', 'preparing', 'ready'];

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function UnscheduledCard({ order, items, onScheduled }: { order: OrderWithItems; items: OrderWithItems['order_items']; onScheduled: () => void }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSchedule = async () => {
    if (!date || !time) return; setSaving(true);
    await (supabase as any).from('orders').update({ scheduled_pickup_date: new Date(`${date}T${time}:00`).toISOString() }).eq('id', order.id);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: order.id, details: { scheduled_pickup_date: new Date(`${date}T${time}:00`).toISOString() } });
    setSaving(false); onScheduled();
  };

  return (
    <div className="rounded-[2px] border border-amber-200/50 bg-amber-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-medium text-black">{order.client_name || 'Client'}</p>
          <p className="text-[11px] text-black/45">{order.client_phone || '—'}</p>
        </div>
        <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">À planifier</span>
      </div>
      <div className="mb-3 space-y-1">
        {items.map((item, i) => (
          <div key={item.id ?? i} className="flex justify-between text-[12px]">
            <span className="text-black/70">{item.quantity}× {item.product_name}</span>
            <span className="tabular-nums text-black/50">{(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}€</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/[0.06] pt-1.5 mt-1.5">
          <span className="text-[12px] font-medium text-black/60">Total</span>
          <span className="text-[13px] font-bold tabular-nums text-black">{order.total.toFixed(2).replace('.', ',')}€</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <input type="date" value={date} min={minDate} onChange={e => setDate(e.target.value)} className="rounded-[2px] border border-noir/15 px-2.5 py-1.5 text-[12px]" />
        <select value={time} onChange={e => setTime(e.target.value)} disabled={!date} className="rounded-[2px] border border-noir/15 px-2.5 py-1.5 text-[12px] disabled:opacity-30">
          <option value="">Heure</option>
          {Array.from({ length: 19 }, (_, i) => { const h = 9 + Math.floor(i / 2); const m = i % 2 === 0 ? '00' : '30'; const v = `${String(h).padStart(2, '0')}:${m}`; return <option key={v} value={v}>{v}</option>; })}
        </select>
        <button onClick={handleSchedule} disabled={!date || !time || saving} className="rounded-[2px] bg-sapin px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white hover:bg-sapin/90 disabled:opacity-30">{saving ? '…' : 'Planifier'}</button>
      </div>
    </div>
  );
}

export default function RetraitsGamme() {
  const [selectedDate, setSelectedDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [unscheduled, setUnscheduled] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
    const { data } = await (supabase as any).from('orders').select('*, order_items(*)').eq('order_type', 'gamme').in('status', GAMME_STATUSES).gte('scheduled_pickup_date', startOfDay.toISOString()).lte('scheduled_pickup_date', endOfDay.toISOString()).order('scheduled_pickup_date', { ascending: true });
    if (data) setOrders(data ?? []);
    setLoading(false);
  }, [selectedDate]);

  const fetchUnscheduled = useCallback(async () => {
    const { data } = await (supabase as any).from('orders').select('*, order_items(*)').eq('order_type', 'gamme').in('status', GAMME_STATUSES).is('scheduled_pickup_date', null).order('created_at', { ascending: false });
    if (data) setUnscheduled(data ?? []);
  }, []);

  useEffect(() => { fetchOrders(); fetchUnscheduled(); }, [fetchOrders, fetchUnscheduled]);
  useEffect(() => { document.title = 'Retraits Gamme — Admin PessÓra'; }, []);

  const goToDay = (offset: number) => { const d = new Date(selectedDate); d.setDate(d.getDate() + offset); setSelectedDate(d); };
  const isPast = (iso: string) => new Date(iso) < new Date();

  const handleAction = async (orderId: string, status: string, extra?: Record<string, unknown>) => {
    await (supabase as any).from('orders').update({ status, ...extra }).eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: status } });
    fetchOrders(); fetchUnscheduled();
  };

  const sorted = [...orders].sort((a, b) => {
    const prio: Record<string, number> = { ready: 0, preparing: 1, scheduled: 2, paid: 3 };
    return (prio[a.status] ?? 99) - (prio[b.status] ?? 99);
  });

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-noir/[0.06] bg-white px-4 py-3 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/admin/commandes" className="flex items-center gap-1.5 text-black/40 hover:text-black/70 transition-colors">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-[15px] font-bold text-black">Retraits Gamme</h1>
            <p className="text-[11px] text-black/40">{orders.length + unscheduled.length} commande{(orders.length + unscheduled.length) > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.18em] text-black/35">{unscheduled.length} à planifier</p>
            <div className="space-y-3">
              {unscheduled.map(o => <UnscheduledCard key={o.id} order={o} items={o.order_items ?? []} onScheduled={() => { fetchOrders(); fetchUnscheduled(); }} />)}
            </div>
          </div>
        )}

        {/* Date navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => goToDay(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-noir/[0.08] hover:bg-noir/[0.03]"><ChevronLeft size={16} strokeWidth={1.5} /></button>
          <p className="text-[13px] font-medium text-black">{formatDateFr(selectedDate)}</p>
          <button onClick={() => goToDay(1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-noir/[0.08] hover:bg-noir/[0.03]"><ChevronRight size={16} strokeWidth={1.5} /></button>
        </div>

        {/* Scheduled orders */}
        {loading ? (
          <p className="py-12 text-center text-[12px] text-black/30">Chargement…</p>
        ) : sorted.length === 0 && unscheduled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={40} strokeWidth={1} className="text-black/10 mb-4" />
            <p className="text-[12px] text-black/35">Aucun retrait prévu</p>
          </div>
        ) : sorted.length > 0 && (
          <div className="border border-noir/[0.06] bg-white rounded-[2px] overflow-hidden">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-noir/[0.06] bg-noir/[0.01] text-[9px] font-medium uppercase tracking-[0.14em] text-black/40">
                  <th className="px-4 py-3 font-normal">Client</th>
                  <th className="px-4 py-3 font-normal">Articles</th>
                  <th className="px-4 py-3 font-normal text-right">Total</th>
                  <th className="px-4 py-3 font-normal">Statut</th>
                  <th className="px-4 py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => {
                  const items = order.order_items ?? [];
                  const overdue = order.scheduled_pickup_date && isPast(order.scheduled_pickup_date) && order.status !== 'completed';
                  const statusBadge = order.status === 'ready' ? '✅ Prête'
                    : order.status === 'preparing' ? '👨‍🍳 En prépa'
                    : order.status === 'scheduled' ? '📅 Planifiée' : '💳 Payée';

                  return (
                    <tr key={order.id} className={`border-b border-noir/[0.04] ${overdue ? 'bg-red-50/30' : 'hover:bg-noir/[0.01]'}`}>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-black">{order.client_name || 'Client'}</p>
                        <p className="text-[11px] text-black/40">{order.client_phone || '—'}{overdue && <span className="ml-2 text-[10px] text-red-500">En retard</span>}</p>
                      </td>
                      <td className="px-4 py-3">
                        {items.map((item, i) => (
                          <p key={item.id ?? i} className="text-[12px] text-black/60">{item.quantity}× {item.product_name}</p>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px] font-medium text-black">{order.total.toFixed(2).replace('.', ',')}€</td>
                      <td className="px-4 py-3"><span className="text-[11px] text-black/55">{statusBadge}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'scheduled' && (
                            <button onClick={() => handleAction(order.id, 'preparing')} className="rounded-[2px] border border-noir/[0.08] px-2.5 py-1 text-[9px] font-medium text-black/55 hover:bg-noir/[0.04]">Préparer</button>
                          )}
                          {order.status === 'preparing' && (
                            <button onClick={() => handleAction(order.id, 'ready')} className="rounded-[2px] border border-noir/[0.08] px-2.5 py-1 text-[9px] font-medium text-black/55 hover:bg-noir/[0.04]">Prête</button>
                          )}
                          {order.status === 'ready' && (
                            <button onClick={() => handleAction(order.id, 'completed', { picked_up_at: new Date().toISOString() })} className="rounded-[2px] bg-sapin px-2.5 py-1 text-[9px] font-medium text-white hover:bg-sapin/90">Remis</button>
                          )}
                          {order.status === 'paid' && (
                            <span className="text-[9px] text-black/25">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
