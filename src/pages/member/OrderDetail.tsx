import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, CupSoda } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { MemberPageSkeleton } from '../../components/member/MemberPageSkeleton';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
        <div className="mb-6 flex flex-wrap items-center gap-4 border border-noir/[0.06] bg-white p-6 rounded-[2px]">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] ${
              order.status === 'pending' ? 'bg-gold-dim text-white' : 'bg-noir/[0.05] text-black/45'
            }`}
            aria-hidden
          >
            <CupSoda size={22} strokeWidth={1.35} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] text-black tabular-nums">
              {order.total.toFixed(2).replace('.', ',')} €
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-black/40">
              <Calendar size={12} strokeWidth={1.3} aria-hidden />
              {order.status === 'completed' ? (
                <span className="text-sapin">Terminée</span>
              ) : order.status === 'pending' ? (
                <span className="text-amber-700">En attente</span>
              ) : order.status === 'cancelled' ? (
                <span className="text-red-600/60">Annulée</span>
              ) : (
                STATUS_LABEL[order.status] ?? order.status
              )}
            </p>
          </div>
        </div>

        <div className="border border-noir/[0.06] bg-white rounded-[2px] overflow-hidden">
          <p className="text-[9px] font-normal uppercase tracking-[0.22em] text-black/35 px-6 pt-6 pb-2">
            Articles
          </p>
          <ul className="divide-y divide-black/[0.05]">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <span className="text-[13px] text-black">{item.product_name}</span>
                <span className="text-[11px] tabular-nums text-black/45">
                  {item.quantity} × {item.price_at_time.toFixed(2).replace('.', ',')} €
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
