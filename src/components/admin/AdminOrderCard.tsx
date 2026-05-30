import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CupSoda, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { cn } from '@heroui/react';
import type { OrderWithItems } from '../../hooks/useOrders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente de paiement',
  paid: 'Payée',
  preparing: 'En préparation',
  ready: 'Prêt',
  completed: 'Retiré',
  cancelled: 'Annulé',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string } | null> = {
  pending: null,
  paid: { label: 'Préparer', next: 'preparing' },
  preparing: { label: 'Marquer prêt', next: 'ready' },
  ready: { label: 'Retiré', next: 'completed' },
  completed: null,
  cancelled: null,
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border border-blue-200',
  preparing: 'bg-sky-50 text-sky-700 border border-sky-200',
  ready: 'bg-sapin-subtle text-sapin border border-sapin-muted',
  completed: 'bg-noir/[0.04] text-black/40',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
};

interface AdminOrderCardProps {
  order: OrderWithItems;
  onStatusUpdate: (orderId: string, nextStatus: string) => void;
}

export function AdminOrderCard({ order, onStatusUpdate }: AdminOrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const items = order.order_items ?? [];
  const itemNames = items.map((it) => `${it.quantity}× ${it.product_name}`).join(', ');
  const pickupLabel = order.pickup_time
    ? new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const dateLabel = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const action = STATUS_ACTIONS[order.status];

  return (
    <div className="rounded-[2px] border border-noir/[0.08] bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[2px] bg-noir/[0.05]">
          <CupSoda size={18} strokeWidth={1.35} className="text-black/45" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-black">{itemNames || '—'}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-black/45">
            <span>{dateLabel}</span>
            <span>Retrait {pickupLabel}</span>
            <span>{order.total.toFixed(2).replace('.', ',')}€</span>
            {order.user_id && (
              <span className="font-mono text-[9.5px]">#{order.user_id.slice(0, 8)}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('inline-block rounded-[2px] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em]', STATUS_BADGE_CLASS[order.status] ?? 'bg-noir/[0.04] text-black/40')}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          {expanded ? (
            <ChevronUp size={14} strokeWidth={1.3} className="text-black/35" />
          ) : (
            <ChevronDown size={14} strokeWidth={1.3} className="text-black/35" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-noir/[0.06] px-5 py-4">
          <div className="mb-4 space-y-1.5">
            {items.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center justify-between text-[12px]">
                <span className="text-black/70">
                  {item.quantity}× {item.product_name}
                </span>
                <span className="tabular-nums text-black/50">
                  {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            ))}
            <div className="border-t border-noir/[0.06] pt-1.5 flex justify-between text-[12px] font-medium">
              <span className="text-black">Total</span>
              <span className="tabular-nums text-black">{order.total.toFixed(2).replace('.', ',')}€</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {action && (
              <button
                type="button"
                onClick={() => onStatusUpdate(order.id, action.next)}
                className="min-h-[36px] rounded-[2px] border border-noir/15 px-4 py-1.5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 hover:border-noir/30 hover:text-noir transition-colors"
              >
                {action.label}
              </button>
            )}
            {order.user_id && (
              <Link
                to={`/admin/membres/${order.user_id}`}
                className="min-h-[36px] rounded-[2px] border border-noir/[0.08] px-4 py-1.5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45 hover:border-noir/20 hover:text-noir transition-colors inline-flex items-center"
              >
                Voir le membre
              </Link>
            )}
            {order.user_id && (
              <span className="flex items-center gap-1 text-[10.5px] text-black/35">
                <Phone size={11} strokeWidth={1.3} className="text-black/30" />
                Contact
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
