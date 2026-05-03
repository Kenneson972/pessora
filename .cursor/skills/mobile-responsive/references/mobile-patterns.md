# Mobile Patterns — Karibloom Reference

Patterns CSS + JSX responsive pour chaque type de section. Mobile-first, production-ready.

---

## 1. Typographie fluide

### Système complet à mettre dans variables.css

```css
:root {
  /* Fluide : clamp(min, préféré, max) — se lit comme du CSS natif */
  --text-hero:    clamp(2rem, 7vw + 0.5rem, 5rem);    /* 32px → 80px */
  --text-h2:      clamp(1.5rem, 4vw + 0.25rem, 2.75rem); /* 24px → 44px */
  --text-h3:      clamp(1.125rem, 2.5vw, 1.5rem);     /* 18px → 24px */
  --text-body:    clamp(0.9375rem, 1.5vw, 1.0625rem); /* 15px → 17px */
  --text-small:   clamp(0.8125rem, 1vw, 0.875rem);    /* 13px → 14px */
  --text-label:   clamp(0.75rem, 0.8vw, 0.8125rem);   /* 12px → 13px */
}

/* Application directe */
h1 { font-size: var(--text-hero);  line-height: 1.1; letter-spacing: -0.03em; }
h2 { font-size: var(--text-h2);   line-height: 1.2; letter-spacing: -0.02em; }
h3 { font-size: var(--text-h3);   line-height: 1.3; }
p, li, a, span { font-size: var(--text-body); line-height: 1.6; }
```

---

## 2. Grilles adaptatives

### Auto-fit (préféré — pas besoin de breakpoints)

```css
/* S'ajuste tout seul selon l'espace disponible */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: var(--gap-cards);
}

/* Variante pour les plus petites cards (stats, badges) */
.auto-grid--sm {
  grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
}
```

### Grille à colonnes fixes avec breakpoints Tailwind

```jsx
// 1 col mobile → 2 tablette → 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// 1 col mobile → 2 tablette → 4 desktop (stats, logos)
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// 1 col mobile → 2 desktop (contact, split)
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
```

---

## 3. Section FAQ — mobile responsive

```jsx
// FAQ accordion natif (HTML <details>) — zéro JS
function FAQSection({ items }) {
  return (
    <section className="faq-section" style={{ padding: 'var(--section-padding-y) 0' }}>
      <div className="container">
        <h2 className="section-title" data-animate="fade" style={{ fontSize: 'var(--text-h2)' }}>
          Questions fréquentes
        </h2>
        <div
          className="faq-list"
          style={{
            maxWidth: '720px',
            marginInline: 'auto',
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {items.map((item, i) => (
            <details
              key={i}
              className="faq-item glass-card"
              data-animate="fade"
              style={{
                borderRadius: 'var(--border-radius)',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 'var(--text-body)',
                  /* Touch target */
                  minHeight: 'var(--touch-min)',
                  WebkitTapHighlightColor: 'transparent',
                  listStyle: 'none', /* Cache le triangle natif */
                }}
              >
                <span>{item.q}</span>
                {/* Indicateur custom — CSS only */}
                <span
                  className="faq-chevron"
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginLeft: '1rem',
                    transition: 'transform 0.3s',
                    fontSize: '1rem',
                  }}
                >
                  ↓
                </span>
              </summary>
              <div style={{ padding: '0 1.25rem 1rem', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CSS pour la rotation du chevron */
/*
details[open] .faq-chevron { transform: rotate(180deg); }
details summary::-webkit-details-marker { display: none; }
*/
```

---

## 4. Timeline / Process — mobile responsive

