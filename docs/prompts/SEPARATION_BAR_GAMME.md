# PROMPT — Séparer commandes Bar et Gamme
# Date : 2 Juin 2026
# Contexte : Cursor a buggé pendant ce refacto, reprendre ici

## OBJECTIF
Séparer les flux de commandes boissons (bar, retrait immédiat) et gammes Herbalife (retrait différé, calendrier).
Actuellement tout est dans `orders` sans distinction — le ModeBar montre tout, aucun planning pour les gammes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 1 — DATABASE & TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 Migration Supabase — ajouter à la table `orders` :
  - `order_type` TEXT NOT NULL DEFAULT 'bar' — 'bar' | 'gamme'
  - `scheduled_pickup_date` TIMESTAMPTZ — date/heure de retrait choisie (gamme uniquement, null pour bar)

1.2 Mettre à jour `src/types/database.ts` :
  - Ajouter `order_type: 'bar' | 'gamme'`
  - Ajouter `scheduled_pickup_date: string | null`

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 2 — GAMME PRODUCT DETAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 `src/pages/GammeProductDetail.tsx` :
  - Après le sélecteur de quantité, ajouter un DatePicker pour choisir la date de retrait
  - Format français, jours ouvrés uniquement, créneaux 9h-18h par tranches de 30 min
  - Utiliser un composant natif <input type="date"> + <select> pour l'heure
  - Passer `scheduled_pickup_date` dans le payload du panier
  - Marquer la ligne panier avec `source: 'gamme'` (déjà fait)

2.2 `src/store/cartStore.ts` :
  - Ajouter `scheduledPickupDate` dans le type CartLine (optionnel, null par défaut)
  - Le passer dans le checkout

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 3 — CHECKOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 `supabase/functions/create-checkout-session/index.ts` :
  - Recevoir `order_type` depuis le body (déduit des items : si au moins un item gamme → 'gamme', sinon 'bar')
  - Recevoir `scheduled_pickup_date` et le stocker dans l'order
  - Passer `order_type` dans le payload INSERT

3.2 CORS et success_url : déjà gérés, ne pas toucher.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 4 — ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 `src/pages/admin/AdminCommandes.tsx` :
  - Ajouter un filtre par type : "Toutes" | "Bar" | "Gamme"
  - Ajouter `order_type` dans l'affichage des cartes commande
  - Colonne "Retrait" : pour gamme → date formatée ; pour bar → "Immédiat"

4.2 `src/pages/admin/ModeBar.tsx` :
  - Filtrer sur `order_type === 'bar'` UNIQUEMENT
  - Ignorer les commandes gamme

4.3 NOUVEAU — `src/pages/admin/RetraitsGamme.tsx` :
  - Vue planning pour les commandes gamme
  - Affichage par date : liste des retraits du jour
  - Filtre `order_type === 'gamme'` + statuts 'paid', 'confirmed'
  - Navigation par jour (flèches précédent/suivant)
  - Carte commande : nom client, articles, cuillère si cochée, téléphone
  - Bouton "Marquer comme remis" → `status: 'completed'` + `picked_up_at`

4.4 Ajouter la route dans `src/App.tsx` :
  - `/admin/retraits` → `RetraitsGamme`

4.5 Ajouter un lien dans la sidebar admin (AdminLayout)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 5 — ESPACE CLIENT (MEMBER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 `src/pages/member/History.tsx` :
  - Séparer en deux onglets : "Commandes bar" / "Commandes gamme"
  - Filtrer par `order_type`

5.2 `src/pages/member/OrderDetail.tsx` :
  - Afficher `scheduled_pickup_date` formaté pour les commandes gamme
  - Afficher le statut de la cuillère doseuse si présente

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIE 6 — WEBHOOK STRIPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

6.1 `supabase/functions/stripe-webhook/index.ts` :
  - Quand `checkout.session.completed` en mode payment :
    - Si `order_type === 'bar'` → `status: 'paid'` (comme actuellement)
    - Si `order_type === 'gamme'` → `status: 'paid'` (le commerçant confirmera manuellement)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
FICHIERS À TOUCHER
━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRÉER :
- src/pages/admin/RetraitsGamme.tsx
- supabase/migrations/xxxx_add_order_type.sql

MODIFIER :
- src/types/database.ts
- src/store/cartStore.ts (CartLine type)
- src/pages/GammeProductDetail.tsx
- supabase/functions/create-checkout-session/index.ts
- src/pages/admin/AdminCommandes.tsx
- src/pages/admin/ModeBar.tsx
- src/App.tsx
- src/pages/admin/AdminLayout.tsx
- src/pages/member/History.tsx
- src/pages/member/OrderDetail.tsx
- supabase/functions/stripe-webhook/index.ts
