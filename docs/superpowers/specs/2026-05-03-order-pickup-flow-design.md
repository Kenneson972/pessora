# Suivi des commandes avec créneau de retrait (pickup)

## Objectif

Permettre aux clients de choisir un **créneau de retrait** lors de leur commande et au gérant de **suivre les commandes** via le dashboard admin avec un cycle de statuts.

## Flux utilisateur

### Pour le client

1. **Panier** : avant de payer, le client sélectionne un **créneau de 15 min** basé sur les horaires d'ouverture
2. **Paiement Stripe** : le créneau est envoyé lors de la création de la commande
3. **Espace client** : dans le Dashboard et l'historique, la commande affiche :
   - Le créneau de retrait choisi
   - Le statut actuel (pending → preparing → ready → completed)

### Pour le gérant (dashboard admin)

1. **Section "Nouvelles commandes"** : les commandes `pending` apparaissent avec :
   - Nom du client, produits, créneau, total
   - Boutons d'action : "Préparer" (→ `preparing`), "Prêt" (→ `ready`), "Retiré" (→ `completed`)
2. **Notification visuelle** : badge ou compteur "Nouvelles commandes" dans la navigation admin

## Base de données

### Table `orders` — nouvelles colonnes

| Colonne | Type | Description |
|---------|------|-------------|
| `pickup_time` | `timestamptz` | Créneau de retrait choisi par le client |
| `picked_up_at` | `timestamptz` | `NULL` ; date effective de retrait |

### Nouveaux statuts

Cycle :
```
pending  →  preparing  →  ready  →  completed
```

### Migrations SQL

```sql
ALTER TABLE orders ADD COLUMN pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN picked_up_at TIMESTAMPTZ;

-- Type enum pour les statuts (optionnel, sinon validation Zod côté client)
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check
--   CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
```

## Calendrier des créneaux

Basé sur `src/data/infoData.ts` → `barInfo.hours` :

| Jour | Créneaux (toutes les 15 min) |
|------|------------------------------|
| Lundi-Vendredi | 9h30 → 17h45 (dernier créneau) |
| Samedi | 10h30 → 13h45 |
| Dimanche | Aucun |

**Logique** :
- Créneaux calculés côté client (`useMemo`)
- Créneaux passés (heure < maintenant) désactivés/ masqués
- Une fois sélectionné, le créneau est stocké comme `pickup_time` (ISO timestamp)

## Notifications gérant

- **Dashboard admin uniquement** pour cette phase
- Pas d'email / SMS (Twilio / Resend à configurer plus tard)
- Les commandes `pending` sont visibles dans une section dédiée
- Badge de comptage des nouvelles commandes dans la navigation admin

## Composants UI

### 1. `PickupTimePicker` (nouveau)

Placé dans le panier **entre les items et le footer** de paiement.

```tsx
<PickupTimePicker
  businessHours={barInfo.hours}
  value={selectedTime}
  onChange={setSelectedTime}
/>
```

Affiche une grille scrollable ou un carrousel de créneaux disponibles avec :
- Créneaux toutes les 15 min
- Créneaux passés = disabled
- Créneau sélectionné = highlight
- Message si fermé (dimanche)

### 2. `OrderStatusBadge` (nouveau)

Badge statut à réutiliser dans :
- Dashboard client (Mes dernières commandes)
- Historique client
- Admin (liste des commandes)

```tsx
<OrderStatusBadge status="pending" />
// → badge gris "En attente"
// → badge bleu "En préparation"
// → badge vert "Prêt"
// → badge noir "Retiré"
```

### 3. `AdminOrderList` (dans AdminOverview ou nouvelle page AdminCommandes)

Section avec :
- Filtre par statut (pending, preparing, ready, completed)
- Liste des commandes avec infos client + produits + créneau
- Boutons d'action pour passer au statut suivant

## Modifications Edge Functions

### `create-checkout-session/index.ts`

- Nouveau champ optionnel `pickup_time: string` dans le body Zod
- Stocker dans `orders.pickup_time` lors de l'insert

### `stripe-webhook/index.ts`

- Ajouter `checkout.session.completed` pour les **commandes (mode payment)**
- Passer `status` de `pending` à `completed` après paiement confirmé
- (Actuellement ce webhook ne gère que les subscriptions)

## Modifications client

### `CartDrawer.tsx`

- Ajouter `PickupTimePicker` dans le Sheet.Body
- Rattacher `pickup_time` à l'appel `useCheckout()`

### `useCheckout.ts`

- Accepter un paramètre `pickupTime: string`
- L'envoyer dans le body de l'Edge Function

### `Dashboard.tsx` (espace client)

- Les commandes affichent le créneau et le statut dans "Mes dernières commandes"

### `History.tsx` (espace client)

- Ajouter colonne créneau + statut dans la liste

### `AdminOverview.tsx` (admin)

- Ajouter section "Commandes en attente" avec les actions de statut

## Fichiers modifiés

| Fichier | Type de changement |
|---------|-------------------|
| `supabase/migrations/...add_order_pickup.sql` | Nouvelle migration |
| `src/types/database.ts` | Mise à jour type `Order` |
| `src/data/infoData.ts` | Inchangé (horaires déjà présents) |
| `src/components/cart/PickupTimePicker.tsx` | Nouveau composant |
| `src/components/cart/CartDrawer.tsx` | Ajout PickupTimePicker + état |
| `src/hooks/useCheckout.ts` | Ajout paramètre pickupTime |
| `supabase/functions/create-checkout-session/index.ts` | Ajout pickup_time |
| `supabase/functions/stripe-webhook/index.ts` | Gestion checkout.session.completed pour payment |
| `src/pages/member/Dashboard.tsx` | Affichage créneau + statut |
| `src/pages/member/History.tsx` | Affichage créneau + statut |
| `src/pages/admin/AdminOverview.tsx` | Section commandes en attente |
| `src/components/member/OrderStatusBadge.tsx` | Nouveau composant |

## Priorité d'implémentation

1. Migration DB + types
2. Composant PickupTimePicker
3. Mise à jour CartDrawer + useCheckout
4. Mise à jour create-checkout-session (Edge Function)
5. Mise à jour stripe-webhook (Edge Function)
6. Dashboard admin : section commandes
7. Espace client : affichage statut
