# Récapitulatif du projet PESSORA

## 1. Présentation

**PessÓra** est le site vitrine et e-commerce du **1er Bar Protéiné & Bien-Être de Martinique**.  
Il présente le concept, le menu (boissons et boosters), les gammes de produits (Wellness, Sport, Skin), les événements et le contact, avec un espace membre pour la fidélité, l'abonnement, l'historique et le suivi des commandes.

- **Design** : Wellness Premium & Modern — minimaliste, éditorial, photos lifestyle.
- **Fond** : Beige/crème organique, police display (instrument serif / archivo), titres réduits `clamp(21px, 2.4vw, 30px)`.
- **Fonctionnalités** : Hero vidéo, mega-menus, chatbot, auth (connexion/inscription), espace membre (demo + protégé), e-commerce (panier, checkout Stripe), admin intégré.

---

## 2. Stack technique

| Techno | Rôle |
|--------|------|
| **React 18** | UI |
| **TypeScript** | Typage |
| **Vite 5** | Build & dev server |
| **React Router DOM 6** | Routing |
| **Tailwind CSS v4** | Styles (utility-first, `@utility`, `@theme`) |
| **Framer Motion 11** | Animations |
| **Lucide React** | Icônes |
| **Supabase** | Base de données, auth, storage |
| **Stripe** | Paiement checkout |

**Scripts** (`package.json`) :
- `npm run dev` — serveur de développement
- `npm run build` — build production (`tsc && vite build`)
- `npm run preview` — prévisualisation du build
- `npm run lint` — ESLint

---

## 3. Structure du projet

```
PESSORA/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   ├── hero-video.webm
│   ├── hero-video-poster.jpg
│   ├── hero-skin.png
│   ├── menu-header.png
│   ├── logo-o.png
│   ├── logo.jpeg
│   └── logo.png
├── supabase/
│   ├── functions/
│   │   └── create-checkout-session/
│   └── migrations/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── common/         # OraPlusTeaserStrip, Chatbot, ScrollToTop
    │   ├── home/           # HomeFeaturedCarousel, HomeSplitGammes, HomeGammes*, HomeProductCarousel, HomeGoogleReviews
    │   ├── layout/         # Header (fixed 3 états), Footer, NewsletterSignup
    │   ├── member/         # MemberLayout (sidebar espace client)
    │   ├── ui/             # SectionTitle, ImageCard, AdminMobileSidebar
    │   └── cart/           # CartDrawer, DrinkOptionsModal
    ├── contexts/
    │   └── AuthContext.tsx
    ├── data/
    │   ├── infoData.ts
    │   ├── menuData.ts
    │   ├── productsData.ts
    │   ├── googleReviews.ts
    │   └── homeSplitGammes.ts (fallback TS)
    ├── hooks/
    │   ├── useFeaturedCarousel.ts
    │   ├── useSplitGammes.ts
    │   ├── useOrders.ts
    │   ├── useAdminMembers.ts
    │   └── useCart.ts
    ├── lib/
    │   ├── cartLine.ts
    │   ├── cartDisplayPrice.ts
    │   ├── storageUpload.ts
    │   ├── motionReveal.ts
    │   └── publicAsset.ts
    ├── store/
    │   └── cartStore.ts (Zustand)
    ├── types/
    │   ├── homeCarousel.ts
    │   └── supabase.ts
    └── pages/
        ├── Home.tsx
        ├── Concept.tsx
        ├── Menu.tsx
        ├── DrinkDetail.tsx
        ├── NosProduits.tsx
        ├── RangeDetail.tsx
        ├── Evenements.tsx
        ├── OraPlus.tsx
        ├── Contact.tsx
        ├── MentionsLegales.tsx
        ├── CGV.tsx
        ├── CommandeAnnulee.tsx
        ├── auth/ (Login, Register)
        ├── member/ (Dashboard, Loyalty, Subscription, History, Profile)
        └── admin/ (AdminOverview, AdminMemberDetail, AdminCarousel, AdminSplitGammes, AdminLayout)
```

---

## 4. Design system

### Palette (Tailwind v4 `@theme` dans `index.css`)

- **Noir** : `#1A1A1A` (soft black)
- **Or** : `#B8A076` (gold)
- **Surfaces** : `surface-page` (beige clair), `surface-muted` (crème), `surface-hero` (gris foncé), `surface-product-well` (vert pâle)
- **Editorial** : `editorial-title` (noir), `editorial-body` (gris), `editorial-badge` (or/vert)
- Toutes les couleurs en OKLCH pour une perception uniforme

### Typographie

- **Display** : Instrument Serif / Italic (titres éditoriaux)
- **Corps** : Archivo (sans-serif, navigation, textes)
- Pas de Playfair Display ni Inter — stack moderne et distinctive
- Tailles réduites : `clamp(21px, 2.4vw, 30px)` pour les titres de section

### Layout système (Tailwind v4 `@utility`)

- `section-wrapper` : `max-width: 1400px`, padding `1rem / 2.5rem / 72px`
- `section-vertical-padding` : `py-16` mobile → `var(--space-section-y-md)` desktop
- Tokens : `--space-section-y-sm: 4.5rem`, `--space-section-y-md: 6.5rem`, `--space-section-y-lg: 8.5rem`
- Header aligné sur `section-wrapper` — `lg:px-[72px]`

### Header (fixe Kayvilla-style, 3 états)

