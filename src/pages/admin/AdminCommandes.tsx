import { useState, useEffect, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { DashPageHeader, DashCard } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminOrdersFilter } from '../../components/admin/AdminOrdersFilter';
import type { OrderTypeFilter } from '../../components/admin/AdminOrdersFilter';
import { AdminOrdersList } from '../../components/admin/AdminOrdersList';
import { useAdminOrders, type OrderFilterStatus } from '../../hooks/useAdminOrders';
import { playNewOrderSound, playPaidSound, setMuted, isMuted } from '../../lib/notificationSound';
import { auditLog } from '../../lib/auditLog';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '../../lib/supabaseClient';

const AdminCommandes = () => {
  const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderTypeFilter>('all');
  const [soundMuted, setSoundMuted] = useState(isMuted());
  const { orders, loading, kpis, newOrderAlert, clearAlert, paidAlert, clearPaidAlert } = useAdminOrders(filterStatus);

  const kpisFiltered = useMemo(() => ({
    paid: orders.filter((o) => o.status === 'paid' && (orderType === 'all' || o.order_type === orderType)).length,
    preparing: orders.filter((o) => o.status === 'preparing' && (orderType === 'all' || o.order_type === orderType)).length,
    ready: orders.filter((o) => o.status === 'ready' && (orderType === 'all' || o.order_type === orderType)).length,
    todayCompleted: orders.filter((o) => {
      if (o.status !== 'completed') return false;
      if (orderType !== 'all' && o.order_type !== orderType) return false;
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    todayRevenue: orders
      .filter((o) => {
        if (o.status !== 'completed') return false;
        if (orderType !== 'all' && o.order_type !== orderType) return false;
        const d = new Date(o.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0),
  }), [orders, orderType]);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    setMuted(next);
  };

  useEffect(() => {
    document.title = 'Commandes — Admin PessÓra';
  }, []);

  useEffect(() => {
    if (newOrderAlert) {
      playNewOrderSound();
      const timer = setTimeout(() => clearAlert(), 6000);
      return () => clearTimeout(timer);
    }
  }, [newOrderAlert, clearAlert]);

  useEffect(() => {
    if (paidAlert) {
      playPaidSound();
      const timer = setTimeout(() => clearPaidAlert(), 6000);
      return () => clearTimeout(timer);
    }
  }, [paidAlert, clearPaidAlert]);

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('orders')
      .update({
        status: nextStatus,
        ...(nextStatus === 'completed' ? { picked_up_at: new Date().toISOString() } : {}),
      })
      .eq('id', orderId);

    auditLog({
      action: 'order.status_change',
      entity_type: 'order',
      entity_id: orderId,
      details: { new_status: nextStatus },
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    await supabase.functions.invoke('delete-order', {
      body: { orderId },
    });
    auditLog({
      action: 'order.delete',
      entity_type: 'order',
      entity_id: orderId,
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (orderType !== 'all' && o.order_type !== orderType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const items = o.order_items ?? [];
    const itemNames = items.map((it) => it.product_name.toLowerCase()).join(' ');
    return (
      o.id.toLowerCase().includes(q) ||
      itemNames.includes(q)
    );
  });

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Commandes"
        subtitle="Gérez les commandes en cours et l'historique"
      />

      <div className={DASH_MAIN_PAD}>
        {newOrderAlert && (
          <div className="mb-4 animate-in slide-in-from-right-5 fade-in duration-300 flex items-center justify-between rounded-[2px] border border-sapin-muted bg-sapin-subtle px-5 py-3">
            <div>
              <p className="text-[12px] font-medium text-sapin">Nouvelle commande</p>
              <p className="text-[11px] text-sapin/70">
                {(newOrderAlert.order_items ?? []).map((it) => `${it.quantity}× ${it.product_name}`).join(', ') || '—'}
                {' · '}
                {newOrderAlert.total.toFixed(2).replace('.', ',')}€
              </p>
            </div>
            <button
              type="button"
              onClick={clearAlert}
              className="text-[10px] uppercase tracking-[0.1em] text-sapin/60 hover:text-sapin"
            >
              Fermer
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'En attente', value: kpisFiltered.paid, color: 'text-blue-600' },
            { label: 'En prépa', value: kpisFiltered.preparing, color: 'text-sky-600' },
            { label: 'Prêtes', value: kpisFiltered.ready, color: 'text-sapin' },
            { label: 'Retirées auj.', value: kpisFiltered.todayCompleted, color: 'text-black/60' },
            { label: 'CA du jour', value: `${kpisFiltered.todayRevenue.toFixed(0)}€`, color: 'text-black' },
          ].map((kpi) => (
            <DashCard key={kpi.label} pad={14} className="text-center">
              <p className="text-[9px] font-normal uppercase tracking-[0.14em] text-black/35">{kpi.label}</p>
              <p className={`mt-1 font-display text-[28px] tabular-nums leading-none ${kpi.color}`}>
                {kpi.value}
              </p>
            </DashCard>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <AdminOrdersFilter
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <button
            type="button"
            onClick={toggleSound}
            className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-noir/[0.08] px-3 py-2 text-[10px] font-normal uppercase tracking-[0.08em] text-black/45 hover:border-noir/20 hover:text-noir transition-colors"
            title={soundMuted ? 'Activer le son' : 'Couper le son'}
          >
            {soundMuted ? <VolumeX size={14} strokeWidth={1.3} /> : <Volume2 size={14} strokeWidth={1.3} />}
            <span className="hidden sm:inline">{soundMuted ? 'Son off' : 'Son on'}</span>
          </button>
        </div>

        <AdminOrdersList
          orders={filteredOrders}
          loading={loading}
          onStatusUpdate={handleStatusUpdate}
          onDeleteOrder={handleDeleteOrder}
        />
      </div>
    </div>
  );
};

export default AdminCommandes;
