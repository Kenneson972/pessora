# Élise → Cursor : Continue les images Herbalife

## Ce que je pense de ton taf

Tu as trouvé la **bonne** source d'images. Le CDN `dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png` est bien supérieur à ce que j'avais trouvé (`assets/regional-reusable-assets/workflow/fusion/pdp/prepared-product/emeai/pp-*-emea.jpg`). Les tiennes sont :
- Plus nettes (canister vs prepared product shot)
- Fond blanc propre
- Tailles standardisées
- Déjà utilisées par les distributeurs officiels

Mon approche (scraper les pages produits une par une) était plus lente et donnait des résultats moins bons. Continue avec **ta** méthode.

## Ce qu'il reste à trouver (12 produits)

Voici les SKU probables à tester. Le pattern est simple : prends `https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png`, remplace `XXXX` par le code, et teste avec un HEAD HTTP (status 200 = trouvé).

### Wellness (2 restants)
| Produit | SKU probable | Notes |
|---|---|---|
| Complex Vitamine (F2 Homme) | `1745` | `pc-1745-fr.png` |
| Complex Vitamine (F2 Femme) | `2038` | `pc-2038-fr.png` |
| Minéral Complex | `0111` | `pc-0111-fr.png` |

### Sport (7 restants)
| Produit | SKU probable | Notes |
|---|---|---|
| Gel Prolong | `???` | Cherche "gel" ou "energy" dans l'API |
| Electrolytes CR7 Boîte | `0276` ou `2913` | CR7 Drive = 1466, Electrolytes = à tester |
| Electrolytes Sachet x10 | `???` | Version sachets du même produit |
| Omega 3 | `???` | Cherche "omega" ou "heart" |
| Hydrate | `???` | Cherche "hydrate" ou "cramp" |
| LiftOff Pamplemousse | `???` | LiftOff Citron = 3152, le Pamplemousse est un autre SKU |
| LiftOff (autres parfums) | `???` | Il y a aussi Pêche, Orange |

### Skin (4 restants)
| Produit | SKU probable | Notes |
|---|---|---|
| Gommage | `1014` | `pc-1014-fr.png` |
| Lotion Tonique | `1016` | `pc-1016-fr.png` |
| Crème Hydratante FPS 30 | `1020` | `pc-1020-fr.png` |
| Sérum Rides | `1022` | `pc-1022-fr.png` |
| **Déjà trouvé** : Gel Nettoyant (511K), Crème Tension (513K), Contour Yeux (515K) | | Ces 3 sont déjà en place ✅ |

## Stratégies supplémentaires

### 1. API produit Herbalife (si accessible)
Essaie `GET https://api3.herbalife.com/api/v1/products/plp?market=fr` — si elle répond sans auth, elle contient TOUS les produits avec SKU, noms, et URLs d'images.

### 2. Site distributeur
Les images sur `myherbalife.com` sont souvent en plus haute résolution que le site public.

### 3. Google Images
Cherche `site:herbalife.fr [nom du produit]` — parfois les pages produits ont été indexées avec un slug différent.

## Une fois les SKU trouvés

Mets à jour :
1. `src/data/productsData.ts` — ajouter `image: 'https://...pc-XXXX-fr.png'` pour chaque produit
2. `supabase/migrations/20260531170000_seed_gamme_product_images.sql` — ajouter les UPDATE manquants

Pattern des URLs : `https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png`

Bonne chasse.
