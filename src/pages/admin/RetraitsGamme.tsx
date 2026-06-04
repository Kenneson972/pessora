import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { auditLog } from '../../lib/auditLog';
import type { OrderWithItems } from '../../hooks/useOrders';

const COLUMNS = [
  { key: 'paid', label: 'À planifier', color: 'bg-amber-50 border-amber-200' },
  { key: 'scheduled', label: 'Planifiées', color: 'bg-blue-50 border-blue-200' },
  { key: 'preparing', label: 'En préparation', color: 'bg-orange-50 border-orange-200' },
  { key: 'ready', label: 'Prêtes', color: 'bg-green-50 border-green-200' },
];

function PaidCard({ order, items, onUpdate }: { order: OrderWithItems; items: OrderWithItems['order_items']; onUpdate: () => void }) {
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [saving, setSaving] = useState(false);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const minDate = tomorrow.toISOString().split('T')[0];
  const planify = async () => { if (!date || !time) return; setSaving(true);
    await (supabase as any).from('orders').update({ status: 'scheduled', scheduled_pickup_date: new Date(`${date}T${time}:00`).toISOString() }).eq('id', order.id);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: order.id, details: { new_status: 'scheduled' } });
    setSaving(false); onUpdate();
  };
  return (
    <div className="rounded-[2px] border border-noir/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <p className="text-[14px] font-bold text-black mb-1">{order.client_name || 'Client'}</p>
      {order.client_phone && <p className="text-[11px] text-black/45 mb-2 flex items-center gap-1"><Phone size={11} />{order.client_phone}</p>}
      <div className="mb-3 space-y-0.5">{items.map((item, i) => (<p key={item.id ?? i} className="text-[12px] text-black/60">{item.quantity}× {item.product_name}</p>))}</div>
      <p className="text-[14px] font-bold tabular-nums text-black mb-3">{order.total.toFixed(2).replace('.', ',')}€</p>
      <div className="flex gap-1.5 mb-3">
        <input type="date" value={date} min={minDate} onChange={e => setDate(e.target.value)} className="flex-1 rounded-[2px] border border-noir/15 px-2 py-1 text-[11px]" />
        <select value={time} onChange={e => setTime(e.target.value)} disabled={!date} className="w-16 rounded-[2px] border border-noir/15 px-1 py-1 text-[11px] disabled:opacity-30">
          <option value="">--</option>
          {Array.from({length:19},(_,i)=>{const h=9+Math.floor(i/2);const m=i%2===0?'00':'30';const v=`${String(h).padStart(2,'0')}:${m}`;return <option key={v} value={v}>{v}</option>})}
        </select>
        <button onClick={planify} disabled={!date||!time||saving} className="rounded-[2px] bg-sapin px-3 py-1 text-[10px] font-medium text-white hover:bg-sapin/90 disabled:opacity-30">{saving?'…':'OK'}</button>
      </div>
      <p className="text-[9px] font-mono text-black/25">#{order.id.slice(0,8)}</p>
    </div>
  );
}

