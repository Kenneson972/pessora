# Admin dashboard — produits Supabase, membres éditables, Stripe, métriques

**Date :** 2026-04-19 (révision : événements + médias produits + synchro `menuData`)  
**Statut :** Spécification produit — itérations : RLS dashboard, source produits = A, membres = B, Stripe, agrégats, **gestion événements avec visuels**, **sync initiale depuis `menuData` + transfert des visuels accueil**.

## 1. Objectifs

- Corriger l’écart **prix sur le site vs liste admin vide** : le site doit consommer **`public.products`** comme source de vérité en production.
- **Synchroniser une fois** le référentiel existant **`menuData`** (+ métadonnées **`homeProductCarousel`**) vers **`products`** pour ne pas repasser manuellement chaque fiche ; les fichiers déjà dans `public/` (ex. `home-showcase-*.png`) deviennent les **`image_url`** (chemins publics ou URLs Storage après migration).
- **Gestion produits complète** : champs éditoriaux + **image principale** (aperçu admin, recadrage léger optionnel v2) ; conserver un **fallback emoji** (`icon` / mapping par `id`) si pas d’image — aujourd’hui les boissons utilisent des emojis dans `menuData` et des PNG sur le carrousel d’accueil.
- **Événements** : admin **plus fluide** (liste, filtres, statut) + **ajout / remplacement de photo** (upload vers **Supabase Storage** + URL stockée dans `events.image_url`, pas seulement un champ texte nu).
- Rendre l’**admin membres** actionnable : édition **profil** (prénom, nom, téléphone) et **abonnement** (plan, statut — champs existants sur `subscriptions`).
- **Préparer Stripe** : lier les comptes aux IDs Stripe (clients / abonnements existants + futurs webhooks).
- **Exposer des métriques** par membre et au niveau dashboard : bilans, commandes / boissons, abonnement.

## 2. Prérequis (déjà validés)

- Migration type `docs/supabase_migration_dashboard.sql` **déjà appliquée** : fonction `is_admin()`, policies lecture/écriture admin sur `profiles` et `subscriptions`.
- En cas de liste membres encore incorrecte : vérifier côté exécution (requête, erreurs réseau) et **données** (`first_name` / `last_name` souvent null si non saisis à l’inscription).

## 3. Produits — source de vérité Supabase

### 3.1 Lecture publique

- Menu, fiche boisson, recherche, carrousel accueil — alimentés par **`products`** (filtres `active`, catégorie, etc.).
- **`menuData.ts`** : après synchro et validation en prod, réduit au **fallback dev** uniquement (feature flag ou build) ou retiré ; pas de double vérité côté contenu prix / descriptif.

### 3.2 Synchronisation initiale depuis `menuData` + carrousel

- **Script idempotent** (Node ou SQL généré) qui pour chaque entrée de `menuItems` :
  - insère ou met à jour **`products`** avec `id` stable = **slug métier** identique à `menuData.id` (UUID côté BDD : soit colonne `slug` unique, soit mapping table — à trancher en implémentation : recommandation **colonne `slug` text unique** + `id` uuid interne pour ne pas casser les FK `order_items`).
  - mappe : nom, catégorie, prix, calories, protéines, description, `ingredients[]`, `benefits[]`, pitch si ajouté en colonne, `active: true`.
- **Visuels** : lire **`homeProductCarousel`** (`src/data/homeProductCarousel.ts`) : pour chaque `id`, si `imageSrc` est défini (ex. `/home-showcase-pink-dragon-shake.png`), écrire cette valeur dans **`products.image_url`** (URL absolue du site ou chemin `/...` cohérent avec `index.html` / Vite `public/`).
- Emojis : soit colonne optionnelle **`icon_emoji` text** sur `products`, soit conserver un **map statique minimal** `productId → emoji` jusqu’à full CMS — la spec recommande **colonne** pour tout centraliser en base.
- Ordre du carrousel : soit colonne **`carousel_order` int nullable** sur `products`, soit table **`home_carousel_slots`** (product_id, position, badge) — permet d’éditer l’accueil sans redéployer.

### 3.3 Gestion admin produits (« vrai » back-office)

- Formulaire : tous les champs métier + **aperçu image** + upload optionnel vers **bucket Storage** `product-images` (policy : lecture publique, écriture admin) ; enregistrer l’URL publique dans `image_url`.
- Validation : prix > 0, catégorie dans l’enum, taille / type fichier image (webp, jpeg, png).
- Cohérence : une boisson sans image affiche l’**emoji** si présent en base, sinon placeholder neutre (même logique que le design actuel).

## 3bis. Événements — gestion intelligente + photos

### Contexte

- `AdminEvenements` gère déjà un champ **`image_url`** (saisie manuelle). Il faut le rendre **opérationnel** : upload, prévisualisation, remplacement.

### Comportement attendu

- **Bucket Storage** dédié `event-images` (ou préfixe dans un bucket `media/`) ; policies **lecture publique** pour les fichiers publics, **insert/update** réservés **admin** (`is_admin()`).
- UI : bouton « **Choisir une image** » → upload → progression → mise à jour de `events.image_url` avec l’URL finale ; possibilité de **supprimer** (clear URL + suppression fichier optionnelle v2).
- **Liste admin** : vignette miniature + titre + date + statut (`active`, `registration_open`) + actions rapides (dupliquer, désactiver) — périmètre **v1** : au minimum vignette + tri par date.
- **Smart** : alertes légères (événement dans < 7 jours sans image, places bientôt complètes) — **v2** si besoin.

