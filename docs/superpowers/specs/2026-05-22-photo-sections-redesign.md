# Spec — Refonte sections photo Home + Nos Produits

**Date** : 2026-05-22  
**Statut** : Validé

---

## Contexte

La gérante veut enrichir le site avec des cadres photos inspirés de la logique Nespresso : carrousel éditorial de photos (modèles + boissons), section split modèle/tabs, et tuiles catégories visuelles. Les vraies photos seront fournies après une séance photo à organiser. Les emojis/placeholders actuels restent jusqu'à la livraison des assets.

---

## Périmètre

### Page Home — 10 sections (ordre)

| # | Section | Statut | Changement |
|---|---------|--------|------------|
| 1 | Hero vidéo | Inchangé | — |
| 2 | **Carrousel éditorial photos** | **Nouveau** | Voir détail ci-dessous |
| 3 | Nos coups de cœur (boissons) | Modifié | Suppression ligne Óra+ sur les cartes · suppression sous-titre "SÉLECTION MAISON · RECETTES COURANTES" |
| 4 | Óra+ strip | Inchangé | — |
| 5 | **Split modèle + tabs gammes boissons** | **Nouveau** | Voir détail ci-dessous |
| 6 | Nos univers | Modifié | Renommer onglet "Nutrition" → "Shakes" · titre de section à renommer (TBD avec gérante) |
| 7 | **Tuiles 3 gammes produits** | **Nouveau** | Wellness / Sport / Skin avec photos |
| 8 | **Carrousel produits par gamme** | **Nouveau** | Tabs Wellness/Sport/Skin · produits avec photos à venir |
| 9 | Avis clients | Inchangé | — |
| 10 | CTA Événements | Modifié | Padding réduit : `py-[104px]` → `py-[52px]` |

### Page Nos Produits — 2 nouvelles sections en tête

| # | Section | Statut |
|---|---------|--------|
| A | **Carrousel éditorial gammes** | Nouveau |
| B | **Tuiles 3 gammes** (navigation rapide) | Nouveau |
| C | Sections alternées existantes | Inchangé |
| D | CTA "En boutique" | Inchangé |

---

## Détails des nouvelles sections

### Section 2 — Carrousel éditorial photos (Home)

- **Titre** : à confirmer avec la gérante (options : "À la une", "L'instant Pessóra", "Nos créations", "En ce moment", "Le bar en images")
- **Layout** : scroll horizontal, cartes 310×420px, border-radius 10px, overlay gradient bas, eyebrow + titre en blanc
- **Contenu** : 4-6 cartes mixant modèles avec boissons + close-ups boissons + ambiance bar
- **Admin** : section entièrement gérable depuis le dashboard — CRUD cartes (photo, eyebrow, titre, lien cible)
- **Photos requises** : modèles avec boissons, ambiance bar, close-ups boissons

### Section 5 — Split modèle + tabs (Home)

- **Titre** : "Choisis ton moment"
- **Sous-titre** : "Chaque boisson PessÓra est pensée pour un instant précis."
- **Tabs** : Wellness · Énergie · Shakes · Coffee
- **Layout** : grille 3/5 + 2/5, hauteur 530px, border-radius 12px
  - Gauche : grande photo modèle avec boisson de la gamme (overlay gradient + eyebrow + titre)
  - Droite : 2 photos produit empilées (close-up boisson)
- **Interaction** : clic sur tab → change les 3 photos (gauche + 2 droite)
- **Photos requises** : 1 photo modèle par gamme (×4) + 2 close-ups par gamme (×8) = 12 photos

### Section 7 — Tuiles 3 gammes produits (Home)

- **Titre** : "Nos gammes"
- **Layout** : grille 3 colonnes, ratio 4/5, border-radius 10px
- **Gammes** : Wellness (Compléments nutrition) · Sport (Performance & récupération) · Skin (Beauté & éclat)
- **Contenu par tuile** : photo fond + label top-left + sous-label bottom-left + flèche bottom-right
- **Lien** : chaque tuile → `/nos-produits#collection-[id]`
- **Photos requises** : 1 photo par gamme produit (×3)

### Section 8 — Carrousel produits par gamme (Home)

- **Position** : immédiatement sous les tuiles gammes (section 7), fond `bg-surface-muted`
- **Layout** : tabs Wellness/Sport/Skin + scroll horizontal de cartes produits
- **Cartes** : 200px wide, ratio 1:1 image + nom + description courte + prix
- **Données** : alimente depuis `rangesData` (productsData.ts) — pas de nouvelle donnée à créer
- **Photos requises** : 1 photo par produit (les vraies photos remplacent les emojis actuels)

### Section A — Carrousel éditorial gammes (Nos Produits)

- **Titre** : "La collection"
- **Layout** : identique au carrousel Home (section 2) mais centré sur les 3 gammes + ambiance boutique
- **Cartes** : Wellness · Sport · Skin · Ambiance boutique (4 cartes)

### Section B — Tuiles 3 gammes (Nos Produits)

- **Titre** : "Explorer par gamme"
- **Layout** : identique aux tuiles Home (section 7) — navigation rapide vers les sections alternées existantes

---

## Réductions texte (Home)

- Supprimer le sous-titre `"SÉLECTION MAISON · RECETTES COURANTES"` du header "Nos coups de cœur"
- Supprimer la ligne `Óra+ dès X€` des cartes produits sur la Home (la garder sur `/menu`)
- Réduire les paddings de la section CTA Événements de moitié

---

## Admin — Carrousel éditorial

Créer une interface dans le dashboard admin (`AdminCommunications` ou nouvelle page `AdminCarousel`) permettant :
- Lister les cartes du carrousel (ordre, photo, eyebrow, titre, lien)
- Ajouter / modifier / supprimer une carte
- Réordonner par drag-and-drop ou flèches
- Upload photo via Supabase Storage

**Table Supabase à créer** : `home_carousel_cards`
```
id uuid PK
position int (ordre)
eyebrow text
title text
image_url text
link_to text (chemin interne)
active bool
created_at timestamptz
```

---

## Photos à préparer (séance photo)

| Usage | Quantité | Description |
|-------|----------|-------------|
| Carrousel éditorial Home | 4-6 | Modèles + boissons, ambiance bar, close-ups |
| Split gammes boissons | 12 | 1 modèle + 2 close-ups × 4 gammes |
| Tuiles gammes produits | 3 | 1 photo par gamme (Wellness/Sport/Skin) |
| Carrousel produits | ~15 | 1 photo par produit (les 3 gammes) |
| Carrousel Nos Produits | 4 | 1 par gamme + ambiance boutique |
| Tuiles Nos Produits | 3 | Idem tuiles Home |
| **Total estimé** | **~43** | |

---

## Hors périmètre

- Refonte du Menu page (hors scope, décision prise)
- Modification des données produits (`productsData.ts`, `menuData.ts`)
- Refonte de la nav ou du footer