1. **Transparent** — sur hero sombre (index), fond `bg-transparent`
2. **Light-vitrage** — sur fond clair sans scroll, fond `bg-white/92`
3. **Solid** — après scroll >24px, fond blanc + bordure + ombre
- `fixed` (pas sticky), `h-16` mobile / `h-20` desktop
- Grid `[1fr_auto_1fr]` pour centrage parfait de la nav
- Logo 36px, nav `10px` uppercase tracking `0.16em`

### Composants home — radius standardisé

Tous les composants home : `rounded-[2px]` (conforme charte graphique).

---

## 5. Routes

### Publiques

| Route | Page |
|-------|------|
| `/` | Home (10 sections : Hero → À la une → Coups de cœur → Óra+ → Split gammes → Univers → Gammes → Avis → Événements → Footer) |
| `/concept` | Concept |
| `/menu` | Menu |
| `/menu/:drinkId` | Détail boisson |
| `/nos-produits` | Nos Produits (3 gammes + carrousels) |
| `/nos-produits/:rangeId` | Détail gamme |
| `/ora-plus` | Óra+ abonnement |
| `/evenements` | Événements |
| `/contact` | Contact |
| `/mentions-legales` | Mentions légales |
| `/cgv` | CGV |
| `/commande-annulee` | Paiement annulé |

### Auth

| Route | Page |
|-------|------|
| `/connexion` | Login |
| `/inscription` | Register |

### Espace membre

| Route | Page |
|-------|------|
| `/mon-espace` | Dashboard |
| `/mon-espace/fidelite` | Fidélité |
| `/mon-espace/abonnement` | Abonnement |
| `/mon-espace/historique` | Historique |
| `/mon-espace/profil` | Profil |
| `/demo-espace/*` | Mêmes pages en mode démo |

### Admin (protégé, rôle `admin`)

| Route | Page |
|-------|------|
| `/admin` | Overview |
| `/admin/membres/:id` | Détail membre |
| `/admin/carousel` | Gestion carrousel "À la une" (CRUD + upload) |
| `/admin/moments` | Gestion "Choisis ton moment" (CRUD + upload 3 photos) |

---

## 6. Homepage — sections

1. **Hero vidéo** — background video + overlay gradient, titres animés Framer Motion
2. **À la une** — `HomeFeaturedCarousel` : carrousel horizontal snap depuis Supabase (`home_carousel_cards`)
3. **Nos coups de cœur** — `HomeProductCarousel` : carrousel boissons
4. **Óra+ teaser** — `OraPlusTeaserStrip` : bandeau abonnement (texte court, pas de border-l)
5. **Choisis ton moment** — `HomeSplitGammes` : 4 onglets avec photos modèle, données Supabase (`home_split_gammes`)
6. **Nos univers** — `ImageCard` : 3 cartes (Shakes & Gaufres, Événements, Bilan 30 min) avec navigation flèches + tabs
7. **Nos gammes** — `HomeGammesProductTiles` + `HomeGammesProductCarousel` : tuiles + carrousel produits
8. **Avis clients** — `HomeGoogleReviews` : citations 5-10 mots, cartes 400-440px, pas d'étoiles ni âge
9. **Événements** — CTA minimal : "Rejoins la communauté Pessóra"
10. **Footer**

---

## 7. Supabase

### Base de données

- Tables : `profiles`, `orders`, `order_items`, `home_carousel_cards`, `home_split_gammes`
- Profiles : rôle `member` ou `admin`, infos utilisateur
- Commandes : liées à Stripe checkout

### Storage buckets

- `product-images` — photos produits
- `event-images` — photos événements
- `carousel-images` — photos carrousel "À la une"
- `split-gammes-images` — photos "Choisis ton moment"

### Compte admin

- Admin actif : `admin@pessora.mq` (UUID: fab6e477)
- Pour ajouter un admin : `UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';`

---

## 8. E-commerce

- **Panier** : Store Zustand (`cartStore.ts`), panier dans `CartDrawer`
- **Options boissons** : `DrinkOptionsModal` (taille, lait, boosters)
- **Checkout** : Stripe via Edge Function `create-checkout-session`
- **Prix** : `cartDisplayPrice.ts` pour formatage

---

## 9. Textes & minimalisme (2026-05-24)

L'index a été allégé :
- Avis clients : citations 5-10 mots, cartes réduites (400-440px), pas d'étoiles, pas d'âge
- Titres section : `clamp(21px, 2.4vw, 30px)` au lieu de 44px max
- Produits : nom + prix seulement (description supprimée des carrousels)
- Événements : titre une ligne, pas de sous-titre
- Sous-titres supprimés (Choisis ton moment, Óra+)

---

## 10. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/index.css` | Tailwind v4 `@theme`, `@utility`, tokens couleurs OKLCH |
| `src/lib/motionReveal.ts` | Constantes Framer Motion (spring, stagger, hero) |
| `src/lib/storageUpload.ts` | Upload photos vers Supabase Storage |
| `src/lib/cartLine.ts` | Logique lignes de panier |
| `src/store/cartStore.ts` | Store Zustand panier |
| `src/hooks/useFeaturedCarousel.ts` | Fetch carrousel Supabase |
| `src/hooks/useSplitGammes.ts` | Fetch split gammes Supabase |

---

## 11. Animations Framer Motion

- **Hero** : `motion.div variants={HERO_CONTAINER}` avec stagger enfants `HERO_ITEM`
- **HomeSplitGammes** : `LayoutGroup` + `layoutId` pour sliding pill, `AnimatePresence` photo cross-fade
- **Cartes** : `whileInView` avec `SPRING_CRISP`, `useInView` sur parent (bug : `whileInView` échoue sur `overflow-x: auto`)
- **Header** : mega-menus animés
