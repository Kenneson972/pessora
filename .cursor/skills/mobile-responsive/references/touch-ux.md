# Touch UX — Karibloom Reference

Interactions tactiles, formulaires mobile-optimisés, feedbacks visuels, et patterns de navigation tactile.

---

## 1. Règles fondamentales du touch

### Touch targets — minimum 44×44px (Apple HIG + WCAG 2.5.5)

```css
/* Reset global à mettre dans variables.css */
:root { --touch-min: 44px; }

/* Application sur les éléments interactifs */
button, a, [role="button"], summary, label[for], input[type="checkbox"] + label {
  min-height: var(--touch-min);
  /* Ou en padding si l'élément doit être plus compact visuellement */
}

/* Touch target étendu sans changer l'apparence visuelle */
.touch-extend {
  position: relative;
}
.touch-extend::after {
  content: '';
  position: absolute;
  inset: -8px; /* Agrandit la zone cliquable de 8px de chaque côté */
}
```

### Supprimer le flash bleu natif iOS/Android

```css
/* Toujours sur tous les éléments interactifs */
a, button, [role="button"], summary, input, textarea, select {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation; /* Supprime le délai 300ms de double-tap */
}
```

### Feedback tactile JSX (avec Framer Motion)

```jsx
// Sur toutes les cards et boutons interactifs importants
import { motion } from 'framer-motion';

<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.1 }}
  style={{ WebkitTapHighlightColor: 'transparent' }}
>
  [Contenu]
</motion.button>

// Card cliquable avec feedback
<motion.article
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.98, y: 0 }}
  transition={{ duration: 0.2 }}
  style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
>
  [Card]
</motion.article>
```

---

## 2. Formulaires mobile-optimisés

### Règles critiques pour mobile

```
1. font-size ≥ 16px sur tous les inputs — évite le zoom auto iOS Safari
2. width: 100% sur tous les inputs en mobile — jamais de largeur fixe
3. min-height: 48px sur inputs/selects — touch target confortable
4. type="email" → clavier email automatique
5. type="tel" → clavier numérique
6. inputMode="numeric" → chiffres sans clavier téléphone
7. autocomplete approprié → pré-remplissage et sécurité
8. Labels visibles — jamais de placeholder seul comme label
```

### Composant Input universel mobile-ready

```jsx
// components/ui/MobileInput.jsx
function MobileInput({
  label,
  type = 'text',
  name,
  placeholder,
  required,
  autoComplete,
  inputMode,
  error,
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label
        htmlFor={name}
        style={{
          fontSize: 'var(--text-small)',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-primary)', marginLeft: '2px' }} aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        style={{
          width: '100%',
          minHeight: '48px',             /* Touch target */
          padding: '0 1rem',
          fontSize: '1rem',              /* 16px — évite zoom iOS */
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          background: 'var(--bg-card, rgba(255,255,255,0.05))',
          border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 'var(--border-radius)',
          outline: 'none',
          transition: 'border-color 0.2s',
          WebkitTapHighlightColor: 'transparent',
          /* Focus visible accessible */
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.15)'; }}
        {...props}
      />
      {error && (
        <span
          id={`${name}-error`}
          role="alert"
          style={{ fontSize: 'var(--text-small)', color: '#ef4444' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
```

### Types d'input et claviers correspondants

```jsx
// Email
<input type="email" autoComplete="email" inputMode="email" />

// Téléphone
<input type="tel" autoComplete="tel" inputMode="tel" />

// Nombre
<input type="number" inputMode="numeric" pattern="[0-9]*" />

// Recherche
<input type="search" autoComplete="off" inputMode="search" />

// Nom complet
<input type="text" autoComplete="name" />

// Prénom / Nom séparés
<input type="text" autoComplete="given-name" />
<input type="text" autoComplete="family-name" />

// Adresse postale
<input type="text" autoComplete="street-address" />
<input type="text" autoComplete="postal-code" inputMode="numeric" />
```

### Textarea mobile-friendly

```jsx
<textarea
  name="message"
  rows={4}
  placeholder="Votre message..."
  style={{
    width: '100%',
    minHeight: '120px',
    padding: '0.75rem 1rem',
    fontSize: '1rem',         /* Évite zoom iOS */
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical',       /* Uniquement vertical — pas horizontal */
    /* Mêmes styles que MobileInput */
    background: 'var(--bg-card, rgba(255,255,255,0.05))',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
    WebkitTapHighlightColor: 'transparent',
  }}
/>
```

### Formulaire complet LeadForm mobile-ready

```jsx
// Utiliser avec react-hook-form + Zod (voir form-builder skill)
// Disposition mobile-first : toujours 1 colonne, puis 2 sur md+

function LeadFormLayout({ children }) {
  return (
    <form
      noValidate
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',         /* 1 col par défaut */
        gap: '1rem',
      }}
      className="md:grid-cols-2"            /* 2 cols sur tablette+ */
    >
      {/* Champ pleine largeur */}
      <div className="md:col-span-2">
        <MobileInput label="Nom complet" name="name" required autoComplete="name" />
      </div>

      {/* Côte à côte sur md+ */}
      <MobileInput label="Email" name="email" type="email" required autoComplete="email" />
      <MobileInput label="Téléphone" name="phone" type="tel" autoComplete="tel" />

      {/* Message pleine largeur */}
      <div className="md:col-span-2">
        {/* textarea ici */}
      </div>

      {/* RGPD + submit */}
      <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="rgpd"
            required
            style={{
              width: 20, height: 20,
              flexShrink: 0,
              marginTop: '2px',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}>
            J'accepte la{' '}
            <a href="/confidentialite" style={{ color: 'var(--color-primary)' }}>
              politique de confidentialité
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          style={{
            width: '100%',
            minHeight: 'var(--touch-min)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'var(--text-body)',
            borderRadius: '100px',
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Envoyer le message
        </button>
      </div>
    </form>
  );
}
```

---

## 3. Toast / notification mobile

```jsx
// Notification légère qui n'interfère pas avec le contenu
// Se place en haut sur mobile, en bas-droite sur desktop

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function Toast({ message, type = 'success', onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-live="polite"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          position: 'fixed',
          /* Mobile : haut centré — Desktop : bas droite */
          top: 'calc(var(--safe-top) + 1rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: '100px',
          fontWeight: 600,
          fontSize: 'var(--text-body)',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <span aria-hidden="true">{type === 'success' ? '✓' : '✕'}</span>
        {message}
        <button
          onClick={onClose}
          style={{
            marginLeft: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            minWidth: '24px', minHeight: '24px',
          }}
          aria-label="Fermer la notification"
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 4. Geste de swipe (carousel natif)

Préférer le scroll natif avec `scroll-snap` plutôt qu'une librairie de carousel.
Voir la section Témoignages dans `mobile-patterns.md` pour le pattern complet.

```css
/* Carousel scroll natif — performant et accessible */
.scroll-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.scroll-carousel::-webkit-scrollbar { display: none; }

.scroll-carousel > * {
  flex-shrink: 0;
  scroll-snap-align: start;
  width: min(85vw, 380px); /* S'adapte au viewport */
}
```

---

## 5. prefers-reduced-motion — accessibilité animations

Toujours respecter la préférence utilisateur :

```css
/* Dans variables.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Désactiver les fade-in — afficher directement */
  [data-animate="fade"] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

```jsx
// Dans les composants Framer Motion
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
    >
      [Contenu]
    </motion.div>
  );
}
```
