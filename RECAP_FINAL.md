# Récapitulatif Final — Site PessÓra

Dernière mise à jour : **4 Juin 2026**

## Stack

- **Front** : React 19 + Vite, React Router 7, Tailwind v4, HeroUI v3, Framer Motion, Zustand
- **Backend** : Supabase (auth, DB, Storage, Edge Functions, Realtime)
- **Paiement** : Stripe Checkout (edge function)
- **Domaine** : pessora.fr (redirection depuis pessora.mq)
- **Déploiement** : Vercel (front) + Supabase (cloud)

## Pages publiques

| Page | Route | État |
|------|-------|------|
| Accueil | `/` | Hero, carrousels (featured + coups de cœur + gammes), infos bar |
| Le Concept | `/concept` | Histoire, valeurs |
| Menu | `/menu` | 12 boissons + boosters + laits, filtres, fiche détail |
| Nos Produits | `/nos-produits` | 3 gammes Herbalife (Wellness, Sport, Skin) |
| Détail gamme | `/nos-produits/:gamme` | Layout éditorial alterné |
| Détail produit | `/nos-produits/:gamme/:slug` | Hero split, cross-sell, panier, option cuillère doseuse |
| Óra+ | `/ora-plus` | Abonnement Stripe |
| Événements | `/evenements` | Partenariats |
| Contact | `/contact` | Formulaire, coordonnées |
| Suivi commande | `/suivi-commande` | Realtime, access token |
| Commande succès | `/commande/succes` | Confirmation, pending→paid auto |
| Commande annulée | `/commande/annulee` | |
| CGV | `/cgv` | |
| Mentions légales | `/mentions-legales` | |
| Politique confidentialité | `/politique-confidentialite` | |

## Espace membre

| Page | Route |
|------|-------|
| Dashboard | `/mon-espace` |
| Mes bilans | `/mon-espace/bilans` |
| Abonnement | `/mon-espace/abonnement` |
| Réservations | `/mon-espace/reservations` |
| Connexion | `/connexion` |
| Inscription | `/inscription` |

## Admin

| Page | Route |
|------|-------|
| Vue d'ensemble | `/admin` (KPIs, analytics Recharts) |
| Commandes | `/admin/commandes` (filtres bar/gamme, statuts, Realtime) |
| **Mode Bar** 🆕 | `/admin/bar` (vue cuisine fullscreen, timer, optimistic updates) |
| Produits | `/admin/produits` (duplication, prix auto, édition inline) |
| Gammes | `/admin/gammes` (Wellness/Sport/Skin) |
| Carrousel | `/admin/carousel` (cartes éditoriales) |
| Moments | `/admin/moments` (split gammes homepage) |
| Membres | `/admin/membres` |
| Fiche membre | `/admin/membres/:id` (Stripe, abonnement, historique) |
| Événements | `/admin/evenements` |
| Infos bar | `/admin/infos` (horaires, contact, PessoBot) |
| Contenu | `/admin/contenu` (bannière homepage, SEO) |
| Retraits Gamme ⏳ | `/admin/retraits` (EN COURS — Cursor buggé) |

## Fonctionnalités clés

### Panier & Checkout
- Panier Zustand persistant (`localStorage`), unifié bar + boutique
- Checkout invité (nom + téléphone)
- Stripe Checkout via Edge Function Supabase
- Validation prix serveur (anti-fraude) + support cuillère doseuse
- **3 filets de sécurité pour pending→paid** : page succès, webhook Stripe, admin polling
- Webhook Stripe idempotent (`stripe_events_processed`)
- Suivi commande en temps réel (Realtime + access token)

### Mode Bar 🆕
- Vue fullscreen fond noir, optimisée cuisine/bar
- Sidebar desktop + bottom bar mobile pour navigation entre commandes
- Timer en direct depuis début préparation (alerte rouge si >15 min)
- **Optimistic updates** : statut UI instantané, synchro DB en arrière-plan
- Sons de notification : MP3 personnalisés avec priming audio au premier clic
- Polling 10s fallback si Realtime déconnecte (inspiré de DALCIELO)
- Actions : "Commencer la prépa" → "Marquer comme PRÊTE"

### CRUD Boissons 🆕
- **Duplication** : bouton Copy → formulaire pré-rempli (tout sauf nom)
- **Prix auto par taille** : case à cocher, 1 seul prix → small/large calculés (×0.8, ×1.3)
- **Édition inline du prix** : clic sur le prix dans la carte → modifiable direct
- Suppression commandes admin avec confirmation + audit log

### Cuillères doseuses 🆕
- `src/data/spoonMap.ts` — mapping slug → couleur par produit
- Option gratuite, checkbox visible uniquement si le produit a une cuillère
- Pastille de couleur dans le label
- Intégrée au checkout (optionsKey: `spoon:0`)

### Gammes Herbalife
- **36/36** produits avec image (CDN Herbalife)
- **36/36** descriptions enrichies (2-3 phrases marketing)
- 15 Skin, 15 Sport, 6 Wellness — tous actifs en DB

### Óra+ (abonnement)
- Checkout abonnement Stripe (24,90€/mois)
- -50% sur les boissons pour les membres actifs
- Gestion admin : consultation, annulation, portail Stripe
- Webhook Stripe pour sync statut

