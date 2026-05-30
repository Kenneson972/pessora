# Design — Page AdminCommandes + Notifications temps réel

**Date :** 2026-05-30
**Scope :** Page dédiée `/admin/commandes` + notifications temps réel (Supabase Realtime)
**Référence :** DALCIELO (search, filtres, polling, audio alerts, kitchen mode)

---

## Problème

La gestion des commandes se fait dans une section inline de `AdminOverview.tsx`. Le lien `/admin/commandes` existe dans la navbar mais la route n'est pas définie (404). Pas de recherche, pas de filtre, pas de notifications nouvelles commandes.

---

## Architecture

### Approche

1. **Nouvelle page** `AdminCommandes.tsx` → route `/admin/commandes` dans `App.tsx`
2. **Composants dédiés** : `AdminOrdersList`, `AdminOrderCard`, `AdminOrdersFilter`
3. **Hook `useAdminOrders`** : fetch Supabase + souscription Realtime (Postgres LISTEN)
4. **Notifs** : toast + son optionnel pour nouvelles commandes, badge compteur sidebar

### Choix clés

- **Supabase Realtime** plutôt que polling HTTP (DALCIELO fait du setInterval 10s). Postgres LISTEN est plus efficace et natif Supabase.
- **Pas de migration DB** : tables `orders` et `order_items` existent déjà avec tous les champs nécessaires
- **Architecture admin existante respectée** : même layout que les autres pages admin
- **Statuts et transitions inchangés** : `paid → preparing → ready → completed`, RLS déjà en place

---

## Composants

### `AdminCommandes.tsx` (page)
- Layout admin standard (PageShell admin)
- Barre sticky : KPIs + recherche + filtres
- Liste des commandes
- Notifications (toast en bas à droite)

### `AdminOrdersFilter.tsx`
- Champ recherche texte (nom client, ID commande)
- Tabs filtre : Toutes, En attente (paid), En prépa (preparing), Prêtes (ready), Terminées (completed/cancelled)
- Optionnel : tri par date ou pickup_time

### `AdminOrdersList.tsx`
- Tri prioritaire : paid → preparing → ready, puis par pickup_time ascendant
- Expand/collapse au clic pour voir le détail
- Animation framer-motion (AnimatePresence)

### `AdminOrderCard.tsx`
- Infos compactes : nom client, date/heure, pickup prévu, statut badge, nombre articles, total
- Expanded : liste des articles avec prix unitaire, options, notes
- Actions selon statut (Preparer / Pret / Retire)
- Lien vers fiche membre si user_id présent

### KPIs bar
- Compteurs : en attente (paid), en prépa, prêtes, terminées aujourd'hui
- CA du jour (somme des completed)

---

## Notifications temps réel

### `useAdminOrders` hook
- Fetch initial : `orders` avec `order_items`, filtré par statuts actifs
- Souscription Supabase Realtime : `supabase.channel('admin-orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, callback)`
- Nouvelle commande → toast + incrément compteur

### Audio
- Son court et discret (pas agressif), fichier `.mp3` dans `/public/sounds/`
- Bouton mute dans la page
- Déclenché uniquement pour les nouveaux `paid` (pas pour les pending)

### Badge sidebar
- Compteur dans `AdminLayout` si commandes actives > 0
- Rafraîchi via contexte ou événement window

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/pages/admin/AdminCommandes.tsx` |
| Créer | `src/components/admin/AdminOrdersList.tsx` |
| Créer | `src/components/admin/AdminOrderCard.tsx` |
| Créer | `src/components/admin/AdminOrdersFilter.tsx` |
| Créer | `src/hooks/useAdminOrders.ts` |
| Créer | `src/lib/orderNotifications.ts` |
| Modifier | `src/App.tsx` — ajout route `/admin/commandes` |
| Modifier | `src/pages/admin/AdminLayout.tsx` — lien sidebar + badge |
| Optionnel | `src/pages/admin/AdminOverview.tsx` — alléger section inline |

---

## Règles

- TypeScript strict, pas de `any`
- `npm run build` doit passer
- Ne pas modifier les migrations Supabase existantes
- Ne pas toucher au flux Stripe (checkout, webhook)
- Ne pas modifier les RLS existantes
- Réutiliser les composants admin existants (DashEyebrow, DashPageHeader, etc.)
- Commit atomique