export default function RetraitsGamme() {
  const [orders, setOrders] = useState<Record<string, OrderWithItems[]>>({ paid: [], scheduled: [], preparing: [], ready: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await (supabase as any).from('orders').select('*, order_items(*)').eq('order_type', 'gamme').in('status', ['paid', 'scheduled', 'preparing', 'ready']).order('created_at', { ascending: false });
    const grouped: Record<string, OrderWithItems[]> = { paid: [], scheduled: [], preparing: [], ready: [] };
    if (data) for (const o of data as OrderWithItems[]) { if (grouped[o.status]) grouped[o.status].push(o); }
    setOrders(grouped); if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    document.title = 'Retraits Gamme — Admin PessÓra';
    // Temps réel + polling de secours (30s) pour synchroniser plusieurs postes
    const channel = (supabase as any)
      .channel('retraits-gamme-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchAll(true); })
      .subscribe();
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => { (supabase as any).removeChannel(channel); clearInterval(interval); };
  }, [fetchAll]);

  const moveOrder = async (orderId: string, newStatus: string) => {
    await (supabase as any).from('orders').update({ status: newStatus }).eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: newStatus } });
    fetchAll(true);
  };
  const markCompleted = async (orderId: string) => {
    await (supabase as any).from('orders').update({ status: 'completed', picked_up_at: new Date().toISOString() }).eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: 'completed' } });
    fetchAll(true);
  };

  const total = Object.values(orders).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="flex items-center justify-between gap-4 border-b border-noir/[0.06] bg-white px-4 py-3 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/admin/commandes" className="text-black/40 hover:text-black/70"><ArrowLeft size={18} strokeWidth={1.5} /></Link>
          <h1 className="text-[15px] font-bold text-black">Retraits Gamme</h1>
          <span className="text-[11px] text-black/40">{total} commande{total > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="p-4 md:p-6">
        {loading ? (<p className="py-12 text-center text-[12px] text-black/30">Chargement…</p>)
        : total === 0 ? (<div className="flex flex-col items-center justify-center py-20"><Package size={40} strokeWidth={1} className="text-black/10 mb-4" /><p className="text-[12px] text-black/35">Aucune commande gamme</p></div>)
        : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map(col => (
              <div key={col.key} className={`rounded-[2px] border ${col.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">{col.label}</h3>
                  <span className="text-[20px] font-bold tabular-nums text-black/25">{orders[col.key]?.length ?? 0}</span>
                </div>
                <div className="space-y-3">
                  {orders[col.key]?.map(order => {
                    const items = order.order_items ?? [];
                    const hasSpoon = items.some(it => it.product_name.toLowerCase().includes('cuillère'));
                    if (col.key === 'paid') return <PaidCard key={order.id} order={order} items={items} onUpdate={() => fetchAll(true)} />;
                    const isOverdue = !!order.scheduled_pickup_date && new Date(order.scheduled_pickup_date).getTime() < Date.now();
                    return (
                      <div key={order.id} className={`rounded-[2px] border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${isOverdue ? 'border-red-300 ring-1 ring-red-200' : 'border-noir/[0.06]'}`}>
                        {isOverdue && (
                          <span className="mb-2 inline-flex items-center gap-1 rounded-[2px] bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-red-600">
                            ⚠ En retard
                          </span>
                        )}
                        <p className="text-[14px] font-bold text-black mb-1">{order.client_name || 'Client'}</p>
                        {order.client_phone && <p className="text-[11px] text-black/45 mb-2 flex items-center gap-1"><Phone size={11} />{order.client_phone}</p>}
                        {order.scheduled_pickup_date && (
                          <p className={`text-[11px] font-medium mb-2 ${isOverdue ? 'text-red-600' : 'text-sapin'}`}>
                            🕐 {new Date(order.scheduled_pickup_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(order.scheduled_pickup_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        <div className="mb-3 space-y-0.5">{items.map((item, i) => (<p key={item.id ?? i} className="text-[12px] text-black/60">{item.quantity}× {item.product_name}</p>))}</div>
                        {hasSpoon && <p className="text-[10px] text-purple-500 mb-3">✓ Cuillère doseuse</p>}
                        <p className="text-[14px] font-bold tabular-nums text-black mb-3">{order.total.toFixed(2).replace('.', ',')}€</p>
                        <p className="text-[9px] font-mono text-black/25 mb-3">#{order.id.slice(0, 8)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {col.key === 'scheduled' && <button onClick={() => moveOrder(order.id, 'preparing')} className="rounded-[2px] border border-noir/10 px-3 py-1.5 text-[9px] font-medium text-black/55 hover:bg-noir/[0.04]">Préparer</button>}
                          {col.key === 'preparing' && <button onClick={() => moveOrder(order.id, 'ready')} className="rounded-[2px] border border-noir/10 px-3 py-1.5 text-[9px] font-medium text-black/55 hover:bg-noir/[0.04]">Prête</button>}
                          {col.key === 'ready' && <button onClick={() => markCompleted(order.id)} className="w-full rounded-[2px] bg-sapin px-3 py-1.5 text-[10px] font-medium text-white hover:bg-sapin/90">Remise</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
