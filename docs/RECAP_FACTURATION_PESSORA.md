# Récapitulatif de prestations — PessÓra
**Document de facturation — Karibloo × PessÓra**
Date : avril 2026

---

## Vue d'ensemble du projet

Application web complète pour **PessÓra**, bar bien-être premium basé en Martinique. Développement full-stack d'un site vitrine luxe éditorial avec espace client, espace administration et infrastructure backend, de zéro à une application production-ready.

---

## 1. Site public (vitrine)

### Pages développées

| Page | URL | Description |
|------|-----|-------------|
| **Accueil** | `/` | Hero sombre éditorial, section boissons onglets (Wellness / Énergie / Shakes / Coffee) grille 1+2 frameless, avis Google, teaser ORA+, mise en avant événements. Boutons « + » ajout panier depuis vignettes. |
| **Concept** | `/concept` | Présentation de la philosophie PessÓra, valeurs, histoire, design minimaliste. |
| **Menu** | `/menu` | Catalogue des boissons par gamme avec filtres, grilles serrées, cartes frameless. Navigation par catégories. |
| **Fiche boisson** | `/menu/:drinkId` | Page détail d'une boisson : options lait, boosters, présentation, ajout au panier avec configuration complète. |
| **Nos Produits** | `/nos-produits` | Catalogue produits boutique par gamme (superfoods, accessoires, etc.). |
| **Page gamme** | `/nos-produits/:rangeId` | Page détail d'une gamme de produits avec liste des articles. |
| **Événements** | `/evenements` | Listing des événements depuis Supabase (ateliers, masterclass, etc.) avec filtres. |
| **Détail événement** | `/evenements/:slug` | Page détail d'un événement : description, date, capacité, bouton d'inscription. |
| **Bilan Bien-Être** | `/bilan-bien-etre` | Page service bilan bien-être personnalisé, formulaire de prise de contact / réservation. |
| **ORA+** | `/ora-plus` | Page dédiée au programme ORA+ (abonnement premium), avantages, CTA inscription. |
| **PessoBot** | `/pessobot` | Page standalone du chatbot IA PessÓra (accès public). |
| **Contact** | `/contact` | Page contact avec informations, formulaire, liens réseaux. |
| **Mentions légales** | `/mentions-legales` | Mentions légales complètes. |
| **CGV** | `/cgv` | Conditions Générales de Vente. |

**Total pages publiques : 14 pages**

---

## 2. Infrastructure technique globale (site public)

### Layout & navigation publique
- **Header** (`Header.tsx`) — Navigation type Nespresso, cellules légères, lien compte (prénom + icône User dynamique), badge panier avec animation, responsive mobile, menu hamburger.
- **HeaderSubNav** — Sous-navigation par gamme ou catégorie.
- **Footer** — Liens légaux, réseaux sociaux, newsletter, informations bar.
- **PageShell** — Wrapper commun pour les pages publiques.
- **ScrollToTop** — Remontée automatique au changement de route.
- **PageSEO** — Balises meta, titre, description par page (config `seoConfig.ts`).
- **AnnouncementPopup** — Popup d'annonce configurable depuis l'admin.
- **OraPlusTeaserStrip** — Bandeau teaser programme ORA+ intégré dans le flux.
- **NewsletterSignup** — Composant inscription newsletter (branché Supabase).
- **LazyWidget** — Chargement différé du chatbot (après 1,5s, idle-based).

### Panier client (`CartDrawer`)
- **Zustand store** (`store/cartStore.ts`) — État panier persisté `localStorage` : lignes `CartLine` (productId, unitPrice, quantity, optionsKey, optionLabels, image), fusion intelligente par produit + options, action `openCart` à l'ajout.
- **Helper cart** (`lib/cartLine.ts`) — `buildDrinkCartOptions` : construction clé unique + prix unitaire + libellés depuis options lait et boosters.
- **Tiroir panier** (`CartDrawer.tsx`) — Animation Framer Motion, `createPortal`, overlay + scroll lock + Échap, liste éditoriale avec formatage prix `formatEurFr`, total, mentions « règlement sur place », CTA « Préparer ma venue » (vers `/contact`), « Appeler le bar », vider le panier.
- Intégration dans `Header.tsx` (badge quantité, micro-animation +1), `DrinkDetail.tsx` (ajout configuré), `HomeProductCarousel.tsx` (ajout rapide 1-clic).

