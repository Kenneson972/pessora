# Audit SEO — Pessora (site e-commerce Herbalife)

**Date** : 2026-06-01  
**Périmètre** : `index.html`, `public/`, `src/` (pages, composants, config SEO, composants JSON-LD)  
**Stack** : Vite + React 19 + React Router + Tailwind + Supabase

---

## ✅ Points positifs (déjà conformes)

- **Meta tags statiques** (`index.html`) : charset, viewport, theme-color, description, keywords, author, robots `index,follow` — complets.
- **Canonical + hreflang** (`index.html` L17-18) : `<link rel="canonical" href="https://pessora.mq/">` + `<link rel="alternate" hreflang="fr-MQ">` — OK.
- **Open Graph statique** (`index.html` L21-29) : `og:type`, `og:locale`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:url` — complet (sauf remarques P1 ci-dessous).
- **Twitter Cards statiques** (`index.html` L32-35) : `twitter:card=summary_large_image`, title, description, image — OK.
- **JSON-LD LocalBusiness** (`index.html` L45-68) : `@type=CafeOrCoffeeShop`, adresse, horaires, téléphone, email, sameAs Instagram — structuré correctement (sauf remarque P0).
- **PageSEO dynamique** (`src/components/common/PageSEO.tsx`) : met à jour `<title>`, `<meta name="description">`, `<link rel="canonical">`, OG et Twitter tags par page — excellent design.
- **SEO par route** (`src/data/seoConfig.ts`) : 17 routes mappées avec title + description + OG optionnel — bonne couverture.
- **Lazy loading global** (`src/App.tsx` L98-111) : toutes les `<img>` sans `loading` reçoivent `loading=lazy` + `decoding=async`, sauf `fetchpriority=high` ou `data-skip-lazy` — excellent.
- **Code-splitting** (`src/App.tsx` L22-67) : toutes les pages en `React.lazy()` + `<Suspense>` — bon pour le LCP.
- **Skip-to-content** (`src/App.tsx` L121-125) : lien "Aller au contenu" + `<main id="main-content">` — accessible.
- **Sitemap auto-généré** (`scripts/generate-sitemap.ts`) : depuis Supabase (products, events, gamme_products) → script à jour.
- **robots.txt** (`public/robots.txt`) : `Allow: /`, pages sensibles Disallow (admin, mon-espace, demo-espace, mockup-*), Sitemap URL absolue — OK.
- **Breadcrumbs** : `DrinkDetail.tsx` L193, `GammeProductDetail.tsx` L144 avec `<nav aria-label="Fil d'Ariane">` — bien structurés.
- **JSON-LD produit** : `ProductJsonLd` et `ItemListJsonLd` existent dans `src/components/seo/ProductJsonLd.tsx`, utilisés sur `/menu` et `/menu/:drinkId`.
- **`aria-current="page"`** sur les breadcrumbs — bon signal sémantique.

---

## 🔴 P0 — CRITIQUE (bloquant pour le SEO / indexation)

### P0-1. Téléphone masqué dans le JSON-LD
**Fichier** : `index.html`, L65  
**Problème** : `"telephone": "+596****0404"` → les validateurs schema.org rejettent ce format. Doit être un numéro E.164 valide.
**Impact** : Google ne pourra pas afficher le rich snippet LocalBusiness.
**Correction** : Remplacer par `"+596XXXXXXXXX"` (numéro réel format international).

### P0-2. Images OG/Twitter en chemins relatifs (racine)
**Fichiers** : `index.html` L26, L35, `src/data/seoConfig.ts` (valeur `/logo-pessora.png`, `/menu-header.png`)  
**Problème** : `og:image` doit être une URL absolue. Le `PageSEO.tsx` L57 corrige dynamiquement (`window.location.origin + ogImage`), mais `index.html` a des URLs relatives.
**Impact** : Crawlers lisent le HTML statique de l'index.html avec chemin `/logo-pessora.png` — certains ne résolvent pas correctement.
**Correction** : Dans `index.html`, passer `og:image` en URL absolue `https://pessora.mq/logo-pessora.png`.

