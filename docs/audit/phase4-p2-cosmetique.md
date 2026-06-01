# Phase 4 — P2 Cosmétique & Edge Cases (Frontend + Admin + Stripe) — Pessora

> Basse priorité. À faire après Phase 1-3 ou quand il reste du temps.

---

## 🟢 Frontend (7 fixes)

### P2-01 : CartDrawer — variable mal nommée `hasStripe`
**Fichier** : `src/components/cart/CartDrawer.tsx:38,225`
- Renommer `hasStripe` → `hasItems` ou `isCartEmpty` (vérifie `items.length > 0`, rien à voir avec Stripe)

### P2-02 : Profile — pas de confirmation mot de passe actuel
**Fichier** : `src/pages/member/Profile.tsx:94-119`
- Ajouter champ "Mot de passe actuel" avant changement

### P2-03 : MemberLayout — race condition logout
**Fichier** : `src/components/member/MemberLayout.tsx:37-40`
- `handleLogout` appelle `logout()` PUIS `navigate('/connexion')` → ProtectedRoute redirige aussi → double navigation
- Supprimer le `navigate` manuel, laisser ProtectedRoute gérer

### P2-04 : SuiviCommande — interpolation non échappée filtre Realtime
**Fichier** : `src/pages/SuiviCommande.tsx:60-64`
- `filter: \`${filterCol}=eq.${trackId}\`` — risque faible (UUID) mais à nettoyer

### P2-05 : Menu — pas d'empty state différencié
**Fichier** : `src/pages/Menu.tsx`
- Ajouter message + suggestions quand `?gamme=X` ne retourne rien

### P2-06 : PickupTimePicker — pas de gestion "fermé aujourd'hui"
**Fichier** : `src/components/cart/PickupTimePicker.tsx:68-83`
- Si jour fermé, proposer "Commander pour demain" au lieu de bloquer

### P2-07 : DrinkOptionsModal — fermeture auto gênante
**Fichier** : `src/components/cart/DrinkOptionsModal.tsx:88-91`
- Remplacer fermeture auto 700ms par boutons "Ajouter et continuer" + "Ajouter et fermer"

---

## 🟢 Admin (8 fixes)

### P2-08 : AdminGammes — filtres non persistants
**Fichier** : `src/pages/admin/AdminGammes.tsx:331`
- Remplacer `useState` par `usePersistentAdminState` (comme AdminProduits/AdminEvenements)

### P2-09 : upsert:true peut écraser fichiers
**Fichier** : `src/lib/storageUpload.ts:25`
- Risque faible (timestamp dans le nom) mais documenter le risque

### P2-10 : Recherche sans debounce
**Fichiers** : `AdminProduits.tsx:413-419`, `AdminEvenements.tsx:614-619`, `AdminMembers.tsx:221-227`
- Ajouter `useMemo` avec `debounce` ou `useDeferredValue`

### P2-11 : Realtime orders — pas de gestion reconnexion
**Fichier** : `src/hooks/useAdminOrders.ts:48-80`
- Ajouter logique de reconnexion WebSocket

### P2-12 : Suppression sans vérification contraintes FK
**Fichiers** : `AdminProduits.tsx:312-324`, `AdminEvenements.tsx:473-488`
- Afficher l'erreur Supabase au lieu du catch silencieux

### P2-13 : verifyAdmin dupliqué dans 3 Edge Functions
**Fichiers** : `supabase/functions/get-stripe-member/index.ts`, `admin-portal-session/index.ts`, `cancel-stripe-subscription/index.ts`
- Remplacer par l'import du module `_shared/verifyAdmin.ts`

### P2-14 : Bouton retour redondant mobile
**Fichier** : `AdminMemberDetail.tsx:347-352`
- Supprimer le lien retour redondant (AdminLayout en a déjà un)

### P2-15 : Slug auto-généré écrase slug manuel
**Fichiers** : `AdminProductForm.tsx:346`, `EventForm.tsx:92`
- Ne régénérer le slug que s'il n'a PAS été modifié manuellement

---

## 🔵 Stripe (8 fixes)

### P2-16 : Message d'erreur divulgue prix serveur
**Fichier** : `supabase/functions/create-checkout-session/index.ts:98-100`
- Logger le détail côté serveur, renvoyer message générique au client

### P2-17 : MRR hardcodé à 24.90€
**Fichier** : `src/pages/admin/AdminOverview.tsx:239`
- Sommer `subscriptions.price` pour les abonnements actifs au lieu de `* 24.90`

### P2-18 : stripeCustomerId toujours null côté client
**Fichier** : `src/contexts/AuthContext.tsx:81`
- Lire `stripe_customer_id` depuis le profil au lieu de hardcoder `null`

### P2-19 : Pas de cleanup stripe_events_processed
**Fichier** : `supabase/migrations/20260503210000_stripe_events_idempotence.sql:17-18`
- Ajouter job pg_cron pour purger > 30 jours

### P2-20 : verify-subscription-session sans authentification
**Fichier** : `supabase/functions/verify-subscription-session/index.ts`
- Ajouter vérification auth ou rate limit

### P2-21 : Admin peut désynchroniser subscriptions vs Stripe
**Fichier** : `src/pages/admin/AdminMemberDetail.tsx:264-302`
- Afficher avertissement ou synchroniser avec Stripe

### P2-22 : Webhook ne gère pas cancel_at_period_end
**Fichier** : `supabase/functions/stripe-webhook/index.ts:53-128`
- Ajouter handling `customer.subscription.updated` avec `cancel_at_period_end`

### P2-23 : verifyAdmin dupliqué (doublon avec P2-13)
**Fichiers** : Mêmes que P2-13 — vu dans les 2 audits, à fusionner

---

**Contexte** : Projet Pessora, /opt/data/repos/pessora. Stack React+TS+Tailwind+Supabase+Stripe.
