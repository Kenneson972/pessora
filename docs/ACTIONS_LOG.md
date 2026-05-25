# ACTIONS_LOG — PessÓra

Journal append-only des actions majeures (features, migrations, sécurité, UI, config).
Format : `ISO` · `type` · résumé · fichiers · vérif.

---

## 2026-05-24

### 2026-05-24T · ui · Refonte header fixe + unifi section layout + minimalisme index

- **Contexte** : redesign complet du header (fixe 3 états Kayvilla-style), unification des wrappers section, réduction texte sur l'index.

- **Header refonte** :
  - Passage de `sticky` à `fixed` avec 3 états de transparence : transparent (hero sombre) → light-vitrage (défilement léger) → solid (bordure + ombre)
  - Taille augmentée : `h-14`→`h-16` mobile, `h-16`→`h-20` desktop, logo 32→36px, nav 9→10px
  - Scroll tracking RAF optimisé (`useState(() => window.scrollY > 24)`) pour éviter le flash initial
  - Grille centrage nav : `grid-cols-[1fr_auto_1fr]` au lieu de `[auto_1fr_auto]` pour centrer parfaitement les liens
  - Padding aligné sur `section-wrapper` : `lg:px-16`→`lg:px-[72px]`
  - `App.tsx` : padding conditionnel `<main>` → `showPublicChrome && !isHomePage && 'pt-16 md:pt-20'` pour garder le hero edge-to-edge

- **Layout unifié (CSS utilities)** :
  - `index.css` : `@utility section-wrapper` (max-w-1400px, padding 1rem→2.5rem→72px) et `@utility section-vertical-padding` (py via `--space-section-y-sm/md`)
  - 10 sections index passées en `section-wrapper` + `section-vertical-padding`
  - Header, Footer, et Hero passés en `lg:px-[72px]` pour alignement horizontal

- **Radius standardisé** :
  - `rounded-[8px/10px/12px]`→`rounded-[2px]` dans 4 composants (HomeFeaturedCarousel, HomeSplitGammes, HomeGammesProductTiles, HomeGammesProductCarousel)
  - OraPlusTeaserStrip : `border-l-2` (anti-pattern side-stripe) supprimé

- **Minimalisme texte index** :
  - Avis Google : citations 5-10 mots, cartes réduites (400-440px), étoiles supprimées, pas de label âge
  - HomeSplitGammes : sous-titre "Chaque boisson..." supprimé
  - Óra+ : texte raccourci ("sur les boissons." sans "au bar", "Bilan & événements prioritaires.")
  - Nos gammes carrousel : descriptions produit retirées (nom + prix seulement)
  - Événements : eyebrow supprimé, titre une ligne sans break
  - Titres section : `clamp(28px, 3.5vw, 44px)`→`clamp(21px, 2.4vw, 30px)` dans SectionTitle et tous les titres sur mesure
  - Heading "Nos gammes" : remplace `<h2>` manuel par `SectionTitle` standard

- **Files** : `src/index.css`, `src/App.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/common/OraPlusTeaserStrip.tsx`, `src/components/ui/SectionTitle.tsx`, `src/components/home/HomeGoogleReviews.tsx`, `src/components/home/HomeSplitGammes.tsx`, `src/components/home/HomeProductCarousel.tsx`, `src/components/home/HomeFeaturedCarousel.tsx`, `src/components/home/HomeGammesProductCarousel.tsx`, `src/data/googleReviews.ts`, `src/pages/Home.tsx`

- **Verify** : `npx tsc --noEmit` OK, 0 erreur console navigateur

### 2026-05-07T · fix · Commande : ne pas « valider » avant paiement Stripe

- **Contexte** : `create-checkout-session` insère une ligne `orders` en `pending` avant redirection Stripe ; l’admin et le membre la voyaient comme commande à traiter.
- **Summary** : file admin = statuts `paid` \| `preparing` \| `ready` seulement ; plus de bouton « Préparer » sur `pending` ; libellé `pending` = « En attente de paiement » ; `useOrders` exclut `pending` (brouillon checkout) ; annulation Stripe → `cancel_url` avec `order_id` + page `CommandeAnnulee` passe la commande en `cancelled` si encore `pending` ; migration RLS `Admins update all orders` + `Users cancel own pending orders`.
- **Files** : `src/hooks/useOrders.ts`, `src/pages/admin/AdminOverview.tsx`, `src/pages/admin/AdminMemberDetail.tsx`, `src/pages/member/History.tsx`, `src/pages/CommandeAnnulee.tsx`, `supabase/functions/create-checkout-session/index.ts`, `supabase/migrations/20260507120000_orders_update_rls_cancel.sql`
- **Verify** : `npx tsc --noEmit` OK — **à faire** : appliquer la migration Supabase + redéployer la Edge Function checkout.