### P0-3. Titres dynamiques en conflit avec seoConfig
**Fichiers** :
- `src/pages/Home.tsx` L55 : `document.title = 'PessÓra — Bar Protéiné & Bien-Être, Martinique'`
- `src/pages/Menu.tsx` L70 : `document.title = 'Carte — PessÓra'`
- `src/pages/Evenements.tsx` L215 : `document.title = 'Événements — PessÓra'`
- `src/pages/Contact.tsx` L16 : `document.title = 'Contact — PessÓra'`

**seoConfig prévoit** : `'PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique'`, `'Menu | PessÓra - Boissons Wellness...'`, etc.

**Problème** : Le `useEffect` du composant de page s'exécute APRÈS `PageSEO` (qui est dans `AppLayout`). Les titres hardcodés écrasent ceux du seoConfig. Les 4 pages ci-dessus ont des titres qui diffèrent de seoConfig → incohérence.
**Impact** : Les titres vus par Google (qui lit le HTML post-render JS) peuvent être différents de ceux voulus dans seoConfig.
**Correction** : Supprimer les `document.title` dans les `useEffect` des pages et laisser `PageSEO` gérer via `seoConfig`. Si un titre différent est nécessaire, le mettre dans `seoConfig`.

---

## 🟠 P1 — PRIORITAIRE (pénalisant mais non bloquant)

### P1-1. Hiérarchie de headings : sauts de niveau
| Page | Fichier | Ligne | Problème |
|------|---------|-------|----------|
| NosProduits | `src/pages/NosProduits.tsx` | L47 | `<h4>` dans `ProductPreview` (composant enfant) alors que le parent a `<h2>` → saut de `<h2>` à `<h4>` |
| Contact | `src/pages/Contact.tsx` | L169 | `<h3>Envoyez-nous un message</h3>` — aucun `<h2>` sur la page, saut de `<h1>` à `<h3>` |
| Menu | `src/pages/Menu.tsx` | L388 | `<h3>30 minutes offertes</h3>` dans la CTA bilan — pas de `<h2>` avant |
| GammeProductDetail | `src/pages/GammeProductDetail.tsx` | (à vérifier) | Utilise probablement PageHero (h1) → puis `<h3>` sans `<h2>` intermédiaire |
| RangeDetail | `src/pages/RangeDetail.tsx` | (à vérifier) | `<h3>` dans les cards produit, mais pas de `<h2>` avant ? |

### P1-2. JSON-LD produit manquant sur les pages gamme
**Fichier** : `src/pages/GammeProductDetail.tsx`  
**Problème** : Aucun `<ProductJsonLd>` n'est rendu sur les pages `/nos-produits/:rangeId/:slug`.  
**Impact** : Google ne voit pas de données structurées Product pour la moitié du catalogue (gammes).  
**Correction** : Ajouter `<ProductJsonLd>` dans `GammeProductDetail.tsx`, comme fait dans `DrinkDetail.tsx` L181.

### P1-3. JSON-LD Event manquant sur les pages événements
**Fichiers** : `src/pages/EvenementDetail.tsx`, `src/pages/Evenements.tsx`  
**Problème** : Aucun `@type: Event` ou `ItemList` JSON-LD sur les pages événements.  
**Impact** : Google ne peut pas afficher de rich snippets pour les événements (date, lieu, prix).  
**Correction** : Créer un composant `<EventJsonLd>` et l'ajouter sur `EvenementDetail` et `Evenements` (ItemList).

