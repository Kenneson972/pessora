# PROMPT — AdminCommandes + Notifications temps réel

## Contexte
Pessora — e-commerce bar protéiné Martinique. Stack : React / Tailwind / HeroUI Pro / Supabase.
Admin existant : 13 pages, composants partagés (DashEyebrow, DashPageHeader, DASH_MAIN_PAD).

## Référence
Spec complète : `docs/specs/2026-05-30-admin-commandes-notifs-design.md`
Modèle DALCIELO : search, filtres, polling, audio alerts, kitchen mode.

## 1. Créer le hook useAdminOrders

**Fichier** : `src/hooks/useAdminOrders.ts`

- Fetch initial : `orders` avec `order_items` (jointure), filtré par statuts actifs
- Souscription Supabase Realtime : `supabase.channel('admin-orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, callback)`
- Retourne : `{ orders, loading, error, newOrderCount }`
- Le compteur `newOrderCount` s'incrémente à chaque INSERT reçu

## 2. Créer les composants

### A. AdminOrdersFilter
**Fichier** : `src/components/admin/AdminOrdersFilter.tsx`

Props : `{ activeFilter: string, onFilterChange: (f: string) => void, searchQuery: string, onSearchChange: (q: string) => void }`

- Champ recherche texte (nom client, ID commande)
- Tabs filtre : Toutes, En attente (paid), En prépa (preparing), Prêtes (ready), Terminées (completed/cancelled)
- Utiliser les composants HeroUI existants (Input, Tabs)

### B. AdminOrderCard
**Fichier** : `src/components/admin/AdminOrderCard.tsx`

Props : `{ order: AdminOrder, onStatusChange: (id: string, status: string) => void }`

- Infos compactes : nom client, date/heure, pickup prévu, badge statut, nombre articles, total
- Expand/collapse (useState local) : liste des articles avec prix unitaire, options
- Actions selon statut : boutons "Préparer" / "Prêt" / "Retiré"
- Status badges : paid=orange, preparing=blue, ready=green, completed=gray
- Lien vers fiche membre si user_id présent → `/admin/membres/${user_id}`

### C. AdminOrdersList
**Fichier** : `src/components/admin/AdminOrdersList.tsx`

Props : `{ orders: AdminOrder[], onStatusChange }`

- Tri prioritaire : paid → preparing → ready, puis par pickup_time ascendant
- AnimatePresence (framer-motion) pour les entrées/sorties
- Utilise AdminOrderCard pour chaque commande

### D. AdminCommandes (page)
**Fichier** : `src/pages/admin/AdminCommandes.tsx`

- Layout admin standard
- Barre sticky KPIs : compteurs (paid / preparing / ready / completed aujourd'hui) + CA du jour
- AdminOrdersFilter
- AdminOrdersList
- Toast notification en bas à droite (HeroUI Toast) quand newOrderCount > 0
- Bouton mute pour le son

### E. Notifications
**Fichier** : `src/lib/orderNotifications.ts`

- Fonction `playNewOrderSound()` : joue un son court depuis `/public/sounds/new-order.mp3`
- Fonction `isMuted()` / `setMuted(v: boolean)` : stocke dans localStorage
- Appelé depuis AdminCommandes quand une nouvelle commande paid arrive

## 3. Modifier l'existant

### A. App.tsx
Ajouter la route : `<Route path="/admin/commandes" element={<ProtectedAdminRoute><AdminCommandes /></ProtectedAdminRoute>}>`

### B. AdminLayout.tsx
- Ajouter le lien "Commandes" dans la sidebar
- Badge compteur (nombre de commandes actives > 0)
- Utiliser un contexte ou événement window pour rafraîchir

### C. AdminOverview.tsx (optionnel)
Alléger la section inline commandes si elle existe — la nouvelle page la remplace.

## Fichiers à créer/modifier

| Action | Fichier |
|--------|---------|
| CRÉER | `src/pages/admin/AdminCommandes.tsx` |
| CRÉER | `src/components/admin/AdminOrdersList.tsx` |
| CRÉER | `src/components/admin/AdminOrderCard.tsx` |
| CRÉER | `src/components/admin/AdminOrdersFilter.tsx` |
| CRÉER | `src/hooks/useAdminOrders.ts` |
| CRÉER | `src/lib/orderNotifications.ts` |
| CRÉER | `public/sounds/new-order.mp3` (fichier silence 0.5s — à remplacer par un vrai son) |
| MODIFIER | `src/App.tsx` |
| MODIFIER | `src/pages/admin/AdminLayout.tsx` |
| OPTIONNEL | `src/pages/admin/AdminOverview.tsx` |

## Règles

- TypeScript strict, pas de `any`
- `npm run build` doit passer
- Ne pas modifier les migrations Supabase existantes
- Ne pas toucher au flux Stripe (checkout, webhook)
- Ne pas modifier les RLS existantes
- Réutiliser les composants admin existants (DashEyebrow, DashPageHeader, DASH_MAIN_PAD, AdminErrorAlert, ConfirmDialog)
- Commit atomique avec `feat(admin):`