```jsx
// Timeline qui passe en colonne sur mobile, ligne sur desktop
function Timeline({ steps }) {
  return (
    <div
      className="timeline"
      style={{
        display: 'grid',
        /* Mobile : 1 col, Desktop : autant de colonnes que d'étapes */
        gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
        gap: '1.5rem',
        position: 'relative',
      }}
    >
      {steps.map((step, i) => (
        <div
          key={i}
          className="timeline-step glass-card"
          data-animate="fade"
          style={{
            transitionDelay: `${i * 0.15}s`,
            padding: '1.5rem',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Numéro d'étape */}
          <div
            className="step-number"
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              marginInline: 'auto',
              marginBottom: '0.75rem',
            }}
          >
            {i + 1}
          </div>
          <span style={{ fontSize: '2rem' }} aria-hidden="true">{step.icon}</span>
          <h3 style={{ fontSize: 'var(--text-h3)', margin: '0.5rem 0 0.25rem' }}>{step.title}</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', margin: 0 }}>
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Section Témoignages — mobile responsive

```jsx
// Carousel mobile natif (scroll-snap) — pas de lib requise
function TestimonialsSection({ testimonials }) {
  return (
    <section style={{ padding: 'var(--section-padding-y) 0', overflow: 'hidden' }}>
      <div className="container">
        <h2 className="section-title" data-animate="fade" style={{ fontSize: 'var(--text-h2)' }}>
          Ce que disent nos clients
        </h2>

        {/* Scroll horizontal natif avec snap */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '1rem', /* espace pour la scrollbar */
            marginInline: 'calc(-1 * var(--container-px))', /* bord-à-bord */
            paddingInline: 'var(--container-px)',
            /* Cacher la scrollbar visuellement */
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          className="testimonials-track"
        >
          {testimonials.map((t, i) => (
            <article
              key={i}
              className="glass-card"
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                /* 85% viewport sur mobile, auto sur desktop */
                width: 'min(85vw, 380px)',
                padding: '1.5rem',
              }}
            >
              {/* Étoiles */}
              <div aria-label={`${t.rating} étoiles sur 5`} style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>
                {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
              </div>
              <blockquote style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{t.text}"
              </blockquote>
              <footer style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 40, height: 40,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#fff', fontSize: '1rem',
                  }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <cite style={{ fontStyle: 'normal', fontWeight: 600, fontSize: 'var(--text-body)' }}>
                    {t.name}
                  </cite>
                  <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)', margin: 0 }}>
                    {t.role}
                  </p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CSS pour cacher la scrollbar */
/*
.testimonials-track::-webkit-scrollbar { display: none; }
*/
```

---

## 6. Section CTA — mobile responsive

```jsx
function CTASection({ title, subtitle, cta, href }) {
  return (
    <section
      className="cta-box"
      style={{
        padding: 'var(--section-padding-y) var(--container-px)',
        textAlign: 'center',
      }}
    >
      <div
        className="container"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(2rem, 6vw, 4rem)',
        }}
      >
        <h2
          data-animate="fade"
          style={{
            fontSize: 'var(--text-h2)',
            color: '#fff',
            maxWidth: '50ch',
            marginInline: 'auto',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            data-animate="fade"
            style={{
              fontSize: 'var(--text-body)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '45ch',
              marginInline: 'auto',
              marginTop: '0.75rem',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* CTA — pleine largeur sur mobile */}
        <a
          href={href || '/contact'}
          data-animate="fade"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1.5rem',
            minHeight: 'var(--touch-min)',
            paddingInline: '2rem',
            background: '#fff',
            color: 'var(--color-primary)',
            borderRadius: '100px',
            fontWeight: 700,
            fontSize: 'var(--text-body)',
            textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
            /* Mobile full-width, auto sur sm+ */
            width: '100%',
            maxWidth: '320px',
          }}
          className="sm:w-auto"
        >
          {cta}
        </a>
      </div>
    </section>
  );
}
```

---

## 7. Pricing cards — mobile responsive

```jsx
function PricingSection({ plans }) {
  return (
    <section style={{ padding: 'var(--section-padding-y) 0' }}>
      <div className="container">
        <h2 className="section-title" style={{ fontSize: 'var(--text-h2)' }} data-animate="fade">
          Nos tarifs
        </h2>

        {/* 1 col mobile → 3 cols lg */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {plans.map((plan, i) => (
            <article
              key={i}
              className="glass-card"
              data-animate="fade"
              style={{
                transitionDelay: `${i * 0.1}s`,
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                border: plan.featured ? `2px solid var(--color-primary)` : undefined,
                position: 'relative',
              }}
            >
              {plan.featured && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: 'var(--text-small)',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⭐ Populaire
                </span>
              )}

              <h3 style={{ fontSize: 'var(--text-h3)' }}>{plan.name}</h3>
              <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {plan.tagline}
              </p>

              {/* Prix */}
              <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '1rem', color: 'var(--color-primary)' }}>
                {plan.price}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                  {plan.period}
                </span>
              </p>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', flexGrow: 1 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.4rem 0',
                    fontSize: 'var(--text-body)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden="true">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaLink || '/contact'}
                className={plan.featured ? 'btn-primary' : 'btn-secondary'}
                style={{ minHeight: 'var(--touch-min)', textAlign: 'center', lineHeight: 'var(--touch-min)' }}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 8. Images responsives

### Règle universelle

```css
/* Dans variables.css — images responsives par défaut */
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### Picture element (art direction)

```jsx
// Image différente selon le breakpoint
<picture>
  <source media="(min-width: 1024px)" srcSet="/img/hero-desktop.webp" />
  <source media="(min-width: 640px)"  srcSet="/img/hero-tablet.webp" />
  <img
    src="/img/hero-mobile.webp"
    alt="[Description accessible]"
    width="390" height="500"  /* Évite le layout shift */
    loading="eager"           /* Hero = eager, reste = lazy */
    decoding="async"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
</picture>
```

### Image de card avec hauteur fixe

```jsx
<div style={{
  width: '100%',
  height: 'clamp(180px, 30vw, 280px)', /* Hauteur fluide */
  overflow: 'hidden',
  borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
}}>
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
</div>
```
