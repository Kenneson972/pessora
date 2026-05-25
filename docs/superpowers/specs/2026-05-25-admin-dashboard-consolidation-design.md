# Admin Dashboard — Consolidation des sections

**Date** : 2026-05-25
**Statut** : Approuvé

## Objectif

Réduire le nombre d'entrées dans la navigation admin en regroupant les sections liées à la gestion de contenu sous deux pages avec onglets :

1. **Produits & Gammes** — fusion des sections Produits et Gammes
2. **Contenu** — fusion des sections Infos bar, Carrousel et Moments

## Navigation sidebar

Les 10 entrées actuelles passent à 7 :

```
Vue d'ensemble     /admin
Membres            /admin/membres
Événements         /admin/evenements
Produits & Gammes  /admin/produits-gammes   ← nouveau, 2 onglets
Bilans             /admin/bilans
Communication      /admin/communication
Contenu            /admin/contenu           ← nouveau, 3 onglets
```

Restent inchangés : Vue d'ensemble, Membres, Événements, Bilans, Communication.

## Routing

### Nouvelles routes
- `/admin/produits-gammes` → page avec onglets Produits | Gammes
- `/admin/contenu` → page avec onglets Infos bar | Carrousel | Moments

### Redirections (anciennes vers nouvelles)
- `/admin/produits` → redirige vers `/admin/produits-gammes?tab=produits`
- `/admin/gammes` → redirige vers `/admin/produits-gammes?tab=gammes`
- `/admin/infos` → redirige vers `/admin/contenu?tab=infos-bar`
- `/admin/carousel` → redirige vers `/admin/contenu?tab=carrousel`
- `/admin/moments` → redirige vers `/admin/contenu?tab=moments`

## Page Produits & Gammes

### Onglet Produits
- Contenu identique à l'actuel `AdminProduits.tsx`
- Grille de cartes, recherche, filtres par gamme/visibilité, modal d'édition, export CSV
- Aucune modification fonctionnelle

### Onglet Gammes
- Réécrit avec le **même design UI que Produits**
- Grille de cartes (image, nom, prix, statut visible/masqué)
- Filtres par gamme (Sport, Skin, Wellness) et sous-catégorie
- Modal d'édition avec les champs spécifiques aux produits de gamme (nom, prix, prix alternatif, description, image, ordre)
- Archive/restore, suppression
- Mêmes patterns visuels que Produits : cartes, badges, boutons d'action

## Page Contenu

### Onglet Infos bar
- Formulaire actuel inchangé (adresse, horaires, contact, abonnement Óra+)
- Contenu identique à l'actuel `AdminInfosBar.tsx`

### Onglet Carrousel
- Liste drag-drop actuelle inchangée
- Contenu identique à l'actuel `AdminCarousel.tsx`

### Onglet Moments
- Liste drag-drop actuelle inchangée
- Contenu identique à l'actuel `AdminSplitGammes.tsx`

## Architecture

### Fichiers modifiés
- `src/App.tsx` — ajout des 2 nouvelles routes, redirections pour les 5 anciennes
- `src/pages/admin/AdminLayout.tsx` — nouvelle navigation : 2 entrées remplacent 5

### Fichiers créés
- `src/pages/admin/AdminProduitsGammes.tsx` — page avec onglets Produits | Gammes
- `src/pages/admin/AdminContenu.tsx` — page avec onglets Infos bar | Carrousel | Moments

### Fichiers supprimés (remplacés par les onglets)
- Aucun — les composants existants sont importés dans les nouvelles pages ongletées

### Dépendances
- `@heroui/react` Tabs component pour les onglets
- Routes protégées via `ProtectedAdminRoute` existant

## Non-concerns
- Aucun changement aux composants métier (produits, gammes, carousel, infos bar, split gammes)
- Aucun changement aux données ou hooks
- Aucun changement aux pages publiques
- Aucun changement aux styles globaux