### Sécurité
- CSP complet (Vercel headers)
- HSTS 63072000, X-Frame-Options DENY
- RLS Supabase (bilan_slots, bilan_bookings, stripe_events)
- Audit log admin
- CSRF helper client
- Edge Functions : JWT verification + admin role check
- Delete commande via edge function (SERVICE_ROLE_KEY, FK-safe)

### Analytics
- Dashboard Recharts (CA 7j, commandes, top produits, pie gamme)
- Admin Toast system (success/error/info, auto-dismiss)

### PessoBot
- Chatbot n8n avec rate limiting Postgres
- Tool calling (get_menu, get_upcoming_events)
- Personnalisation visiteur / membre / Óra+

## Base de données Supabase

| Table | État |
|-------|------|
| `gamme_products` | 36/36 image_url + descriptions |
| `products` (bar) | 15 produits actifs |
| `home_carousel_cards` | CRUD admin |
| `home_split_gammes` | 4 sections éditables |
| `orders` + `order_items` | token accès, nom/tél, RGPD, stripe_session_id |
| `stripe_events_processed` | Idempotence webhook |
| `subscriptions` | Stripe sync |
| `profiles` | admin_ui_prefs, stripe_customer_id |
| `admin_audit_log` | traçabilité |
| `bar_status` | Realtime |
| `stock_movements` | traçabilité stocks |

## Buckets Storage
- `carousel-images` — photos "À la une"
- `split-gammes-images` — photos "Choisis ton moment"
- `product-images` — photos produits
- `event-images` — photos événements

## Edge Functions Supabase

| Fonction | Rôle |
|----------|------|
| `create-checkout-session` | Création session Stripe + commande pending |
| `get-order-for-success` | Lecture commande pour page succès |
| `get-order-by-token` | Suivi commande public |
| `update-order-status` | PATCH pending→paid (idempotent) |
| `delete-order` 🆕 | Suppression order_items + order (FK-safe) |
| `stripe-webhook` | checkout.session.completed → pending→paid |
| `admin-portal-session` | Portail admin |
| `create-customer-portal-session` | Portail client Stripe |
| `cancel-stripe-subscription` | Annulation abonnement |
| `create-subscription-session` | Abonnement Óra+ |
| `verify-subscription-session` | Vérification abonnement |
| `get-stripe-member` | Infos Stripe membre |
| `send-contact-email` | Formulaire contact |

## Domaine & SEO
- Domaine : **pessora.fr** (canonique sans www)
- Sitemap dynamique, JSON-LD Product/ItemList
- OG/Twitter meta, h1 visible
- vercel.json : cleanUrls, security headers

## Historique récent

### 3-4 Juin 2026 — Séparation Bar/Gamme + Finitions
- **Séparation bar/gamme** : order_type, scheduled_pickup_date, checkout split, 2 orders si mix
- **RetraitsGamme Kanban** : 4 colonnes, date picker, cartes détaillées, design premium anthracite
- **Guest checkout** : formulaire nom/téléphone, CTA invité masqué si connecté
- **ModeBar** : filtre order_type bar uniquement, fond anthracite premium
- **Newsletter admin** : edge function send-newsletter (Resend BCC), composer AdminCommunications
- **Templates email** : redesign sapin #1E3529, contraste AA, logo PESSOV2, images lifestyle
- **Images** : 122 fichiers convertis WebP, ratio images corrigés (carré 1:1 menu, portrait 2:3 boissons)
- **Badges** : Nouveauté/Coup de cœur sur cartes Menu et fiche boisson
- **PessoBot** : repositionné assistant bar, workflow n8n v4
- **Favicon** : fix crop, redimensions, suppression résiduels
- **Stripe** : doc go-live prête, webhook split orders, async_payment, CORS fix
- **Sécurité** : JSON n8n retiré du repo, CSP unsafe-eval retiré
- **SuiviCommande** : hero redesign, timeline colorée, CTA inscription invités, polling 5s
- **Boissons** : badges, pastilles, booster admin CRUD, prix Óra+ calculé 50%
- **SEO** : sitemap, JSON-LD, OG/Twitter, h1 visible

### 2 Juin 2026 — 13 commits
- **Guest checkout** (nom + téléphone), CORS localhost
- **Fix pending→paid** : page succès + webhook + admin polling 10s
- **Mode Bar** : vue cuisine fullscreen, timer, optimistic updates, sons MP3
- **CRUD boissons** : duplication, prix auto par taille, édition inline
- **Cuillères doseuses** : spoonMap, option gratuite avec pastille couleur
- **Domaine** : pessora.mq → pessora.fr
- **delete-order** : edge function FK-safe
- **motionReveal fix** : ModeBar crash

### 1er Juin 2026 — 60 fixes d'audit
- **65 fixes** en 23 commits (5 phases)
- P0 Sécurité (5), P0 Frontend (4), P1 Prioritaire (16), SEO (16), P2 Cosmétique (19)
- Guest checkout form, verifyAdmin dédupliqué, debounce ×3
- Score SEO : ~70 → ~85/100
- 36/36 images gamme, 36/36 descriptions enrichies

## En cours ⏳

### Stripe Live (bloqué — attend clés de la gérante)
- Suivre `docs/stripe-live-deployment.md`
- Clés nécessaires : `sk_live_...`, `whsec_...`, `price_...`
- Edge functions à redéployer
- Test paiement 1€

### PessoBot (à activer après go-live)
- Workflow n8n prêt (v4)
- Rate limiting Postgres en place
- Tool calling : get_menu, get_upcoming_events
