# Pièges Chrome Android — Karibloom Reference

Ces bugs sont **invisibles sur desktop et sur Brave** mais tuent les performances sur Chrome mobile.
À appliquer systématiquement sur tous les sites clients.

---

## 1. `backdrop-filter: blur()` — cibler, jamais écraser globalement

C'est le **pire ennemi de Chrome Android**. Chaque élément avec un blur force le GPU à recalculer le rendu en permanence. Résultat : scroll saccadé, surchauffe, batterie vidée.

```css
/* ❌ INTERDIT — trop agressif, casse les composants tiers */
@media (max-width: 768px) {
  * { backdrop-filter: none !important; }
}

/* ✅ CORRECT — ciblage précis sur les classes Karibloom gérées */
@media (max-width: 768px) {
  .glass-card,
  .modal-overlay,
  [data-backdrop="true"] {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: rgba(10, 10, 10, 0.92); /* Fond opaque de remplacement */
  }
}
```

Sur desktop, `.glass-card { backdrop-filter: blur(12px) }` reste libre.

---

## 2. `background-attachment: fixed` — interdit sur mobile

Force le navigateur à repeindre **tout le fond** à chaque pixel scrollé sur Chrome Android.
Résultat : scroll saccadé même sur un téléphone récent. Brave gère mieux ce bug → fausse impression de fluidité lors des tests.

```css
/* ✅ Correct — conditionnel par breakpoint */
body {
  background-attachment: fixed; /* OK desktop */
}
@media (max-width: 768px) {
  body {
    background-attachment: scroll; /* OBLIGATOIRE mobile */
  }
}
```

---

## 3. Image de fond — WebP + `<div>` fixe dédié, jamais sur `body`

Un PNG de fond peut peser 8 Mo+. En WebP : 200 Ko.
De plus, `background-image` sur `body` cause un **flash blanc au scroll** sur Chrome Android (le navigateur libère le layer GPU).

```html
<!-- Dans le layout principal — aria-hidden car purement décoratif -->
<div id="site-bg" aria-hidden="true"></div>
```

```css
#site-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/images/background.webp');   /* WebP obligatoire */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: translateZ(0);    /* Force GPU — évite le zoom au scroll */
  will-change: transform;      /* Alloue le layer GPU en avance */
}

/* Image portrait pour mobile — évite le crop 16:9 → 9:16 */
@media (max-width: 768px) {
  #site-bg {
    background-image: url('/images/background-mobile.webp'); /* Format 9:16 */
    background-position: center top;
  }
}
```

**Règles :** WebP obligatoire · 2 versions (16:9 desktop + 9:16 mobile) · toujours `transform: translateZ(0)` + `will-change: transform` · **jamais** `background-image` sur `body`.

---

## 4. Animations JS (Framer Motion, GSAP) — limiter sur mobile

Les librairies d'animation sont pensées pour desktop. Sur Chrome Android, chaque `animate` Framer Motion crée des layers GPU supplémentaires.

```jsx
// Détection mobile — à faire une seule fois au niveau App
const isMobile = typeof window !== 'undefined'
  && (window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));

// Désactiver les animations non essentielles sur mobile
<motion.div animate={isMobile ? {} : { y: [0, -15, 0] }} />

// Utiliser useReducedMotion de Framer (couvre aussi prefers-reduced-motion)
import { useReducedMotion } from 'framer-motion';
const shouldReduce = useReducedMotion();
<motion.div animate={shouldReduce ? {} : { opacity: 1, y: 0 }} />
```

**Règles à appliquer :**
- Jamais d'animation `repeat: Infinity` sans `willChange: 'transform'`
- Préférer `IntersectionObserver` + classes CSS pour les fade-in plutôt que Framer Motion sur chaque élément
- `requestIdleCallback` pour planifier les animations non critiques

---

## 5. WebGL / 3D / particules — toujours désactivés sur mobile

```jsx
// Détection au plus tôt — ne jamais monter le composant, pas juste le cacher en CSS
const isMobile = window.innerWidth <= 768
  || /Android|iPhone|iPad/i.test(navigator.userAgent);

// ✅ Contrôle le MONTAGE React (null), pas la visibilité CSS
{!isMobile && (
  <Suspense fallback={null}>
    <LiquidEther colors={['#000', '#D4AF37']} dpr={Math.min(devicePixelRatio, 2)} />
  </Suspense>
)}

// ❌ INTERDIT — le composant est quand même monté et consomme du GPU
{!isMobile && <div style={{ display: 'none' }}><HeavyWebGLComponent /></div>}
```

---

## 6. `overscroll-behavior` — modales et drawers

Sans cette propriété, scroller jusqu'au bout d'une modale/sidebar provoque le scroll de la page en arrière-plan (effet "bounce" iOS qui remonte la page principale).

```css
.modal-content,
.drawer,
.bottom-sheet {
  overscroll-behavior: contain; /* Bloque le scroll parent */
}

/* Bloquer le scroll du body quand une modale est ouverte */
body.modal-open {
  overflow: hidden;
  position: fixed; /* Nécessaire sur iOS Safari — prevent body scroll */
  width: 100%;
  /* Sauvegarder et restaurer scroll position via JS */
}
```

```js
// Sauvegarder la position avant d'ouvrir la modale
let scrollY = 0;

function openModal() {
  scrollY = window.scrollY;
  document.body.style.top = `-${scrollY}px`;
  document.body.classList.add('modal-open');
}

function closeModal() {
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
}
```

---

## 7. `dvh` vs `svh` — choisir selon le contexte

Ces deux unités gèrent le problème iOS où `100vh` inclut la barre d'adresse.

| Unité | Valeur | Usage recommandé |
|-------|--------|-----------------|
| `vh`  | Inclut les barres UI browser | ❌ Éviter sur mobile pour les hauteurs plein écran |
| `svh` | **Small** viewport — barres toujours visibles | ✅ **Hero sections** — hauteur conservatrice, toujours visible |
| `dvh` | **Dynamic** viewport — change au scroll | ✅ Modales/drawers qui doivent occuper tout l'écran visible |
| `lvh` | **Large** viewport — barres cachées | ⚠️ Peut faire couper le contenu quand les barres réapparaissent |

```css
/* Hero — utiliser svh : taille stable, conservative, ne change pas au scroll */
.hero-section {
  min-height: 100vh;   /* Fallback navigateurs anciens */
  min-height: 100svh;  /* Override — stable, conservateur */
}

/* Modale plein écran — dvh s'adapte quand les barres se cachent */
.modal-fullscreen {
  height: 100vh;
  height: 100dvh;
}
```

---

## 8. Checklist Chrome Android avant livraison

```
CHROME ANDROID
  [ ] backdrop-filter ciblé (pas *), désactivé sur .glass-card mobile
  [ ] background-attachment: scroll sur mobile (pas fixed)
  [ ] Fond de page en WebP via <div id="site-bg">, pas sur body
  [ ] Animations Framer Motion / GSAP désactivées ou réduites sur mobile
  [ ] WebGL / 3D : composant non monté sur mobile (pas juste display:none)
  [ ] overscroll-behavior: contain sur modales et drawers
  [ ] dvh ou svh utilisé selon le contexte (jamais vh seul sur mobile)
  [ ] Tests effectués sur Chrome Android physique (pas seulement DevTools)
```
