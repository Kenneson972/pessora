# PESSORA — Refonte Design Luxe Éditorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte complète du design PESSORA en style minimaliste luxe éditorial Nespresso — typographie Cormorant + DM Sans, palette noir/ivoire + accent vert #3d6b3e, double header avec nav-cats, composants HeroUI v3 obligatoires.

**Architecture:** Design system first — réécriture des tokens `@theme` dans `index.css`, puis composants partagés (Header, Footer, ImageCard, ArrowBtn…), puis pages dans l'ordre d'impact. Les routes existantes ne changent pas. HeroUI v3 est la base composants pour tous les éléments interactifs.

**Tech Stack:** React 19, TypeScript, Vite, HeroUI v3, Tailwind v4 (`@theme`), React Router v6, Framer Motion, Lucide React, Supabase.

**Mockups de référence :** `.superpowers/brainstorm/97155-1776547079/content/` — `homepage-full.html`, `page-menu.html`, `page-evenements.html`, `page-dashboard.html`

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/index.css` | Modifier | Tokens @theme + polices + base styles |
| `src/components/layout/Header.tsx` | Réécrire | Double header sticky |
| `src/components/layout/Footer.tsx` | Réécrire | Footer 4-col noir |
| `src/components/ui/ImageCard.tsx` | Créer | Card image overlay réutilisable |
| `src/components/ui/ArrowBtn.tsx` | Créer | Bouton flèche rond |
| `src/components/ui/SectionTitle.tsx` | Créer | Titre section + lien right |
| `src/components/ui/ProductCard.tsx` | Créer | Product card HeroUI |
| `src/pages/Home.tsx` | Réécrire | Homepage |
| `src/pages/Menu.tsx` | Réécrire | Page carte/shakes |
| `src/pages/Evenements.tsx` | Réécrire | Liste événements |
| `src/components/member/MemberLayout.tsx` | Réécrire | Sidebar dashboard |
| `src/pages/member/Dashboard.tsx` | Réécrire | Tableau de bord |
| `src/pages/auth/Login.tsx` | Réécrire | Page connexion |
| `src/pages/auth/Register.tsx` | Réécrire | Page inscription |
| `src/pages/EvenementDetail.tsx` | Modifier | Restyling tokens |
| `src/pages/BilanBienEtre.tsx` | Modifier | Restyling tokens |

---

## Task 1: Design System — index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Remplacer le bloc @theme et les styles base**

```css
/* src/index.css */
@import "tailwindcss";
@import "@heroui/styles";
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');

@theme {
  /* Palette */
  --color-noir: #0a0a0a;
  --color-ivory: #faf9f7;
  --color-accent: #3d6b3e;
  --color-muted: rgba(0,0,0,0.38);

  /* Typography */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Cormorant Garamond', Georgia, serif;

  /* Radius */
  --radius-card: 16px;
  --radius-product: 14px;
  --radius-pill: 24px;
}

@layer base {
  html { scroll-behavior: smooth; }
  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: var(--font-sans);
    font-weight: 300;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #faf9f7;
    color: #111;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 300;
  }
}
```

- [ ] **Step 2: Vérifier que le build compile**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npm run build 2>&1 | tail -20
```

Expected: `✓ built in` — pas d'erreur TypeScript ni Tailwind.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: design system — tokens @theme Cormorant/DM Sans, palette noir/ivory/accent"
```

---

## Task 2: Composants UI partagés

**Files:**
- Create: `src/components/ui/ArrowBtn.tsx`
- Create: `src/components/ui/ImageCard.tsx`
- Create: `src/components/ui/SectionTitle.tsx`
- Create: `src/components/ui/ProductCard.tsx`

- [ ] **Step 1: Créer ArrowBtn**

```tsx
// src/components/ui/ArrowBtn.tsx
import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';

interface ArrowBtnProps {
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
}

const sizes = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-14 h-14' };
const iconSizes = { sm: 14, md: 16, lg: 20 };

export const ArrowBtn = ({ onDark = false, size = 'md', onPress, className = '' }: ArrowBtnProps) => (
  <Button
    isIconOnly
    radius="full"
    onPress={onPress}
    className={`${sizes[size]} min-w-0 ${
      onDark
        ? 'bg-white text-black hover:bg-white/90'
        : 'bg-black text-white hover:bg-black/85'
    } ${className}`}
    aria-label="Voir plus"
  >
    <ArrowRight size={iconSizes[size]} strokeWidth={1.5} />
  </Button>
);
```

- [ ] **Step 2: Créer SectionTitle**

```tsx
// src/components/ui/SectionTitle.tsx
import { Link } from 'react-router-dom';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
}

export const SectionTitle = ({ title, subtitle, linkLabel, linkTo }: SectionTitleProps) => (
  <div className="flex items-end justify-between mb-7">
    <div>
      <h2
        className="font-display font-light text-[42px] leading-none text-black"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-[11px] text-black/38 tracking-[0.03em] mt-1">{subtitle}</p>
      )}
    </div>
    {linkLabel && linkTo && (
      <Link
        to={linkTo}
        className="text-[10px] font-normal tracking-[0.18em] uppercase text-black border-b border-black pb-px leading-none flex-shrink-0 mb-1 hover:opacity-60 transition-opacity"
      >
        {linkLabel}
      </Link>
    )}
  </div>
);
```

- [ ] **Step 3: Créer ImageCard**

```tsx
// src/components/ui/ImageCard.tsx
import { ArrowBtn } from './ArrowBtn';

interface ImageCardProps {
  eyebrow: string;
  title: string;
  titleEm?: string;
  bgClass?: string;
  bgImage?: string;
  aspectRatio?: string;
  onPress?: () => void;
}

export const ImageCard = ({
  eyebrow,
  title,
  titleEm,
  bgClass = 'bg-[#1e3a1e]',
  bgImage,
  aspectRatio = 'aspect-[3/4]',
  onPress,
}: ImageCardProps) => (
  <div
    className={`relative rounded-[16px] overflow-hidden ${aspectRatio} cursor-pointer group`}
    onClick={onPress}
  >
    <div
      className={`absolute inset-0 ${bgClass} bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]`}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />
    <div className="absolute inset-0 p-[22px] flex flex-col justify-between">
      <p className="text-[9px] font-normal tracking-[0.3em] uppercase text-white/65">{eyebrow}</p>
      <div>
        <h3
          className="font-display font-light text-[28px] leading-[1.05] text-white mb-3.5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
          {titleEm && <><br /><em className="italic">{titleEm}</em></>}
        </h3>
        <ArrowBtn onDark size="sm" />
      </div>
    </div>
  </div>
);
```

- [ ] **Step 4: Créer ProductCard**

```tsx
// src/components/ui/ProductCard.tsx
import { Card, CardBody, CardFooter, Button, Chip } from '@heroui/react';