### Schéma

- Aucun changement obligatoire sur `events` si `image_url` suffit ; optionnel : `image_storage_path` pour supprimer proprement le fichier côté Storage.

## 4. Admin membres (périmètre B)

### 4.1 Affichage

- Colonne **Membre** : `first_name` + `last_name` ; si les deux vides → afficher **email** (et éventuellement téléphone) pour éviter les cellules vides.
- Colonnes existantes : email, plan, statut abonnement, date d’inscription.

### 4.2 Actions

- **Édition profil** : `first_name`, `last_name`, `phone` sur `profiles` (updates via client authentifié admin, conformes RLS).
- **Édition abonnement** : `plan`, `status`, `end_date`, `auto_renew`, `price` sur `subscriptions` (ligne unique par `user_id` — respecter la contrainte `unique(user_id)`).
- **Hors périmètre v1** : promotion `role` admin depuis l’UI (traiter dans une itération sécurisée avec audit) ; **notes internes** membre (nouvelle colonne) — optionnel plus tard.

### 4.3 UX

- Panneau latéral ou ligne dépliante avec formulaire + **Enregistrer / Annuler**.
- Retour utilisateur explicite (succès / erreur serveur ou RLS).

## 5. Stripe — préparation et synchronisation

### 5.1 Modèle de données

- **`subscriptions`** : déjà `stripe_subscription_id` ; compléter par **`stripe_customer_id`** si stocké au niveau abonnement, ou **`profiles.stripe_customer_id`** (choisir **un seul** lieu canonique pour le customer — recommandation : **profiles** pour tout lien client, **subscriptions** pour l’abonnement récurrent).
- Optionnel : `stripe_price_id` pour tracer le prix Stripe utilisé.

### 5.2 Données existantes (hors site)

- **Backfill manuel ou script ponctuel** : associer `user_id` / email aux **customer** et **subscription** Stripe existants (one-shot, documenté, exécuté par un admin technique).
- Aucune exposition de **secret** Stripe côté navigateur ; toute synchro « live » avec l’API Stripe = **Edge Function** ou backend avec `STRIPE_SECRET_KEY`.

### 5.3 Webhooks (phase suivante, décrite ici pour alignement)

- Endpoints typiques : `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` (selon modèle de facturation).
- Effet attendu : mettre à jour `subscriptions.status`, `end_date`, et éventuellement `plan` si mappé depuis Stripe.

## 6. Métriques — collecte et affichage

### 6.1 Par membre (dans admin membres ou fiche détail)

- **Bilans** : nombre de lignes dans **`bilan_bookings`** où `user_id` = id membre (exclure annulés si besoin métier).
- **Boissons / CA** : agrégats sur **`orders`** + **`order_items`** (quantités, montants) pour `user_id` ; si commandes encore peu utilisées, afficher 0 avec message explicite.
- **Abonnement** : lecture directe depuis **`subscriptions`**.

### 6.2 Vue d’ensemble (`/admin`)

- KPIs v1 : nombre de membres, abonnements actifs par plan (agrégation SQL), bilans sur période, commandes sur période — implémentation par **requêtes** ou **vue SQL** matérialisée si volume augmente.

## 7. Approche retenue (trade-offs)

- **Métriques** : agrégations à la demande / vues SQL (**approche pragmatique**), pas de table `user_stats` ni triggers tant que le volume ne l’exige pas.
- **Stripe** : colonnes + backfill + webhooks planifiés ; pas de dépendance à un outil BI externe pour le MVP.

## 8. Risques et sécurité

- Vérifier les policies **INSERT** sur `subscriptions` si création depuis l’admin (aujourd’hui souvent trigger à l’inscription uniquement).
- Ne jamais utiliser **`user_metadata`** seul pour le rôle admin (déjà le cas : `profiles.role`).
- Valider les mises à jour d’abonnement pour éviter les incohérences avec Stripe une fois les webhooks actifs.
- **Storage** : bucket privé en écriture pour les uploads admin ; pas d’upload anonyme ; limiter taille et MIME types ; éviter les URLs signées expirées pour les images **marketing** (préférer fichiers publics en lecture).
- **CORS** : configurer les origines autorisées pour upload direct depuis le navigateur si utilisé.

## 9. Ordre d’implémentation suggéré

1. Migrations **`products`** : colonnes manquantes (`slug`, `icon_emoji`, `carousel_order` ou table slots, alignement avec `menuData`).  
2. **Script de synchro** `menuData` + `homeProductCarousel` → `products` + reprise des chemins **`/home-showcase-*.png`**.  
3. Buckets **Storage** (`product-images`, `event-images`) + policies admin.  
4. **Admin produits** : édition complète + upload image ; puis **bascule lecture** Menu / DrinkDetail / HomeProductCarousel vers **fetch Supabase**.  
5. **Admin événements** : upload photo + liste avec vignettes.  
6. Admin membres : affichage robuste + édition profil + édition subscription.  
7. Colonnes Stripe + doc backfill.  
8. KPIs dashboard + métriques par membre.  
9. Webhooks Stripe (Edge Function) + tests.

## 10. Hors scope (v1)

- Notes internes CRM sur le membre.  
- Promotion / révocation admin depuis l’UI.  
- Synchronisation bidirectionnelle temps réel avec Stripe sans webhooks.  
- Éditeur d’image avancé (recadrage IA, etc.).  
- CDN hors Supabase / Cloudflare (peut être ajouté plus tard devant Storage public).
