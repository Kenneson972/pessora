# Récap Élise — 30 Mai 2026

## Contexte

Pessora revend des produits Herbalife. Les images des gammes (Wellness, Sport, Skin) étaient des photos Unsplash génériques. On les a remplacées par les visuels officiels Herbalife depuis leur CDN.

---

## Ce qui a été fait

### 1. Images hero des gammes (`productsData.ts`)

Les 3 `heroImage` (bannières de section sur `/nos-produits`) pointent maintenant vers les canisters Herbalife :

| Gamme | Produit associé | SKU | URL |
|-------|----------------|-----|-----|
| Wellness | Aloe Vera | `1065` | `pc-1065-fr.png` |
| Sport | Formula 1 | `048K` | `pc-048k-fr.png` |
| Skin | Crème Tension Ultime | `513K` | `pc-513k-fr.png` |

### 2. Images des produits individuels (`productsData.ts`)

11 produits sur 24 ont leur image Herbalife :

**Wellness :** Aloe Vera (1065), Thé Detox (182K), Fibres (2554), Collagène (076K)
**Sport :** Formula 1 (048K), Créatine (488K), Rebuild Whey (013K), Protein Drink (2600), LiftOff Citron (3152)
**Skin :** Gel Nettoyant (511K), Crème Tension (513K), Contour Yeux (515K)

### 3. Base de données Supabase (`gamme_products`)

Migration `20260531170000` appliquée : met à jour `image_url` dans la table `gamme_products` avec les URLs Herbalife correspondantes (mêmes SKU que ci-dessus). Les previews produits sur `/nos-produits` s'affichent maintenant.

### 4. Pattern des URLs

```
https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png
```

Remplacer `XXXX` par le SKU en minuscules (ex: `1065`, `048k`, `511k`).

---

## Produits sans image (SKU à confirmer)

Ces produits sont dans `productsData.ts` mais n'ont pas de SKU Herbalife confirmé :

| Gamme | Produit | Remarque |
|-------|---------|----------|
| Wellness | Complex Vitamine | ? |
| Wellness | Minéral Complex | ? |
| Sport | Gel Prolong | ? |
| Sport | Electrolytes CR7 Boîte | ? |
| Sport | Electrolytes Sachet x10 | ? |
| Sport | Omega 3 | ? |
| Sport | Hydrate | ? |
| Sport | LiftOff Pamplemousse | Trouvé Citron-Citron vert (3152) et Pêche/Classique — pas Pamplemousse |
| Skin | Gommage | ? |
| Skin | Lotion Tonique Revitalisant | ? |
| Skin | Crème Hydratante FPS 30 | ? |
| Skin | Sérum Rides | ? Peut-être doublon avec Crème Tension (513K) |

Dès que tu me donnes les SKU, je mets à jour en 2 minutes.

---

## Ce que j'ai exploré sur le site Herbalife

- **API officielle** : `api3.herbalife.com/api/v1/products/plp` — retourne les 77 produits France avec SKU, noms, descriptions, images
- **Catégories** : `nutrition-au-quotidien` (49), `sport` (23), `soins-visage-corps` (12)
- **Les URLs CDN sont stables** — même structure depuis des années, utilisée par les distributeurs officiels
- **Le site est difficile à scraper** (React, CORS, tokens de session) — j'ai dû naviguer page par page

---

## Pour la suite

1. Confirmer les SKU manquants → je complète `productsData.ts` + migration DB
2. Les images chargent directement depuis le CDN Herbalife, pas besoin d'upload
3. Si vous préférez héberger les images vous-mêmes, on peut les télécharger et les mettre dans Supabase Storage
