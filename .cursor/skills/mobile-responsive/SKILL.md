---
name: mobile-responsive
description: >
  Guide la création et la correction du responsive mobile pour les sites clients Karibloom : navigation
  hamburger animée, layouts Tailwind fluides, typographie fluide, touch targets, images adaptatives,
  formulaires adaptés au mobile, checklist de validation et code React/CSS production-ready mobile-first.
  À utiliser lorsque l’utilisateur aborde le responsive, le mobile, le menu hamburger, les breakpoints,
  les débordements, la navigation mobile, l’adaptation smartphone ou tablette, un layout cassé sur petit
  écran, une grille qui ne s’adapte pas, le zoom iOS sur les champs, ou l’optimisation mobile. Référence
  mobile Karibloom pour tout affichage tactile ou viewport réduit.
---

# Mobile Responsive — Karibloom

Système complet pour créer et corriger le responsive mobile des sites clients. Mobile-first, touch-ready, animé, accessible.

---

## Stack ciblée

Ce skill couvre les deux stacks Karibloom :
- **React SPA** (Vite + React Router) — imports : `Link`, `useLocation` de `react-router-dom`
- **Next.js App Router** — imports : `Link` de `next/link`, `usePathname` de `next/navigation`

Chaque fichier de référence indique la variante à utiliser selon la stack du projet.

---

## Décision rapide : que faire ?

| Situation | Action |
|-----------|--------|
| Nouveau site → tout créer | Suivre le **Workflow complet** ci-dessous |
| Bug responsive signalé | Aller au **Diagnostic rapide** |
| Navigation mobile à créer | Lire `references/nav-mobile.md` (React SPA + Next.js) |
| Composant spécifique à rendre responsive | Lire `references/mobile-patterns.md` |
| Touch/UX mobile à améliorer | Lire `references/touch-ux.md` |
| Perf mobile Chrome Android (scroll, GPU, animations) | Lire `references/chrome-android.md` |

---

## 1. Fondamentaux Karibloom Mobile-First

### Breakpoints Tailwind (à utiliser partout, jamais de px custom)

```
sm:   640px   → smartphone paysage / petite tablette
md:   768px   → tablette portrait
lg:   1024px  → tablette paysage / laptop
xl:   1280px  → desktop standard
2xl:  1536px  → grands écrans
```

**Règle d'or** : écrire d'abord le style mobile (sans préfixe), puis surcharger pour les écrans plus larges.

```jsx
// ✅ Correct — mobile-first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">

// ❌ Interdit — desktop-first avec media query inverse
<div className="grid grid-cols-3 max-sm:grid-cols-1">
```

### Variables CSS essentielles pour le mobile

Ajouter dans `variables.css` si absent :

```css
:root {
  /* Espacements fluides */
  --section-padding-y: clamp(3rem, 8vw, 7rem);
  --container-px:      clamp(1rem, 4vw, 2rem);
  --gap-cards:         clamp(0.75rem, 2vw, 1.5rem);

  /* Typographie fluide */
  --text-hero:    clamp(2rem, 7vw, 5rem);
  --text-h2:      clamp(1.5rem, 4vw, 2.75rem);
  --text-h3:      clamp(1.125rem, 2.5vw, 1.5rem);
  --text-body:    clamp(0.9375rem, 1.5vw, 1.0625rem); /* min 15px, max 17px */
  --text-small:   clamp(0.8125rem, 1vw, 0.875rem);

  /* Touch targets */
  --touch-min: 44px; /* Apple HIG + WCAG 2.5.5 */

  /* Bottom safe area (iPhone X+) */
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top:    env(safe-area-inset-top, 0px);
}
```

---

## 2. Workflow complet : rendre un site responsive

