# AdminCommandes + Notifs temps réel — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Page admin `/admin/commandes` dédiée avec recherche, filtres, actions par statut, KPIs, et notifications temps réel (Supabase Realtime + audio).

**Architecture:** Hook `useAdminOrders` fédère le fetch Supabase + souscription Realtime. Composants `AdminOrdersFilter`, `AdminOrderCard`, `AdminOrdersList` encapsulent l'UI. La page `AdminCommandes` orchestre le tout. Audio optionnel via élément HTML5.

**Tech Stack:** React 19, TypeScript strict, Supabase Realtime, Framer Motion (AnimatePresence), HeroUI, Lucide icons, composants dashboard primitives existants.

---

### Task 1: Hook `useAdminOrders` — fetch + Realtime

**Files:**
- Create: `src/hooks/useAdminOrders.ts`

- [ ] **Step 1: Écrire le hook complet**

```typescript
// src/hooks/useAdminOrders.ts
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithItems } from './useOrders';

export type OrderFilterStatus = 'all' | 'paid' | 'preparing' | 'ready' | 'completed';

export function useAdminOrders(filterStatus: OrderFilterStatus = 'all') {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<OrderWithItems | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let query = db
      .from('orders')
      .select('*, order_items(*)')
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        query = query.in('status', ['completed', 'cancelled']);
      } else {
        query = query.eq('status', filterStatus);
      }
    }

    query.then(({ data, error }: { data: OrderWithItems[] | null; error: { message: string } | null }) => {
      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[useAdminOrders]', error.message);
      } else {
        setOrders(data ?? []);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filterStatus]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as OrderWithItems;
          if (newOrder.status !== 'pending') {
            setNewOrderAlert(newOrder);
            setOrders((prev) => [newOrder, ...prev]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearAlert = () => setNewOrderAlert(null);

  const kpis = {
    paid: orders.filter((o) => o.status === 'paid').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    todayCompleted: orders.filter((o) => {
      if (o.status !== 'completed') return false;
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    todayRevenue: orders
      .filter((o) => {
        if (o.status !== 'completed') return false;
        const d = new Date(o.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0),
    activeCount: orders.filter((o) => ['paid', 'preparing', 'ready'].includes(o.status)).length,
  };

  return { orders, loading, kpis, newOrderAlert, clearAlert };
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminOrders.ts
git commit -m "feat: hook useAdminOrders — fetch + Supabase Realtime + KPIs"
```

---

### Task 2: Composant `AdminOrdersFilter`

**Files:**
- Create: `src/components/admin/AdminOrdersFilter.tsx`

- [ ] **Step 1: Écrire le composant**

```typescript
// src/components/admin/AdminOrdersFilter.tsx
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
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminOrdersFilter.tsx
git commit -m "feat: AdminOrdersFilter — tabs statut + recherche texte"
```

---

### Task 3: Composant `AdminOrderCard`

**Files:**
- Create: `src/components/admin/AdminOrderCard.tsx`

- [ ] **Step 1: Écrire le composant**

```typescript
// src/components/admin/AdminOrderCard.tsx
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
                WhatsApp
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminOrderCard.tsx
git commit -m "feat: AdminOrderCard — carte commande expand/collapse + actions statut"
```

---

### Task 4: Composant `AdminOrdersList`

**Files:**
- Create: `src/components/admin/AdminOrdersList.tsx`

- [ ] **Step 1: Écrire le composant**

```typescript
// src/components/admin/AdminOrdersList.tsx
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
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminOrdersList.tsx
git commit -m "feat: AdminOrdersList — liste triée priorité + skeleton loading"
```

---

### Task 5: Son de notification

**Files:**
- Create: `public/sounds/new-order.mp3`

- [ ] **Step 1: Générer le fichier son**

Notes pour l'implémenteur : le son doit être un court ping discret (environ 500ms, tonalité douce, pas agressif). Comme on ne peut pas générer un vrai MP3 dans ce plan, on crée un placeholder et on utilisera un son HTML5 Web Audio API tone en fallback.

On va plutôt utiliser l'API Web Audio pour générer le son programmatiquement — pas de fichier externe nécessaire.

- [ ] **Step 2: Créer le module de son**

Create: `src/lib/notificationSound.ts`

```typescript
// src/lib/notificationSound.ts
let audioCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted(): boolean {
  return muted;
}

export function playNewOrderSound() {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    osc.frequency.setValueAtTime(660, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // AudioContext non disponible (ex: navigateur bloque l'autoplay)
  }
}
```

- [ ] **Step 3: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 4: Commit**

```bash
git add src/lib/notificationSound.ts
git commit -m "feat: notificationSound — ping discret via Web Audio API"
```

---

### Task 6: Page `AdminCommandes`

**Files:**
- Create: `src/pages/admin/AdminCommandes.tsx`

- [ ] **Step 1: Écrire la page**