### P1-4. BreadcrumbList JSON-LD absent
**Fichiers** : `src/pages/DrinkDetail.tsx` (L193), `src/pages/GammeProductDetail.tsx` (L144)  
**Problème** : Les breadcrumbs visuels existent (`<nav aria-label="Fil d'Ariane">`) mais pas de `@type: BreadcrumbList` en JSON-LD associé.  
**Impact** : Perte d'opportunité de rich snippet breadcrumb dans les SERP.  
**Correction** : Ajouter un `<BreadcrumbJsonLd>` dynamique basé sur le pathname.

### P1-5. `og:locale` absent sur les pages dynamiques
**Fichier** : `src/components/common/PageSEO.tsx`  
**Problème** : La fonction `setMetaTag` définit `og:site_name` mais pas `og:locale`.  
**Impact** : Les pages autres que l'index n'ont pas de balise `og:locale`.  
**Correction** : Ajouter `setMetaTag('og:locale', 'fr_FR')` dans le `useEffect` de PageSEO.

### P1-6. Sitemap : lastmod uniforme pour toutes les URLs
**Fichier** : `scripts/generate-sitemap.ts` L31, L75  
**Problème** : `const today = new Date().toISOString().split('T')[0]` → toutes les URLs reçoivent la même date. Google pénalise les sitemaps où toutes les URLs ont le même lastmod.  
**Correction** : Récupérer `updated_at` depuis Supabase pour les produits/événements, et utiliser la date de dernier commit pour les pages statiques.

### P1-7. Pas de `og:image:width` / `og:image:height` sur les pages dynamiques
**Fichier** : `src/components/common/PageSEO.tsx`  
**Problème** : Les dimensions d'image ne sont pas propagées dans les meta OG dynamiques.  
**Impact** : Facebook/Instagram doivent télécharger l'image pour connaître ses dimensions → délai d'affichage.  
**Correction** : Ajouter `og:image:width` / `og:image:height` dans `seoConfig` et `PageSEO`.

### P1-8. Lien WhatsApp placeholder dans le footer
**Fichier** : `src/components/layout/Footer.tsx` L26  
**Problème** : `'https://wa.me/596696000000'` — numéro factice.  
**Impact** : Lien cassé → expérience utilisateur dégradée.  
**Correction** : Remplacer par le vrai numéro WhatsApp.

### P1-9. Navigation header sans `<nav>` sémantique
**Fichier** : `src/components/layout/Header.tsx`  
**Problème** : Le header contient les liens de navigation principaux mais n'utilise pas de balise `<nav>` explicite.  
**Impact** : Les screen readers et crawlers ne peuvent pas identifier la navigation principale.  
**Correction** : Wrapper la liste de liens desktop/mobile dans `<nav aria-label="Navigation principale">`.

---

## 🟡 P2 — COSMÉTIQUE (améliorations recommandées)

### P2-1. ProductJsonLd incomplet
**Fichier** : `src/components/seo/ProductJsonLd.tsx`  
**Manques** : `sku`, `brand`, `gtin`, `aggregateRating`, `review`.  
**Correction** : Ajouter au moins `brand: { "@type": "Brand", "name": "Herbalife" }`.

### P2-2. Pas de champ `category` structuré dans ProductJsonLd
**Fichier** : `src/components/seo/ProductJsonLd.tsx` L24  
**Problème** : `category` est passé comme string brut (`"wellness"`, `"coffee"`). Google attend une valeur de taxonomy (ex: `"Food & Beverages > Coffee"`).  
**Correction** : Mapper les catégories vers des chaînes de taxonomy schema.org.

### P2-3. Pas de `sameAs` dynamique dans les pages
**Fichier** : `index.html` L67, `src/components/common/PageSEO.tsx`  
**Problème** : Le `sameAs` Instagram n'est présent que dans le JSON-LD statique de l'index. Les pages dynamiques n'ont pas de lien vers les réseaux sociaux.  
**Correction** : Ajouter dans le `seoConfig` ou dans le footer JSON-LD.