### Étape 1 — Poser le viewport meta (index.html)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<!-- viewport-fit=cover = support des encoches iPhone -->
```

### Étape 2 — Reset global anti-overflow

Dans `index.css` ou `variables.css` :

```css
/* Prevent horizontal scroll — toujours présent */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Images responsives par défaut */
img, video, iframe {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Box sizing universel */
*, *::before, *::after {
  box-sizing: border-box;
}
```

### Étape 3 — Conteneur responsive

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding-inline: var(--container-px);
}
```

### Étape 4 — Navigation mobile

Voir `references/nav-mobile.md` pour le composant Header complet avec hamburger Framer Motion.

### Étape 5 — Sections et grilles

Voir `references/mobile-patterns.md` pour tous les patterns de layout responsive.

### Étape 6 — Touch UX

Voir `references/touch-ux.md` pour les interactions, formulaires, et gestes tactiles.

### Étape 7 — Validation

Utiliser la **checklist de livraison** en section 5.

---

## 3. Diagnostic rapide des bugs courants

| Symptôme | Cause probable | Fix |
|----------|---------------|-----|
| Scroll horizontal | `width: 100vw` avec padding | → `width: 100%` + `overflow-x: hidden` sur body |
| Menu qui déborde | Position absolute sans `width: 100vw` | → Voir `nav-mobile.md` |
| Boutons trop petits | Padding insuffisant | → `min-height: var(--touch-min); min-width: var(--touch-min)` |
| Texte illisible | Font-size fixe trop petite | → `font-size: clamp(15px, 4vw, 17px)` |
| Images déformées | Pas de `object-fit` | → `object-fit: cover; width: 100%; height: 200px` |
| Hero cassé mobile | Hauteur fixe `vh` | → `min-height: 100svh` (small viewport height) |
| Grid non adapté | `grid-cols` fixe | → `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` |
| Form champ trop petit | Input sans width | → `width: 100%; min-height: 48px; font-size: 16px` (évite zoom iOS) |
| Safe area iPhone | Pas de `env()` | → `padding-bottom: calc(1rem + env(safe-area-inset-bottom))` |
| Animations lentes mobile | Pas de `will-change` | → `will-change: transform, opacity` + `prefers-reduced-motion` |

---

## 4. Composants critiques à générer

### Section Hero — version mobile

```jsx
// Hero responsive avec hauteur safe et typographie fluide
<section
  className="hero-section"
  style={{
    minHeight: '100svh', // svh = small viewport height, évite le bug iOS avec la barre d'adresse
    paddingTop: 'calc(var(--header-height, 70px) + var(--safe-top))',
    paddingBottom: 'calc(var(--section-padding-y) + var(--safe-bottom))',
    paddingInline: 'var(--container-px)',
  }}
>
  <div className="container">
    <div className="hero-content" data-hero="true">
      {/* Badge — caché sur très petit écran si trop encombrant */}
      <span className="hero-badge hidden xs:inline-flex">
        [Badge]
      </span>

      {/* H1 fluide */}
      <h1 style={{ fontSize: 'var(--text-hero)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {'[Titre]'.split(' ').map((w, i) => (
          <span key={i} className="luxe-word-reveal" style={{ animationDelay: `${i * 0.08}s` }}>
            {w}{' '}
          </span>
        ))}
      </h1>

      {/* Sous-titre — réductible sur mobile */}
      <p className="hero-subtitle" style={{
        fontSize: 'var(--text-body)',
        maxWidth: '65ch',
        marginInline: 'auto',
      }}>
        [Sous-titre]
      </p>

      {/* CTAs empilés sur mobile, côte-à-côte sur sm+ */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6">
        <a href="/contact" className="btn-primary w-full sm:w-auto text-center">
          [CTA Principal]
        </a>
        <a href="#services" className="btn-secondary w-full sm:w-auto text-center">
          [CTA Secondaire]
        </a>
      </div>

      {/* Trust bar — 1 col sur mobile, horizontal sur md+ */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-6 justify-center items-center mt-6 text-sm">
        <span>⭐⭐⭐⭐⭐ [Note] avis</span>
        <span className="hidden md:inline">·</span>
        <span>🏆 [Preuve sociale]</span>
        <span className="hidden md:inline">·</span>
        <span>📍 [Localisation]</span>
      </div>
    </div>
  </div>
</section>
```

### Cards grid — mobile-first

```jsx
// Grid de cards s'adaptant automatiquement
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-cards)]">
  {services.map((service, i) => (
    <article
      key={service.id}
      className="glass-card feature-card"
      data-animate="fade"
      style={{
        transitionDelay: `${i * 0.08}s`,
        borderTop: `3px solid ${service.color}`,
        // Touch feedback
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span className="card-icon text-3xl" aria-hidden="true">{service.icon}</span>
      <h3 style={{ fontSize: 'var(--text-h3)' }}>{service.name}</h3>
      <p style={{ fontSize: 'var(--text-body)' }}>{service.tagline}</p>
      <ul className="mt-3 space-y-1">
        {service.features.slice(0, 4).map((f, j) => (
          <li key={j} className="flex items-start gap-2 text-sm">
            <span aria-hidden="true">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {/* CTA min 44px */}
      <a
        href={service.ctaLink}
        className="btn-primary mt-4 block text-center"
        style={{ minHeight: 'var(--touch-min)', lineHeight: 'var(--touch-min)' }}
      >
        {service.cta}
      </a>
    </article>
  ))}
</div>
```

---

## 5. Checklist de livraison mobile

Exécuter avant chaque livraison client — cocher mentalement ou dans le rapport :

```
VIEWPORT & STRUCTURE
  [ ] <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  [ ] overflow-x: hidden sur html et body
  [ ] Aucun élément avec width > 100vw sans overflow hidden
  [ ] box-sizing: border-box universel

TYPOGRAPHIE
  [ ] Corps de texte min 16px (évite le zoom auto iOS)
  [ ] Titres avec clamp() ou fluid typography
  [ ] Aucun white-space: nowrap sans overflow: hidden + text-overflow: ellipsis
  [ ] line-height ≥ 1.4 pour les paragraphes

NAVIGATION
  [ ] Hamburger menu présent sur mobile (≤ 768px)
  [ ] Menu fermé par défaut, accessible au clavier (Escape)
  [ ] Logo cliquable (retour home)
  [ ] Aucun lien de navigation trop petit pour être cliqué

TOUCH TARGETS
  [ ] Tous les boutons/liens ≥ 44×44px
  [ ] Espace suffisant entre les éléments cliquables (≥ 8px)
  [ ] -webkit-tap-highlight-color: transparent sur les éléments interactifs
  [ ] Pas de hover-only pour l'info critique (pas accessible mobile)

IMAGES & MÉDIAS
  [ ] max-width: 100% sur toutes les images
  [ ] object-fit: cover sur les images avec hauteur fixe
  [ ] loading="lazy" sur les images hors viewport
  [ ] srcset ou picture pour les images importantes (hero)
  [ ] Pas de vidéo autoplay avec son sur mobile

FORMULAIRES
  [ ] Champs input width: 100% en mobile
  [ ] min-height: 48px sur les inputs et selects
  [ ] font-size: 16px sur les inputs (évite le zoom iOS)
  [ ] type approprié sur les inputs (email, tel, number...)
  [ ] autocomplete défini
  [ ] Keyboard type adapté (inputMode)

LAYOUT
  [ ] Grilles passent à 1 colonne en mobile
  [ ] Flexbox avec flex-wrap: wrap si nécessaire
  [ ] Pas de min-width fixe qui force le débordement
  [ ] Sections avec padding fluide (clamp ou var)

PERFORMANCE MOBILE
  [ ] Google PageSpeed mobile ≥ 85
  [ ] Pas de layout shift (CLS < 0.1) — images avec width/height définis
  [ ] Animations désactivées si prefers-reduced-motion
  [ ] Polices préchargées (rel="preload")
  [ ] Fonts avec font-display: swap

CHROME ANDROID (voir references/chrome-android.md)
  [ ] backdrop-filter ciblé sur .glass-card uniquement (pas *), désactivé mobile
  [ ] background-attachment: scroll sur mobile (pas fixed)
  [ ] Image de fond via <div id="site-bg"> en WebP, pas sur body
  [ ] Animations Framer Motion / GSAP réduites ou désactivées sur mobile
  [ ] WebGL / 3D : composant non monté sur mobile (null, pas display:none)
  [ ] overscroll-behavior: contain sur modales et drawers
  [ ] svh ou dvh utilisé selon le contexte (hero → svh, modale → dvh)

SAFE AREAS (iPhone X+)
  [ ] Padding-bottom avec env(safe-area-inset-bottom) sur footer et nav fixe
  [ ] Padding-top avec env(safe-area-inset-top) sur header fixe
  [ ] viewport-fit=cover dans le meta viewport

ACCESSIBILITÉ MOBILE
  [ ] Focus visible sur tous les éléments interactifs
  [ ] Pas d'info transmise par la couleur seule
  [ ] Labels sur tous les champs de formulaire
  [ ] aria-label sur les boutons icône-only
  [ ] Contraste ≥ 4.5:1 sur le texte
```

---

## 6. Fichiers de référence

- **`references/nav-mobile.md`** → Navigation hamburger Framer Motion — variante React SPA (React Router) **et** Next.js App Router
- **`references/mobile-patterns.md`** → Patterns CSS/JSX pour Hero, Timeline, FAQ, CTA, Pricing, Testimonials
- **`references/touch-ux.md`** → Interactions tactiles, formulaires, swipe, bottom nav, toasts
- **`references/chrome-android.md`** → Pièges GPU Chrome Android : backdrop-filter, background-attachment, WebGL, animations, overscroll, svh/dvh
- **`scripts/audit-mobile.js`** → Audit Puppeteer multi-viewport (viewport meta, scroll horizontal, touch targets, etc.). Nécessite `puppeteer` : `node scripts/audit-mobile.js <URL> [--output rapport.html]`

Lire le fichier de référence approprié selon la tâche demandée plutôt que réinventer chaque fois.