```typescript
// src/pages/admin/AdminCommandes.tsx
import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { DashPageHeader, DashCard } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminOrdersFilter } from '../../components/admin/AdminOrdersFilter';
import { AdminOrdersList } from '../../components/admin/AdminOrdersList';
import { useAdminOrders, type OrderFilterStatus } from '../../hooks/useAdminOrders';
import { playNewOrderSound, setMuted, isMuted } from '../../lib/notificationSound';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '../../lib/supabaseClient';

const AdminCommandes = () => {
  const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundMuted, setSoundMuted] = useState(isMuted());
  const { orders, loading, kpis, newOrderAlert, clearAlert } = useAdminOrders(filterStatus);

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

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('orders')
      .update({
        status: nextStatus,
        ...(nextStatus === 'completed' ? { picked_up_at: new Date().toISOString() } : {}),
      })
      .eq('id', orderId);
  };

  const filteredOrders = orders.filter((o) => {
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
        {/* Notifications toast */}
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

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'En attente', value: kpis.paid, color: 'text-blue-600' },
            { label: 'En prépa', value: kpis.preparing, color: 'text-sky-600' },
            { label: 'Prêtes', value: kpis.ready, color: 'text-sapin' },
            { label: 'Retirées auj.', value: kpis.todayCompleted, color: 'text-black/60' },
            { label: 'CA du jour', value: `${kpis.todayRevenue.toFixed(0)}€`, color: 'text-black' },
          ].map((kpi) => (
            <DashCard key={kpi.label} pad={14} className="text-center">
              <p className="text-[9px] font-normal uppercase tracking-[0.14em] text-black/35">{kpi.label}</p>
              <p className={`mt-1 font-display text-[28px] tabular-nums leading-none ${kpi.color}`}>
                {kpi.value}
              </p>
            </DashCard>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <AdminOrdersFilter
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
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

        {/* Orders list */}
        <AdminOrdersList
          orders={filteredOrders}
          loading={loading}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </div>
  );
};

export default AdminCommandes;
```

- [ ] **Step 2: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: pas d'erreurs.

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: `✓ built in X.XXs`

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminCommandes.tsx
git commit -m "feat: AdminCommandes — page avec KPIs, filtres, liste, notifs toast + son"
```

---

### Task 7: Ajouter la route dans `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Ajouter l'import lazy et la route**

Find: `const AdminBilans = lazy(`
Add before:
```typescript
const AdminCommandes = lazy(() => import('./pages/admin/AdminCommandes'));
```

Find: `{/* ── Commandes ──}` or the route section after bilans. Add after the `/admin/bilans` route block:
```tsx
            <Route path="/admin/commandes" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminCommandes /></AdminLayout>
              </ProtectedAdminRoute>
            } />
```

- [ ] **Step 2: Vérifier TypeScript + Build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep "✓ built"`
Expected: TypeScript clean, `✓ built in X.XXs`

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route /admin/commandes → AdminCommandes"
```

---

### Task 8: Ajouter le lien sidebar + badge dans `AdminLayout`

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Ajouter "Commandes" dans la navigation**

Find:
```typescript
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Images } from 'lucide-react';
```

Replace with (adding `ClipboardList`):
```typescript
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Images, ClipboardList } from 'lucide-react';
```

In the `NAV` array, add after Bilans:
```typescript
  { label: 'Commandes', shortLabel: 'Cmd.', icon: ClipboardList, path: '/admin/commandes' },
```

- [ ] **Step 2: Vérifier TypeScript + Build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep "✓ built"`
Expected: TypeScript clean, build OK.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx
git commit -m "feat: lien Commandes dans la sidebar admin"
```

---

### Task 9: Alléger la section "Commandes en cours" de l'Overview (optionnel)

**Files:**
- Modify: `src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Simplifier la section commandes**

Remplacer toute la section "Commandes en cours" (le bloc complet `{pendingOrders.length > 0 ? (...)}`) par un lien vers la nouvelle page :

```tsx
          {/* ── Navigation rapide ─────────── */}
          <div className="col-span-1 md:col-span-12">
            <DashCard pad={22} className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-[22px]">
                  Accès <em className="italic">rapide</em>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Membres', to: '/admin/membres' },
                  { label: 'Commandes', to: '/admin/commandes' },
                  { label: 'Produits', to: '/admin/produits-gammes' },
                  { label: 'Bilans', to: '/admin/bilans' },
                  { label: 'Événements', to: '/admin/evenements' },
                  { label: 'Communication', to: '/admin/communication' },
                ].map((lnk) => (
                  <Link
                    key={lnk.to}
                    to={lnk.to}
                    className="flex items-center justify-between rounded-[2px] bg-surface-muted px-3 py-[10px] text-[11px] font-medium text-black/60 hover:text-noir hover:bg-noir/[0.06] transition-colors"
                  >
                    {lnk.label} <ArrowUpRight size={12} />
                  </Link>
                ))}
              </div>
            </DashCard>
          </div>
```

- [ ] **Step 2: Nettoyer le code mort**

Supprimer les variables/fonctions devenues inutilisées : `pendingOrders`, `handleOrderAction`, `STATUS_ACTIONS`, `STATUS_LABELS` (si plus référencées). Supprimer la query `orders` du `Promise.all` si elle n'est plus utilisée ailleurs.

- [ ] **Step 3: Vérifier TypeScript + Build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep "✓ built"`
Expected: TypeScript clean, build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminOverview.tsx
git commit -m "refactor: alléger AdminOverview — commandes déléguées à /admin/commandes"
```

---

### Task 10: Vérification finale et nettoyage

- [ ] **Step 1: Vérifier TypeScript global**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 2: Vérifier le build production**

Run: `npm run build`
Expected: `✓ built in X.XXs`

- [ ] **Step 3: Vérifier visuellement la page**

Run: le serveur dev sur `localhost:3000`, naviguer vers `/admin/commandes`.
Vérifier : la page charge, les KPIs s'affichent, la liste des commandes est visible, les filtres fonctionnent, le toggle son est présent.

- [ ] **Step 4: Commit final si changements**

```bash
git add -A
git commit -m "chore: vérification finale AdminCommandes"
```
