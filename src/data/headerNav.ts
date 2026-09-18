import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Home,
  Mail,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import { PILLARS, PILLAR_NAMES } from './pillars';

/** Navigation principale — alignée sur les routes réelles du site */
export const PRIMARY_NAV: {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Si true, actif seulement quand pathname === path exact */
  matchExact?: boolean;
}[] = [
  { label: 'Accueil', path: '/', icon: Home, matchExact: true },
  { label: 'La carte', path: '/menu', icon: UtensilsCrossed },
  { label: 'Produits', path: '/nos-produits', icon: Package },
  { label: 'Événements', path: '/evenements', icon: CalendarDays },
  { label: 'Contact', path: '/contact', icon: Mail },
];

export function isPrimaryNavActive(pathname: string, itemPath: string, matchExact?: boolean): boolean {
  if (matchExact) return pathname === itemPath;
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Barre secondaire type Nespresso : filtres par contexte */
export type SubNavItem = { label: string; href: string };

/**
 * Barre du menu — **générée depuis la table des piliers**, aucun libellé recopié.
 *
 * Avant : 4 entrées écrites à la main (`Wellness`, `Énergie`, `Shakes`, `Coffee`) qui
 * envoyaient `?gamme=wellness|energie|shakes|coffee` — des mots que la page ne comprend
 * plus depuis le passage aux 3 piliers, donc **3 des 4 entrées menaient à une page vide**
 * (« Aucun produit »). Ici les deux moitiés du problème disparaissent ensemble : le libellé
 * ET le lien viennent de `PILLAR_NAMES` / `PILLARS`, la même table que lit la page.
 * Une quatrième entrée ne pourra donc plus être inventée sans toucher la table.
 */
export const SUBNAV_MENU: SubNavItem[] = [
  { label: 'Tous', href: '/menu' },
  ...PILLARS.map((pilier) => ({ label: PILLAR_NAMES[pilier], href: `/menu?gamme=${pilier}` })),
];

export const SUBNAV_EVENEMENTS: SubNavItem[] = [
  { label: 'Tous', href: '/evenements' },
  { label: 'Pop-up', href: '/evenements?type=popup' },
  { label: 'Atelier', href: '/evenements?type=atelier' },
  { label: 'Partenariats', href: '/evenements?type=partenariat' },
];

export const SUBNAV_PRODUITS: SubNavItem[] = [
  { label: 'Vue d’ensemble', href: '/nos-produits' },
  { label: 'Wellness', href: '/nos-produits/wellness' },
  { label: 'Sport', href: '/nos-produits/sport' },
  { label: 'Skin', href: '/nos-produits/skin' },
];

export function getSubNavForPath(pathname: string): SubNavItem[] | null {
  if (pathname.startsWith('/nos-produits/')) return SUBNAV_PRODUITS;
  return null;
}
