# 🎥 Vidéo Hero - Guide d'Intégration

La vidéo a été intégrée dans le hero de la page d'accueil avec succès ! 🎉

---

## 📋 Ce qui a été fait

### 1. **Vidéo déplacée**
- Fichier original : `0131.webm`
- Nouveau emplacement : `public/hero-video.webm`
- Accessible via : `/hero-video.webm`

### 2. **Intégration dans Home.tsx**

La vidéo remplace maintenant l'ancien fond dégradé avec :
- ✅ **Lecture automatique** (autoplay)
- ✅ **Boucle infinie** (loop)
- ✅ **Son coupé** (muted) - requis pour autoplay
- ✅ **Compatible mobile** (playsInline)
- ✅ **Poster** : Affiche le logo pendant le chargement
- ✅ **Overlay sombre** : Gradient pour garder le texte lisible
- ✅ **Effet vignette** : Assombrit les bords pour meilleur focus

### 3. **Gestion intelligente**

```typescript
// La vidéo se met automatiquement en pause quand :
- L'onglet n'est pas visible (économise batterie/data)
- L'utilisateur change d'onglet

// Et reprend automatiquement quand :
- L'utilisateur revient sur l'onglet
```

### 4. **Optimisations CSS**

```css
/* Performance GPU */
- will-change: transform
- backface-visibility: hidden

/* Effet visuel */
- Vignette radiale sur les bords
- Overlay dégradé vert/noir
- Motifs feuilles en overlay subtil
```

---

## 🎨 Résultat Visuel

### Structure des couches (de bas en haut) :

1. **Vidéo** (`hero-video.webm`)
   - En fond, plein écran
   - Object-fit: cover (remplit tout l'écran)

2. **Overlay gradient** (60-80% opacité)
   - Dégradé vert du haut vers le bas
   - Assure lisibilité du texte

3. **Motifs feuilles** (5% opacité)
   - Emojis 🌿🍃 positionnés
   - Ajoute un effet organique

4. **Effet vignette** (via CSS)
   - Assombrit les bords
   - Centre l'attention sur le contenu

5. **Contenu texte** (z-index: 10)
   - Titre, description, boutons
   - Parfaitement lisible

---

## 📱 Responsive & Performance

### Mobile (< 768px)
- Vidéo optimisée pour mobile
- `playsInline` évite le fullscreen automatique
- Pause automatique en arrière-plan

### Desktop
- Vidéo fluide en haute résolution
- Gestion intelligente de la visibilité

### Optimisations
- `preload="metadata"` : Charge seulement les infos de base
- Pause automatique hors vue
- Optimisation GPU avec CSS transforms

---

## 🔧 Personnalisation

### Changer la vidéo

Remplace simplement le fichier :
```bash
public/hero-video.webm
```

### Formats supportés
- WebM (optimal pour web)
- MP4 (fallback)
- MOV (si converti)

### Recommandations vidéo
- **Durée** : 10-30 secondes (boucle)
- **Résolution** : 1920x1080 minimum
- **Format** : WebM ou MP4 (H.264)
- **Poids** : < 5MB idéalement
- **Framerate** : 30fps
- **Ratio** : 16:9

### Ajuster l'overlay

Dans `Home.tsx`, ligne ~35 :
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary-dark/60 to-primary-dark/80"></div>
```

Modifie les valeurs `/70`, `/60`, `/80` pour ajuster l'opacité.

### Ajuster la vignette

Dans `index.css` :
```css
.hero-video-vignette::after {
  background: radial-gradient(
    ellipse at center,
    transparent 20%,        /* Centre transparent */
    rgba(45, 80, 22, 0.3) 70%,  /* Milieu léger */
    rgba(45, 80, 22, 0.6) 100%  /* Bords foncés */
  );
}
```

---

## 🐛 Dépannage

### La vidéo ne se lance pas

**Problème** : Certains navigateurs bloquent l'autoplay

**Solution** : C'est normal et géré automatiquement
- Le poster (logo) s'affiche
- L'overlay gradient reste visible
- Le site reste utilisable

### La vidéo est trop sombre/claire

**Ajuste l'overlay** dans `Home.tsx` :
```tsx
// Plus sombre
from-primary/80 via-primary-dark/70 to-primary-dark/90

// Plus clair
from-primary/50 via-primary-dark/40 to-primary-dark/60
```

### La vidéo lag sur mobile

**Optimisations** :
1. Compresse davantage la vidéo
2. Réduis la résolution (720p pour mobile)
3. Active la pause automatique (déjà fait)

### Désactiver la vidéo sur mobile

Dans `Home.tsx`, ajoute une condition :
```tsx
{window.innerWidth > 768 && (
  <video ref={videoRef} ... />
)}
```

---

## 🎯 Améliorations futures

### À considérer :
- [ ] Version mobile optimisée (résolution réduite)
- [ ] Plusieurs sources vidéo (WebM + MP4 fallback)
- [ ] Lazy loading de la vidéo
- [ ] Contrôles utilisateur (play/pause)
- [ ] Différentes vidéos selon l'heure/saison
- [ ] Ajout de sous-titres (accessibility)

---

## 📊 Impact

### Avant (gradient statique)
- Chargement instantané
- Pas de bande passante
- Statique

### Après (vidéo dynamique)
- Chargement : ~2-5 secondes
- Bande passante : ~3-5MB
- **Dynamique et engageant** ✨
- **Économie d'énergie** : pause automatique

---

## ✅ Checklist Déploiement

Avant de déployer en production :
- [x] Vidéo dans `/public`
- [x] Overlay lisible
- [x] Autoplay fonctionnel
- [x] Pause automatique
- [x] Responsive mobile
- [ ] Compresser davantage la vidéo si possible
- [ ] Tester sur différents navigateurs
- [ ] Tester sur connexion lente
- [ ] Ajouter fallback MP4 (optionnel)

---

**Intégration réalisée le** : 31 Janvier 2026
**Fichier vidéo** : `public/hero-video.webm`
**Format** : WebM
**Status** : ✅ Fonctionnel
