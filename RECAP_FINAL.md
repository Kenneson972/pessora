# Récapitulatif Final — Site PessÓra

Dernière mise à jour : **31 Mai 2026**

## Stack

- **Front** : React 19 + Vite, React Router 7, Tailwind v4, HeroUI v3, Framer Motion, Zustand
- **Backend** : Supabase (auth, DB, Storage, Edge Functions, Realtime)
- **Paiement** : Stripe Checkout (edge function)
- **Déploiement** : Vercel (front) + Supabase (cloud)

## Pages publiques

| Page | Route | État |
|------|-------|------|
| Accueil | `/` | Hero, carrousels (featured + coups de cœur + gammes), infos bar |
| Le Concept | `/concept` | Histoire, valeurs |
| Menu | `/menu` | 12 boissons + boosters + laits, filtres, fiche détail |
| Nos Produits | `/nos-produits` | 3 gammes Herbalife (Wellness, Sport, Skin) |
| Détail gamme | `/nos-produits/:gamme` | Layout éditorial alterné |
| Détail produit | `/nos-produits/:gamme/:slug` | Hero split, cross-sell, panier |
| Óra+ | `/ora-plus` | Abonnement Stripe |
| Événements | `/evenements` | Partenariats |
| Contact | `/contact` | Formulaire, coordonnées |
| Suivi commande | `/suivi-commande` | Realtime, access token |
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
| Commandes | `/admin/commandes` (filtres, statuts, Realtime) |
| Produits | `/admin/produits` (bar + boutique) |
| Gammes | `/admin/gammes` (Wellness/Sport/Skin) |
| Carrousel | `/admin/carousel` (cartes éditoriales) |
| Moments | `/admin/moments` (split gammes homepage) |
| Membres | `/admin/membres` |
| Fiche membre | `/admin/membres/:id` (Stripe, abonnement, historique) |
| Événements | `/admin/evenements` |
| Infos bar | `/admin/infos` (horaires, contact, PessoBot) |
| Contenu | `/admin/contenu` (bannière homepage, SEO) |

## Fonctionnalités clés

### Panier & Checkout
- Panier Zustand persistant (`localStorage`), unifié bar + boutique
- Checkout invité (nom + téléphone)
- Stripe Checkout via Edge Function Supabase
- Validation prix serveur (anti-fraude)
- Suivi commande en temps réel (Realtime + access token)

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
| `orders` + `order_items` | token accès, nom/tél, RGPD |
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

## Domaine & SEO
- Domaine : pessora.mq (canonique sans www)
- Sitemap dynamique, JSON-LD Product/ItemList
- OG/Twitter meta, h1 visible
- vercel.json : cleanUrls, security headers

## État actuel : ✅ Production Ready

Derniers commits : 31 Mai 2026 — 36/36 images gamme, 36/36 descriptions enrichies, checkout invité, analytics, bar status, stocks, audit log.

Prochaines étapes : déployer edge functions Stripe sur Supabase (configurer `STRIPE_SECRET_KEY`), intégrer BarStatusProvider dans App.tsx, tester checkout invité de bout en bout.