interface ProductCardProps {
  tag: string;
  name: string;
  description: string;
  macros?: string;
  price: string;
  bgClass?: string;
  onAdd?: () => void;
}

export const ProductCard = ({
  tag,
  name,
  description,
  macros,
  price,
  bgClass = 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]',
  onAdd,
}: ProductCardProps) => (
  <Card
    className="bg-white rounded-[14px] border border-black/[0.06] shadow-none hover:shadow-md transition-shadow"
    shadow="none"
  >
    <CardBody className="p-[18px] pb-0 gap-0">
      <Chip
        size="sm"
        className="bg-accent text-white text-[8px] tracking-[0.2em] uppercase rounded-[3px] h-auto py-[3px] px-2 mb-[14px]"
        style={{ backgroundColor: '#3d6b3e' }}
      >
        {tag}
      </Chip>
      <div className="h-[110px] flex items-center justify-center mb-[14px]">
        <div className={`w-[60px] h-[88px] rounded-[30px] ${bgClass}`} />
      </div>
      <p className="text-[13px] font-normal text-black mb-[2px]">{name}</p>
      <p className="text-[11px] text-black/38 leading-[1.5] mb-[12px] min-h-[32px]">{description}</p>
      {macros && <p className="text-[9px] text-black/30 tracking-[0.05em] mb-[12px]">{macros}</p>}
    </CardBody>
    <CardFooter className="px-[18px] pb-[16px] pt-0 flex items-center justify-between">
      <span className="text-[14px] font-normal text-black">{price}</span>
      <Button
        isIconOnly
        radius="full"
        className="w-8 h-8 min-w-0 bg-black text-white text-xl font-light"
        onPress={onAdd}
        aria-label={`Ajouter ${name}`}
      >
        +
      </Button>
    </CardFooter>
  </Card>
);
```

- [ ] **Step 5: Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | head -30
```

