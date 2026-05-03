# 🌿 Nouveau Thème Organique PessÓra

Le site a été entièrement redesigné avec une palette organique et naturelle inspirée du logo PessÓra.

## 🎨 Palette de Couleurs

### Couleurs Principales
```css
--primary: #3A5F1A       /* Vert olive foncé (du logo) */
--primary-light: #5B8C3E /* Vert clair */
--primary-dark: #2D5016  /* Vert très foncé */
```

### Accents Naturels
```css
--accent-cream: #E8DCC8  /* Beige crème (fond du logo) */
--accent-leaf: #6B9544   /* Vert feuille */
--accent-wood: #C19A6B   /* Bois/nature */
```

### Neutres Organiques
```css
--neutral-cream: #FAF8F3 /* Crème très clair */
--neutral-sand: #F5F1E8  /* Sable clair */
--neutral-warm: #E5DED3  /* Beige chaud */
```

### Base
```css
--dark: #2C3E1F          /* Vert très sombre (textes) */
--light: #FFFFFF         /* Blanc pur */
```

## 📝 Typographie

### Polices Utilisées
- **Corps de texte** : Nunito (arrondie et douce)
- **Titres** : Nunito Bold / Montserrat
- **Style** : Sans-serif arrondie, agréable et lisible

### Poids de Police
- 300, 400, 500 : Texte courant
- 600, 700 : Titres et emphase
- 800, 900 : Titres principaux

## 🎭 Style Visuel

### Formes
- **Boutons** : `rounded-full` (complètement arrondis)
- **Cartes** : `rounded-3xl` (coins très arrondis)
- **Éléments** : Formes circulaires et organiques

### Ombres
- `shadow-sm` : Ombre légère par défaut
- `hover:shadow-xl` : Ombre prononcée au survol
- `shadow-lg` : Ombre moyenne

### Transitions
- Toutes les interactions utilisent des transitions de 300ms
- Effets de scale au survol (1.05) sur les boutons
- Translations subtiles (-translate-y-2) sur les cartes

## 🧩 Composants Principaux

### `.btn-primary`
```css
Arrière-plan : Dégradé vert (primary → primary-light)
Texte : Blanc
Forme : Arrondie (rounded-full)
Hover : Scale + ombre + dégradé foncé
```

### `.btn-secondary`
```css
Arrière-plan : Blanc
Bordure : 2px vert primary
Texte : Vert primary
Forme : Arrondie (rounded-full)
Hover : Fond vert + texte blanc
```

### `.card`
```css
Arrière-plan : Blanc
Forme : rounded-3xl
Bordure : Subtile grise
Ombre : sm → xl au survol
```

### `.card-organic`
```css
Arrière-plan : Dégradé blanc → crème
Forme : rounded-3xl
Bordure : Crème accent semi-transparente
Ombre : sm → xl au survol
Effet : Plus organique et chaleureux
```

## 📄 Pages Mises à Jour

### Page d'Accueil (Home)
✅ Hero avec dégradé vert et motifs feuilles en background
✅ Section Concept avec cartes organiques
✅ Section Boissons avec nouveau style
✅ Section Partenariats avec badges arrondis
✅ Section Infos Pratiques avec fond vert et motifs
✅ CTA Instagram avec nouvelles couleurs

### Header
✅ Logo PessÓra circulaire intégré
✅ Navigation avec texte vert olive
✅ Fond crème avec backdrop blur
✅ Menu mobile avec style organique arrondi
✅ Boutons d'action arrondis au survol

### Footer
✅ Fond vert sombre
✅ Texte crème/sable
✅ Accents vert feuille
✅ Logo circulaire intégré
✅ Liens avec hover vert clair

## 🌳 Motifs Organiques

### Éléments Décoratifs
- Emojis feuilles (🌿) et plantes (🍃) en arrière-plan avec opacité 5%
- Positionnement stratégique pour créer une ambiance naturelle
- Utilisation subtile pour ne pas surcharger

### Dégradés
```css
/* Principal */
background: linear-gradient(135deg, #3A5F1A 0%, #5B8C3E 100%);

/* Crème */
background: linear-gradient(135deg, #FAF8F3 0%, #E8DCC8 100%);

/* Organique */
background: linear-gradient(135deg, #F5F1E8 0%, #E5DED3 100%);
```

## 🎯 Badges et Tags

### Style des Tags
```css
Arrière-plan : Vert clair avec opacité (accent-leaf/20)
Texte : Vert primary
Forme : rounded-full
Padding : px-3 py-1
Police : font-semibold
```

### Badges Partenaires
```css
/* Fitness */
Arrière-plan : accent-leaf (vert)
Texte : Blanc
Police : font-bold

/* Bien-être */
Arrière-plan : accent-wood (bois)
Texte : Blanc
Police : font-bold
```

## 🖼️ Images et Médias

### Logo
- Fichier : `public/logo.jpeg`
- Utilisation : Header, Footer
- Style : Circulaire (rounded-full), 40-48px
- Object-fit : cover

### Favicon
- Fichier : `public/favicon.svg`
- Style : Lettre "Ó" stylisée avec feuille
- Couleurs : Vert olive sur fond crème

## 📱 Responsive

### Mobile
- Menu burger avec overlay arrondi
- Cartes empilées verticalement
- Boutons full-width
- Padding réduit

### Tablet
- Grid 2 colonnes
- Espacement modéré
- Navigation horizontale

### Desktop
- Grid 3-4 colonnes
- Espacement généreux
- Navigation complète
- Effets hover complets

## 🔄 Animations

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Slide In Left/Right
```css
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### Hover Effects
- Scale sur boutons : `hover:scale-105`
- Translation sur cartes : `hover:-translate-y-2`
- Ombre augmentée : `hover:shadow-xl`

## 📊 Scrollbar Personnalisée

```css
/* Track */
background: crème neutre
border-radius: 10px

/* Thumb */
background: Dégradé vert (primary → primary-light)
border-radius: 10px
border: 2px solid crème

/* Hover */
background: Dégradé vert foncé
```

## ✨ Améliorations UX

1. **Formes Arrondies** : Plus douces et accueillantes
2. **Couleurs Naturelles** : Évoquent le bien-être et la nature
3. **Espacement Généreux** : Respiration visuelle
4. **Transitions Fluides** : Expérience agréable
5. **Hiérarchie Claire** : Lecture facilitée

## 🚀 Prochaines Étapes

### Contenu à Ajouter
- [ ] Photos de boissons fraîches avec ingrédients naturels
- [ ] Photos de personnes en mouvement serein
- [ ] Images d'ingrédients bio/naturels
- [ ] Photos du bar avec ambiance organique

### Optimisations
- [ ] Compresser les images
- [ ] Ajouter lazy loading sur images
- [ ] Optimiser les dégradés pour performance
- [ ] Tester sur tous les navigateurs

### Accessibilité
- [ ] Vérifier le contraste des couleurs
- [ ] Ajouter les attributs ARIA
- [ ] Tester avec lecteur d'écran
- [ ] Vérifier la navigation au clavier

## 📝 Notes Importantes

- Le thème est maintenant complètement en harmonie avec le logo
- Toutes les couleurs sont définies dans `tailwind.config.js` et `src/index.css`
- Les composants utilisent les classes utility Tailwind
- Le design est minimaliste et organique
- La typographie est douce et arrondie

---

**Thème créé le** : 30 Janvier 2026
**Version** : 1.0.0
**Style** : Minimaliste Organique
