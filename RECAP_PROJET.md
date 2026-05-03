# Récapitulatif du projet PESSORA

## 1. Présentation

**PessÓra** est le site vitrine et espace client du **1er Bar Protéiné & Bien-Être de Martinique**.  
Il présente le concept, le menu (boissons et boosters), les gammes de produits (Wellness, Sport, Skin), les événements et le contact, avec un espace membre pour la fidélité, l’abonnement et l’historique.

- **Design** : Wellness Premium & Modern (inspiré Moon Juice, Form Nutrition, Pressed).
- **Fond** : Beige/crème organique, titres Serif (Playfair Display), texte Sans-Serif (Inter), boutons vert forêt / noir doux.
- **Fonctionnalités** : Hero vidéo, navigation avec mega-menus (Nos Produits, Menu), footer, chatbot, auth (connexion/inscription), espace membre (demo + protégé), pages légales.

---

## 2. Stack technique

| Techno | Rôle |
|--------|------|
| **React 18** | UI |
| **TypeScript** | Typage |
| **Vite 5** | Build & dev server |
| **React Router DOM 6** | Routing |
| **Tailwind CSS 3** | Styles (utility-first) |
| **Framer Motion 11** | Animations |
| **Lucide React** | Icônes |

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
│   ├── hero-skin.png       # Hero gamme Skin
│   ├── menu-header.png     # Bannière header page Menu
│   ├── logo-o.png          # Logo header (O + feuille)
│   ├── logo.jpeg
│   └── logo.png
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── common/         # Chatbot, ScrollToTop
    │   ├── layout/         # Header, Footer
    │   ├── member/         # MemberLayout (sidebar espace client)
    │   ├── DemoAuthWrapper.tsx
    │   └── ProtectedRoute.tsx
    ├── contexts/
    │   └── AuthContext.tsx
    ├── data/
    │   ├── infoData.ts     # Infos bar, valeurs, partenaires
    │   ├── menuData.ts     # Boissons, boosters, options lait
    │   └── productsData.ts # Gammes Wellness / Sport / Skin
    └── pages/
        ├── Home.tsx
        ├── Concept.tsx
        ├── Menu.tsx
        ├── DrinkDetail.tsx
        ├── NosProduits.tsx
        ├── RangeDetail.tsx
        ├── Evenements.tsx
        ├── Contact.tsx
        ├── MentionsLegales.tsx
        ├── CGV.tsx
        ├── auth/
        │   ├── Login.tsx
        │   └── Register.tsx
        └── member/
            ├── Dashboard.tsx
            ├── Loyalty.tsx
            ├── Subscription.tsx
            ├── History.tsx
            └── Profile.tsx
```

---

## 4. Design system

### Palette (Tailwind + `index.css`)

- **Primary** : `#1A1A1A` (Soft Black), `primary-forest` `#2D472C`, `primary-light` `#3A5F1A`
- **Accent** : `accent-cream` `#EDE7DF` (beige chaud, fond principal), `accent-cream-light` `#F5F0E8`, `accent-cream-dark` `#E4DCD2`, `accent-leaf` `#6B9544`, `accent-wood` `#C19A6B`
- **Neutral** : `neutral-cream`, `neutral-sand`, `neutral-warm` (dérivés du beige)

### Typographie

- **Titres** : Playfair Display (serif)
- **Corps** : Inter (sans-serif)
- **Polices** chargées via Google Fonts dans `index.html`.

### Classes utilitaires (`index.css`)

- `section-padding`, `container-custom`
- `btn-premium`, `btn-premium-outline`
- `card-floating`, `badge-nutrition`

### Layout conditionnel

- **Header / Footer / Chatbot** : masqués sur `/mon-espace`, `/demo-espace` et pages auth (`/connexion`, `/inscription`).
- **Header** : logo uniquement (`logo-o.png`, pas de texte « PessÓra »). Mega-menus au survol : **Nos Produits** (gammes Wellness, Sport, Skin + CTA) et **Menu** (catégories boissons + CTA), style Form Nutrition, animation Framer Motion.
- **Espace membre** : `MemberLayout` (sidebar noire style app, accent vert lime `#D9F99D`), contenu principal à droite avec fond clair et coins arrondis.