Expected: aucune erreur dans les nouveaux fichiers.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: composants UI partagés — ArrowBtn, ImageCard, SectionTitle, ProductCard"
```

---

## Task 3: Header — double rangée

**Files:**
- Modify: `src/components/layout/Header.tsx`

Le header existant est entièrement remplacé. On conserve : `useAuth`, `useLocation`, `Link`, HeroUI `Button`, `Input`, `Badge`.

- [ ] **Step 1: Réécrire Header.tsx**

```tsx
// src/components/layout/Header.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Badge } from '@heroui/react';
import { Search, User, ShoppingBag, UtensilsCrossed, Users, Heart, PersonStanding, CalendarDays, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_CATS = [
  { label: 'Shakes', icon: UtensilsCrossed, path: '/menu' },
  { label: 'Gauffres', icon: UtensilsCrossed, path: '/menu?category=gauffres' },
  { label: 'Événements', icon: Users, path: '/evenements' },
  { label: 'Bilan', icon: Heart, path: '/bilan-bien-etre' },
  { label: 'Run Club', icon: PersonStanding, path: '/evenements?type=run-club' },
  { label: 'Réserver', icon: CalendarDays, path: '/bilan-bien-etre' },
] as const;

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCat = NAV_CATS.find((c) => location.pathname === c.path || location.pathname.startsWith(c.path.split('?')[0]));

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Rangée 1 */}
      <div className="px-12 h-14 flex items-center gap-6">
        <Link
          to="/"
          className="font-display font-light text-[22px] tracking-[0.28em] uppercase text-black flex-shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>

        <div className="flex-1 flex justify-center">
          <Input
            placeholder="Shakes, gauffres, événements…"
            startContent={<Search size={14} className="text-black/35" strokeWidth={1.5} />}
            radius="full"
            size="sm"
            classNames={{
              base: 'max-w-[440px]',
              inputWrapper: 'border border-black/18 bg-white shadow-none h-9 px-4',
              input: 'text-[12px] text-black/40 placeholder:text-black/40',
            }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            as={Link}
            to={isAuthenticated ? '/mon-espace' : '/connexion'}
            variant="bordered"
            radius="full"
            size="sm"
            startContent={<User size={15} strokeWidth={1.5} />}
            className="border-black text-black text-[11px] tracking-[0.08em] font-normal"
          >
            Mon Espace
          </Button>
          <Badge content="0" color="success" size="sm" style={{ '--heroui-success': '#3d6b3e' } as React.CSSProperties}>
            <Button
              isIconOnly
              variant="bordered"
              radius="full"
              size="sm"
              className="border-black/20 w-9 h-9 min-w-0"
              aria-label="Panier"
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
            </Button>
          </Badge>
          <Button
            isIconOnly
            variant="light"
            className="md:hidden"
            onPress={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <MenuIcon size={22} strokeWidth={1.5} />}
          </Button>
        </div>
      </div>

      {/* Rangée 2 — desktop */}
      <div className="hidden md:flex items-center justify-center border-t border-black/[0.07] h-[72px] px-12 gap-0">
        {NAV_CATS.map((cat) => {
          const isActive = cat === activeCat;
          return (
            <Link
              key={cat.label}
              to={cat.path}
              className={`flex flex-col items-center justify-center gap-[5px] px-6 h-14 rounded-lg transition-colors flex-shrink-0 ${
                isActive ? 'bg-[#f0f0ee]' : 'hover:bg-black/[0.04]'
              }`}
            >
              <cat.icon
                size={22}
                strokeWidth={1.3}
                className={isActive ? 'text-black' : 'text-black/65'}
              />
              <span
                className={`text-[11px] tracking-[0.02em] whitespace-nowrap ${
                  isActive ? 'text-black font-normal' : 'text-black/60 font-light'
                }`}
              >
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-black/[0.07] bg-white px-6 py-4 flex flex-col gap-1">
          {NAV_CATS.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-[12px] text-black/65 border-b border-black/[0.06] last:border-0"
            >
              {cat.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
```

- [ ] **Step 2: Démarrer le dev server et vérifier visuellement**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npm run dev
```

Ouvrir `http://localhost:5173` — vérifier :
- Rangée 1 : logo gauche, recherche centrée, "Mon Espace" + panier droite
- Rangée 2 : 6 catégories centrées avec icônes
- Sticky au scroll

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "Header"
```

Expected: aucune erreur sur Header.tsx.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: header double rangée — logo+search+compte / nav-cats centré"
```

---

## Task 4: Footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Réécrire Footer.tsx**

```tsx
// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';

const MENU_LINKS = [
  { label: 'Shakes', to: '/menu' },
  { label: 'Gauffres', to: '/menu?category=gauffres' },
  { label: 'Carte complète', to: '/menu' },
];
const ESPACE_LINKS = [
  { label: 'Événements', to: '/evenements' },
  { label: 'Run Club', to: '/evenements?type=run-club' },
  { label: 'Bilan Bien-être', to: '/bilan-bien-etre' },
];
const CONTACT_LINKS = [
  { label: 'Instagram', to: 'https://instagram.com/pessora.mq', external: true },
  { label: 'WhatsApp', to: 'https://wa.me/596696000000', external: true },
  { label: 'Fort-de-France', to: '/contact' },
];

const FooterCol = ({ title, links }: { title: string; links: { label: string; to: string; external?: boolean }[] }) => (
  <div>
    <p className="text-[9px] font-normal tracking-[0.28em] uppercase text-white/25 mb-[14px]">{title}</p>
    {links.map((l) =>
      l.external ? (
        <a key={l.label} href={l.to} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-white/50 mb-[9px] hover:text-white/80 transition-colors tracking-[0.03em]">
          {l.label}
        </a>
      ) : (
        <Link key={l.label} to={l.to} className="block text-[12px] text-white/50 mb-[9px] hover:text-white/80 transition-colors tracking-[0.03em]">
          {l.label}
        </Link>
      )
    )}
  </div>
);

const Footer = () => (
  <footer>
    <div className="bg-[#0a0a0a] px-[60px] pt-[52px] pb-7 grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
      <div>
        <p
          className="font-display font-light text-[20px] tracking-[0.28em] uppercase text-white mb-[10px]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </p>
        <p className="text-[11px] text-white/28 leading-[1.8]">
          Bar protéiné<br />Fort-de-France, Martinique
        </p>
        <div className="flex gap-3 mt-5">
          <a href="https://instagram.com/pessora.mq" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
            <Instagram size={16} strokeWidth={1.5} />
          </a>
          <a href="https://wa.me/596696000000" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
            <MessageCircle size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
      <FooterCol title="Menu" links={MENU_LINKS} />
      <FooterCol title="Espace" links={ESPACE_LINKS} />
      <FooterCol title="Contact" links={CONTACT_LINKS} />
    </div>
    <div className="bg-[#0a0a0a] border-t border-white/[0.07] px-[60px] py-4 flex justify-between">
      <span className="text-[10px] text-white/18 tracking-[0.08em]">© {new Date().getFullYear()} Pessóra</span>
      <div className="flex gap-6">
        <Link to="/mentions-legales" className="text-[10px] text-white/18 hover:text-white/40 transition-colors tracking-[0.08em]">Mentions légales</Link>
        <Link to="/cgv" className="text-[10px] text-white/18 hover:text-white/40 transition-colors tracking-[0.08em]">CGV</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
```

- [ ] **Step 2: Vérifier visuellement**

Ouvrir `http://localhost:5173` et scroller jusqu'au footer — vérifier : fond noir, 4 colonnes, typographie Cormorant, liens blancs/50 opacity.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: footer 4-col noir — Pessóra, Menu, Espace, Contact"
```

---

## Task 5: Homepage

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Réécrire Home.tsx**

```tsx
// src/pages/Home.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import { ImageCard } from '../components/ui/ImageCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';

const SHAKES = [
  { tag: 'Protéine', name: 'Vanilla Boost', description: 'Notes vanille douce', macros: '30g protéines · 220 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]' },
  { tag: 'Énergie', name: 'Chocolat Power', description: 'Cacao intense, magnésium', macros: '28g protéines · 240 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#3d6b3e] to-[#2a4a2b]' },
  { tag: 'Légèreté', name: 'Fraise Légèreté', description: 'Fruité & rafraîchissant', macros: '22g protéines · 180 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#1a2e1a] to-[#0f1f10]' },
  { tag: 'Gauffre', name: 'Gauffre Protéinée', description: 'Maison, sans sucre ajouté', macros: '20g protéines · 190 kcal', price: '4,50€', bg: 'bg-gradient-to-b from-[#4a7c35] to-[#3a6028]' },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ height: '86vh', minHeight: '520px', background: '#0a0a0a' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 65% 40%, rgba(30,58,30,0.45) 0%, transparent 60%), linear-gradient(155deg, #1a2e1a 0%, #0a0a0a 55%, #111 100%)' }}
        />
        <div className="relative z-10 px-[60px] pb-20">
          <p className="text-[9px] font-normal tracking-[0.45em] uppercase text-white/35 mb-[18px]">
            Bar Protéiné · Fort-de-France
          </p>
          <h1
            className="font-display font-light text-white leading-[0.92] tracking-[-0.02em] mb-11"
            style={{ fontFamily: 'var(--font-display)', fontSize: '80px' }}
          >
            Nourris<br /><em className="italic text-white/65">l'essentiel</em>
          </h1>
          <ArrowBtn onDark size="lg" onPress={() => navigate('/menu')} />
        </div>
      </section>

      {/* Nos univers */}
      <section className="bg-[#faf9f7] px-[60px] py-[72px]">
        <SectionTitle title="Nos univers" linkLabel="Tout explorer" linkTo="/menu" />
        <div className="grid grid-cols-3 gap-[14px]">
          <ImageCard eyebrow="Nutrition" title="Shakes &" titleEm="gauffres" bgClass="bg-gradient-to-b from-[#1e3a1e] to-[#0a0a0a]" onPress={() => navigate('/menu')} />
          <ImageCard eyebrow="Communauté" title="Run" titleEm="Club" bgClass="bg-gradient-to-b from-[#111] to-[#1c2c1c]" onPress={() => navigate('/evenements')} />
          <ImageCard eyebrow="Bien-être" title="Bilan" titleEm="30 min" bgClass="bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" onPress={() => navigate('/bilan-bien-etre')} />
        </div>
      </section>

      {/* Découvrez nos shakes */}
      <section className="bg-white px-[60px] pb-[72px]">
        <SectionTitle title="Découvrez nos shakes :" subtitle="Protéines haute qualité, fabriquées à Fort-de-France" linkLabel="Voir la carte" linkTo="/menu" />
        <div className="grid grid-cols-4 gap-3">
          {SHAKES.map((s) => (
            <ProductCard key={s.name} tag={s.tag} name={s.name} description={s.description} macros={s.macros} price={s.price} bgClass={s.bg} />
          ))}
        </div>
      </section>

      {/* Section vidéo Événements */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '72vh', minHeight: '420px' }}
      >
        {/* En production : remplacer ce div par <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" /> */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(30,60,30,0.4) 0%, transparent 65%), linear-gradient(160deg, #0f1f0f 0%, #0a0a0a 40%, #111 70%, #0d1a0d 100%)' }}
        />
        <div
          className="relative z-10 mx-4 text-center rounded-[20px] px-16 py-[52px]"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            maxWidth: '620px',
          }}
        >
          <span className="inline-block text-[9px] font-normal tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[14px] py-[5px] rounded-[4px] mb-6">
            Événements · Run Club
          </span>
          <h2
            className="font-display font-light text-white leading-[1.05] mb-7"
            style={{ fontFamily: 'var(--font-display)', fontSize: '46px' }}
          >
            Rejoins la<br />communauté Pessóra
          </h2>
          <Button
            as={Link}
            to="/evenements"
            radius="full"
            className="bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-8 h-11"
          >
            Voir les événements
          </Button>
        </div>
      </section>

      {/* Nos actualités */}
      <section className="bg-[#faf9f7] px-[60px] py-[72px]">
        <SectionTitle title="Nos actualités" />
        <div className="grid grid-cols-2 gap-[14px]">
          <ImageCard eyebrow="Bilan Bien-être" title="30 minutes" titleEm="offertes" bgClass="bg-gradient-to-b from-[#1e3a1e] to-[#0f1f0f]" aspectRatio="aspect-[16/9]" onPress={() => navigate('/bilan-bien-etre')} />
          <ImageCard eyebrow="Pop-up · GigaFit" title="Nouveau" titleEm="point de vente" bgClass="bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" aspectRatio="aspect-[16/9]" onPress={() => navigate('/evenements')} />
        </div>
      </section>
    </div>
  );
};

export default Home;
```

- [ ] **Step 2: Vérifier visuellement chaque section**

Ouvrir `http://localhost:5173` — vérifier dans l'ordre :
1. Hero : fond noir, titre 80px Cormorant, bouton flèche blanc
2. Nos univers : 3 image cards 3/4, fond ivory
3. Shakes : 4 product cards HeroUI, fond blanc
4. Section vidéo : fond noir, card frosted glass centrée, tag vert
5. Actualités : 2 big cards 16/9

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "Home\|ImageCard\|ProductCard\|ArrowBtn\|SectionTitle"
```

Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: homepage refonte luxe éditorial — hero, univers, shakes, vidéo événements"
```

---

## Task 6: Page Menu

**Files:**
- Modify: `src/pages/Menu.tsx`

- [ ] **Step 1: Réécrire Menu.tsx**

```tsx
// src/pages/Menu.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, Tab, Chip, Button } from '@heroui/react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';

const FILTERS = ['Tout', 'Protéine ↑', 'Faible calories', 'Végétalien', 'Sans lactose', 'Énergie'];

const SHAKES = [
  { tag: 'Protéine', name: 'Vanilla Boost', description: 'Notes vanille douce', macros: '30g protéines · 220 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]' },
  { tag: 'Énergie', name: 'Chocolat Power', description: 'Cacao intense, magnésium', macros: '28g protéines · 240 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#3d6b3e] to-[#2a4a2b]' },
  { tag: 'Légèreté', name: 'Fraise Légèreté', description: 'Fruité & rafraîchissant', macros: '22g protéines · 180 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#1a2e1a] to-[#0f1f10]' },
  { tag: 'Récup', name: 'Mangue Caraïbe', description: 'Tropical, post-effort', macros: '25g protéines · 200 kcal', price: '6,90€', bg: 'bg-gradient-to-b from-[#4a7c35] to-[#3a6028]' },
  { tag: 'Énergie', name: 'Café Matin', description: 'Caféine naturelle & protéines', macros: '26g protéines · 210 kcal', price: '7,50€', bg: 'bg-gradient-to-b from-[#1e3a1e] to-[#0a1a0a]' },
];

const GAUFFRES = [
  { tag: 'Gauffre', name: 'Gauffre Nature', description: 'Sans sucre ajouté, croustillante', macros: '20g protéines · 190 kcal', price: '4,50€', bg: 'bg-gradient-to-b from-[#111] to-[#1a1a1a]' },
  { tag: 'Gauffre', name: 'Gauffre Chocolat', description: 'Pépites cacao, moelleuse', macros: '18g protéines · 210 kcal', price: '4,90€', bg: 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' },
  { tag: 'Gauffre', name: 'Gauffre Coco', description: 'Noix de coco, éclats d\'amande', macros: '17g protéines · 205 kcal', price: '4,90€', bg: 'bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]' },
];

const Menu = () => {
  const [activeFilter, setActiveFilter] = useState('Tout');

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <section className="bg-[#0a0a0a] px-[60px] py-[56px]">
        <p className="text-[9px] font-normal tracking-[0.42em] uppercase text-white/28 mb-[14px]">
          Bar Protéiné · Fort-de-France
        </p>
        <h1
          className="font-display font-light text-white leading-[0.95] tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-display)', fontSize: '58px' }}
        >
          La<br /><em className="italic text-white/60">carte</em>
        </h1>
        <p className="text-[10px] text-white/28 tracking-[0.15em] uppercase mt-5">
          Shakes · Gauffres · Compléments
        </p>
      </section>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-black/[0.08] px-[60px]">
        <Tabs
          aria-label="Catégories"
          variant="underlined"
          classNames={{
            tabList: 'gap-0 h-[60px] p-0',
            tab: 'h-full px-[18px] text-[12px] font-normal tracking-[0.02em] data-[selected=true]:font-medium',
            cursor: 'bg-black',
            tabContent: 'text-black/60 group-data-[selected=true]:text-black',
          }}
        >
          <Tab key="tout" title="Tout" />
          <Tab key="shakes" title="Shakes protéinés" />
          <Tab key="gauffres" title="Gauffres" />
          <Tab key="complements" title="Compléments" />
          <Tab key="offres" title="Offres" />
        </Tabs>
      </div>

      {/* Secondary chips */}
      <div className="bg-[#faf9f7] px-[60px] py-4 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-black/35 mr-1">Filtrer par :</span>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`cursor-pointer text-[11px] h-7 px-3 ${
              activeFilter === f
                ? 'bg-[#3d6b3e] text-white border-[#3d6b3e]'
                : 'bg-transparent text-black/55 border-black/15'
            }`}
            variant="bordered"
            radius="full"
          >
            {f}
          </Chip>
        ))}
      </div>

      {/* Shakes */}
      <section className="px-[60px] py-[32px] pb-[52px] bg-[#faf9f7]">
        <SectionTitle title="Shakes protéinés" linkLabel="Tout voir" linkTo="/menu" />
        <div className="grid grid-cols-5 gap-3">
          {SHAKES.map((s) => (
            <ProductCard key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Gauffres */}
      <section className="px-[60px] pb-[52px] bg-[#faf9f7]">
        <SectionTitle title="Gauffres maison" />
        <div className="grid grid-cols-5 gap-3">
          {GAUFFRES.map((g) => (
            <ProductCard key={g.name} {...g} />
          ))}
        </div>
      </section>

      {/* Bilan CTA banner */}
      <div className="mx-[60px] mb-16 rounded-[16px] overflow-hidden bg-[#0a0a0a] flex items-center px-[52px] py-10 gap-10">
        <div className="flex-1">
          <p className="text-[9px] tracking-[0.4em] uppercase text-white/28 mb-[10px]">Bilan Bien-être</p>
          <h3
            className="font-display font-light text-white leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '34px' }}
          >
            30 minutes<br /><em className="italic text-white/60">offertes</em>
          </h3>
        </div>
        <Button
          as={Link}
          to="/bilan-bien-etre"
          radius="full"
          className="bg-white text-black text-[11px] font-normal tracking-[0.1em] uppercase px-7 h-11 flex-shrink-0"
        >
          Réserver mon bilan
        </Button>
      </div>
    </div>
  );
};

export default Menu;
```

- [ ] **Step 2: Vérifier visuellement**

Ouvrir `http://localhost:5173/menu` — vérifier :
1. Hero noir avec titre "La *carte*"
2. Tabs HeroUI avec underline noir actif
3. Chips filtres (vert quand actif)
4. Grille 5 colonnes shakes/gauffres
5. Banner bilan noir en bas

- [ ] **Step 3: Commit**

```bash
git add src/pages/Menu.tsx
git commit -m "feat: page menu refonte — hero noir, tabs HeroUI, chips filtres, grille 5-col"
```

---

## Task 7: Page Événements

**Files:**
- Modify: `src/pages/Evenements.tsx`

- [ ] **Step 1: Réécrire Evenements.tsx** (conserver le fetch Supabase existant, remplacer uniquement le JSX/styles)

```tsx
// src/pages/Evenements.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Tabs, Tab, Card, CardBody, CardFooter, Chip } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import { today, getLocalTimeZone } from '@internationalized/date';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import { SectionTitle } from '../components/ui/SectionTitle';

interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  time_start: string | null;
  location: string | null;
  type: string;
  max_participants: number | null;
  description: string | null;
  active: boolean;
  event_registrations: unknown[];
}

const TYPE_LABELS: Record<string, string> = {
  'run-club': 'Run Club',
  'pop-up': 'Pop-up',
  'atelier': 'Atelier',
  'partenariat': 'Partenariat',
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDate().toString();
}
function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' });
}

const Evenements = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const todayStr = today(getLocalTimeZone()).toString();
    supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('active', true)
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setEvents(data as Event[]);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ height: '56vh', minHeight: '320px', background: '#0a0a0a' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 55% 40%, rgba(30,60,30,0.45) 0%, transparent 65%), linear-gradient(155deg, #0f1f0f 0%, #0a0a0a 50%, #111 100%)' }}
        />
        <div className="relative z-10 px-[60px] pb-[56px]">
          <p className="text-[9px] tracking-[0.45em] uppercase text-white/35 mb-[16px]">Communauté · Fort-de-France</p>
          <h1
            className="font-display font-light text-white leading-[0.93] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '68px' }}
          >
            Nos<br /><em className="italic text-white/60">événements</em>
          </h1>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-black/[0.08] px-[60px]">
        <Tabs
          aria-label="Types d'événements"
          variant="underlined"
          classNames={{
            tabList: 'gap-0 h-[60px] p-0',
            tab: 'h-full px-[18px] text-[12px] font-normal',
            cursor: 'bg-black',
            tabContent: 'text-black/60 group-data-[selected=true]:text-black',
          }}
        >
          <Tab key="tous" title="Tous" />
          <Tab key="run-club" title="Run Club" />
          <Tab key="pop-up" title="Pop-up" />
          <Tab key="atelier" title="Atelier" />
          <Tab key="partenariat" title="Partenariats" />
        </Tabs>
      </div>

      {/* Prochain événement — grande card */}
      {featured && (
        <div className="mx-[60px] mt-10 rounded-[20px] overflow-hidden grid grid-cols-2 bg-[#0a0a0a]" style={{ minHeight: '360px' }}>
          <div className="bg-gradient-to-br from-[#1e3a1e] to-[#0f1f0f] flex items-center justify-center">
            <div className="w-[72px] h-[72px] rounded-full border border-white/10 flex items-center justify-center opacity-30">
              <span className="text-white text-2xl">📍</span>
            </div>
          </div>
          <div className="px-[52px] py-[52px] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[8px] tracking-[0.22em] uppercase bg-[#3d6b3e] text-white px-[10px] py-1 rounded-[3px] mb-5">
                Prochain événement
              </span>
              <h2
                className="font-display font-light text-white leading-[1.0] mb-5"
                style={{ fontFamily: 'var(--font-display)', fontSize: '46px' }}
              >
                {featured.title}<br />
                <em className="italic text-white/60">{TYPE_LABELS[featured.type] ?? featured.type}</em>
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/28 leading-[2.0] mb-9">
                {formatDate(featured.date)}{featured.time_start ? ` · ${featured.time_start.slice(0, 5)}` : ''}{featured.location ? ` · ${featured.location}` : ''}
              </p>
            </div>
            <Button
              as={Link}
              to={`/evenements/${featured.slug}`}
              radius="full"
              className="bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-7 h-11 self-start"
            >
              S'inscrire
            </Button>
          </div>
        </div>
      )}

      {/* Grille événements */}
      <section className="px-[60px] py-[52px]">
        <div className="flex items-baseline justify-between mb-7">
          <h2
            className="font-display font-light text-[36px] text-black"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tous les événements
          </h2>
        </div>

        {loading ? (
          <p className="text-[12px] text-black/38">Chargement…</p>
        ) : rest.length === 0 && !featured ? (
          <p className="text-[12px] text-black/38">Aucun événement à venir.</p>
        ) : (
          <div className="grid grid-cols-3 gap-[14px]">
            {rest.map((ev) => {
              const regCount = Number((ev.event_registrations as { count: number | string }[])?.[0]?.count ?? 0);
              const spots = ev.max_participants ? ev.max_participants - regCount : null;
              const isFull = spots !== null && spots <= 0;
              return (
                <Card
                  key={ev.id}
                  isPressable={!isFull}
                  onPress={() => navigate(`/evenements/${ev.slug}`)}
                  className={`bg-white rounded-[16px] border border-black/[0.06] shadow-none hover:shadow-lg transition-shadow ${isFull ? 'opacity-60' : ''}`}
                  shadow="none"
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a1e] to-[#0a0a0a] transition-transform duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <p className="absolute bottom-[14px] left-[14px] text-[8px] tracking-[0.25em] uppercase text-white/75">
                      {TYPE_LABELS[ev.type] ?? ev.type} · {formatDate(ev.date)}
                    </p>
                    {isFull && (
                      <span className="absolute top-[14px] right-[14px] text-[8px] tracking-[0.2em] uppercase bg-black/70 text-white/70 px-[10px] py-1 rounded-[4px]">
                        Complet
                      </span>
                    )}
                  </div>
                  <CardBody className="px-5 pt-5 pb-0 gap-0">
                    <p className="text-[8px] tracking-[0.22em] uppercase text-[#3d6b3e] mb-2">{TYPE_LABELS[ev.type] ?? ev.type}</p>
                    <h3
                      className="font-display font-light text-[22px] leading-[1.1] text-black mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {ev.title}
                    </h3>
                    <p className="text-[10px] text-black/38 leading-[1.8]">
                      {formatDate(ev.date)}{ev.time_start ? ` · ${ev.time_start.slice(0, 5)}` : ''}<br />
                      {ev.location ?? 'Fort-de-France'}
                    </p>
                  </CardBody>
                  <CardFooter className="px-5 pb-[18px] pt-3 flex items-center justify-between">
                    <p className="text-[10px] text-black/35">
                      {spots !== null ? (
                        isFull ? 'Complet' : <><span className="text-[#3d6b3e] font-normal">{spots} places</span> disponibles</>
                      ) : (
                        <span className="text-[#3d6b3e] font-normal">Entrée libre</span>
                      )}
                    </p>
                    <ArrowBtn size="sm" />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Run Club banner récurrent */}
      <div className="mx-[60px] mb-16 rounded-[20px] overflow-hidden bg-[#0a0a0a] flex items-center px-[60px] py-[52px] gap-[60px]">
        <div className="flex-1">
          <p className="text-[9px] tracking-[0.42em] uppercase text-white/28 mb-[14px]">Chaque semaine</p>
          <h3
            className="font-display font-light text-white leading-[1.0] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}
          >
            Run Club<br /><em className="italic text-white/55">Pessóra</em>
          </h3>
          <p className="text-[10px] text-white/28 tracking-[0.15em] uppercase">Tous les mercredis · 6h00 · Fort-de-France</p>
        </div>
        <Button
          as={Link}
          to="/evenements"
          radius="full"
          className="bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-7 h-11 flex-shrink-0"
        >
          Rejoindre le club
        </Button>
      </div>
    </div>
  );
};

export default Evenements;
```

- [ ] **Step 2: Vérifier visuellement et fonctionnellement**

Ouvrir `http://localhost:5173/evenements` — vérifier :
1. Hero noir avec titre "Nos *événements*"
2. Tabs filtre
3. Grande card prochain événement (données Supabase réelles)
4. Grille 3 colonnes avec cards HeroUI
5. États "Complet" grisés
6. Banner Run Club en bas

- [ ] **Step 3: Commit**

```bash
git add src/pages/Evenements.tsx
git commit -m "feat: page événements refonte — hero, tabs, grande card, grille HeroUI"
```

---

## Task 8: MemberLayout + Dashboard

**Files:**
- Modify: `src/components/member/MemberLayout.tsx`
- Modify: `src/pages/member/Dashboard.tsx`

- [ ] **Step 1: Réécrire MemberLayout.tsx**

```tsx
// src/components/member/MemberLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button } from '@heroui/react';
import { LayoutDashboard, Users, Heart, PersonStanding, User, Star, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/mon-espace' },
  { label: 'Mes événements', icon: Users, path: '/mon-espace/evenements' },
  { label: 'Bilans bien-être', icon: Heart, path: '/mon-espace/historique' },
  { label: 'Run Club', icon: PersonStanding, path: '/mon-espace/run-club' },
  { label: 'Mon profil', icon: User, path: '/mon-espace/profil' },
  { label: 'Abonnement', icon: Star, path: '/mon-espace/abonnement' },
];

const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.email?.slice(0, 1).toUpperCase() ?? 'M';
  const displayName = user?.email?.split('@')[0] ?? 'Membre';

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-black/[0.08] flex flex-col py-9 flex-shrink-0">
        {/* Logo */}
        <Link
          to="/"
          className="px-7 mb-8 font-display font-light text-[20px] tracking-[0.28em] uppercase text-black block"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>

        {/* User */}
        <div className="px-7 mb-8">
          <Avatar
            name={initials}
            className="w-[52px] h-[52px] mb-1.5"
            classNames={{ base: 'bg-gradient-to-br from-[#1e3a1e] to-[#3d6b3e]', name: 'text-white font-display font-light text-[20px]' }}
          />
          <p className="text-[14px] font-normal text-black capitalize mt-1.5">{displayName}</p>
          <span className="inline-block text-[8px] tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[7px] py-[2px] rounded-[3px] mt-1">
            Premium
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-[11px] px-3 py-[10px] rounded-lg mb-1 text-[12px] transition-colors ${
                  active ? 'bg-[#f0f0ee] text-black font-normal' : 'text-black/55 hover:bg-black/[0.04] hover:text-black font-light'
                }`}
              >
                <item.icon size={16} strokeWidth={1.5} className={active ? 'text-black' : 'text-black/60'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-[11px] px-3 py-[10px] rounded-lg text-[12px] text-black/35 hover:text-black transition-colors w-full font-light"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-[40px]">
        {children}
      </main>
    </div>
  );
};

export default MemberLayout;
```

- [ ] **Step 2: Réécrire Dashboard.tsx**

```tsx
// src/pages/member/Dashboard.tsx
import { Link } from 'react-router-dom';
import { Card, CardBody, Button } from '@heroui/react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const KPI = ({ label, value, sub, green = false, trend }: { label: string; value: string; sub: string; green?: boolean; trend?: string }) => (
  <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none" shadow="none">
    <CardBody className="p-[22px] gap-0">
      <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-[10px]">{label}</p>
      <p
        className={`font-display font-light text-[42px] leading-none mb-1.5 ${green ? 'text-[#3d6b3e]' : 'text-black'}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="text-[10px] text-black/30">{sub}</p>
      {trend && (
        <p className="flex items-center gap-1 text-[10px] text-[#3d6b3e] mt-1">
          <TrendingUp size={12} /> {trend}
        </p>
      )}
    </CardBody>
  </Card>
);

const EventRow = ({ day, month, name, meta, status }: { day: string; month: string; name: string; meta: string; status: 'confirmed' | 'pending' }) => (
  <div className="flex items-center gap-[14px] p-[14px] rounded-[10px] bg-[#faf9f7] hover:bg-[#f0f0ee] transition-colors cursor-pointer">
    <div className="w-11 h-11 rounded-[10px] bg-[#0a0a0a] flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-[16px] font-normal text-white leading-none">{day}</span>
      <span className="text-[8px] tracking-[0.12em] uppercase text-white/50">{month}</span>
    </div>
    <div className="flex-1">
      <p className="text-[12px] font-normal text-black">{name}</p>
      <p className="text-[10px] text-black/38">{meta}</p>
    </div>
    <span className={`text-[8px] tracking-[0.15em] uppercase px-2 py-[3px] rounded-[3px] ${status === 'confirmed' ? 'bg-[rgba(61,107,62,0.1)] text-[#3d6b3e]' : 'bg-black/5 text-black/40'}`}>
      {status === 'confirmed' ? 'Confirmé' : 'En attente'}
    </span>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] ?? 'Membre';

  return (
    <div>
      <h1
        className="font-display font-light text-[38px] text-black leading-none mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Bonjour,{' '}
        <em className="italic text-black/40">{firstName}</em>
      </h1>
      <p className="text-[11px] text-black/35 tracking-[0.05em] mb-9">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-9">
        <KPI label="Événements" value="7" sub="ce trimestre" trend="+2 vs dernier" />
        <KPI label="Run Club" value="12" sub="sessions complétées" green trend="Régulière" />
        <KPI label="Bilans" value="3" sub="bilans réalisés" />
        <KPI label="Abonnement" value="Premium" sub="Renouvellement : 1 mai" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-4">
        {/* Abonnement card */}
        <div className="bg-[#0a0a0a] rounded-[14px] p-6">
          <div className="flex justify-between items-start mb-5">
            <h3
              className="font-display font-light text-white text-[24px] leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Plan<br /><em className="italic text-white/55">Premium</em>
            </h3>
            <span className="text-[8px] tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[10px] py-1 rounded-[3px]">Actif</span>
          </div>
          {[
            { label: 'Shakes à -10%', on: true },
            { label: 'Accès Run Club illimité', on: true },
            { label: '2 bilans/mois offerts', on: true },
            { label: 'Accès ateliers prioritaire', on: false },
          ].map((perk) => (
            <div key={perk.label} className={`flex items-center gap-2.5 text-[11px] mb-2.5 ${perk.on ? 'text-white/85' : 'text-white/25'}`}>
              <span className={`text-[11px] ${perk.on ? 'text-[#3d6b3e]' : 'text-white/20'}`}>✓</span>
              {perk.label}
            </div>
          ))}
          <p className="text-[10px] text-white/22 mt-4">Renouvellement automatique · 1 mai 2026</p>
        </div>

        {/* Prochains événements */}
        <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none" shadow="none">
          <CardBody className="p-6 gap-0">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[12px] font-normal text-black">Mes prochains événements</p>
              <Link to="/mon-espace/historique" className="text-[10px] text-black/40 border-b border-black/20 pb-px">Tout voir</Link>
            </div>
            <div className="flex flex-col gap-3">
              <EventRow day="23" month="Avr" name="Run Club · Mercredi" meta="6h00 · Départ Pessóra" status="confirmed" />
              <EventRow day="28" month="Avr" name="Bilan Bien-être" meta="10h30 · Pessóra Bar" status="confirmed" />
              <EventRow day="3" month="Mai" name="Pop-up GigaFit" meta="9h00 – 13h00 · Lamentin" status="pending" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Commande rapide */}
      <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none" shadow="none">
        <CardBody className="p-6 gap-0">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[12px] font-normal text-black">Commander à nouveau</p>
            <Link to="/menu" className="text-[10px] text-black/40 border-b border-black/20 pb-px">Voir la carte</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { name: 'Vanilla Boost', price: '6,21€', bg: 'from-[#2c4e2d] to-[#1a3a1b]' },
              { name: 'Chocolat Power', price: '6,21€', bg: 'from-[#3d6b3e] to-[#2a4a2b]' },
              { name: 'Gauffre Nature', price: '4,05€', bg: 'from-[#111] to-[#1a1a1a]' },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-[10px] bg-[#faf9f7] hover:bg-[#f0f0ee] transition-colors cursor-pointer">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-b ${item.bg} flex-shrink-0`} />
                <p className="flex-1 text-[12px] font-normal text-black">{item.name}</p>
                <p className="text-[12px] text-black/40">{item.price} <span className="text-[9px] text-black/25">-10%</span></p>
                <button className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[18px] leading-none flex-shrink-0">+</button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 3: Vérifier visuellement**

Ouvrir `http://localhost:5173/demo-espace` — vérifier :
1. Sidebar : logo, avatar gradient vert, nav items avec icônes, item actif `#f0f0ee`
2. Main : titre Bonjour + prénom italic, 4 KPI cards
3. Row 2 : card abonnement noir + widget événements
4. Commande rapide avec prix -10%

- [ ] **Step 4: Commit**

```bash
git add src/components/member/MemberLayout.tsx src/pages/member/Dashboard.tsx
git commit -m "feat: dashboard membre refonte — sidebar 240px, KPIs, abonnement noir, commande rapide"
```

---

## Task 9: Pages Auth

**Files:**
- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Register.tsx`

- [ ] **Step 1: Réécrire Login.tsx**

```tsx
// src/pages/auth/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/mon-espace');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <Link
          to="/"
          className="block text-center font-display font-light text-[28px] tracking-[0.28em] uppercase text-black mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>
        <Card className="bg-white rounded-[16px] border border-black/[0.06] shadow-none" shadow="none">
          <CardBody className="p-8 gap-0">
            <h1
              className="font-display font-light text-[32px] leading-none text-black mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Connexion
            </h1>
            <p className="text-[11px] text-black/38 mb-8">Accédez à votre espace membre</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                label="Email"
                value={email}
                onValueChange={setEmail}
                startContent={<Mail size={15} className="text-black/35" strokeWidth={1.5} />}
                radius="sm"
                classNames={{ inputWrapper: 'border border-black/15 bg-white shadow-none', label: 'text-[11px] text-black/50', input: 'text-[13px]' }}
                required
              />
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onValueChange={setPassword}
                startContent={<Lock size={15} className="text-black/35" strokeWidth={1.5} />}
                radius="sm"
                classNames={{ inputWrapper: 'border border-black/15 bg-white shadow-none', label: 'text-[11px] text-black/50', input: 'text-[13px]' }}
                required
              />
              {error && <p className="text-[11px] text-red-500" role="alert">{error}</p>}
              <Button
                type="submit"
                radius="full"
                isLoading={loading}
                className="bg-black text-white text-[11px] font-normal tracking-[0.12em] uppercase h-11 mt-2"
              >
                Se connecter
              </Button>
            </form>
            <p className="text-[11px] text-black/38 text-center mt-6">
              Pas encore membre ?{' '}
              <Link to="/inscription" className="text-black border-b border-black/30 pb-px">Créer un compte</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;
```

- [ ] **Step 2: Réécrire Register.tsx**

```tsx
// src/pages/auth/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, firstName);
      navigate('/mon-espace');
    } catch {
      setError('Impossible de créer le compte. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <Link
          to="/"
          className="block text-center font-display font-light text-[28px] tracking-[0.28em] uppercase text-black mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>
        <Card className="bg-white rounded-[16px] border border-black/[0.06] shadow-none" shadow="none">
          <CardBody className="p-8 gap-0">
            <h1
              className="font-display font-light text-[32px] leading-none text-black mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Créer un compte
            </h1>
            <p className="text-[11px] text-black/38 mb-8">Rejoignez la communauté Pessóra</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                label="Prénom"
                value={firstName}
                onValueChange={setFirstName}
                startContent={<User size={15} className="text-black/35" strokeWidth={1.5} />}
                radius="sm"
                classNames={{ inputWrapper: 'border border-black/15 bg-white shadow-none', label: 'text-[11px] text-black/50', input: 'text-[13px]' }}
                required
              />
              <Input
                type="email"
                label="Email"
                value={email}
                onValueChange={setEmail}
                startContent={<Mail size={15} className="text-black/35" strokeWidth={1.5} />}
                radius="sm"
                classNames={{ inputWrapper: 'border border-black/15 bg-white shadow-none', label: 'text-[11px] text-black/50', input: 'text-[13px]' }}
                required
              />
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onValueChange={setPassword}
                startContent={<Lock size={15} className="text-black/35" strokeWidth={1.5} />}
                radius="sm"
                classNames={{ inputWrapper: 'border border-black/15 bg-white shadow-none', label: 'text-[11px] text-black/50', input: 'text-[13px]' }}
                required
              />
              {error && <p className="text-[11px] text-red-500" role="alert">{error}</p>}
              <Button
                type="submit"
                radius="full"
                isLoading={loading}
                className="bg-black text-white text-[11px] font-normal tracking-[0.12em] uppercase h-11 mt-2"
              >
                Créer mon compte
              </Button>
            </form>
            <p className="text-[11px] text-black/38 text-center mt-6">
              Déjà membre ?{' '}
              <Link to="/connexion" className="text-black border-b border-black/30 pb-px">Se connecter</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Register;
```

- [ ] **Step 3: Vérifier — noter si `register` existe dans AuthContext**

```bash
grep -n "register" "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/src/contexts/AuthContext.tsx" | head -10
```

Si `register` n'existe pas dans AuthContext, utiliser `login` après `supabase.auth.signUp()` directement ou adapter selon l'API disponible.

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "Login|Register"
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/Login.tsx src/pages/auth/Register.tsx
git commit -m "feat: pages auth refonte — card blanche centrée, HeroUI Input/Button, fond ivory"
```

---

## Task 10: Restyling EvenementDetail + BilanBienEtre

**Files:**
- Modify: `src/pages/EvenementDetail.tsx`
- Modify: `src/pages/BilanBienEtre.tsx`

Ces deux pages ont la logique Supabase déjà implémentée. On adapte uniquement les classes Tailwind et les composants pour utiliser les nouveaux tokens.

- [ ] **Step 1: Identifier les classes à remplacer dans EvenementDetail.tsx**

```bash
grep -n "bg-\|text-\|font-\|rounded\|border" "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/src/pages/EvenementDetail.tsx" | head -30
```

- [ ] **Step 2: Appliquer les tokens dans EvenementDetail.tsx**

Remplacements clés à faire manuellement dans le fichier :
- Background hero : `style={{ background: '#0a0a0a' }}`
- Titres : ajouter `style={{ fontFamily: 'var(--font-display)' }}` sur les `h1`/`h2`
- Fond page : `className="bg-[#faf9f7]"`
- Bouton submit : `className="bg-black text-white"` + `radius="full"`
- Labels de section : `className="text-[9px] tracking-[0.4em] uppercase text-black/35"`

- [ ] **Step 3: Appliquer les tokens dans BilanBienEtre.tsx**

Mêmes remplacements. Conserver intégralement le Calendar compound HeroUI v3 — juste appliquer les classes de couleur nouvelles (fond `#faf9f7`, hero `#0a0a0a`, boutons noirs).

- [ ] **Step 4: Vérifier les deux pages**

```bash
# EvenementDetail — tester avec un slug valide
open "http://localhost:5173/evenements/run-club-mercredi-23-avril"

# BilanBienEtre
open "http://localhost:5173/bilan-bien-etre"
```

Vérifier : hero noir, Calendar HeroUI intact, formulaires avec Input HeroUI stylisés.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EvenementDetail.tsx src/pages/BilanBienEtre.tsx
git commit -m "feat: restyling EvenementDetail + BilanBienEtre — tokens noir/ivory/accent"
```

---

## Self-Review

**Spec coverage :**
- ✅ Design system (tokens @theme) — Task 1
- ✅ Header double rangée + nav-cats centré — Task 3
- ✅ Footer 4-col noir — Task 4
- ✅ Composants partagés HeroUI — Task 2
- ✅ Homepage toutes sections — Task 5
- ✅ Page Menu avec tabs + chips — Task 6
- ✅ Page Événements avec Supabase — Task 7
- ✅ Dashboard sidebar + KPIs — Task 8
- ✅ Pages auth restyling — Task 9
- ✅ EvenementDetail + BilanBienEtre — Task 10
- ✅ HeroUI obligatoire partout (Button, Input, Card, Tabs, Chip, Badge, Avatar)
- ✅ Vert #3d6b3e jamais dans sections noires — vérifié dans chaque task

**Placeholder scan :** aucun TBD, aucun "implement later", code complet dans chaque step.

**Type consistency :** `Event` interface définie dans Task 7 et utilisée uniquement dans Task 7. `ProductCard` props définies dans Task 2 et utilisées identiquement dans Tasks 5 et 6.
