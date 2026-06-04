# Prompt Cursor — Audit Flux Commande & Paiement Pessora

## Objectif

Audite TOUT le flux de commande et paiement de Pessora — de la page produit jusqu'à la livraison admin. Vérifie que chaque étape fonctionne, identifie les bugs, et propose des améliorations concrètes.

## Règles

- Lis les fichiers avant de les modifier
- Ne casse rien — propose des fix, pas des refactos
- Priorité : bugs > améliorations UX > polish cosmétique
- Documente chaque problème trouvé avec : fichier, ligne, description, sévérité (P0/P1/P2)
- Les corrections de Kenneson sont des règles dures

## 1. Tunnel d'achat — Espace Client

### 1.1 Panier (`/src/stores/cartStore.ts`, `/src/components/cart/`)
- Ajout produit bar : options (taille, lait, boosters) correctement sauvegardées
- Ajout produit gamme : date de retrait, cuillère doseuse
- Panier mixte (bar + gamme) : split correct en 2 orders
- Quantités, suppression, persistence localStorage
- Blocage checkout gamme pour guests (redirect connexion)

### 1.2 Checkout (`/src/pages/Checkout.tsx`, `/supabase/functions/create-checkout-session/`)
- Guest checkout : nom + téléphone obligatoires, validation
- Membre connecté : infos profil pré-remplies
- Création session Stripe : prix corrects, remise Óra+ -50% bar
- Cuillère doseuse : option `spoon:0` incluse
- Split panier mixte : `parent_payment_id`, 2 orders créées
- Gestion erreurs : Stripe down, réseau, session expirée

### 1.3 Page succès (`/src/pages/CommandeSucces.tsx`, `/supabase/functions/get-order-for-success/`)
- Affichage commande(s) bar ET gamme (2 cartes si mixte)
- Statut pending → paid automatique
- Affichage date de retrait gamme
- Lien vers suivi commande

### 1.4 Page annulée (`/src/pages/CommandeAnnulee.tsx`)
- Bouton retour → /menu (pas navigate(-1))

### 1.5 Suivi commande (`/src/pages/SuiviCommande.tsx`, `/supabase/functions/get-order-by-token/`)
- Access token dans l'URL fonctionnel
- Realtime : mise à jour instantanée du statut
- Polling 5s fallback si Realtime déconnecte
- Hero redesign : cercle statut, timeline colorée
- CTA inscription pour invités (masqué si connecté)
- 6 étapes pipeline gamme visibles

### 1.6 Historique (`/src/pages/espace-client/History.tsx`)
- Onglets Bar / Gamme fonctionnels
- Filtre par `order_type`
- Commandes récentes en premier
- Lien vers OrderDetail

### 1.7 Détail commande (`/src/pages/espace-client/OrderDetail.tsx`)
- Infos complètes : produits, prix, statut, date retrait
- Badge type gamme + scheduled_pickup_date
- Bouton copier lien suivi
- Timeline commande

## 2. Gestion commandes — Espace Admin

### 2.1 AdminCommandes (`/src/pages/admin/AdminCommandes.tsx`)
- Filtres : statut (pending/paid/scheduled/preparing/ready/completed), type (Bar/Gamme)
- Realtime : nouvelles commandes apparaissent sans refresh
- Polling 30s fallback
- Affichage : nom client, téléphone, N° commande, type, prix
- Actions : changer statut, supprimer (edge function FK-safe)
- Badge order_type visible

### 2.2 ModeBar (`/src/pages/admin/bar/ModeBar.tsx`)
- Filtre `order_type === 'bar'` uniquement
- Vue cuisine fullscreen, fond anthracite premium
- Timer depuis début préparation, alerte rouge >15min
- Optimistic updates : UI instantané, synchro DB arrière-plan
- Sons notification MP3, priming audio premier clic
- Actions : "Commencer la prépa" → "Marquer comme PRÊTE"
- Sidebar desktop + bottom bar mobile

### 2.3 RetraitsGamme (`/src/pages/admin/RetraitsGamme.tsx`)
- Kanban 4 colonnes : À planifier, Planifié, En préparation, Prêt
- Date picker intégré pour planifier
- Cartes détaillées (client, produits, date)
- Badge retard si dépassé
- Design anthracite premium

### 2.4 Dashboard (`/src/pages/admin/Dashboard.tsx`)
- KPIs : CA 7j, nombre commandes, top produits, pie gamme
- Données cohérentes avec la réalité
- Filtre temporel fonctionnel

## 3. Edge Functions Stripe — Vérifier

### 3.1 create-checkout-session
- Prix validés côté serveur (anti-fraude)
- Support cuillère doseuse
- Split bar/gamme si panier mixte
- Metadata : order_id(s), order_type

### 3.2 stripe-webhook
- checkout.session.completed → pending→paid
- Gestion `orders_ids` pour split
- Support `async_payment`
- Idempotence (`stripe_events_processed`)
- Logs d'erreur

### 3.3 get-order-for-success
- Vérification que le client a bien accès à SA commande
- Retourne toutes les orders liées (`parent_payment_id`)

### 3.4 get-order-by-token
- Token valide → commande
- Token expiré/invalide → erreur propre
- Pas de fuite de données entre clients

### 3.5 update-order-status
- PATCH pending→paid idempotent
- Validation statut (pas de saut illégal)

### 3.6 delete-order
- FK-safe : order_items supprimés avant order
- SERVICE_ROLE_KEY uniquement
- Audit log

## 4. Flux Óra+ (Abonnement)

### 4.1 Souscription (`/src/pages/OraPlus.tsx`, `/supabase/functions/create-subscription-session/`)
- Checkout abonnement Stripe
- Prix 24.90€/mois
- Webhook sync statut abonnement

### 4.2 Avantages membre
- Remise -50% boissons bar appliquée dans checkout
- Prix Óra+ affiché sur cartes Menu
- Badge membre dans l'interface

### 4.3 Gestion admin (`/src/pages/admin/Membres.tsx`, fiche membre)
- Consultation abonnement
- Portail Stripe client
- Annulation abonnement

## 5. Points transverses à vérifier

- **Mobile** : tout le flux fonctionne en responsive
- **Realtime** : pas de double affichage, pas de perte de mise à jour
- **Erreurs réseau** : messages utilisateur propres, pas de crash
- **Accessibilité** : contrastes AA, labels, rôles ARIA
- **Performances** : pas de render bloquant, chargements optimisés
- **Email** : templates confirmation commande cohérents avec le flux

## Format du rendu

1. **Rapport de bugs** : fichier, ligne, description, sévérité (P0/P1/P2)
2. **Améliorations proposées** : description + impact
3. **Correctifs appliqués** : liste des commits avec message

Ne modifie rien sans avoir lu le code d'abord. Chaque fix = 1 commit avec message clair.
