import { Search } from 'lucide-react';
import { cn } from '@heroui/react';
import type { OrderFilterStatus } from '../../hooks/useAdminOrders';

const FILTER_TABS: { key: OrderFilterStatus; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'paid', label: 'En attente' },
  { key: 'preparing', label: 'En prépa' },
  { key: 'ready', label: 'Prêtes' },
  { key: 'completed', label: 'Terminées' },
];

interface AdminOrdersFilterProps {
  filterStatus: OrderFilterStatus;
  onFilterChange: (status: OrderFilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AdminOrdersFilter({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: AdminOrdersFilterProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterChange(tab.key)}
            className={cn(
              'rounded-[2px] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
              filterStatus === tab.key
                ? 'bg-sapin text-white'
                : 'bg-surface-muted text-black/45 hover:bg-noir/[0.06] hover:text-black',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative min-w-0 sm:w-56">
        <Search size={14} strokeWidth={1.3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" aria-hidden />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-[2px] border border-noir/[0.08] bg-surface-muted py-2 pl-9 pr-3 text-[11px] font-light text-black placeholder:text-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20"
        />
      </div>
    </div>
  );
}
