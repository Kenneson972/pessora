# Guest Checkout — Formulaire Nom & Téléphone dans le Panier

Date : 2026-05-31
Statut : ✅ Approuvé

## Contexte

Le backend guest checkout est prêt (Edge Function `create-checkout-session` accepte `client_name`, `client_phone`, `access_token`), le suivi par token fonctionne (`/suivi-commande?token=xxx`), la page succès affiche le token. Mais aucun champ frontend ne collecte le nom/téléphone du client invité — la commande part sans ces infos.

## Objectif

Ajouter deux champs (nom + téléphone) dans le `CartDrawer`, visibles uniquement pour les utilisateurs non connectés, obligatoires pour valider le paiement.

## Approche retenue

### 1. `useCheckout` — Ajout de `clientName` et `clientPhone`

```ts
// Avant
export function useCheckout(pickupTime: string)

// Après
export function useCheckout(pickupTime: string, clientName: string, clientPhone: string)

// Body transmis à l'Edge Function :
{ items, user_id, pickup_time, client_name: clientName, client_phone: clientPhone }
```

### 2. `CartDrawer` — Formulaire invité

**Condition d'affichage** : uniquement si l'utilisateur n'est pas authentifié (`!session`).

**Placement** : dans le `Sheet.Footer`, entre le `PickupTimePicker` et la ligne Total/bouton Payer.

**Champs** :
- **Nom** : `<input type="text">`, placeholder "Votre nom", `minLength={2}`, hauteur 44px, `rounded-full`, border `border-noir/[0.12]`
- **Téléphone** : `<input type="tel">`, placeholder "06 XX XX XX XX", validation 10 chiffres (regex `/^0[1-9]\d{8}$/`), même style

**Validation** :
- Le bouton "Payer" est `isDisabled` si :
  - `guestName.trim().length < 2`
  - OU `guestPhone` ne match pas `/^0[1-9]\d{8}$/`

**État local** :
- `guestName` / `guestPhone` — `useState` dans CartDrawer
- Pas de persistance localStorage (données personnelles)
- Réinitialisés lors du `clearCart()`

### 3. Ce qui ne change pas

- Le flux membre connecté reste identique (aucun champ ajouté)
- L'Edge Function n'est pas modifiée (elle supporte déjà ces champs)
- La page `CommandeSucces` n'est pas modifiée
- Le suivi par token n'est pas modifié

## Fichiers touchés

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useCheckout.ts` | +2 paramètres (`clientName`, `clientPhone`), transmis au body |
| `src/components/cart/CartDrawer.tsx` | + auth check, + 2 inputs avec validation, + disable conditionnel du bouton Payer |

## Wireframe

```
┌─ Panier ─────────────────────────┐
│                                   │
│  [PickupTimePicker]               │
│                                   │
│  ┌─ Invité uniquement ─────────┐  │
│  │  [Votre nom.............]    │  │
│  │  [06 XX XX XX XX........]    │  │
│  └──────────────────────────────┘  │
│                                   │
│  Total                     XX,XX€ │
│  ⏱ ~15 min d'attente estimée     │
│                                   │
│  [Payer ma commande] (désactivé   │
│   tant que champs invalides)      │
│  Appeler le bar                   │
│  Vider le panier                  │
└───────────────────────────────────┘
```
