import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { motionInitial, motionTransition } from '../../lib/motionReveal';
import { Clock, User, ChevronRight, CupSoda, ArrowLeft } from 'lucide-react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { playNewOrderSound, playPaidSound } from '../../lib/notificationSound';
import { supabase } from '../../lib/supabaseClient';
import { auditLog } from '../../lib/auditLog';
import type { OrderWithItems } from '../../hooks/useOrders';

const OVERDUE_MINUTES = 15;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ModeBar() {
  const reduceMotion = useReducedMotion();
  const { orders: allOrders, loading, newOrderAlert, clearAlert, paidAlert, clearPaidAlert } =
    useAdminOrders('all');

  //  state local pour mises a jour optimistes (evite le delai de polling)
  const [localOrders, setLocalOrders] = useState<OrderWithItems[]>([]);

  // Sync avec useAdminOrders (evite de perdre les ajouts Realtime)
  useEffect(() => {
    setLocalOrders((prev) => {
      const prevIds = new Set(prev.map((o) => o.id));
      const fresh = allOrders.filter((o) => !prevIds.has(o.id));
      // Merge: garde les updates optimistes locales, ajoute les nouveaux
      const merged = prev.map((o) => {
        const updated = allOrders.find((a) => a.id === o.id);
        return updated ?? o;
      });
      for (const f of fresh) merged.unshift(f);
      return merged;
    });
  }, [allOrders]);

  // Filtrer : seulement paid + preparing
  const orders = localOrders.filter(
    (o) => o.order_type === 'bar' && (o.status === 'paid' || o.status === 'preparing')
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const prevCountRef = useRef(orders.length);

  // Sons sur nouvelles commandes
  useEffect(() => {
    if (newOrderAlert) {
      playNewOrderSound();
      clearAlert();
    }
  }, [newOrderAlert, clearAlert]);

  useEffect(() => {
    if (paidAlert) {
      playPaidSound();
      clearPaidAlert();
    }
  }, [paidAlert, clearPaidAlert]);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset index si la liste change
  useEffect(() => {
    if (orders.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= orders.length) {
      setCurrentIndex(0);
    }
    prevCountRef.current = orders.length;
  }, [orders.length, currentIndex]);

  useEffect(() => {
    document.title = 'Mode Bar — PessÓra';
  }, []);

  const handleStartPrep = async (orderId: string) => {
    setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'preparing' as const } : o)));
    await (supabase as any).from('orders').update({ status: 'preparing' }).eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: 'preparing' } });
  };

  const handleMarkReady = async (orderId: string) => {
    setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'ready' as const } : o)));
    setCurrentIndex((prev) => (prev < orders.length - 1 ? prev + 1 : 0));
    await (supabase as any).from('orders').update({ status: 'ready' }).eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: 'ready' } });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < orders.length - 1 ? prev + 1 : 0));
  };

  const clockDisplay = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noir">
        <p className="text-white/40 text-sm">Chargement…</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-noir px-4">
        <CupSoda size={64} strokeWidth={1} className="text-white/15 mb-6" />
        <p className="text-2xl font-bold text-white md:text-3xl">Aucune commande en cours</p>
        <p className="mt-3 text-base text-white/35">En attente de nouvelles commandes…</p>
        <Link
          to="/admin/commandes"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm text-white/60 hover:bg-white/15 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const current = orders[currentIndex] as OrderWithItems;
  if (!current) return null;

  const items = current.order_items ?? [];
  const pickupLabel = current.pickup_time
    ? new Date(current.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const createdAtLabel = new Date(current.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const elapsedSeconds = current.status === 'preparing'
    ? Math.floor((now.getTime() - new Date(current.created_at).getTime()) / 1000)
    : 0;
  const isOverdue = elapsedSeconds > OVERDUE_MINUTES * 60;

  return (
    <div className="min-h-screen bg-noir text-white">
      {/* Top bar */}
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
            <h1 className="text-lg font-bold tracking-tight md:text-xl">Mode Bar</h1>
            <p className="text-xs text-white/35">
              {currentIndex + 1} / {orders.length} commande{orders.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums text-sapin md:text-4xl">{clockDisplay}</p>
      </div>

      <div className="md:grid md:grid-cols-[200px_1fr] md:h-[calc(100vh-69px)]">
        {/* Sidebar — liste des commandes */}
        <div className="hidden md:flex md:flex-col border-r border-white/[0.06] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {orders.map((order, i) => {
              const pickup = order.pickup_time
                ? new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <button
                  key={order.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full text-left px-3 py-3 border-b border-white/[0.04] transition-colors ${
                    i === currentIndex
                      ? 'bg-sapin/20 border-l-2 border-l-sapin'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <p className="font-medium text-white text-xs truncate">
                    {order.client_name || 'Client'}
                  </p>
                  <p className="text-white/30 text-[10px] mt-0.5">Retrait {pickup}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-[0.1em] ${
                        order.status === 'preparing'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-sapin/20 text-sapin-light'
                      }`}
                    >
                      {order.status === 'preparing' ? 'En prép.' : 'À faire'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main — commande en cours */}
        <div className="flex items-center justify-center p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={motionInitial(reduceMotion, { opacity: 0, x: 40 })}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={motionTransition(reduceMotion, { duration: 0.25 })}
              className="w-full max-w-lg"
            >
              {/* Carte commande */}
              <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] p-6 md:p-8 border-2 border-sapin/60">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold mb-3">
                    {current.client_name || 'Client'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} strokeWidth={1.3} className="text-sapin-light shrink-0" />
                      Retrait {pickupLabel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={15} strokeWidth={1.3} className="text-sapin-light shrink-0" />
                      Commande à {createdAtLabel}
                    </span>
                    <span className="text-white/35 font-mono text-xs">#{current.id.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-6">
                  {items.map((item, i) => (
                    <div
                      key={item.id ?? i}
                      className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3"
                    >
                      <div>
                        <p className="text-lg font-bold">
                          {item.quantity}x {item.product_name}
                        </p>
                      </div>
                      <span className="text-lg tabular-nums text-white/60">
                        {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}€
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-white/[0.08] pt-3 px-1">
                    <span className="text-sm font-medium text-white/60">Total</span>
                    <span className="text-lg font-bold tabular-nums">
                      {current.total.toFixed(2).replace('.', ',')}€
                    </span>
                  </div>
                </div>

                {/* Timer — si en préparation */}
                {current.status === 'preparing' && (
                  <div
                    className={`rounded-xl p-4 mb-6 border ${
                      isOverdue
                        ? 'bg-red-500/15 border-red-500/40 animate-pulse'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <p className="text-lg font-bold text-center tabular-nums">
                      {isOverdue ? 'Délai dépassé — ' : ''}
                      <span className={`font-mono text-2xl ${isOverdue ? 'text-red-400' : 'text-amber-300'}`}>
                        {formatTimer(elapsedSeconds)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {current.status === 'paid' ? (
                    <>
                      <button
                        onClick={() => handleStartPrep(current.id)}
                        className="flex-1 min-h-[56px] bg-sapin hover:bg-sapin/85 active:bg-sapin/70 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                      >
                        Commencer la préparation
                      </button>
                      <button
                        onClick={handleNext}
                        className="min-h-[56px] bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.15] text-white px-6 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                      >
                        Suivante <ChevronRight size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleMarkReady(current.id)}
                        className="flex-1 min-h-[56px] bg-sapin hover:bg-sapin/85 active:bg-sapin/70 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                      >
                        Marquer comme PRÊTE
                      </button>
                      <button
                        onClick={handleNext}
                        className="min-h-[56px] bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.15] text-white px-6 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                      >
                        Suivante <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom bar — liste rapide */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-noir border-t border-white/[0.06] px-3 py-2 flex gap-1.5 overflow-x-auto">
        {orders.map((order, i) => (
          <button
            key={order.id}
            onClick={() => setCurrentIndex(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${
              i === currentIndex
                ? 'bg-sapin text-white'
                : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.08]'
            }`}
          >
            {order.client_name || 'Client'}
          </button>
        ))}
      </div>
    </div>
  );
}
