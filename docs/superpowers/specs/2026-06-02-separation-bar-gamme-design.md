# Design — Séparation commandes Bar & Gamme

**Date :** 2026-06-02
**Source :** `docs/prompts/SEPARATION_BAR_GAMME.md`

## Objectif

Séparer les flux de commandes boissons (bar, retrait immédiat) et gammes Herbalife (retrait différé ≥J+1, calendrier). Aujourd'hui tout est dans `orders` sans distinction — le ModeBar montre tout, aucun planning pour les gammes.

---

## 1. Database

### Migration

```sql
ALTER TABLE orders
  ADD COLUMN order_type TEXT NOT NULL DEFAULT 'bar',
  ADD COLUMN scheduled_pickup_date TIMESTAMPTZ;
```

- `order_type` : `'bar'` | `'gamme'`
- `scheduled_pickup_date` : null pour bar, date ISO pour gamme

### Types (`src/types/database.ts`)

Ajouter dans `orders.Row` :
```
order_type: 'bar' | 'gamme'
scheduled_pickup_date: string | null
```

---

## 2. Cart Store (`src/store/cartStore.ts`)

Ajouter dans `CartLine` :
```ts
scheduledPickupDate?: string  // ISO, optionnel, porté uniquement par les lignes gamme
```

---

## 3. GammeProductDetail (`src/pages/GammeProductDetail.tsx`)

### DatePicker de retrait

- Ajouté après le sélecteur de quantité, avant le CTA
- Composants natifs : `<input type="date">` + `<select>` pour l'heure
- **Restrictions :**
  - min = aujourd'hui + 1 jour
  - max = aujourd'hui + 60 jours
  - Jours ouvrés : lundi → samedi (dimanche bloqué, filtré via onChange)
  - Créneaux : 9h–18h par tranches de 30 min
- Bouton "Ajouter au panier" désactivé si aucune date choisie

### Payload panier

```ts
addLine({
  // ... existant
  source: 'gamme',
  scheduledPickupDate: selectedDate.toISOString(),
})
```

---

## 4. Checkout — Split automatique

### Règle

L'edge function détecte le mix bar+gamme dans les items. Si mix :
- 1 session Stripe (paiement unique)
- 2 orders créées dans `orders` : une `bar` (scheduled_pickup_date = null), une `gamme` (avec la date)
- Même `stripe_session_id` sur les 2 orders

Si homogène : 1 seule order avec le bon `order_type`.

### Déduction du `order_type`

- Si tous les items ont `source === 'gamme'` → `'gamme'`
- Sinon → `'bar'`
- Un item gamme dans un panier majoritairement bar → split (1 order bar + 1 order gamme)

### Edge Function modifiée

`supabase/functions/create-checkout-session/index.ts` :
- Grouper les items par type (`bar` / `gamme`)
- Si 2 groupes → créer 2 orders, 1 session Stripe
- `order_type` déduit, pas envoyé par le client

---

## 5. Admin

### 5.1 AdminCommandes (`src/pages/admin/AdminCommandes.tsx`)

- Filtre par type : "Toutes" | "Bar" | "Gamme"
- Badge `order_type` sur chaque carte commande
- Colonne "Retrait" : gamme → date formatée ; bar → "Immédiat"

### 5.2 ModeBar (`src/pages/admin/ModeBar.tsx`)

- Filtre `order_type === 'bar'` UNIQUEMENT
- Statuts : `paid`, `preparing` (inchangé)
- Ignore totalement les commandes gamme

### 5.3 RetraitsGamme (`src/pages/admin/RetraitsGamme.tsx`) — NOUVEAU

Vue planning pour commandes gamme.

- **Filtre** : `order_type === 'gamme'` + statuts `paid`, `preparing`, `ready`, `confirmed`
- **Navigation** : flèches jour précédent/suivant, date affichée en titre
- **Badge "En retard"** : si `scheduled_pickup_date < now` et `status != 'completed'` (visuel rouge/amber)
- **Carte commande** : nom client, téléphone, articles (quantité × nom), cuillère si cochée
- **Action** : bouton "Marquer comme remis" → `status: 'completed'` + `picked_up_at: now()`
- **Pas de timer** d'urgence comme ModeBar (rythme différent)

### 5.4 Route + Sidebar

- `App.tsx` : `/admin/retraits` → `RetraitsGamme`
- `AdminLayout.tsx` : ajout lien "Retraits" dans la NAV (entre Mode Bar et Commandes)

---

## 6. Espace Membre

### 6.1 History (`src/pages/member/History.tsx`)

- Deux onglets : "Bar" / "Gamme"
- Filtrage par `order_type`

### 6.2 OrderDetail (`src/pages/member/OrderDetail.tsx`)

- Badge `order_type` en haut
- Pour gamme : afficher `scheduled_pickup_date` formaté (date + heure)
- Si cuillère doseuse dans les items → l'indiquer

---

## 7. Webhook Stripe

`supabase/functions/stripe-webhook/index.ts` :

- `checkout.session.completed` en mode `payment` :
  - Récupérer TOUTES les orders liées au `stripe_session_id`
  - Toutes → `status: 'paid'`
  - La gamme garde son `scheduled_pickup_date`

---

## Fichiers

| Action | Fichier |
|--------|---------|
| **CRÉER** | `src/pages/admin/RetraitsGamme.tsx` |
| **CRÉER** | `supabase/migrations/` (SQL) |
| MODIFIER | `src/types/database.ts` |
| MODIFIER | `src/store/cartStore.ts` |
| MODIFIER | `src/pages/GammeProductDetail.tsx` |
| MODIFIER | `supabase/functions/create-checkout-session/index.ts` |
| MODIFIER | `src/pages/admin/AdminCommandes.tsx` |
| MODIFIER | `src/pages/admin/ModeBar.tsx` |
| MODIFIER | `src/App.tsx` |
| MODIFIER | `src/pages/admin/AdminLayout.tsx` |
| MODIFIER | `src/pages/member/History.tsx` |
| MODIFIER | `src/pages/member/OrderDetail.tsx` |
| MODIFIER | `supabase/functions/stripe-webhook/index.ts` |

## Règles métier

- **Mix bar+gamme** → split automatique, 1 paiement, 2 orders
- **order_type** déduit côté serveur (pas de confiance client)
- **Retrait gamme** : min J+1, lun-sam, 9h-18h/30min
- **Retrait bar** : immédiat, créneau `pickup_time` (existant)
- **Cuillère doseuse** : déjà dans `optionsKey` (spoon:0 = offerte, spoon:1 = +1€)
