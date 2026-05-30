import { AdminOrderCard } from './AdminOrderCard';
import type { OrderWithItems } from '../../hooks/useOrders';

interface AdminOrdersListProps {
  orders: OrderWithItems[];
  loading: boolean;
  onStatusUpdate: (orderId: string, nextStatus: string) => void;
}

const PRIORITY_ORDER: Record<string, number> = {
  paid: 0,
  preparing: 1,
  ready: 2,
};

export function AdminOrdersList({ orders, loading, onStatusUpdate }: AdminOrdersListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[2px] border border-noir/[0.06] bg-white px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="h-[38px] w-[38px] rounded-[2px] bg-noir/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-noir/[0.06]" />
                <div className="h-3 w-1/2 rounded bg-noir/[0.04]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] font-light text-black/35">Aucune commande trouvée</p>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.status] ?? 99;
    const pb = PRIORITY_ORDER[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((order) => (
        <AdminOrderCard
          key={order.id}
          order={order}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  );
}