---

## 2026-05-04

### 2026-05-04T · fix · Panier : prix public stocké, remise Óra+ au runtime + shakes sans choix de lait

- **Summary** : le modal carte enregistrait `unitPrice` déjà remisé → après déconnexion le panier restait à −50 %. Désormais **prix public** en stockage + `barBasePublic` pour la base boisson ; **affichage total** via `displayBarLineUnit` selon abonnement. **Shakes** : plus de segment lait / UI lait (coffee uniquement). `buildDrinkCartOptions` inclut `size` dans la clé quand pertinent.
- **Files** : `src/store/cartStore.ts`, `src/lib/cartLine.ts`, `src/lib/cartDisplayPrice.ts`, `src/components/cart/CartDrawer.tsx`, `src/components/cart/DrinkOptionsModal.tsx`, `src/pages/DrinkDetail.tsx`, `src/pages/CGV.tsx`
- **Note** : clé localStorage `pessora-cart` → `pessora-cart-v2` (panier local **réinitialisé une fois** au prochain chargement, évite anciennes lignes au tarif membre figé).
- **Verify** : `npx tsc --noEmit` OK

### 2026-05-04T · docs · Synthèse présentation direction (non technique + prompt PowerPoint)

- **Summary** : document `docs/PRESENTATION_GERANT_PESSORA_2026-05.md` — version enrichie : chronologie fin avril→début mai, Stripe/commandes détaillés en langage métier, admin événements/produits, PessoBot, mobile/a11y, logs `2026-04-20` à `2026-05-03` ; prompt IA allongé pour 14–16 slides.
- **Why** : restitution complète au gérant sans jargon excessif ; pas de secrets copiés depuis les logs.
- **Verify** : relecture cohérence avec ACTIONS_LOG + journaux

### 2026-05-04T · docs · Mémo présentateur (cheat sheet réunion gérant)

- **Summary** : `docs/MEMO_PRESENTATEUR_PESSORA.md` — structure 10 min / 25–40 min, FAQ, checklist, liens vers présentation longue et audit Stripe.
- **Why** : aide personnelle oral + prep sans relire tout le dossier.
- **Verify** : fichier créé, cohérent avec `PRESENTATION_GERANT_PESSORA_2026-05.md`

### 2026-05-04T · docs · Mémo présentateur réaligné sur PDF 15 slides

- **Summary** : `MEMO_PRESENTATEUR_PESSORA.md` — table slide par slide d’après `pessora_presentation_gerant_2026_20260504151302.pdf` ; avis interne (structure, titres forts, placeholders « Slide Content » à corriger) ; parcours express 10 min.
- **Why** : le deck exporté fait foi pour l’oral ; le mémo suit la numérotation réelle.
- **Verify** : titres PDF extraits + contrôle visuel recommandé sur slides 3–4, 8, 12, 14–15

## 2026-05-03

### 2026-05-03T · audit · Audit complet + correctifs P1/P2 (client, membre, admin)

- **Contexte** : audit complet du site en se mettant à la place d'un visiteur, d'un membre connecté et d'un admin. 2 P1, 3 P2 corrigés, 1 P2 documenté (as any).
- **Summary** : Voir `docs/logs/2026-05-03.md` — session "Correctifs audit complet".
- **Files** : `src/components/dashboard/DashboardBottomNav.tsx`, `src/pages/Contact.tsx`, `supabase/migrations/20260503200001_ensure_event_registrations_fk.sql`, `src/types/database.ts`, `src/pages/admin/AdminOverview.tsx`
- **Why** : fiabiliser l'expérience mobile membre, la soumission contact, la requête Supabase admin, et l'accessibilité clavier.
- **Verify** : `npx tsc --noEmit` OK, `npm run build` OK (warnings CSS HeroUI uniquement)

### 2026-05-03T · security · Correctifs Stripe P0/P1/P2 — prix serveur, idempotence, statut paid