---

## 5. Routes

### Publiques

| Route | Page |
|-------|------|
| `/` | Home |
| `/concept` | Concept |
| `/menu` | Menu |
| `/menu/:drinkId` | Détail boisson |
| `/nos-produits` | Nos Produits (3 gammes) |
| `/nos-produits/:rangeId` | Détail gamme (wellness, sport, skin) |
| `/evenements` | Événements |
| `/contact` | Contact |
| `/mentions-legales` | Mentions légales |
| `/cgv` | CGV |

### Auth

| Route | Page |
|-------|------|
| `/connexion` | Login |
| `/inscription` | Register |

### Espace membre (demo, sans login)

| Route | Page |
|-------|------|
| `/demo-espace` | Dashboard |
| `/demo-espace/fidelite` | Ma Carte / Fidélité |
| `/demo-espace/abonnement` | Abonnement |
| `/demo-espace/historique` | Historique |
| `/demo-espace/profil` | Profil |

### Espace membre (protégé, après login)

Mêmes chemins en `/mon-espace/*`, protégés par `ProtectedRoute`.

---

## 6. Données centralisées

### `src/data/infoData.ts`

- **barInfo** : nom, tagline, description, adresse, horaires, contact (téléphone, email, Instagram).
- **values** : Équilibre, Plaisir, Motivation, Bien-être (titres, descriptions, icônes).
- **partnerships** : partenaires (ex. GigaFit, EN BONS THERMES) pour la page Événements.
- **events** : liste des événements à venir (id, title, date, location, description, type).
- **socialLinks** : Instagram, Facebook, etc.

### `src/data/menuData.ts`

- **Types** : `MenuItem`, `Booster`, `MilkOption`.
- **Catégories** : `wellness`, `energie`, `shakes`, `coffee`.
- **wellnessItems**, **energieItems**, **shakesItems**, **coffeeItems**, **boosters**, **milkOptions**.
- Chaque item : id, name, description, category, price, calories, protein, ingredients, benefits, pitch, badges (vegan, glutenfree, vitamins).

### `src/data/productsData.ts`

- **rangesData** : 3 gammes — `wellness`, `sport`, `skin`.
- Par gamme : id, title, subtitle, description, icon (Lucide), color, bgColor, heroImage, products[] (name, description, price).
- **Gamme Skin** : hero = `/hero-skin.png` (photo produit locale).

---

## 7. Authentification & espace membre

### AuthContext

- **État** : `user`, `subscription`, `isLoading`, `isAuthenticated`.
- **Actions** : `login`, `register`, `logout`, `updateProfile`, `updateSubscription`.
- Données mock (localStorage) : utilisateur et abonnement type “premium”.

### Composants de protection

- **ProtectedRoute** : redirige vers `/connexion` si non connecté (pour `/mon-espace/*`).
- **DemoAuthWrapper** : fournit un utilisateur demo pour `/demo-espace/*` sans vraie connexion.

### MemberLayout (sidebar)

- Logo PessÓra (vert lime si actif).
- Liens : Home, Ma Carte (fidélité), Abonnement, Historique.
- Bas : Sécurité, Settings (profil), Logout.
- Version mobile : menu hamburger, sidebar en drawer.
- Style : fond noir, texte blanc, actif en `#D9F99D`.

### Pages membre

- **Dashboard** : Bento grid — accueil, jauge fidélité, points, activité récente, actions rapides, graphique points.
- **Loyalty** : Carte fidélité type wallet (points, QR), paliers de récompenses.
- **Subscription** : Comparatif plans (Start, Premium, Elite), badge “Actuel”.
- **History** : Historique des commandes, export, stats et favoris en sidebar.
- **Profile** : Carte identité, formulaire infos, préférences, sécurité, déconnexion.

