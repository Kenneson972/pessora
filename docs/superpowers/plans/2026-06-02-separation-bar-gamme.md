# Séparation Bar/Gamme — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Séparer les flux de commandes boissons (bar, immédiat) et gammes Herbalife (retrait ≥J+1, calendrier) avec split automatique au checkout.

**Architecture:** Migration DB (order_type + scheduled_pickup_date), DatePicker dans GammeProductDetail, split automatique dans l'edge function checkout (1 Stripe → 2 orders si mix), filtrage admin (ModeBar bar-only, nouveau RetraitsGamme), onglets membre.

**Tech Stack:** React 19, Supabase (Postgres + Edge Functions Deno), Stripe, Zustand cart store

---

### Task 1: Migration SQL — ajouter order_type et scheduled_pickup_date

**Files:**
- Create: `supabase/migrations/20260602100000_add_order_type.sql`

- [ ] **Step 1: Écrire la migration**

```sql
-- Migration: ajouter order_type et scheduled_pickup_date à orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'bar',
  ADD COLUMN IF NOT EXISTS scheduled_pickup_date TIMESTAMPTZ;

-- Index pour filtrer par type + statut (utilisé par RetraitsGamme et ModeBar)
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status);

-- Index pour le planning gamme (tri par date de retrait)
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_pickup ON orders(scheduled_pickup_date)
  WHERE order_type = 'gamme';
```

- [ ] **Step 2: Appliquer la migration via MCP Supabase**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260602100000_add_order_type.sql
git commit -m "feat: migration — order_type + scheduled_pickup_date sur orders"
```

---

### Task 2: Types database.ts — ajouter les colonnes

**Files:**
- Modify: `src/types/database.ts:163-181`

- [ ] **Step 1: Mettre à jour orders.Row**

Dans `database.ts`, modifier `orders.Row` pour ajouter `order_type` et `scheduled_pickup_date`:

```ts
orders: {
  Row: {
    id: string
    user_id: string | null
    total: number
    status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    order_type: 'bar' | 'gamme'
    pickup_time: string | null
    scheduled_pickup_date: string | null
    picked_up_at: string | null
    stripe_payment_intent_id: string | null
    stripe_session_id: string | null
    access_token: string | null
    client_name: string | null
    client_phone: string | null
    created_at: string
  }
  Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'> & {
    order_type?: 'bar' | 'gamme'
    scheduled_pickup_date?: string | null
  }
  Update: Partial<Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>>
  Relationships: []
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: types — order_type + scheduled_pickup_date dans orders"
```

---

### Task 3: CartStore — ajouter scheduledPickupDate dans CartLine

**Files:**
- Modify: `src/store/cartStore.ts:5-19`

- [ ] **Step 1: Ajouter le champ**

```ts
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  barBasePublic?: number;
  quantity: number;
  category: string;
  optionsKey: string;
  optionLabels: string[];
  image?: string;
  source: 'bar' | 'gamme';
  scheduledPickupDate?: string; // ISO, gamme uniquement
}
```

- [ ] **Step 2: Commit**

```bash
git add src/store/cartStore.ts
git commit -m "feat: CartLine.scheduledPickupDate pour produits gamme"
```

---

### Task 4: GammeProductDetail — DatePicker de retrait

**Files:**
- Modify: `src/pages/GammeProductDetail.tsx`

- [ ] **Step 1: Ajouter l'état pour la date et l'heure**

Après les `useState` existants (ligne ~53), ajouter :

```tsx
const [pickupDate, setPickupDate] = useState('');
const [pickupTime, setPickupTime] = useState('');

// Date min = aujourd'hui + 1 jour
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const minDate = tomorrow.toISOString().split('T')[0];
const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

// Bloque le dimanche (0 = dimanche)
const isSunday = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay() === 0;
};