### Données catalogue
- `src/data/menuData.ts` — Catalogue complet des boissons (toutes gammes, options, prix).
- `src/data/productsData.ts` — Catalogue produits boutique.
- `src/data/infoData.ts` — Informations bar (adresse, horaires, téléphone, réseaux).
- `src/data/homeDrinkShowcase.ts` — 3 visuels × 4 gammes pour la section accueil onglets.
- `src/data/homeProductCarousel.ts` — Sélection de produits pour le carrousel accueil.
- `src/lib/menuVisuals.tsx` — Helpers visuels / emojis associés aux boissons.

### Chatbot PessoBot
- `components/common/Chatbot.tsx` — Interface chat IA PessÓra, branché sur webhook **n8n** (URL variable d'environnement), mode public + mode embedded (espace membre), chargement lazy en public.
- Script n8n documenté : `docs/PESSOBOT_N8N_SCRIPT_IMPROVED.js`.

---

## 3. Authentification & Backend

### Auth Supabase (`contexts/AuthContext.tsx`)
- Inscription / connexion / déconnexion via Supabase Auth.
- Chargement profil depuis la table `profiles` à l'authentification.
- `updateProfile` — mise à jour prénom, nom, téléphone, préférences.
- Gestion robuste : `INITIAL_SESSION`, listener unique, async différé `setTimeout(0)`, vérification session après `SIGNED_OUT`, `buildFallbackUser` si fetch profil échoue, refs `initialSessionHandled` / `loginInProgress`.
- Rôle admin détecté via champ `role` du profil (`isAdmin`).
- `ProtectedRoute` — garde de route espace membre.
- `ProtectedAdminRoute` — garde de route espace admin.
- `DemoAuthWrapper` — accès démo sans authentification (préfixe `/demo-espace`).

### Pages auth
- **Connexion** (`/connexion`) — Formulaire email/mot de passe, lien inscription, design luxe éditorial.
- **Inscription** (`/inscription`) — Formulaire création compte (email, mot de passe, prénom, nom), validation, création profil Supabase.

### Base de données Supabase (tables)
| Table | Rôle |
|-------|------|
| `profiles` | Profils membres (prénom, nom, téléphone, email, rôle, préférences, dates) |
| `events` | Événements bar (titre, description, date, capacité, image, slug, published) |
| `event_registrations` | Inscriptions membres aux événements |
| `products` | Produits boutique (nom, description, prix, gamme, image, stock, publié) |
| `subscriptions` | Abonnements ORA+ membres (plan, statut, Stripe ID, dates) |
| `orders` | Commandes membres (statut, total, notes, dates) |
| `order_items` | Lignes de commandes (produit, quantité, prix unitaire) |
| `bilan_bookings` | Réservations bilans bien-être (créneau, membre, statut, notes) |
| `announcements` | Popups d'annonces admin (titre, contenu, actif, dates) |
| `newsletter_subscribers` | Abonnés newsletter (email, date, statut) |

**RLS (Row Level Security)** configurée sur toutes les tables :
- Lecture membre = ses propres données uniquement.
- Lecture admin = toutes les données.
- Migrations SQL documentées (`supabase/migrations/`).

---

## 4. Espace membre (`/mon-espace/*`)

### Shell — MemberLayout
- Sidebar **76 px icon-only**, `hidden md:flex`, fond blanc, sticky.
- Boutons nav `w-11 h-11 rounded-[12px]`, actif = `bg-noir text-white`.
- Mode label vertical « MEMBRE ».
- Lien avatar bas → `/profil`.
- Lien « Administration » visible si `isAdmin`.
- Préfixe dynamique `/mon-espace` ou `/demo-espace` selon le contexte.

### Pages membre (6 pages)

| Page | URL | Contenu |
|------|-----|---------|
| **Tableau de bord** | `/mon-espace` | Hero magazine sombre (Variante B) : salutation serif 52px, AreaChart bien-être, 4 KPIs (commandes, événements, points, abonnement), liste événements Supabase, carte abonnement ORA+, strip de commande rapide 4 produits. Données réelles via hooks Supabase. |
| **Mes événements** | `/mon-espace/evenements` | Liste des inscriptions du membre avec statuts, détails événements, CTA découvrir plus. |
| **Bilan bien-être** | `/bilan-bien-etre` | Redirection vers la page publique bilan (accès depuis le menu membre). |
| **Mes commandes** | `/mon-espace/historique` | Historique des commandes avec statuts, dates, montants, détail des lignes. |
| **Mon abonnement** | `/mon-espace/abonnement` | Plan actuel, avantages, date renouvellement, CTA upgrade, grille `md:grid-cols-[7fr_5fr]`. |
| **Mon profil** | `/mon-espace/profil` | Formulaire édition prénom/nom/téléphone, email non modifiable, préférences (notifications, newsletter) avec toggles, bouton sécurité (changement mot de passe), bouton déconnexion. |

**Mode démo** : préfixe `/demo-espace` — accès sans auth pour présentation client (mêmes 5 pages + PessoBot embedded).

---

## 5. Espace administration (`/admin/*`)

### Shell — AdminLayout
- Sidebar **76 px icon-only**, `hidden md:flex`, fond blanc, sticky.
- Même système que MemberLayout, mode label « ADMIN ».
- Avatar initiales admin non-lié (non cliquable).
- Déconnexion → `/connexion`.

### Pages admin (7 sections)

#### Vue d'ensemble (`/admin`)
- **Variante A Editorial grid** : 4 KPIs top (membres totaux, abonnements actifs, nouveaux membres ce mois, événements à venir), AreaChart acquisition membres (12 mois), distribution plans abonnements (3 plans %), tableau des événements prochains (titre + date + barre capacité inscriptions/total), feed activité récente avec icônes, grille liens rapides.
- Données réelles : `profiles` count (hors admin), `subscriptions` count (actives), nouveaux membres mois courant, `events` à venir (4), `products` count.

#### Gestion membres (`/admin/membres`)
- Grille de cartes membres : initiales, nom, email, badge plan, badge statut.
- Filtres : plan (tous / ORA+ / Essentiel / Découverte), rôle (admin/membre), champ recherche.
- Squelette de chargement animé.
- Chaque carte → lien vers la fiche détail.

#### Fiche membre (`/admin/membres/:memberId`)
- Chargement `profiles` + `subscriptions`, puis `Promise.all` : commandes, bilans, inscriptions événements.
- Bloc identité : avatar initiales, email, UUID copiable, aide édition email hors-app.
- **Formulaire profil** : prénom, nom, téléphone, rôle → enregistrement Supabase.
- **Formulaire abonnement** : plan, statut, Stripe ID (lecture seule), dates → enregistrement.
- **Historique commandes** : liste orders + order_items (lecture seule).
- **Historique bilans** : liste bilan_bookings (lecture seule).
- **Historique événements** : liste event_registrations + events (lecture seule).
- Toasts succès / erreurs RLS par section.

#### Gestion événements (`/admin/evenements`)
- Liste des événements avec statut (publié / brouillon), date, capacité, inscrits.
- **Création** : formulaire complet (titre, description, date, heure, lieu, capacité, prix, image, slug, publié).
- **Édition** : modification de tous les champs.
- **Suppression** : avec confirmation.
- **Upload image** : vers Supabase Storage.
- **Export CSV** : liste des inscrits par événement.
- Gestion des inscriptions depuis l'admin.

#### Gestion produits (`/admin/produits`)
- Grille de cartes produits avec image, nom, prix, gamme, stock, statut.
- Filtres par gamme.
- **Création** : formulaire (nom, description, prix, gamme, image, stock, publié).
- **Édition** : formulaire inline, carte masquée pendant l'édition.
- **Suppression** : avec confirmation.
- **Upload image** : vers Supabase Storage.

#### Gestion bilans (`/admin/bilans`)
- Vue des réservations bilans bien-être.
- Gestion des créneaux disponibles.
- Statuts réservations (confirmé, en attente, annulé).
- Notes admin sur chaque réservation.

#### Communication (`/admin/communication`)
- **Popups d'annonces** : création / édition / suppression / activation-désactivation de popups affichées sur le site public.
- **Newsletter** : liste des abonnés, gestion des envois, statuts.

---

## 6. Système de design dashboard (primitives)

Composants partagés entre l'espace membre et l'admin, créés from scratch pour correspondre à la DA PessÓra.

### `src/components/dashboard/primitives.tsx`

| Composant | Description |
|-----------|-------------|
| `DashCard` | Carte avec `rounded-[2px] border`, variant light (fond blanc) ou dark (fond `bg-noir text-[#F5F2EC]`). |
| `DashEyebrow` | Étiquette `9px uppercase tracking-[0.22em]` — label de section. |
| `DashKPI` | Carte KPI : eyebrow + valeur serif 30px + slot optionnel (delta, action). |
| `DashPageHeader` | En-tête de page : px-5 md:px-10 + border-b ; h1 serif 40px, breadcrumb, sous-titre, slot action. |
| `DashPill` | Badge pill coloré (statut, catégorie). |
| `DashDelta` | Indicateur variation (+/- %) avec icône et couleur. |
| `DashBtn` | Bouton dashboard (variantes outlined / filled). |
| `DashStatusBadge` | Badge statut sémantique (actif, inactif, en attente…). |
| `DashInput` | Champ de saisie stylé dashboard. |
| `DashRule` | Séparateur horizontal `1px black/[0.06]`. |
| `Sparkline` | Mini graphique SVG sparkline (7-8 points, stroke uniquement). |
| `MiniBars` | Mini graphique barres SVG (données hebdomadaires). |
| `AreaChart` | Graphique area SVG responsive (gradient unique via `useRef`, `preserveAspectRatio="none"`, labels X/Y). |
| `Gauge` | Jauge demi-cercle SVG (score bien-être, progression abonnement). |

---

## 7. Design system global

### Tokens CSS (`src/index.css`)
- `--color-noir` — Noir éditorial PessÓra.
- `--color-surface-muted` — Fond gris très doux (fond des dashboards).
- `--color-surface-card`, `--color-surface-page`, `--color-surface-hero`.
- `--font-display` — Berthold Baskerville (serif éditorial).
- `--radius-card: 2px` — Rayon de carte minimal (luxe sobre).
- `--color-gold-dim` — Or atténué (accents toggles, badges).

### Conventions visuelles
- **Typographie** : Display serif / Jost sans-serif ; hiérarchie fine `font-light` / `font-normal`.
- **Cartes** : `rounded-[2px]`, `border border-black/[0.06]`, fond blanc ou `bg-noir`.
- **Sidebar icônes** : `rounded-[12px]` uniquement pour les boutons nav.
- **Grilles responsive** : `grid-cols-1 md:grid-cols-12`, `col-span-1 md:col-span-N`.
- **Mobile sidebar** : `hidden md:flex` — sidebar masquée sous md.
- **Direction DA** : Nespresso × Le Tanneur — air, surfaces sobres, animations courtes, zéro beige.

---

## 8. Performances & qualité

- **Lazy loading routes** : toutes les pages en `React.lazy()` + `Suspense` + fallback `PageLoadingFallback`.
- **Images lazy** : hook `useEffect` applique `loading="lazy" decoding="async"` sur toutes les `<img>` au changement de route.
- **Build** : Vite, 3 877 modules, ~2,7 s. 0 erreur TypeScript (`tsc --noEmit`).
- **SEO** : `PageSEO` par route, `seoConfig.ts`, balises meta Open Graph.
- **Accessibilité** : skip link « Aller au contenu », `aria-label` sur tous les boutons icônes, `role` ARIA cohérents.
- **Sécurité** : `VITE_*` uniquement en client, pas de service role frontend, admin `ProtectedAdminRoute`, audit documenté (`AUDIT_SECURITE_PESSORA.md`).

---

## 9. Documentation technique livrée

| Fichier | Contenu |
|---------|---------|
| `docs/RECAP_TRAVAIL_PESSORA.md` | Journal de synthèse complet (stack, auth, changelog). |
| `docs/AUDIT_SECURITE_PESSORA.md` | Audit sécurité — obligations dev. |
| `docs/AUDIT_GLOBAL_KARIBLOOM_PESSORA.md` | Audit grille Karibloom (stack, archi, SEO, forms, perf, déploiement). |
| `docs/SUPABASE_SCHEMA.sql` | Schéma complet Supabase. |
| `docs/ETAPES_APRES_BDD.md` | Étapes post-configuration BDD. |
| `docs/PESSOBOT_N8N_SCRIPT_IMPROVED.js` | Script logique n8n du chatbot. |
| `supabase/migrations/*.sql` | Migrations SQL versionnées (RLS, colonnes, politiques admin). |
| `docs/superpowers/specs/` | Specs design (redesign luxe, espace client, dashboard, admin membre, panier). |

---

## 10. Récapitulatif chiffré

| Espace / Module | Pages / Composants |
|-----------------|-------------------|
| Site public | 14 pages |
| Auth (connexion + inscription) | 2 pages |
| Espace membre (shell + pages) | 1 layout + 5 pages + mode démo |
| Espace admin (shell + pages) | 1 layout + 7 sections (dont fiche membre détail) |
| Panier client complet | 1 store + 1 tiroir + 1 helper + intégrations |
| Chatbot PessoBot | 1 interface (public + embedded) |
| Design system dashboard | 15 composants primitifs + 4 graphiques SVG |
| Tokens / design system global | 1 fichier CSS theme complet |
| Tables Supabase | 10 tables + RLS |
| Documentation | 8+ documents techniques |

**Total fichiers source créés ou modifiés : ~60 fichiers TypeScript/TSX**

---

*Document établi par Karibloo — avril 2026*
*Toute reproduction partielle soumise à accord préalable.*
