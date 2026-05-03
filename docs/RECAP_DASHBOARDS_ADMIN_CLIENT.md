# Recap Dashboards Admin & Client

Date: 2026-04-22  
Projet: PESSORA (`feat/supabase-events-bilan`)

## 1) Vue globale

Le projet possède aujourd'hui deux espaces distincts:

- Dashboard client membre: `/mon-espace` (et routes enfants)
- Dashboard admin: `/admin` (et routes enfants)

Les deux dashboards sont connectés à Supabase pour la majorité des données clés (membres, abonnements, événements, produits, bilans, communication).

## 2) Dashboard Client (Membre)

### Routes principales

- `/mon-espace` -> vue d'accueil dashboard membre
- `/mon-espace/evenements`
- `/mon-espace/abonnement`
- `/mon-espace/profil`
- `/mon-espace/historique`
- `/mon-espace/pessobot`

### Page Dashboard (`src/pages/member/Dashboard.tsx`)

Contenu actuel:

- En-tête personnalisé avec prénom (ou fallback email)
- KPIs:
  - Événements ce trimestre (`useDashboardStats`)
  - Bilans confirmés (`useDashboardStats`)
  - Plan d'abonnement + date de renouvellement (`useAuth`)
- Carte "Plan" avec avantages affichés
- Bloc "Mes prochains événements" (`useUpcomingEvents(3)`)
- Bloc "Commander à nouveau" (3 produits actifs Supabase, catégories `shakes` + `wellness`)

### Sources de données

- `useDashboardStats`:
  - `event_registrations` join `events` (compte trimestriel)
  - `bilan_bookings` (statut `confirme`)
- `useUpcomingEvents`:
  - `event_registrations` join `events` à venir
- Recommandations produits:
  - table `products` active

### Points forts

- Plus de données hardcodées sur les KPIs principaux
- Dashboard visuellement cohérent avec le design éditorial premium
- Expérience utilisateur claire (chargement, états vides, CTA)

### Points à surveiller

- Le bloc "Commander à nouveau" n'est pas encore basé sur l'historique réel de commandes utilisateur (sélection par catégorie pour l'instant)
- Peu de gestion d'erreurs visible côté UI sur certains appels Supabase

## 3) Dashboard Admin

### Routes principales

- `/admin` -> vue d'ensemble
- `/admin/membres`
- `/admin/membres/:memberId`
- `/admin/evenements`
- `/admin/produits`
- `/admin/bilans`
- `/admin/communication`

### Layout admin (`src/pages/admin/AdminLayout.tsx`)

- Sidebar dédiée admin (navigation complète)
- Zone principale de gestion
- Déconnexion intégrée

### Vue d'ensemble (`src/pages/admin/AdminOverview.tsx`)

KPIs chargés depuis Supabase:

- Nombre total de membres (hors admin)
- Abonnements actifs
- Nouveaux membres du mois
- Prochain événement + nombre d'inscrits

### Membres (`src/pages/admin/AdminMembers.tsx`)

- Vue en cartes (profil, contact, plan, statut)
- Recherche texte
- Filtres par plan et rôle
- Lien vers fiche membre détaillée
- Hook dédié: `useAdminMembers` (avec message explicite si souci RLS)
- Filtres + recherche persistés : `localStorage` + **`profiles.admin_ui_prefs`** (clé `members_filters_v1`) via `usePersistentAdminState` après migration `20260422120000_profiles_admin_ui_prefs.sql`

### Événements (`src/pages/admin/AdminEvenements.tsx`)

- Préférences liste (filtres / recherche) : `admin_events_filters_v1` dans `admin_ui_prefs` (même hook que ci-dessus)
- CRUD complet événements (création/édition/suppression)
- Upload d'image (storage public)
- Toggle "inscriptions ouvertes"
- Compteur d'inscrits par événement
- Affichage des inscrits par événement
- Export CSV des inscrits

### Produits (`src/pages/admin/AdminProduits.tsx`)

- Préférences liste : `admin_products_filters_v1` dans `admin_ui_prefs`
- CRUD complet produits
- Gestion image URL ou upload
- Gestion champs métier (prix, calories, protéines, badges, ordre carrousel, visibilité)
- Filtres par catégorie
- Invalidation du cache menu après modifications (`invalidateMenuCatalogCache`)

### Bilans (`src/pages/admin/AdminBilans.tsx`)

- Onglet demandes:
  - liste des réservations bilan
  - filtre par statut
  - actions de statut (confirmer/annuler/en attente)
- Onglet créneaux:
  - création de créneaux
  - toggle disponibilité
  - suppression créneau

### Communication (`src/pages/admin/AdminCommunications.tsx`)

- Onglet popups:
  - CRUD des annonces site (`site_announcements`)
  - activation/désactivation
  - priorité et mode de fermeture
- Onglet newsletter:
  - liste des abonnés (`newsletter_subscribers`)
  - export CSV
  - suppression d'une entrée

## 4) Sécurité et accès

- Dashboard admin protégé par route dédiée admin (côté app)
- Les hooks admin dépendent de `isAdmin` (AuthContext)
- Certaines lectures sensibles reposent sur RLS Supabase (migration de correction mentionnée dans `useAdminMembers`)

## 5) Etat d'avancement

### Déjà en place

- Structure complète des deux dashboards
- Connexions Supabase sur les modules principaux
- CRUD admin opérationnel sur événements/produits/communication/bilans
- KPI membre/admin principaux branchés

### Prochaines optimisations recommandées

- Uniformiser gestion d'erreurs + toasts sur tous les écrans dashboard
- Ajouter rafraîchissement optimiste/local sur certaines actions admin (moins de refetch global)
- Brancher "Commander à nouveau" sur vraie logique d'historique commandes
- Ajouter tests fonctionnels ciblés (filtres admin, exports CSV, protections routes)

## 6) Fichiers clés (référence rapide)

- Client:
  - `src/pages/member/Dashboard.tsx`
  - `src/hooks/useDashboardStats.ts`
  - `src/hooks/useUpcomingEvents.ts`
- Admin:
  - `src/pages/admin/AdminLayout.tsx`
  - `src/pages/admin/AdminOverview.tsx`
  - `src/pages/admin/AdminMembers.tsx`
  - `src/pages/admin/AdminEvenements.tsx`
  - `src/pages/admin/AdminProduits.tsx`
  - `src/pages/admin/AdminBilans.tsx`
  - `src/pages/admin/AdminCommunications.tsx`
  - `src/hooks/usePersistentAdminState.ts` (préférences listes admin + sync `profiles.admin_ui_prefs`)

