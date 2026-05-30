// src/pages/member/History.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Calendar, MapPin, CupSoda } from 'lucide-react';
import { EmptyState } from '@heroui-pro/react';
import { useOrders } from '../../hooks/useOrders';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { MemberPageSkeleton } from '../../components/member/MemberPageSkeleton';

const PAGE_SIZE = 10;

const History = () => {
  useEffect(() => { document.title = 'Mes commandes — PessÓra'; }, []);
  const { pathname } = useLocation();
  const prefix = pathname.startsWith('/demo-espace') ? '/demo-espace' : '/mon-espace';
  const { orders, loading, error, totalThisMonth, topProducts } = useOrders();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;

  return (
    <div>
      <DashPageHeader title="Mes commandes" subtitle="Historique de vos commandes enregistrées." />
      <div className={DASH_MAIN_PAD}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 flex flex-col gap-6">

        {error && (
          <p className="text-[11px] text-red-500/80" role="alert">{error}</p>
        )}

        {loading ? (
          <MemberPageSkeleton rows={6} />
        ) : orders.length === 0 ? (
          <EmptyState className="rounded-[2px] border border-noir/[0.06] bg-white p-10">
            <EmptyState.Header>
              <EmptyState.Title className="text-[13px] font-normal text-black">
                Aucune commande
              </EmptyState.Title>
              <EmptyState.Description className="text-[11px] font-light text-black/40">
                Votre historique de commandes apparaîtra ici.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <>
          <div className="bg-white rounded-[2px] border border-noir/[0.06] overflow-hidden">
            {visibleOrders.map((order, index) => {
              const itemNames = order.order_items.map(i => i.product_name).join(', ');
              const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              });
              return (
                <Link
                  key={order.id}
                  to={`${prefix}/historique/${order.id}`}
                  className={`group flex flex-col sm:flex-row items-start sm:items-center p-6 hover:bg-noir/[0.02] transition-colors duration-200 gap-4 ${
                    index < visibleOrders.length - 1 ? 'border-b border-noir/[0.05]' : ''
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] ${
                      order.status === 'pending' ? 'bg-gold-dim text-white' : 'bg-noir/[0.05] text-black/45'
                    }`}
                    aria-hidden
                  >
                    <CupSoda size={20} strokeWidth={1.35} />
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="text-[13px] font-normal text-black">{itemNames || '—'}</h4>
                    <div className="flex flex-wrap gap-4 text-[10px] font-light text-black/40">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.3} /> {date}
                      </span>
                      {order.pickup_time && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} strokeWidth={1.3} /> Retrait{' '}
                          {new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {(() => {
                      const st = order.status;
                      if (st === 'pending') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-amber-700 border border-amber-200 bg-amber-50 px-2.5 py-1 rounded-[2px]">Paiement en attente</span>;
                      if (st === 'paid') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-blue-700 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-[2px]">Payée</span>;
                      if (st === 'preparing') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-sky-700 border border-sky-200 bg-sky-50 px-2.5 py-1 rounded-[2px]">En préparation</span>;
                      if (st === 'ready') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-sapin border border-sapin/20 bg-sapin/8 px-2.5 py-1 rounded-[2px]">Prêt</span>;
                      if (st === 'completed') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-black/45 border border-black/10 bg-black/[0.04] px-2.5 py-1 rounded-[2px]">Retiré</span>;
                      if (st === 'cancelled') return <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-red-600/60 border border-red-200 bg-red-50 px-2.5 py-1 rounded-[2px]">Annulé</span>;
                      return null;
                    })()}
                    <p className="text-[15px] font-normal text-black">
                      {order.total.toFixed(2).replace('.', ',')}€
                    </p>
                    <ChevronRight size={15} strokeWidth={1.3} className="text-black/20 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
                  </div>
                </Link>
              );
            })}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="self-start rounded-[2px] border border-noir/15 px-5 py-3 min-h-[44px] inline-flex items-center text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 hover:border-noir/30 hover:text-noir transition-colors"
            >
              Charger plus ({orders.length - visibleCount} restantes)
            </button>
          )}
          </>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-surface-muted rounded-[2px] p-8 border border-noir/[0.06]">
          <p className="text-[9px] font-normal uppercase tracking-[0.25em] text-black/50 mb-3">
            Total ({monthLabel})
          </p>
          <p
            className="font-display font-normal text-noir leading-none mb-6"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
          >
            {totalThisMonth.toFixed(2).replace('.', ',')}€
          </p>
          <div className="border-t border-noir/[0.06] pt-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-light text-black/45">Commandes</span>
              <span className="text-[13px] font-normal text-noir">{orders.length}</span>
            </div>
            {orders.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-light text-black/45">Moyenne</span>
                <span className="text-[13px] font-normal text-noir">
                  {(orders.reduce((s, o) => s + o.total, 0) / orders.length).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            )}
          </div>
        </div>

        {!loading && topProducts.length > 0 && (
          <div className="bg-white rounded-[2px] p-6 border border-noir/[0.06]">
            <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50 mb-5">
              Produits favoris
            </p>
            <div className="flex flex-col divide-y divide-black/[0.05]">
              {topProducts.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-normal text-black/25 tabular-nums w-5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px] font-normal text-black">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-normal text-black/50">{item.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

export default History;
