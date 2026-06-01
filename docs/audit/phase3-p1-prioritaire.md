# Phase 3 — P1 Prioritaire (Frontend + Admin + Stripe) — Pessora

---

## 🟠 Frontend

### P1-01 : ProtectedRoute — pas de redirect return
**Fichier** : `src/components/ProtectedRoute.tsx`
- Ajouter `?redirect=` dans l'URL de redirection login
- Après login, rediriger vers l'URL sauvegardée

### P1-02 : useCheckout — pas de validation pickup
**Fichier** : `src/hooks/useCheckout.ts`
- Valider que `pickupTime` est défini AVANT d'appeler `checkout()`
- Bloquer le bouton checkout si pas de créneau sélectionné

### P1-03 : CommandeSucces — useEffect boucle
**Fichier** : `src/pages/CommandeSucces.tsx:17-22`
- Stabiliser les dépendances du `useEffect` (extraire `clearCart` avec `useRef` ou `useCallback`)

### P1-04 : CommandeAnnulee — pas de feedback
**Fichier** : `src/pages/CommandeAnnulee.tsx`
- Ajouter indicateur visuel (loading spinner puis check/cross)
- Gérer le cas `!session?.user` explicitement

### P1-05 : Dashboard — commandes pending invisibles
**Fichier** : `src/hooks/useOrders.ts:29-30`
- Ne PAS filtrer `.neq('status', 'pending')` OU afficher les pending avec un badge "En cours"

### P1-06 : useCheckout — parsing d'erreur cassé
**Fichier** : `src/hooks/useCheckout.ts:27-31`
- `ctx?.json` → `await ctx.json()` (méthode, pas propriété)

---

## 🟠 Admin

### P1-07 : Pas de limite images galerie événement
**Fichier** : `src/components/admin/EventGalleryManager.tsx:67-78`
- Ajouter `MAX_EVENT_GALLERY = 12`

### P1-08 : Audit log silencieux
**Fichier** : `src/lib/auditLog.ts:44-46`
- Remplacer catch vide par `console.error` + localStorage en fallback

### P1-09 : AdminOverview — pas de pagination
**Fichier** : `src/pages/admin/AdminOverview.tsx`
- Ajouter `.limit(50)` ou filtre temporel sur les commandes

### P1-10 : Analytics — toutes commandes 7j sans limite
**Fichier** : `src/components/admin/AnalyticsDashboard.tsx:19-50`
- Utiliser agrégations SQL (`.select('total, created_at')`) ou vue matérialisée

### P1-11 : Pas de confirmation changement statut
**Fichier** : `src/components/admin/AdminOrderCard.tsx:107-113`
- Ajouter `ConfirmDialog` avant `completed`

### P1-12 : AdminMemberDetail — pas d'audit log abonnements
**Fichier** : `src/pages/admin/AdminMemberDetail.tsx:264-301`
- Ajouter `auditLog({ action: 'member.subscription.update', ... })`

### P1-13 : Prix négatifs autorisés
**Fichiers** : `AdminProductForm.tsx`, `AdminGammes.tsx`
- Ajouter `min="0"` sur inputs prix + validation dans `payloadFromForm`

---

## 🟠 Stripe

### P1-14 : Race condition idempotence webhook
**Fichier** : `supabase/functions/stripe-webhook/index.ts:30-51`
- Remplacer SELECT+INSERT par `INSERT ... ON CONFLICT (id) DO NOTHING RETURNING`

### P1-15 : Anti-fraude prix gamme absent
**Fichier** : `supabase/functions/create-checkout-session/index.ts:47-61`
- Ajouter comparaison client/serveur pour produits `source: 'gamme'`

### P1-16 : Rate limiter non distribué
**Fichier** : `supabase/functions/_shared/rate-limiter.ts`
- Remplacer Map locale par table PostgreSQL

### P1-17 : order_items erreur silencieuse
**Fichier** : `supabase/functions/create-checkout-session/index.ts:220-223`
- `throw` l'erreur au lieu de `console.error`

### P1-18 : Pas d'idempotencyKey Stripe
**Fichier** : `supabase/functions/create-checkout-session/index.ts:233`
- Ajouter `{ idempotencyKey: order.id }` dans `stripe.checkout.sessions.create`

### P1-19 : metadata.user_id absent
**Fichier** : `supabase/functions/create-subscription-session/index.ts`
- Ajouter `metadata: { user_id: user.id }` dans `sessionParams`

---

**Contexte** : Projet Pessora, /opt/data/repos/pessora. Stack React+TS+Tailwind+Supabase+Stripe.
