# Cursor Prompt — Suivi Commande Live + Sons Distincts Pessora (31 Mai 2026)

## Contexte

Deux scénarios à couvrir :

1. **Le client** a payé et attend son shake. Il veut savoir où en est sa commande sans appeler le barista.
2. **Le barista** derrière le comptoir entend une nouvelle commande arriver. Il doit distinguer "nouvelle commande à préparer" de "commande payée/confirmée".

Actuellement Pessora a une page `OrderDetail.tsx` statique et un seul son admin. On crée le suivi live + on distingue les sons.

---

## Partie A : Page Suivi Commande Live

### Nouvelle page : `src/pages/SuiviCommande.tsx`

Route : `/suivi-commande?order=UUID` (accessible sans auth)

**États de la timeline :**

```
🕐 Commande reçue       → pending  (gris)
💳 Paiement confirmé     → paid     (bleu)
👨‍🍳 En préparation       → preparing (orange)
✅ Prête !               → ready    (vert sapin)
📦 Retirée               → completed (gris foncé)
```

**Design :** Timeline verticale avec animations Framer Motion.

```tsx
// Structure simplifiée
const STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Clock },
  { key: 'paid', label: 'Paiement confirmé', icon: CreditCard },
  { key: 'preparing', label: 'En préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête ! Venez la chercher', icon: CheckCircle },
  { key: 'completed', label: 'Retirée', icon: Package },
];

function OrderTracker({ status }: { status: string }) {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="font-display text-3xl mb-8 text-center">Votre commande</h1>
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
              className="flex items-start gap-4 py-4 border-l-2 border-noir/10 pl-6"
            >
              <step.icon className={isCurrent ? 'text-sapin' : isActive ? 'text-black/40' : 'text-black/15'} />
              <div>
                <p className="font-medium">{step.label}</p>
                {isCurrent && <p className="text-xs text-sapin animate-pulse">En cours...</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

**Data fetching :** Supabase Realtime sur la commande spécifique.

```tsx
const [order, setOrder] = useState<Order | null>(null);

useEffect(() => {
  // 1. Charger la commande
  supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
    .then(({ data }) => setOrder(data));

  // 2. S'abonner aux changements de cette commande
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => setOrder(payload.new as Order)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [orderId]);
```

**Accessibilité :** Cette page doit être accessible SANS authentification. Ajouter une vérification minimale : le client doit fournir le bon `order_id`. Optionnel : vérifier par email (champ optionnel pour "sécurité légère").

**Lien depuis `CommandeSucces.tsx` :**
```tsx
<Link to={`/suivi-commande?order=${orderId}`}>
  Suivre ma commande
</Link>
```

---

## Partie B : Sons distincts admin

### Fichier à modifier : `src/lib/notificationSound.ts`

Passer de la synthèse Web Audio à 2 vrais fichiers audio, comme Dal Cielo.

**Action :** Ajouter deux fichiers dans `public/sounds/` :
- `new-order.mp3` — son bref et aigu (nouvelle commande)
- `order-paid.mp3` — son plus long et satisfaisant (paiement confirmé)

**Code mis à jour :**

```ts
let newOrderAudio: HTMLAudioElement | null = null;
let paidAudio: HTMLAudioElement | null = null;
let muted = false;
let unlocked = false;

// Déverrouiller l'audio au premier clic (politique autoplay navigateur)
function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;
  newOrderAudio = new Audio('/sounds/new-order.mp3');
  paidAudio = new Audio('/sounds/order-paid.mp3');
  unlocked = true;
}

if (typeof window !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
}

export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }

export function playNewOrderSound() {
  if (muted || !newOrderAudio) return;
  try { newOrderAudio.currentTime = 0; newOrderAudio.play().catch(() => {}); } catch {}
}

export function playPaidSound() {
  if (muted || !paidAudio) return;
  try { paidAudio.currentTime = 0; paidAudio.play().catch(() => {}); } catch {}
}
```

### Fichier à modifier : `src/pages/admin/AdminCommandes.tsx`

Distinguer les événements :

```tsx
// Actuellement : joue playNewOrderSound() pour toute nouvelle commande
// Après : jouer le bon son selon le statut

useEffect(() => {
  if (newOrderAlert) {
    if (newOrderAlert.status === 'pending') {
      // Nouveau : commande qui vient d'être passée (pas encore payée via Stripe)
      // → son optionnel (dépend si on garde le statut pending ou si on passe direct à paid)
    }
    const timer = setTimeout(() => clearAlert(), 6000);
    return () => clearTimeout(timer);
  }
}, [newOrderAlert, clearAlert]);

// Dans useAdminOrders, on pourrait exposer deux callbacks :
// onNewPending  → playNewOrderSound()
// onNewPaid     → playPaidSound()
```

**Option plus simple :** Dans `useAdminOrders`, le `newOrderAlert` est déclenché pour les INSERT. On peut aussi écouter les UPDATE (passage pending→paid) pour jouer le son "payé".

```tsx
// Dans useAdminOrders, ajouter un second channel :
const channel = supabase
  .channel('admin-orders-realtime')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'orders' },
    (payload) => { /* existing logic - play newOrderSound */ }
  )
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.paid' },
    (payload) => {
      // Vérifier que old.status était 'pending' (pas re-trigger sur chaque update)
      if (payload.old.status === 'pending' && payload.new.status === 'paid') {
        playPaidSound();
      }
    }
  )
  .subscribe();
```

---

## Fichiers de son

Créer deux fichiers (tu peux les générer ou les trouver) :
- `/public/sounds/new-order.mp3` — 0.5s, tonalité montante, style "notification"
- `/public/sounds/order-paid.mp3` — 0.8s, tonalité descendante satisfaisante, style "ka-ching"

Si pas de fichiers disponibles, le fallback Web Audio actuel peut être gardé temporairement.

---

## Checklist

### Partie A — Suivi Client
- [ ] Créer `src/pages/SuiviCommande.tsx`
- [ ] Route dans `App.tsx` : `/suivi-commande`
- [ ] Realtime UPDATE sur la commande
- [ ] Timeline animée 5 étapes
- [ ] Accessible sans auth
- [ ] Lien depuis `CommandeSucces.tsx`

### Partie B — Sons admin
- [ ] Ajouter `public/sounds/new-order.mp3` + `public/sounds/order-paid.mp3`
- [ ] Update `notificationSound.ts` avec HTMLAudioElement + unlock
- [ ] Update `useAdminOrders.ts` avec canal UPDATE pour paid
- [ ] Update `AdminCommandes.tsx` pour jouer les deux sons distincts
- [ ] Tester : nouvelle commande → son 1, confirmation paiement → son 2
