# Cursor Prompt — SEO Pessora (Audit 30 Mai 2026)

## Contexte

Audit SEO complet effectué. 4 problèmes critiques, 4 modérés, 5 mineurs.
Corrige dans l'ordre de priorité ci-dessous.

---

## 🔴 CRITIQUE 1 : Ajouter un `<h1>` visible sur la Home

**Fichier :** `src/pages/Home.tsx`

La page n'a aucun `<h1>`. Le titre principal est un `<h2>` (ligne ~262). Google utilise le h1 comme signal fort.

**Action :**
- Ajouter un `<h1>` visible contenant le nom du bar + mots-clés
- Suggestion : `<h1 className="sr-only">PessÓra — Bar Protéiné & Bien-Être à Fort-de-France</h1>` (visible pour Google, discret pour le design)
- OU : remplacer le `<h2>` principal par un `<h1>` si le design le permet
- Vérifier qu'il n'y a qu'UN seul `<h1>` par page

---

## 🔴 CRITIQUE 2 : Étendre `PageSEO` pour les balises Open Graph / Twitter

**Fichier :** `src/components/common/PageSEO.tsx`

Actuellement, `PageSEO` ne met à jour que :
- `document.title`
- `<meta name="description">`
- `<link rel="canonical">`

Les balises OG (`og:title`, `og:description`, `og:image`, `og:type`) et Twitter (`twitter:card`, `twitter:title`, etc.) sont écrites statiquement dans `index.html` et **jamais mises à jour par route**.

**Action :**
- Ajouter des props optionnelles au composant : `ogTitle`, `ogDescription`, `ogImage`, `ogType`
- Dans le `useEffect`, créer/mettre à jour les balises `<meta property="og:*">` et `<meta name="twitter:*">`
- Appliquer sur TOUTES les pages :
  - `/menu` → `og:title="La Carte — PessÓra"`, `og:description="Découvrez nos boissons protéinées..."`, `og:image="<URL image menu>"`
  - `/menu/:drinkId` → titre + image spécifique au produit
  - `/ora-plus` → `og:title="Óra+ — L'abonnement bien-être"`
  - `/evenements` → `og:title="Événements — PessÓra"`
  - `/nos-produits` → `og:title="Nos Produits — PessÓra"`
  - `/concept` → `og:title="Le Concept — PessÓra"`

Fallback : si pas de props, utiliser les valeurs par défaut de `index.html`.

---

## 🔴 CRITIQUE 3 : Sitemap dynamique avec toutes les routes

**Fichier :** `public/sitemap.xml` actuel → 14 URLs statiques

Routes manquantes à inclure :
- `/menu/:drinkId` — toutes les boissons du catalogue
- `/evenements/:slug` — tous les événements
- `/nos-produits/:rangeId` — pages gamme
- `/nos-produits/:rangeId/:slug` — fiches produit gamme

**Action :**
Deux options (choisis la plus simple) :

### Option A : Script de génération (recommandé)
Créer `scripts/generate-sitemap.ts` qui :
1. Récupère tous les produits depuis Supabase (`products` table, `gamme_products`)
2. Récupère tous les événements depuis Supabase (`events` table)
3. Génère `public/sitemap.xml` avec toutes les URLs + `lastmod`, `changefreq`, `priority`
4. À exécuter au build (`npm run build` → `tsx scripts/generate-sitemap.ts`)

### Option B : Plugin Vite
Installer `vite-plugin-sitemap` et configurer avec les routes dynamiques récupérées au build.

**Important :** Les URLs doivent utiliser le domaine **sans** `www` (`https://pessora.mq/...` pour être cohérent avec le robots.txt).

---

## 🔴 CRITIQUE 4 : Uniformiser le domaine canonique

**Problème :**
- `index.html` → `<link rel="canonical" href="https://www.pessora.mq/" />` (avec www)
- `robots.txt` → `Sitemap: https://pessora.mq/sitemap.xml` (sans www)
- `sitemap.xml` → toutes les URLs sans www