- **Contexte** : audit Stripe du 3 mai a révélé 2 vulnérabilités P0 (prix calculé côté client sans validation serveur, pas d'idempotence webhook), 2 P1 (statut orders, activation Ora+ en fallback), 2 P2 (PII metadata, affichage statuts).
- **Summary** :
  - **P0-1** : `create-checkout-session` — nouvelle fonction `fetchVerifiedPrice()` interroge `products`/`gamme_products` en base, ignore le prix client (anti-fraude)
  - **P0-2** : `stripe-webhook` + migration `stripe_events_processed` — table d'idempotence (event.id PK), vérification avant traitement, marquage immédiat
  - **P1-3** : `stripe-webhook` — statut `completed` → `paid` (intermédiaire pending→paid→completed manuellement)
  - **P1-4** : `verify-subscription-session` — plus de fallback `activateOraPlus()`, retourne `pending` si webhook pas encore traité
  - **P2-5** : métadonnées Stripe — suppression de `customer_name` (PII)
  - **P2-6** : types DB + affichages — ajout `'paid'` aux types, badges et actions admin/membre
- **Files** : `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-subscription-session/index.ts`, `supabase/migrations/20260503210000_stripe_events_idempotence.sql`, `src/types/database.ts`, `src/pages/admin/AdminOverview.tsx`, `src/pages/member/Dashboard.tsx`, `src/pages/AbonnementSucces.tsx`
- **Why** : le prix était calculé côté client (fraudable), le webhook n'était pas idempotent (doublons potentiels), pas de statut intermédiaire pour les commandes payées.
- **Verify** : `npx tsc --noEmit` OK

### 2026-05-03T · ui · Accueil — restauration layout éditorial (Timeline Cursor) + persistance Git

- **Contexte** : une version non commitée de `Home.tsx` avait été écrasée ; la **Timeline locale Cursor** contenait encore un snapshot (`~/Library/Application Support/Cursor/User/History/70e9343/5U7a.tsx`, voir `entries.json` du même dossier) avec hero vidéo, `HomeProductCarousel`, `OraPlusTeaserStrip`, `HomeGoogleReviews`, `publicAssetWithCache` pour la carte Communauté.
- **Summary** :
  - `Home.tsx` — réintégration de cette version + `useEffect` pour `document.title` + flèches carrousel en `onPress` (HeroUI v3).
- **Why** : ne plus dépendre uniquement de l’historique machine ; version figée dans Git + trace écrite.
- **Files** : `src/pages/Home.tsx`, `docs/ACTIONS_LOG.md` (détail session aussi appendé dans `docs/logs/2026-05-03.md` — dossier `docs/logs` ignoré par le `.gitignore` du dépôt racine `~`, donc non commité là-bas)
- **Verify** : `npx tsc --noEmit` OK, `npm run build` OK

### 2026-05-03T · ui · Refonte page Gammes (NosProduits) + HeaderSubNav Segment HeroUI Pro

- **Contexte** : redesign complet de `/nos-produits` — layout éditorial alterné image/texte (comme Concept/Événements), retrait des produits de la page principale, sous-nav header migrée vers Segment HeroUI Pro centré. Suite à critique design : retrait des numéros de collection, renforcement section finale, shimmer loading, `from-noir` pour le gradient overlay.
- **Summary** :
  - `NosProduits.tsx` — réécriture complète : sections alternées avec `flex-row-reverse`, badges thématiques, compteur produits, CTA "Découvrir la collection" avec hover lift, `sizes` attribute, shimmer `animate-pulse`, ancres `id="collection-{id}"` pour scroll natif
  - `HeaderSubNav.tsx` — remplacement de l'ancienne sous-nav scrollable (chevrons, overflow-x-auto) par un Segment HeroUI Pro centré avec navigation vers les pages collection + scroll vers ancres depuis la page d'ensemble
  - `RangeDetail.tsx` — bouton "Renseignements" passe en `<Link>` vers `/nos-produits/:rangeId/:slug`
  - `headerNav.ts` — `SUBNAV_PRODUITS` remis en direct links (pas d'ancre)
- **Why** : la page était jugée "moche" par l'utilisateur ; besoin d'une expérience éditoriale premium cohérente avec le reste du site
- **Files** : `src/pages/NosProduits.tsx`, `src/components/layout/HeaderSubNav.tsx`, `src/pages/RangeDetail.tsx`, `src/data/headerNav.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-05-03.md`
- **Verify** : `npm run build` → OK (warnings CSS HeroUI uniquement)

### 2026-05-03T · feat · Pages détail produit (GammeProductDetail) + slug helper

- **Contexte** : implémentation des pages de détail pour les produits individuels dans les gammes, suite à redesign des gammes. Route : `/nos-produits/:rangeId/:slug`.
- **Summary** :
  - `src/lib/toSlug.ts` — nouveau helper : slugify (NFD + remove diacritics + lowercase + hyphens)
  - `src/lib/getGammeProduct.ts` — nouveau helper : lookup produit par rangeId + slug (fallback static)
  - `src/pages/GammeProductDetail.tsx` — nouvelle page : breadcrumb, split hero image/info, sélecteur quantité, add-to-cart avec `useCart`, caractéristiques, cross-sell, final CTA
  - `src/App.tsx` — route lazy `/nos-produits/:rangeId/:slug` avant `/nos-produits/:rangeId`
- **Why** : permettre aux visiteurs d'explorer chaque produit d'une gamme en détail avant achat
- **Files** : `src/pages/GammeProductDetail.tsx` (créé), `src/lib/toSlug.ts` (créé), `src/lib/getGammeProduct.ts` (créé), `src/App.tsx`
- **Verify** : `npm run build` → OK (après cleanup variables inutilisées)

### 2026-05-03T · feat · Tailles et prix dans DrinkDetail

- **Contexte** : les boissons au menu ont des prix par taille (`price_small`, `price_medium`, `price_large`) mais `DrinkDetail.tsx` n'utilisait qu'un seul `drink.price`. Ajout d'un sélecteur de taille avec calcul dynamique du prix.
- **Summary** :
  - `DrinkDetail.tsx` — ajout state `selectedSize`, sélecteur visuel small/medium/large, calcul `sizeBasePrice`, mise à jour de tous les appels `buildDrinkCartOptions` avec `sizePrice`
  - `src/lib/cartLine.ts` — `buildDrinkCartOptions` accepte `sizePrice?: number` optionnel
- **Why** : aligner le détail produit sur les prix réels par taille affichés dans le menu
- **Files** : `src/pages/DrinkDetail.tsx`, `src/lib/cartLine.ts`
- **Verify** : `npm run build` → OK

### 2026-05-03T · fix · Stripe double slash redirect / redirection commande annulée/succès + Edge Function siteUrl

- **Contexte** : retour Stripe vers `http://localhost:3000//commande/annulee` (double slash). Cause racine : `SITE_URL` potentiellement avec trailing slash dans l'Edge Function.
- **Summary** :
  - Frontend : `CommandeAnnulee.tsx` + `CommandeSucces.tsx` — refonte design complète (breadcrumb, typo, CTA) + `useEffect` correcteur d'URLs à double slash (`//commande/annulee` → `/commande/annulee`)
  - Backend : `supabase/functions/create-checkout-session/index.ts` — strip trailing slash sur `siteUrl`
  - `CartDrawer.tsx` — fix `isLoading` → `isDisabled` (HeroUI v3 ne supporte pas `isLoading`)
- **Why** : les retours Stripe échouaient sur la redirection à cause du double slash
- **Files** : `src/pages/CommandeAnnulee.tsx`, `src/pages/CommandeSucces.tsx`, `supabase/functions/create-checkout-session/index.ts`, `src/components/cart/CartDrawer.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · ui · Déplacement CTA Rejoindre Óra+ du Hero vers section Privilèges

- **Contexte** : demande utilisateur de déplacer le CTA "Rejoindre Óra+" du Hero vers une autre partie de la page, pour que l'utilisateur découvre d'abord les avantages avant la conversion.
- **Summary** :
  - `OraPlus.tsx` — retrait du bouton "Rejoindre Óra+" (primaire) du Hero, ne garde que "En savoir plus"
  - Ajout d'un nouveau bloc CTA "Rejoindre Óra+" juste après les 4 cartes Privilèges, avec sous-texte "30 jours satisfait ou remboursé · Sans engagement" et gestion `subError`
- **Why** : améliorer le parcours utilisateur en plaçant la proposition de conversion après la démonstration des bénéfices
- **Files** : `src/pages/OraPlus.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · fix · Requête AdminOverview — colonne capacity inexistante

- **Contexte** : erreur 400 sur la requête Supabase `events` dans `AdminOverview.tsx`. La colonne `capacity` n'existe pas dans la table `events`, le nom correct est `places_max`.
- **Summary** : correction du `.select()` et du type attendu dans `Promise.all` + `.map()`
- **Files** : `src/pages/admin/AdminOverview.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · feat · Page Mes bilans dans l'espace membre

- **Contexte** : le lien "Bilans bien-être" dans la sidebar membre redirigeait vers la page publique `/bilan-bien-etre`. Besoin d'une vraie page intégrée à l'espace membre avec historique + réservation simplifiée (champs pré-remplis).
- **Summary** :
  - `src/pages/member/MesBilans.tsx` (nouveau) — page complète avec stats (confirmés/en attente), historique chronologique (date tile, statut visuel, bouton annuler), et réservation simplifiée (calendrier + créneaux, formulaire allégé avec nom/prénom/téléphone/email pré-remplis depuis le profil, seulement notes + checkbox RGPD)
  - `src/App.tsx` — ajout route `{ segment: 'bilans', element: <MesBilans /> }` dans `MEMBER_ROUTE_SEGMENTS`
  - `MemberLayout.tsx` — lien sidebar passe de `/bilan-bien-etre` à `${prefix}/bilans`
  - `Dashboard.tsx` — correction des perks Óra+ (retrait "2 bilans/mois offerts", alignement sur les vrais bénéfices)
- **Design doc** : `docs/superpowers/specs/2026-05-03-member-bilans-design.md`
- **Plan** : `docs/superpowers/plans/2026-05-03-member-bilans.md`
- **Why** : offrir une expérience réservation cohérente dans l'espace membre, sans avoir à quitter le dashboard
- **Files** : `src/pages/member/MesBilans.tsx` (créé), `src/App.tsx`, `src/components/member/MemberLayout.tsx`, `src/pages/member/Dashboard.tsx`, `docs/superpowers/specs/2026-05-03-member-bilans-design.md`, `docs/superpowers/plans/2026-05-03-member-bilans.md`
- **Verify** : `npm run build` → OK (0 erreur TS)

### 2026-05-03T · review · Critique design complète (impeccable)

- **Contexte** : demande utilisateur `/critique` — audit design complet du site PESSORA via le playbook impeccable.
- **Summary** :
  - Score heuristique Nielsen : **27/40 (Acceptable)**
  - Anti-patterns AI : verdict **pas de AI slop** — direction éditoriale authentique
  - 6 issues identifiées : P1 aide utilisateur + erreurs techniques, P2 dashboard/membre/admin, P3 footer
  - Plans d'action présentés puis mis en suspens par l'utilisateur
- **why** : photographie objective de la qualité design à un instant T, sans implémentation immédiate.
- **Files** : `docs/logs/2026-05-03.md` (session "Critique design complète")
- **Verify** : rapport livré, aucun code modifié

## 2026-04-26

### 2026-04-26T10:30 · security · RLS event registrations (public insert + proper policy)

- **Contexte** : les inscriptions aux événements (page publique) et le wizard post-inscription (survey) échouaient en prod à cause de RLS trop restrictive. Deux migrations appliquées.
- **Summary** :
  - `20260426120000_event_registrations_rls_public_insert.sql` — policy `Anyone can insert event_registrations` avec `USING true` puis `WITH CHECK (true)`, plus `(user_id IS NULL OR user_id = auth.uid())`. Grant `INSERT, SELECT` sur `public.event_registrations` au rôle `anon`.
  - `20260426123000_cleanup_event_registrations_rls.sql` — correction : supprime la policy trop large, la remplace par `WITH CHECK (true)` uniquement. Supprime les grants `INSERT`/`SELECT` redondants (déjà hérités via `public`). Rétablit le comportement par défaut de Supabase (RLS activée, pas de `USING` en lecture = ligne vide pour anon = safe).
- **Impact** : les utilisateurs non connectés peuvent désormais s'inscrire à un événement et répondre au questionnaire post-inscription sans erreur RLS 42501.
- **Verify** : testé en local via API directe Supabase → insert OK, select anon retourne 0 ligne (RLS respectée).
