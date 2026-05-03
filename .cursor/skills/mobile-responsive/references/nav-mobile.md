# Navigation Mobile — Karibloom Reference

Navigation hamburger complète, accessible, animée Framer Motion. Copier-adapter pour chaque client.

Deux variantes disponibles selon la stack :
- **React SPA (Vite + React Router)** → section ci-dessous
- **Next.js App Router** → section "Variante Next.js" en bas du fichier

---

## Composant Header complet — React SPA (Vite + React Router)

```jsx
// components/layout/Header.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { href: '/',         label: 'Accueil' },
  { href: '/services', label: 'Services' },
  { href: '/about',    label: 'À propos' },
  { href: '/contact',  label: 'Contact' },
];

export default function Header() {
  const [isOpen, setIsOpen]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const { pathname }              = useLocation();
  const menuRef                   = useRef(null);
  const toggleRef                 = useRef(null);

  // Fermer le menu au changement de route
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Scroll pour le fond du header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquer le scroll body quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Focus trap dans le menu mobile
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const focusables = menuRef.current.querySelectorAll(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    const trap  = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    first?.focus();
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(o => !o), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? 'bg-[var(--glass-bg)] backdrop-blur-[12px] border-b border-white/10'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <nav
          className="container flex items-center justify-between"
          style={{ height: 'var(--header-height, 70px)' }}
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <Link
            to="/"
            className="font-bold text-xl text-[var(--color-primary)] z-10"
            aria-label="[Nom Client] — Accueil"
            onClick={() => setIsOpen(false)}
          >
            [LOGO ou NOM CLIENT]
          </Link>

          {/* Nav desktop — cachée sur mobile */}
          <ul className="hidden md:flex items-center gap-8 list-none" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  to={href}
                  className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${
                    pathname === href
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA desktop */}
          <Link
            to="/contact"
            className="hidden md:inline-flex btn-primary text-sm"
            style={{ minHeight: 'var(--touch-min)' }}
          >
            Nous contacter
          </Link>

          {/* Bouton hamburger — visible sur mobile uniquement */}
          <button
            ref={toggleRef}
            onClick={toggle}
            className="md:hidden z-10 flex flex-col justify-center items-center gap-[5px]"
            style={{
              width: 'var(--touch-min)',
              height: 'var(--touch-min)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {/* Les 3 lignes animées */}
            <motion.span
              animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'block',
                width: 22, height: 2,
                background: 'currentColor',
                borderRadius: 2,
                transformOrigin: 'center',
              }}
            />
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'block',
                width: 22, height: 2,
                background: 'currentColor',
                borderRadius: 2,
              }}
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'block',
                width: 22, height: 2,
                background: 'currentColor',
                borderRadius: 2,
                transformOrigin: 'center',
              }}
            />
          </button>
        </nav>
      </header>

      {/* ── MENU MOBILE (drawer) ─────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 40,
              }}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              ref={menuRef}
              id="mobile-menu"
              role="dialog"
              aria-label="Menu de navigation"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                top: 0, right: 0, bottom: 0,
                width: 'min(320px, 85vw)',
                background: 'var(--bg-card, #111118)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'calc(var(--safe-top) + 80px)',
                paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)',
                paddingInline: '1.5rem',
                overflowY: 'auto',
              }}
            >
              {/* Liens de navigation */}
              <nav aria-label="Menu mobile">
                <motion.ul
                  role="list"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  initial="closed"
                  animate="open"
                  variants={{
                    open:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                    closed: {},
                  }}
                >
                  {NAV_LINKS.map(({ href, label }) => (
                    <motion.li
                      key={href}
                      variants={{
                        open:   { opacity: 1, x: 0 },
                        closed: { opacity: 0, x: 24 },
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link
                        to={href}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: 'var(--touch-min)',
                          paddingBlock: '0.75rem',
                          fontSize: '1.125rem',
                          fontWeight: 500,
                          color: pathname === href
                            ? 'var(--color-primary)'
                            : 'var(--text-primary)',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        aria-current={pathname === href ? 'page' : undefined}
                      >
                        {label}
                        {pathname === href && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              width: 6, height: 6,
                              borderRadius: '50%',
                              background: 'var(--color-primary)',
                            }}
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>

              {/* CTA en bas du drawer */}
              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    minHeight: 'var(--touch-min)',
                    lineHeight: 'var(--touch-min)',
                  }}
                >
                  Nous contacter
                </Link>

                {/* Coordonnées rapides */}
                <div style={{
                  marginTop: '1.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <a href="tel:[TELEPHONE]" style={{ color: 'inherit', textDecoration: 'none' }}>
                    📞 [TELEPHONE]
                  </a>
                  <a href="mailto:[EMAIL]" style={{ color: 'inherit', textDecoration: 'none' }}>
                    ✉️ [EMAIL]
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## CSS Header à ajouter dans variables.css

```css
/* Header */
:root {
  --header-height: 70px;
}

/* Padding top automatique sur le contenu pour éviter le chevauchement */
main {
  padding-top: var(--header-height);
}