---

## 8. Pages principales (contenu)

### Home

- Hero avec vidéo (`/hero-video.webm`) et titre Serif blanc.
- Section “Nos Boissons” (cartes sans bordure, badges calories/protéines, bouton COMMANDER).
- Section “Le Concept” en zig-zag (image / texte alternés), basée sur `barInfo.values` et images lifestyle.
- Partenariats en bas de page.

### Concept

- Hero + récit + blocs zig-zag (images Unsplash + valeurs).
- CTA final.

### Menu

- **Header visuel** : bannière plein largeur (`/menu-header.png`), hauteur ~40vh, cadrage `object-[center_38%]` (visages visibles), titre « La Carte » en overlay.
- Filtres par catégorie (Wellness, Énergie, Shakes, Coffee).
- Cartes boissons (style Moon Juice / Pressed), badges, bouton DÉTAILS & COMMANDE.
- Section Boosters.

### Nos Produits

- Une section par gamme (Wellness, Sport, Skin) : fond alterné, panneau gauche (titre, description, lien “Découvrir la gamme”), grille produits à droite.
- Liens vers `/nos-produits/wellness`, `/nos-produits/sport`, `/nos-produits/skin`.

### RangeDetail

- Hero plein écran (image de la gamme : `heroImage` ; pour Skin = `/hero-skin.png`).
- Lien “Retour aux gammes”.
- Description de la gamme.
- Grille produits avec cartes (image placeholder, nom, description, prix, bouton Ajouter).

### Événements

- Fond beige `#EDE7DF`, hero type Contact/Concept (label, gros titre serif, italique vert forêt).
- **Partenariats** : cartes `accent-cream-light`, badges par type (Fitness / Bien-être), données `partnerships` (infoData).
- **Événements à venir** : liste depuis `events` (infoData), cartes avec date, lieu, badge Pop-up/Événement ; message + lien Instagram si vide.
- **Nos Animations** : 3 cartes (Événements Fitness, Pop-up Stands, Ateliers Bien-être) avec icônes Lucide.
- **CTA** : bandeau primary, lien Instagram (btn-premium blanc).

### Auth (Login / Register)

- Layout split : image lifestyle à gauche, formulaire à droite.
- Boutons `btn-premium`, champs stylés, messages d’erreur.

---

## 9. Composants communs

- **Header** : logo seul (`/logo-o.png`, O vert forêt + feuille), nav (Accueil, Le Concept, **Nos Produits**, **Menu**, Événements, Contact) avec **mega-menus** au survol pour Nos Produits et Menu (Framer Motion), icônes User/LogIn, menu mobile.
- **Footer** : liens, infos, horaires, contact, réseaux.
- **ScrollToTop** : remonte en haut lors du changement de route.
- **Chatbot** : widget fixe (Pessobot), non affiché en espace membre ni sur les pages auth.

---

## 10. Assets & médias

| Fichier | Usage |
|---------|--------|
| `public/hero-video.webm` | Vidéo hero page d’accueil |
| `public/hero-skin.png` | Hero gamme Skin |
| `public/menu-header.png` | Bannière header page Menu (personnes + boissons) |
| `public/logo-o.png` | Logo header (O stylisé + feuille, vert forêt) |
| `public/logo.jpeg`, `logo.png` | Anciens logos / branding |
| `public/favicon.svg` | Favicon |

Images externes : Unsplash pour Concept et héros Wellness/Sport dans `productsData.ts`. Gamme Skin : `/hero-skin.png` (locale).

---

## 11. Résumé technique

- **Build** : Vite + TypeScript, sortie dans `dist/`.
- **Styles** : Tailwind + `index.css` (variables CSS, utilitaires).
- **État global** : AuthContext (user, subscription).
- **Routing** : React Router, pas de SSR.
- **Données** : Fichiers TS dans `src/data/` (pas d’API pour l’instant).

Ce document sert de **référence unique** pour comprendre l’architecture, les routes, le design et les données du projet PessÓra.