**Action :**
1. Choisir le domaine principal → `https://pessora.mq` (celui utilisé par le sitemap et robots.txt)
2. Modifier `index.html` ligne 17 → `href="https://pessora.mq/"`
3. Vérifier que `PageSEO.tsx` utilise bien `window.location.origin` (déjà fait)
4. Configurer une redirection 301 `www.pessora.mq` → `pessora.mq` côté hébergeur (Vercel) pour éviter le duplicate content

---

## 🟡 MODÉRÉ 1 : Images non décoratives → `alt` descriptif

**Fichiers concernés :**
- `src/pages/Concept.tsx` (~ligne 65) : 4 images Unsplash avec `alt=""` → remplacer par des descriptions (ex: "Intérieur lumineux du bar PessÓra", "Préparation d'un smoothie protéiné")
- `src/pages/Evenements.tsx` (~ligne 78) : image d'événement avec `alt=""` → utiliser le titre de l'événement ou une description

---

## 🟡 MODÉRÉ 2 : `loading="lazy"` sur les images hero

**Fichiers concernés :**
- `src/pages/DrinkDetail.tsx` (~ligne 205) : ajouter `loading="lazy"` sur l'image principale du produit
- `src/pages/EvenementDetail.tsx` (~ligne 237) : ajouter `loading="lazy"` sur l'image hero
- Bonus : ajouter `fetchpriority="high"` sur l'image hero de la Home pour améliorer le LCP

---

## 🟡 MODÉRÉ 3 : JSON-LD Product / ItemList pour les fiches produit

**Action :** Créer un composant `src/components/seo/ProductJsonLd.tsx`

```tsx
// Props : { name, description, image, price, category, url }
// Génère un <script type="application/ld+json"> avec Product schema
```

À intégrer dans :
- `DrinkDetail.tsx` → JSON-LD `Product` pour chaque boisson
- `src/pages/member/GammeDetail.tsx` ou équivalent → JSON-LD `Product` pour les produits gamme
- `Menu.tsx` → JSON-LD `ItemList` contenant tous les produits du menu

---

## 🟡 MODÉRÉ 4 : Corriger le téléphone dans le JSON-LD LocalBusiness

**Fichier :** `index.html` (~ligne 64)

Remplacer `"telephone": "+596696XXXXXX"` par le vrai numéro du bar.
Si pas encore de numéro fixe, utiliser un format valide temporaire ou retirer le champ (mieux vaut absent que faux).

---

## 🟢 MINEURS (optionnels, nice-to-have)

1. **Page 404** : Le composant `NotFound.tsx` est bon, mais le serveur renvoie 200. Ajouter une règle Vercel (`vercel.json`) pour renvoyer un vrai 404 sur les URLs inexistantes.
2. **Polices** : Nettoyer les `<link rel="preconnect">` Google Fonts inutilisés dans `index.html` (lignes 37-38) — les polices sont en `local()`.
3. **hreflang** : Ajouter `<link rel="alternate" hreflang="fr-MQ" href="https://pessora.mq/" />` dans `index.html`
4. **Sitemap** : Ajouter `<lastmod>` à chaque entrée (`2026-05-30` pour le moment)
5. **Menu** : Rendre le `<h1 className="sr-only">` visible (ou le garder en sr-only si le design l'exige, c'est acceptable)

---

## Checklist

- [ ] `Home.tsx` : ajouter `<h1>`
- [ ] `PageSEO.tsx` : gérer og:* et twitter:*
- [ ] Toutes les pages : props `ogTitle`/`ogDescription`/`ogImage`
- [ ] `scripts/generate-sitemap.ts` : création + intégration build
- [ ] `index.html` : canonique sans www
- [ ] `Concept.tsx` : `alt` descriptifs
- [ ] `Evenements.tsx` : `alt` descriptif
- [ ] `DrinkDetail.tsx` : `loading="lazy"`
- [ ] `EvenementDetail.tsx` : `loading="lazy"`
- [ ] `src/components/seo/ProductJsonLd.tsx` : création
- [ ] `DrinkDetail.tsx` + `Menu.tsx` : intégrer JSON-LD
- [ ] `index.html` : vrai numéro de téléphone
- [ ] Vérifier : `npm run build` ne casse pas
