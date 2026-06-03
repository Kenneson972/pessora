import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, CupSoda, Clock, CreditCard, ChefHat, CheckCircle, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrders } from '../../hooks/useOrders';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { MemberPageSkeleton } from '../../components/member/MemberPageSkeleton';

const STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Clock },
  { key: 'paid', label: 'Paiement confirmé', icon: CreditCard },
  { key: 'preparing', label: 'En préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête !', icon: CheckCircle },
  { key: 'completed', label: 'Retirée', icon: Package },
];

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { pathname } = useLocation();
  const prefix = pathname.startsWith('/demo-espace') ? '/demo-espace' : '/mon-espace';
  const { orders, loading, error } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  if (loading) {
    return (
      <div>
        <DashPageHeader title="Commande" subtitle="Détail de votre commande." />
        <div className={DASH_MAIN_PAD}>
          <MemberPageSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <DashPageHeader title="Commande" subtitle="Détail de votre commande." />
        <div className={DASH_MAIN_PAD}>
          <p className="text-[12px] text-black/45 mb-4" role="alert">
            {error ?? 'Commande introuvable ou vous n&apos;y avez pas accès.'}
          </p>
          <Link
            to={`${prefix}/historique`}
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/55 hover:text-noir"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Retour à l&apos;historique
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const items = order.order_items ?? [];
  const isDone = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div>
      <DashPageHeader
        title="Commande"
        subtitle={`Passée le ${dateStr}`}
        action={
          <Link
            to={`${prefix}/historique`}
            className="inline-flex items-center gap-2 rounded-full border border-noir/15 px-4 py-[10px] text-[13px] font-medium text-black/55 hover:text-noir hover:border-noir/30 transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Historique
          </Link>
        }
      />
      <div className={DASH_MAIN_PAD}>
        {/* En-tête */}
        <div className="mb-6 flex flex-wrap items-center gap-4 border border-noir/[0.06] bg-white p-6 rounded-[2px]">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] ${order.status === 'pending' ? 'bg-gold-dim text-white' : 'bg-noir/[0.05] text-black/45'}`} aria-hidden>
            <CupSoda size={22} strokeWidth={1.35} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] text-black tabular-nums">{order.total.toFixed(2).replace('.', ',')} €</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-black/40">
              <Calendar size={12} strokeWidth={1.3} aria-hidden />
              {isDone ? <span className="text-sapin">Terminée</span>
              : isCancelled ? <span className="text-red-600/60">Annulée</span>
              : <span className="text-amber-700">{order.status === 'paid' ? 'Payée' : order.status === 'preparing' ? 'En préparation' : order.status === 'ready' ? 'Prête' : 'En attente'}</span>}
              {order.order_type === 'gamme' && (
                <span className="ml-2 inline-block rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em]">Gamme</span>
              )}
            </p>
            {order.order_type === 'gamme' && order.scheduled_pickup_date && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-black/50">
                <Calendar size={13} strokeWidth={1.3} className="text-sapin-light" />
                Retrait le {new Date(order.scheduled_pickup_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' à '}{new Date(order.scheduled_pickup_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="mb-6 border border-noir/[0.06] bg-white rounded-[2px] p-6">
            <p className="mb-5 text-[9px] font-medium uppercase tracking-[0.2em] text-black/35">Progression</p>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const isCurrent = i === currentIdx;
                const isPast = i < currentIdx;
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-start gap-4 border-l-2 py-3 pl-5 ${isCurrent ? 'border-l-sapin' : isPast ? 'border-l-sapin/25' : 'border-l-noir/[0.06]'}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? 'bg-sapin text-white' : isPast ? 'bg-sapin-subtle text-sapin' : 'bg-noir/[0.04] text-black/20'}`}>
                      <StepIcon size={15} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className={`text-[13px] ${isCurrent ? 'font-bold text-black' : isPast ? 'font-medium text-black/60' : 'font-light text-black/25'}`}>
                        {step.key === 'ready' && isCurrent ? 'Prête ! Passez la chercher au comptoir' : step.label}
                      </p>
                      {isCurrent && !isDone && (
                        <p className="mt-0.5 text-[10px] font-medium text-sapin/70 animate-pulse">En cours…</p>
                      )}
                      {isPast && <p className="mt-0.5 text-[9px] font-medium text-sapin/40">✓ Terminé</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mb-6 rounded-[2px] border border-red-200 bg-red-50/80 px-5 py-4 text-center">
            <p className="text-[14px] font-medium text-red-700">Commande annulée</p>
            <p className="mt-1 text-[12px] text-red-500/80">Cette commande n&apos;a pas abouti.</p>
          </div>
        )}

        {/* Articles */}
        <div className="border border-noir/[0.06] bg-white rounded-[2px] overflow-hidden">
          <p className="text-[9px] font-normal uppercase tracking-[0.22em] text-black/35 px-6 pt-6 pb-2">Articles</p>
          <ul className="divide-y divide-black/[0.05]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <span className="text-[13px] text-black">{item.product_name}</span>
                <span className="text-[11px] tabular-nums text-black/45">{item.quantity} × {item.price_at_time.toFixed(2).replace('.', ',')} €</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
