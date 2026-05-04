# Audit Flux Stripe — PESSORA (2026-05-03)

Score : **6.5/10** — fonctionnel mais 2 vulnérabilités P0.

---

## 🔴 P0 — Critique (corriger immédiatement)

### 1. Prix calculés côté client uniquement (fraude possible)

**Fichier :** `supabase/functions/create-checkout-session/index.ts:85`
```ts
const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
```
Le serveur reçoit `unitPrice` du client et ne le vérifie **pas** en base. Un client modifié peut payer 0,01 € pour n'importe quel produit.

**Action :** Recalculer tous les prix côté serveur en interrogeant la table `products` / `gamme_products`.

### 2. Pas d'idempotence webhook (doublons possibles)

**Fichier :** `supabase/functions/stripe-webhook/index.ts` — aucun check d'event_id.

Si Stripe rejoue un webhook (normal sur erreur 5xx), la commande passe deux fois à `completed`, l'abonnement Óra+ est activé deux fois.

**Action :** Créer une table `stripe_events_processed` et vérifier `event.id` avant traitement.

---

## 🟡 P1 — Haute priorité

| # | Problème | Fichier | Détail |
|---|----------|---------|--------|
| 3 | Commande passe directement `pending → completed` | `stripe-webhook/index.ts:42` | Devrait être `pending → paid`, puis workflow bar. Actuellement marquée "Terminée" dès l'encaissement. |
| 4 | Activation Óra+ en fallback avant webhook | `verify-subscription-session/index.ts` | La page de succès appelle un fallback qui active l'abonnement sans attendre la confirmation Stripe. |
| 5 | `as any` sur tous les appels DB Stripe | Multiples fichiers | Masque les erreurs de type — contourné partout. |

---

## 🔵 P2 — Priorité normale

| # | Problème | Fichier |
|---|----------|---------|
| 6 | PII dans metadata Stripe (`customer_name`) | `create-checkout-session/index.ts:154` |
| 7 | CORS `*` trop permissif sur toutes les Edge Functions | Toutes les Edge Functions |
| 8 | Pas d'annulation de session Stripe précédente en cas de double clic | `create-checkout-session/index.ts` |
| 9 | MRR calculé côté client simpliste : `n × 24,90` | `AdminOverview.tsx` |
| 10 | Pas d'idempotence sur le type `Update` des orders (contourné par `as any`) | `database.ts` |

---

## ✅ Ce qui fonctionne bien

- Signature webhook vérifiée (`constructEventAsync`)
- Order créé en `pending` **avant** la session Stripe (pattern correct)
- Validation Zod du body dans `create-checkout-session`
- Auth JWT vérifiée (user_id dans le body == token)
- Metadata `order_id` présente (bonne traçabilité)
- Portail Stripe Billing fonctionnel (admin + membre)
- Variables d'env Stripe non exposées côté client
- Panier Zustand persisté et versionné
- Types DB complets (Order, OrderItem, Subscription, Profile)

---

## Flux actuel

```
Client ajoute boissons → store Zustand (prix des données statiques)
  ↓
CartDrawer → useCheckout() → Edge Function create-checkout-session
  ↓
Serveur : insert order (pending) + order_items, crée session Stripe
  ↓  ← MAILLON FAIBLE : prix non vérifié côté serveur
Client redirigé vers Stripe Checkout → paie
  ↓
Stripe → Webhook (signature OK, pas d'idempotence) → completed ou Ora+ actif
  ↓
Client redirigé vers /commande/succès → panier vidé
```

---

Rapport généré depuis l'exploration du code le 2026-05-03.