/* Sur les pages hero full-screen : compenser dans le héro plutôt que sur main */
.hero-no-padding-main + main {
  padding-top: 0;
}
```

---

## Variante : Bottom Navigation (apps / PWA)

Pour les sites de type app mobile avec navigation par icônes en bas :

```jsx
// components/layout/BottomNav.jsx — visible uniquement sur mobile
const BOTTOM_TABS = [
  { href: '/',         icon: '🏠', label: 'Accueil' },
  { href: '/services', icon: '💼', label: 'Services' },
  { href: '/contact',  icon: '📞', label: 'Contact' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-40"
      aria-label="Navigation principale"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 'var(--safe-bottom)',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOTTOM_TABS.length}, 1fr)`,
      }}
    >
      {BOTTOM_TABS.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            to={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '56px',
              gap: '4px',
              color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: '0.625rem',
              fontWeight: active ? 600 : 400,
              WebkitTapHighlightColor: 'transparent',
              textDecoration: 'none',
            }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## Variante Next.js App Router

Même logique que la variante React SPA. Seuls les imports de navigation changent :
- `Link` vient de `next/link` (pas de `react-router-dom`)
- `usePathname` vient de `next/navigation` (remplace `useLocation`)
- `href` est passé directement à `<Link>` (pas de prop `to`)

```jsx
// components/layout/Header.tsx  (ou .jsx)
'use client'; // Obligatoire — useState, useEffect, event handlers

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { href: '/',         label: 'Accueil' },
  { href: '/services', label: 'Services' },
  { href: '/about',    label: 'À propos' },
  { href: '/contact',  label: 'Contact' },
];

export default function Header() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname(); // ← Next.js
  const menuRef                 = useRef(null);
  const toggleRef               = useRef(null);

  // Fermer le menu au changement de route
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Scroll pour le fond du header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquer le scroll body quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Focus trap dans le menu mobile
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const focusables = menuRef.current.querySelectorAll(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    const trap  = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    first?.focus();
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(o => !o), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? 'bg-[var(--glass-bg)] backdrop-blur-[12px] border-b border-white/10'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <nav
          className="container flex items-center justify-between"
          style={{ height: 'var(--header-height, 70px)' }}
          aria-label="Navigation principale"
        >
          {/* Logo — next/link : prop href, pas to */}
          <Link
            href="/"
            className="font-bold text-xl text-[var(--color-primary)] z-10"
            aria-label="[Nom Client] — Accueil"
            onClick={() => setIsOpen(false)}
          >
            [LOGO ou NOM CLIENT]
          </Link>

          {/* Nav desktop */}
          <ul className="hidden md:flex items-center gap-8 list-none" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}  // ← href (Next.js), pas to
                  className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${
                    pathname === href
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA desktop */}
          <Link
            href="/contact"
            className="hidden md:inline-flex btn-primary text-sm"
            style={{ minHeight: 'var(--touch-min)' }}
          >
            Nous contacter
          </Link>

          {/* Bouton hamburger */}
          <button
            ref={toggleRef}
            onClick={toggle}
            className="md:hidden z-10 flex flex-col justify-center items-center gap-[5px]"
            style={{
              width: 'var(--touch-min)',
              height: 'var(--touch-min)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <motion.span
              animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transformOrigin: 'center' }}
            />
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2 }}
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transformOrigin: 'center' }}
            />
          </button>
        </nav>
      </header>

      {/* MENU MOBILE (drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
              aria-hidden="true"
            />

            <motion.div
              ref={menuRef}
              id="mobile-menu"
              role="dialog"
              aria-label="Menu de navigation"
              aria-modal="true"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(320px, 85vw)',
                background: 'var(--bg-card, #111118)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                zIndex: 50,
                display: 'flex', flexDirection: 'column',
                paddingTop: 'calc(var(--safe-top) + 80px)',
                paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)',
                paddingInline: '1.5rem',
                overflowY: 'auto',
                overscrollBehavior: 'contain', // Bloque le scroll parent (Chrome Android)
              }}
            >
              <nav aria-label="Menu mobile">
                <motion.ul
                  role="list"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  initial="closed"
                  animate="open"
                  variants={{
                    open:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                    closed: {},
                  }}
                >
                  {NAV_LINKS.map(({ href, label }) => (
                    <motion.li
                      key={href}
                      variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 24 } }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link
                        href={href}  // ← href (Next.js)
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center',
                          minHeight: 'var(--touch-min)',
                          paddingBlock: '0.75rem',
                          fontSize: '1.125rem', fontWeight: 500,
                          color: pathname === href ? 'var(--color-primary)' : 'var(--text-primary)',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        aria-current={pathname === href ? 'page' : undefined}
                      >
                        {label}
                        {pathname === href && (
                          <span
                            style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }}
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <Link
                  href="/contact"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary"
                  style={{ display: 'block', textAlign: 'center', minHeight: 'var(--touch-min)', lineHeight: 'var(--touch-min)' }}
                >
                  Nous contacter
                </Link>

                <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a href="tel:[TELEPHONE]" style={{ color: 'inherit', textDecoration: 'none' }}>📞 [TELEPHONE]</a>
                  <a href="mailto:[EMAIL]" style={{ color: 'inherit', textDecoration: 'none' }}>✉️ [EMAIL]</a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

### Bottom Nav — variante Next.js

```tsx
// components/layout/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BOTTOM_TABS = [
  { href: '/',         icon: '🏠', label: 'Accueil' },
  { href: '/services', icon: '💼', label: 'Services' },
  { href: '/contact',  icon: '📞', label: 'Contact' },
];

export function BottomNav() {
  const pathname = usePathname(); // ← Next.js

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-40"
      aria-label="Navigation principale"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 'var(--safe-bottom)',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOTTOM_TABS.length}, 1fr)`,
      }}
    >
      {BOTTOM_TABS.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}  // ← href (Next.js)
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '56px', gap: '4px',
              color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: '0.625rem', fontWeight: active ? 600 : 400,
              WebkitTapHighlightColor: 'transparent',
              textDecoration: 'none',
            }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```
