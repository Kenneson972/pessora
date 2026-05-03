# Récap Page Ora+ — Design, layout, couleurs, contenu

Dernière mise à jour : **2026-04-22** (état code actuel).

---

## 1) Positionnement visuel

La page `OraPlus` est pensée comme une **landing premium de conversion** :

- héro sombre, statutaire ;
- contenu court et lisible ;
- avantages + pricing au centre ;
- CTA répétés sans agressivité.

La direction garde le langage éditorial PessOra : sobriété, noir chaud, contraste maîtrisé, micro-détails raffinés.

---

## 2) Typographie

Pilotée par `src/index.css` :

- **Interface** : `Akkurat Pro` (`--font-sans`)
- **Titres** : `Berthold Baskerville Book` (`--font-display`)

Application visible dans `src/pages/OraPlus.tsx` :

- `h1`, `h2`, prix => `font-display`
- micro-copy / labels / CTAs => sans-serif légère en uppercase tracking large

=> Rendu premium, lisible, avec forte hiérarchie visuelle.

---

## 3) Palette & codes couleur

Tokens clés utilisés :

- `--color-noir` / `bg-noir` : fond héro + bloc pricing principal
- `--color-anthracite` : nuances du dégradé de fond héro
- `--color-gold`, `--color-gold-dim` : accents premium (icône couronne, halo, badge)
- `--color-surface-muted` : sections de respiration claires
- `--color-surface-card` : hover subtil sur les liens utilitaires

Rendu global :

- contraste fort dans les sections conversion (sombre + texte blanc),
- contraste doux dans les sections de navigation (fond clair),
- accents gold parcimonieux (pas d'effet bling).

---

## 4) Structure de layout (ordre visuel)

La page est construite en 6 blocs :

1. **Hero premium** (fond sombre + badge + titre + sous-texte + CTA principal)
2. **Bande visuelle éditoriale** (3 images en grille)
3. **Bloc avantages + tarif** (2 colonnes)
4. **Bloc liens d'exploration** (cross-links)
5. **CTA final** ("Créer un compte")
6. marges/paddings généreux via `PageShell`

`PageShell` standardise la largeur et le rythme vertical de toute la page.

---

## 5) Hero Ora+

Section la plus statutaire :

- fond `bg-noir` + overlay radial/dégradé ;
- pill premium avec icône `Crown` ;
- titre `Ora+` en display (`clamp(40px, 5.5vw, 56px)`) ;
- sous-texte court issu de `oraPlusHero.sub` ;
- duo CTA :
  - principal : `Rejoindre Ora+` -> `/inscription`
  - secondaire : `Connexion` -> `/connexion`

Objectif : poser clairement l'offre en moins de 3 secondes.

---

## 6) Bande visuelle éditoriale

Section intermédiaire de branding :

- grille `grid-cols-3` ;
- ratio image `aspect-[3/4]` mobile, `aspect-[4/3]` desktop ;
- images de `oraPlusEditorialImages` ;
- traitement `grayscale` + léger zoom au hover ;
- index visuel (`01`, `02`, `03`) en bas de chaque image.

Rôle UX : renforcer l'univers de marque sans alourdir le texte.

---

## 7) Bloc avantages + pricing (coeur conversion)

Section la plus stratégique :

- conteneur sombre `bg-noir`, coins `2px`, halos gold subtils ;
- layout 2 colonnes (`md:grid-cols-2`).

### Colonne gauche — Inclus

- titre "Inclus"
- liste `oraPlusBenefits` avec check icons (`Check`)
- ton volontairement court ("Le résumé.")

### Colonne droite — Offre

- carte pricing semi-transparente (`bg-white/[0.07]`, `border-white/12`)
- badge `oraPlusPricing.badge` (ex. "Offre limitée")
- prix principal (`oraPlusPricing.price`)
- période (`oraPlusPricing.period`)
- argument de rentabilité (`oraPlusPricing.highlight`)
- CTA principal (`oraPlusPricing.cta` -> `/inscription`)
- note basse (`oraPlusPricing.footnote`)

Cette zone concentre le message valeur + passage à l'action.

---

## 8) Bloc "Explorer" (cross-links)

Section de rebond utilisateur :

- fond `bg-surface-muted`
- titre "Explorer"
- lien rapide vers `/menu` avec icône `ArrowUpRight`
- grille de liens utilitaires (`oraPlusCrossLinks`) :
  - La carte
  - Événements
  - Bilan
  - Contact

Design :

- tuiles blanches, bordure très fine,
- hover discret (`bg-surface-card`),
- uppercase compact pour cohérence éditoriale.

---

## 9) CTA final

Dernier push conversion :

- section centrée, aérée ;
- bouton unique : **"Créer un compte"** vers `/inscription`.

Ce CTA final capte les utilisateurs qui ont scrollé toute la promesse.

---

## 10) Contenu métier (data-driven)

Source principale : `src/data/oraPlusData.ts`

### Hero content

- `oraPlusHero.eyebrow`: L'abonnement premium
- `oraPlusHero.title`: Ora+
- `oraPlusHero.sub`: promesse courte orientée bénéfices

### Avantages

- Jusqu'à -50% sur les boissons
- Sans engagement
- Bilan & événements prioritaires

### Pricing

- `24,90EUR / mois`
- Highlight: "Rentable dès la 4e boisson *"
- Badge: "Offre limitée"
- CTA: "S'abonner"
- Footnote explicative

### Liens croisés

- `/menu`, `/evenements`, `/bilan-bien-etre`, `/contact`

### Visuels

- 3 URLs d'images éditoriales externes (Unsplash)

---

## 11) Motion & ressenti UX

Animations Framer Motion :

- `useFadeUpWhenVisible` sur héro, header bloc liens, CTA final
- `useStaggerReveal` sur grille images et liste avantages

Accessibilité/perception :

- images avec `alt` descriptif ;
- `loading="lazy"` + `decoding="async"` ;
- respect `isReducedMotion` pour réduire les animations.

---

## 12) Détails de design system visibles

- rayons serrés (`rounded-[2px]`) pour une identité nette ;
- tracking large sur micro-textes (uppercase éditorial) ;
- contrastes de texte calibrés (`text-white/65`, `text-black/55`) ;
- bordures presque invisibles (`/[0.06]`, `/12`) ;
- mélange HeroUI (`buttonVariants`) + Tailwind utilitaire pour contrôle fin.

---

## 13) Fichiers de référence

- `src/pages/OraPlus.tsx`
- `src/data/oraPlusData.ts`
- `src/components/layout/PageShell.tsx`
- `src/index.css`

---

## 14) Résumé exécutif

La page `Ora+` est une landing premium centrée conversion :

- héro statutaire,
- promesse courte,
- bloc avantages + tarif clair,
- rebonds vers sections clés du site,
- double opportunité de conversion (`inscription` en haut et en bas),
- cohérence complète avec la DA minimaliste luxe de PessOra.