// Créneaux 9h-18h par 30 min
const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});
```

- [ ] **Step 2: Ajouter le DatePicker dans le JSX**

Entre le bloc cuillère doseuse et le bloc quantité+CTA, ajouter :

```tsx
{/* Sélecteur date/heure de retrait */}
<div className="mb-6 rounded-[2px] border border-noir/[0.08] bg-sapin-subtle p-4">
  <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
    Date de retrait (min. J+1)
  </p>
  <div className="flex gap-3">
    <input
      type="date"
      value={pickupDate}
      min={minDate}
      max={maxDate}
      onChange={(e) => {
        const val = e.target.value;
        if (isSunday(val)) {
          // Sauter au lundi
          const d = new Date(val + 'T12:00:00');
          d.setDate(d.getDate() + 1);
          setPickupDate(d.toISOString().split('T')[0]);
          return;
        }
        setPickupDate(val);
      }}
      className="flex-1 rounded-[2px] border border-noir/10 px-3 py-2.5 text-[13px] text-black bg-white"
      required
    />
    <select
      value={pickupTime}
      onChange={(e) => setPickupTime(e.target.value)}
      className="rounded-[2px] border border-noir/10 px-3 py-2.5 text-[13px] text-black bg-white"
      required
      disabled={!pickupDate}
    >
      <option value="">Heure</option>
      {TIME_SLOTS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  </div>
  {pickupDate && pickupTime && (
    <p className="mt-2 text-[11px] text-black/50">
      Retrait le {new Date(pickupDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {pickupTime}
    </p>
  )}
</div>
```

- [ ] **Step 3: Modifier handleAddToCart pour passer la date**

```tsx
const handleAddToCart = () => {
  const scheduledPickupDate = pickupDate && pickupTime
    ? new Date(`${pickupDate}T${pickupTime}:00`).toISOString()
    : undefined;

  addLine({
    productId: product.id,
    name: product.name,
    unitPrice: product.price,
    barBasePublic: product.price,
    quantity,
    category: rangeId!,
    source: 'gamme',
    optionsKey: spoonSelected && spoonInfo ? 'spoon:0' : 'default',
    optionLabels: spoonOptionLabels,
    image: product.image_url || product.name.charAt(0),
    scheduledPickupDate,
  });
  setJustAdded(true);
  setTimeout(() => setJustAdded(false), 2000);
};
```

- [ ] **Step 4: Désactiver le bouton si pas de date**

Remplacer le `isDisabled={loading}` du Button par :

```tsx
isDisabled={loading || (!pickupDate || !pickupTime)}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/GammeProductDetail.tsx
git commit -m "feat: DatePicker retrait gamme — J+1, lun-sam, 9h-18h/30min"
```

---

### Task 5: Edge Function checkout — split Bar/Gamme

**Files:**
- Modify: `supabase/functions/create-checkout-session/index.ts`

- [ ] **Step 1: Ajouter scheduledPickupDate au CartLineSchema**

Dans le `CartLineSchema` (ligne ~33), ajouter :

```ts
scheduledPickupDate: z.string().optional(),
```

- [ ] **Step 2: Grouper les items par type et détecter le split**

Ajouter après la validation du body (après `const { items, user_id, pickup_time, client_name, client_phone } = parsed.data;`) :

```ts
// Grouper par type (bar vs gamme)
const barItems = items.filter((i) => i.source !== 'gamme');
const gammeItems = items.filter((i) => i.source === 'gamme');
const needsSplit = barItems.length > 0 && gammeItems.length > 0;

// Déduire le scheduled_pickup_date depuis les items gamme (prendre le premier)
const gammePickupDate = gammeItems[0]?.scheduledPickupDate ?? null;
```

- [ ] **Step 3: Créer une fonction helper pour créer une order**

Après `fetchVerifiedPrice`, ajouter :

```ts
async function createOrder(
  supabase: ReturnType<typeof createClient>,
  params: {
    lines: typeof verifiedLines,
    user_id: string | null,
    pickup_time: string | null,
    client_name: string | null,
    client_phone: string | null,
    order_type: 'bar' | 'gamme',
    scheduled_pickup_date: string | null,
  },
): Promise<string> {
  const total = params.lines.reduce((sum, i) => sum + i.verifiedUnitPrice * i.quantity, 0);
  const accessToken = crypto.randomUUID().replace(/-/g, '');

  const orderPayload: Record<string, unknown> = {
    total,
    status: 'pending',
    order_type: params.order_type,
    access_token: accessToken,
  };
  if (params.user_id) orderPayload.user_id = params.user_id;
  if (params.client_name) orderPayload.client_name = params.client_name;
  if (params.client_phone) orderPayload.client_phone = params.client_phone;
  if (params.order_type === 'bar' && params.pickup_time) {
    orderPayload.pickup_time = params.pickup_time;
  }
  if (params.order_type === 'gamme' && params.scheduled_pickup_date) {
    orderPayload.scheduled_pickup_date = params.scheduled_pickup_date;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (error || !order) throw new Error('Impossible de créer la commande : ' + error?.message);

  const orderItems = params.lines.map((item) => ({
    order_id: order.id,
    product_id: item.dbProductId ?? (UUID_RE.test(item.productId) ? item.productId : null),
    product_name: item.name,
    quantity: item.quantity,
    price_at_time: item.verifiedUnitPrice,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw new Error('Erreur articles : ' + itemsError.message);

  return order.id;
}
```

- [ ] **Step 4: Remplacer la création d'order existante par le split**

Remplacer tout le bloc de création d'order actuel (lignes ~199-230) par :

```ts
// Vérifier les prix côté serveur (inchangé)
const verifiedLines = await Promise.all(
  items.map(async (item) => {
    const { verifiedUnitPrice, productId } = await fetchVerifiedPrice(supabase, item);
    return { ...item, verifiedUnitPrice, dbProductId: productId };
  }),
);

// Pickup_time ISO pour le bar
const orderPickupTime = pickup_time
  ? (() => {
      const [h, m] = pickup_time.split(':').map(Number);
      const d = new Date();
      d.setHours(h ?? 0, m ?? 0, 0, 0);
      return d.toISOString();
    })()
  : null;

// Split ou non
const barLines = verifiedLines.filter((i) => i.source !== 'gamme');
const gammeLines = verifiedLines.filter((i) => i.source === 'gamme');

let orderIds: string[] = [];

if (barLines.length > 0 && gammeLines.length > 0) {
  // Split : 2 orders, 1 Stripe
  if (gammeLines.length > 0) {
    const gammeId = await createOrder(supabase, {
      lines: gammeLines,
      user_id,
      pickup_time: null,
      client_name,
      client_phone,
      order_type: 'gamme',
      scheduled_pickup_date: gammePickupDate,
    });
    orderIds.push(gammeId);
  }
  if (barLines.length > 0) {
    const barId = await createOrder(supabase, {
      lines: barLines,
      user_id,
      pickup_time: orderPickupTime,
      client_name,
      client_phone,
      order_type: 'bar',
      scheduled_pickup_date: null,
    });
    orderIds.push(barId);
  }
} else {
  // Homogène
  const theType = gammeLines.length > 0 ? 'gamme' : 'bar';
  const thePickup = theType === 'bar' ? orderPickupTime : null;
  const theScheduled = theType === 'gamme' ? gammePickupDate : null;
  const theId = await createOrder(supabase, {
    lines: verifiedLines,
    user_id,
    pickup_time: thePickup,
    client_name,
    client_phone,
    order_type: theType,
    scheduled_pickup_date: theScheduled,
  });
  orderIds.push(theId);
}
```

- [ ] **Step 5: Stripe — passer tous les order_ids en metadata**

Remplacer le `stripeBody.append('metadata[order_id]', ...)` existant par :

```ts
stripeBody.append('metadata[order_ids]', orderIds.join(','));
```

- [ ] **Step 6: Mettre à jour stripe_session_id sur toutes les orders**

Remplacer le `.update({ stripe_session_id })` unique par :

```ts
for (const oid of orderIds) {
  await supabase
    .from('orders')
    .update({ stripe_session_id: stripeJson.id ?? null })
    .eq('id', oid);
}
```

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat: checkout split bar/gamme — 1 Stripe, 2 orders si mix"
```

---

### Task 6: Webhook Stripe — gérer plusieurs orders par session

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts:46-64`

- [ ] **Step 1: Remplacer la gestion payment actuelle**

Dans le `case 'checkout.session.completed':` pour `mode === 'payment'`, remplacer :

```ts
const orderId = session.metadata?.order_id
if (orderId) {
  await supabase
    .from('orders')
    .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent as string })
    .eq('id', orderId)
}
```

Par :

```ts
const orderIds = session.metadata?.order_ids
  ? session.metadata.order_ids.split(',')
  : session.metadata?.order_id
    ? [session.metadata.order_id]
    : [];

if (orderIds.length > 0) {
  await supabase
    .from('orders')
    .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent as string })
    .in('id', orderIds);
}
```

- [ ] **Step 2: Faire la même modification pour async_payment_succeeded**

Remplacer le bloc `checkout.session.async_payment_succeeded` de la même manière.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: webhook Stripe gère orders_ids (split) + async_payment"
```

---

### Task 7: ModeBar — filtrer order_type === 'bar'

**Files:**
- Modify: `src/pages/admin/ModeBar.tsx:44`

- [ ] **Step 1: Filtrer par order_type dans le filtre existant**

Remplacer la ligne :

```tsx
const orders = localOrders.filter((o) => o.status === 'paid' || o.status === 'preparing');
```

Par :

```tsx
const orders = localOrders.filter(
  (o) => o.order_type === 'bar' && (o.status === 'paid' || o.status === 'preparing')
);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/ModeBar.tsx
git commit -m "fix: ModeBar filtre order_type === 'bar' uniquement"
```

---

### Task 8: AdminCommandes — filtre par type + badge order_type

**Files:**
- Modify: `src/pages/admin/AdminCommandes.tsx`
- Modify: `src/components/admin/AdminOrdersFilter.tsx`
- Modify: `src/components/admin/AdminOrderCard.tsx`

- [ ] **Step 1: Ajouter un filtre par type dans AdminOrdersFilter**

Remplacer le composant `AdminOrdersFilter` :

```tsx
export type OrderTypeFilter = 'all' | 'bar' | 'gamme';

const FILTER_TABS: { key: OrderFilterStatus; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En cours' },
  { key: 'paid', label: 'En attente' },
  { key: 'preparing', label: 'En prépa' },
  { key: 'ready', label: 'Prêtes' },
  { key: 'completed', label: 'Terminées' },
];

interface AdminOrdersFilterProps {
  filterStatus: OrderFilterStatus;
  onFilterChange: (status: OrderFilterStatus) => void;
  orderType: OrderTypeFilter;
  onOrderTypeChange: (type: OrderTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AdminOrdersFilter({
  filterStatus, onFilterChange, orderType, onOrderTypeChange, searchQuery, onSearchChange,
}: AdminOrdersFilterProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {/* Filtre type */}
        {(['all', 'bar', 'gamme'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onOrderTypeChange(t)}
            className={cn(
              'rounded-[2px] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
              orderType === t
                ? 'bg-anthracite text-white'
                : 'bg-surface-muted text-black/45 hover:bg-noir/[0.06] hover:text-black',
            )}
          >
            {t === 'all' ? 'Tous types' : t === 'bar' ? 'Bar' : 'Gamme'}
          </button>
        ))}
        <span className="w-px bg-noir/[0.08] mx-1" aria-hidden />
        {/* Filtre statut */}
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

- [ ] **Step 2: Mettre à jour AdminCommandes pour utiliser le filtre type**

```tsx
const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
const [orderType, setOrderType] = useState<OrderTypeFilter>('all');
// ... reste inchangé

const { orders, loading, kpis, newOrderAlert, clearAlert, paidAlert, clearPaidAlert } = useAdminOrders(filterStatus);

// Ajuster les KPIs pour tenir compte du type
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

const filteredOrders = orders.filter((o) => {
  if (orderType !== 'all' && o.order_type !== orderType) return false;
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase();
  const items = o.order_items ?? [];
  const itemNames = items.map((it) => it.product_name.toLowerCase()).join(' ');
  return o.id.toLowerCase().includes(q) || itemNames.includes(q);
});

// Dans le JSX, remplacer kpis par kpisFiltered et passer les nouvelles props:
<AdminOrdersFilter
  filterStatus={filterStatus}
  onFilterChange={setFilterStatus}
  orderType={orderType}
  onOrderTypeChange={setOrderType}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

N'oublie pas d'ajouter `import { useMemo } from 'react';` en haut et `import type { OrderTypeFilter } from '../../components/admin/AdminOrdersFilter';`.

- [ ] **Step 3: Ajouter le badge order_type dans AdminOrderCard**

Dans `AdminOrderCard.tsx`, ajouter après le badge status :

```tsx
<span className={cn(
  'inline-block rounded-[2px] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em]',
  order.order_type === 'gamme'
    ? 'bg-purple-50 text-purple-700 border border-purple-200'
    : 'bg-noir/[0.04] text-black/40'
)}>
  {order.order_type === 'gamme' ? 'Gamme' : 'Bar'}
</span>
```

Et pour la colonne retrait, modifier la ligne de pickup pour :

```tsx
{order.order_type === 'gamme' && order.scheduled_pickup_date
  ? `Retrait ${new Date(order.scheduled_pickup_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${new Date(order.scheduled_pickup_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  : `Retrait ${pickupLabel}`
}
```

Ajouter l'import `import { cn }` si pas déjà présent (vérifier).

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminCommandes.tsx src/components/admin/AdminOrdersFilter.tsx src/components/admin/AdminOrderCard.tsx
git commit -m "feat: AdminCommandes — filtre par type (Bar/Gamme), badge order_type, retrait gamme"
```

---

### Task 9: RetraitsGamme — NOUVEAU planning admin gamme

**Files:**
- Create: `src/pages/admin/RetraitsGamme.tsx`

- [ ] **Step 1: Créer le composant complet**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Phone, User, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { motionInitial, motionTransition } from '../../lib/motionReveal';
import { supabase } from '../../lib/supabaseClient';
import { auditLog } from '../../lib/auditLog';
import type { OrderWithItems } from '../../hooks/useOrders';

const GAMME_STATUSES = ['paid', 'preparing', 'ready', 'confirmed'];

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function RetraitsGamme() {
  const reduceMotion = useReducedMotion();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_type', 'gamme')
      .in('status', GAMME_STATUSES)
      .gte('scheduled_pickup_date', startOfDay.toISOString())
      .lte('scheduled_pickup_date', endOfDay.toISOString())
      .order('scheduled_pickup_date', { ascending: true });

    if (!error) setOrders(data ?? []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => { document.title = 'Retraits Gamme — Admin PessÓra'; }, []);

  const goToDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const handleMarkPickedUp = async (orderId: string) => {
    await (supabase as any)
      .from('orders')
      .update({ status: 'completed', picked_up_at: new Date().toISOString() })
      .eq('id', orderId);
    auditLog({ action: 'order.status_change', entity_type: 'order', entity_id: orderId, details: { new_status: 'completed' } });
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const isPast = (iso: string) => new Date(iso) < new Date();

  return (
    <div className="min-h-screen bg-noir text-white">
      {/* Header */}
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
            <h1 className="text-lg font-bold tracking-tight md:text-xl">Retraits Gamme</h1>
            <p className="text-xs text-white/35">{orders.length} retrait{orders.length > 1 ? 's' : ''} prévu{orders.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation par jour */}
      <div className="flex items-center justify-center gap-4 border-b border-white/[0.06] px-4 py-4">
        <button
          onClick={() => goToDay(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
          aria-label="Jour précédent"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <p className="text-sm font-medium min-w-[200px] text-center">{formatDateFr(selectedDate)}</p>
        <button
          onClick={() => goToDay(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
          aria-label="Jour suivant"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Liste des retraits */}
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {loading ? (
          <p className="text-center text-white/30 text-sm py-12">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={48} strokeWidth={1} className="text-white/10 mb-4" />
            <p className="text-white/30 text-sm">Aucun retrait prévu ce jour</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="space-y-4">
              {orders.map((order) => {
                const items = order.order_items ?? [];
                const overdue = order.scheduled_pickup_date && isPast(order.scheduled_pickup_date) && order.status !== 'completed';
                const hasSpoon = items.some((it) => it.product_name.toLowerCase().includes('cuillère'));

                return (
                  <motion.div
                    key={order.id}
                    initial={motionInitial(reduceMotion, { opacity: 0, y: 12 })}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    transition={motionTransition(reduceMotion, { duration: 0.2 })}
                    className={`rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] p-5 md:p-6 ${
                      overdue ? 'border-2 border-amber-500/50' : ''
                    }`}
                  >
                    {/* En-tête carte */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{order.client_name || 'Client'}</h3>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                              <AlertTriangle size={12} strokeWidth={1.5} />
                              En retard
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
                          {order.client_phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} strokeWidth={1.3} />
                              {order.client_phone}
                            </span>
                          )}
                          <span>
                            Retrait {order.scheduled_pickup_date ? formatTime(order.scheduled_pickup_date) : '—'}
                          </span>
                          <span className="font-mono text-xs text-white/25">#{order.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-5">
                      {items.map((item, i) => (
                        <div key={item.id ?? i} className="flex justify-between text-sm">
                          <span className="text-white/70">{item.quantity}× {item.product_name}</span>
                          <span className="tabular-nums text-white/50">
                            {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}€
                          </span>
                        </div>
                      ))}
                      {hasSpoon && (
                        <p className="text-[11px] text-purple-400/70 mt-1">✓ Cuillère doseuse incluse</p>
                      )}
                      <div className="flex justify-between border-t border-white/[0.08] pt-2 mt-2">
                        <span className="text-sm font-medium text-white/60">Total</span>
                        <span className="text-sm font-bold tabular-nums">{order.total.toFixed(2).replace('.', ',')}€</span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleMarkPickedUp(order.id)}
                      className="w-full flex items-center justify-center gap-2 min-h-[48px] bg-sapin hover:bg-sapin/85 active:bg-sapin/70 text-white rounded-2xl font-bold text-sm transition-colors"
                    >
                      <Check size={18} strokeWidth={2} />
                      Marquer comme remis
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/RetraitsGamme.tsx
git commit -m "feat: RetraitsGamme — planning admin gamme par jour, badge retard, pickup complet"
```

---

### Task 10: App.tsx + AdminLayout — route et sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Ajouter l'import lazy dans App.tsx**

Après les autres lazy imports :

```tsx
const RetraitsGamme = lazy(() => import('./pages/admin/RetraitsGamme'));
```

- [ ] **Step 2: Ajouter la route**

Après la route `/admin/mode-bar` :

```tsx
<Route path="/admin/retraits" element={
  <ProtectedAdminRoute>
    <RetraitsGamme />
  </ProtectedAdminRoute>
} />
```

- [ ] **Step 3: Ajouter le lien dans AdminLayout.tsx**

Dans le tableau NAV, après Mode Bar :

```tsx
{ label: 'Retraits Gamme', shortLabel: 'Retraits', icon: Package, path: '/admin/retraits' },
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/admin/AdminLayout.tsx
git commit -m "feat: route /admin/retraits + lien sidebar RetraitsGamme"
```

---

### Task 11: History — onglets Bar/Gamme

**Files:**
- Modify: `src/pages/member/History.tsx`

- [ ] **Step 1: Ajouter le state d'onglet et le filtre**

En haut du composant, après `const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);` :

```tsx
const [orderTypeTab, setOrderTypeTab] = useState<'all' | 'bar' | 'gamme'>('all');

const filtered = orderTypeTab === 'all'
  ? orders
  : orders.filter((o) => o.order_type === orderTypeTab);
const visibleOrders = filtered.slice(0, visibleCount);
const hasMore = visibleCount < filtered.length;
```

- [ ] **Step 2: Ajouter les onglets dans le JSX**

Avant le bloc `orders.length === 0`, ajouter la barre d'onglets :

```tsx
<div className="flex gap-1.5 mb-5">
  {(['all', 'bar', 'gamme'] as const).map((tab) => (
    <button
      key={tab}
      type="button"
      onClick={() => { setOrderTypeTab(tab); setVisibleCount(PAGE_SIZE); }}
      className={cn(
        'rounded-[2px] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
        orderTypeTab === tab
          ? 'bg-sapin text-white'
          : 'bg-surface-muted text-black/45 hover:bg-noir/[0.06] hover:text-black',
      )}
    >
      {tab === 'all' ? 'Toutes' : tab === 'bar' ? 'Bar' : 'Gamme'}
    </button>
  ))}
</div>
```

Ajouter `import { cn } from '@heroui/react';` en haut du fichier.

- [ ] **Step 3: Utiliser `filtered` au lieu de `orders` dans le JSX**

Remplacer toutes les occurrences de `visibleOrders` et `orders.length` par les versions filtrées. Utiliser `filtered` pour `orders.length` et `visibleOrders` pour l'affichage.

- [ ] **Step 4: Commit**

```bash
git add src/pages/member/History.tsx
git commit -m "feat: History — onglets Bar/Gamme, filtre par order_type"
```

---

### Task 12: OrderDetail — badge type + scheduled_pickup_date

**Files:**
- Modify: `src/pages/member/OrderDetail.tsx`

- [ ] **Step 1: Ajouter le badge order_type et la date de retrait gamme**

Dans le bloc après le montant, ajouter sous le statut :

```tsx
{order.order_type === 'gamme' && (
  <span className="inline-block rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em]">
    Gamme
  </span>
)}
```

Et après le statut, ajouter la date de retrait si gamme :

```tsx
{order.order_type === 'gamme' && order.scheduled_pickup_date && (
  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-black/50">
    <Calendar size={13} strokeWidth={1.3} className="text-sapin-light" />
    Retrait le {new Date(order.scheduled_pickup_date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })} à {new Date(order.scheduled_pickup_date).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    })}
  </p>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/member/OrderDetail.tsx
git commit -m "feat: OrderDetail — badge type gamme + scheduled_pickup_date"
```

---

### Task 13: Déploiement — edge functions Supabase

**Files:**
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Déployer create-checkout-session**

```bash
npx supabase functions deploy create-checkout-session --project-ref <PROJECT_REF>
```

- [ ] **Step 2: Déployer stripe-webhook**

```bash
npx supabase functions deploy stripe-webhook --project-ref <PROJECT_REF>
```

- [ ] **Step 3: Appliquer la migration**

Appliquer `20260602100000_add_order_type.sql` via MCP Supabase `apply_migration`.

---

### Ordre d'exécution recommandé

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13

Les tâches 1-3 peuvent être parallélisées (aucune dépendance entre elles).  
Les tâches 7-8-9-10-11-12 sont indépendantes les unes des autres (peuvent être parallélisées après la tâche 5).