### P2-4. Pas de `hreflang` sur les pages dynamiques
**Fichier** : `src/components/common/PageSEO.tsx`  
**Problème** : `hreflang="fr-MQ"` n'est défini que dans `index.html`. Les pages dynamiques n'en ont pas.  
**Correction** : Ajouter `setMetaName('...')` ou insérer `<link rel="alternate" hreflang="fr-MQ">` dynamiquement.

### P2-5. Pas de sitemap image/video
**Fichier** : `scripts/generate-sitemap.ts`  
**Problème** : Les extensions `<image:image>` et `<video:video>` ne sont pas incluses pour les pages produit.  
**Correction** : Ajouter les URL d'images produits dans le sitemap.

### P2-6. Pas de `og:updated_time` sur les pages
**Fichier** : `src/components/common/PageSEO.tsx`  
**Problème** : Aucun signal temporel de mise à jour.  
**Correction** : Ajouter `og:updated_time` dynamique (timestamp de build ou lastmod DB).

### P2-7. Pas de sitemap index ou sitemap compressé
**Fichier** : `public/sitemap.xml` (68 URLs)  
**Problème** : 68 URLs dans un seul fichier, c'est OK actuellement. Si le catalogue dépasse 50 000 URLs, il faudra un index.  
**Correction** : Anticiper en générant un `sitemap_index.xml` avec sous-sitemaps par type (pages, produits, événements).

### P2-8. `twitter:site` / `twitter:creator` absents
**Fichiers** : `index.html` L32-35, `src/components/common/PageSEO.tsx`  
**Problème** : Aucun compte Twitter associé aux Twitter Cards.  
**Correction** : Ajouter `twitter:site` et `twitter:creator` si un compte Twitter/X existe.

### P2-9. Pas de `meta name="format-detection"` 
**Fichier** : `index.html`  
**Problème** : Sur mobile, certains navigateurs auto-détectent les numéros de téléphone et les rendent cliquables.  
**Correction** : Ajouter `<meta name="format-detection" content="telephone=no">` si le design ne le gère pas.

### P2-10. Images Unsplash sur la page Concept
**Fichier** : `src/pages/Concept.tsx` L12-16  
**Problème** : Les images sont hébergées sur `images.unsplash.com` — pas de contrôle sur la disponibilité, pas de cache optimisé.  
**Correction** : Rapatrier les images sur le CDN du site (`/public/` ou bucket Supabase).

---

## 📊 Synthèse

| Priorité | Nb issues | Pages concernées |
|----------|-----------|------------------|
| **P0** (bloquant) | 3 | index.html (×2), PageSEO, Home, Menu, Evenements, Contact |
| **P1** (prioritaire) | 9 | NosProduits, Contact, Menu, GammeProductDetail, DrinkDetail, EvenementDetail, Evenements, PageSEO, Footer, Header, generate-sitemap.ts |
| **P2** (cosmétique) | 10 | ProductJsonLd, PageSEO, sitemap, Concept, index.html |

### Score global SEO : ~70/100

- **On-page SEO** : bon (title, meta desc, canonical, hreflang ✅)
- **Open Graph / Twitter Cards** : couvert statiquement et dynamiquement ✅ (sauf og:locale P1)
- **Structured Data (JSON-LD)** : partiel — LocalBusiness ✅, Product partiel ⚠️, Event manquant ❌, BreadcrumbList manquant ❌
- **Headings hierarchy** : acceptable avec 4 violations (P1) ⚠️
- **Sitemap / robots.txt** : OK ✅, lastmod à améliorer (P1) ⚠️
- **Performance signals** : lazy loading global ✅, code splitting ✅, Suspense ✅
- **Sémantique HTML5** : `<main>` ✅, `<nav>` (breadcrumbs) ✅, `<nav>` (header) ❌ P1
- **Alt texts** : tous les `<img>` ont un `alt` ✅ (vérifié sur Home, Concept, Menu, NosProduits, Evenements, DrinkDetail, GammeProductDetail, ProductCard, ImageCard, HomeProductCarousel, PageHero)
