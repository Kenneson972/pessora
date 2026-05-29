# Prompt Cursor — Fix Incohérences Frontend Pessora (29/05/2026)

---

## 🔴 BUGS FONCTIONNELS

### 1. Events payants affichés comme "gratuits"

**Fichiers :** `src/pages/Evenements.tsx`, `src/pages/EvenementDetail.tsx`

Problème : le bouton d'inscription dit en dur **"Je m'inscris gratuitement"** et `price` n'est jamais affiché sur les pages publiques.

**À faire :**
- Dans `Evenements.tsx` (liste) : ligne ~154, remplacer `is_free ? 'Entrée libre' : 'Sur inscription'` par l'affichage du prix quand `!is_free && price > 0`
- Dans `EvenementDetail.tsx` : afficher `price` formaté (ex: `${price}€`) dans les infos pratiques
- Dans `EvenementDetail.tsx` : remplacer le texte en dur "Je m'inscris gratuitement" par un conditionnel : gratuit si `is_free`, sinon afficher le prix sur le bouton (ex: "Je m'inscris — 25€")

---

### 2. `meeting_point` jamais affiché publiquement

**Fichier :** `src/pages/EvenementDetail.tsx`

L'admin peut définir un point de rendez-vous. Il est en DB mais pas dans la page détail.

**À faire :**
- Dans la section "Infos pratiques" (date, heure, lieu), ajouter `meeting_point` s'il est non-null
- Format : icône map-pin + texte du meeting_point

---

### 3. Galerie events jamais affichée publiquement

**Fichiers :** `src/pages/Evenements.tsx`, `src/pages/EvenementDetail.tsx`

L'admin peut uploader des photos d'événements (`gallery: string[]`) mais les visiteurs ne les voient jamais.

**À faire :**
- Dans `EvenementDetail.tsx` : ajouter une section "Photos" (comme pour `DrinkDetail.tsx` ligne 762) si `Array.isArray(event.gallery) && event.gallery.length > 0`
- Grille responsive 2-3 colonnes, images en `object-cover`, lazy loading

---

### 4. Carrousel : 2 slides mortes (`tiramisu-creamy`, `detox-my-body`)

**Fichier :** `src/data/homeProductCarousel.ts`

Ces 2 slugs sont référencés dans le carrousel mais :
- `tiramisu-creamy` : existe en DB (`active=true`) mais **absent de `menuData.ts`** → `getCarouselMenuItems()` le filtre
- `detox-my-body` : inactif en DB (`active=false`) ET absent de `menuData.ts`

**À faire (option A — recommandé) :** Supprimer ces 2 entrées du template `homeProductCarousel` 
**À faire (option B) :** Ajouter TIRAMISU GOURMAND dans `menuData.ts` (catégorie shakes, 290 cal, 22g protéines)

---

## 🟡 AMÉLIORATIONS

### 5. Prix gamme non formatés

**Fichier :** `src/pages/GammeProductDetail.tsx` (~ligne 109-111)

Actuellement : `` `${product.price}€ / ${product.price_alt}€` `` → `7.5€` au lieu de `7,50€`

**À faire :**
```tsx
const formatEur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
```
Appliquer sur tous les affichages de prix de la page.

### 6. Formatage prix dans `DrinkDetail.tsx`

**Fichier :** `src/pages/DrinkDetail.tsx`

Vérifier que les prix utilisent bien `toLocaleString('fr-FR')` partout (pas de `.toFixed()` seul).

---

## 🟢 MINEUR

### 7. Slug `caramel-glace` (nouveau)

**Fichiers :** `src/data/menuData.ts`, `src/data/homeProductCarousel.ts`

Le slug `iced-caramel-latte` a été renommé en `caramel-glace` dans la DB. Mettre à jour les données statiques.

**À faire :**
- `menuData.ts` : renommer `iced-caramel-latte` → `caramel-glace`, et `ICE CARAMEL LATTE` → `CARAMEL GLACÉ`
- `homeProductCarousel.ts` : idem

---

## 🎯 OBJECTIF

- [ ] Event : prix affiché, bouton conditionnel
- [ ] Event : `meeting_point` affiché
- [ ] Event : galerie publique
- [ ] Carrousel : 2 slugs morts nettoyés
- [ ] Prix gamme formatés fr-FR
- [ ] Slug `caramel-glace` dans les fichiers statiques
