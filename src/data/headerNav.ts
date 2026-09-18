import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Home,
  Mail,
  Package,
  UtensilsCrossed,
} from 'lucide-react';

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
 * (Retiré le 17/09) `SUBNAV_MENU` — 4 entrées « Wellness / Énergie / Shakes / Coffee ».
 *
 * Ce bloc n'avait **aucun consommateur** : rien ne le rendait, et `getSubNavForPath('/menu')`
 * renvoie `null` — la page « La carte » n'a **jamais** eu de barre secondaire (mesuré : 0 lien
 * `?gamme=` dans le DOM de `/menu`). C'était donc un **troisième vocabulaire mort**, et le
 * laisser était un piège : on a lu deux fois ses vieux mots comme s'ils étaient cliquables.
 * Le filtre de la page (4 entrées : Tout · Mega Thé · Protein Shake · Coffee) est le seul
 * contrôle réel, et la résolution des liens entrants vit dans `src/data/pillars.ts`.
 */

/**
 * (Retiré le 17/09) `SUBNAV_EVENEMENTS` — « Tous / Pop-up / Atelier / Partenariats ».
 * Même constat que `SUBNAV_MENU` : **aucun consommateur**, et `getSubNavForPath` ne rend
 * une sous-barre que pour `/nos-produits/…`. Ses mots avaient l'air cliquables sans
 * l'être — c'était un quatrième vocabulaire mort. Si une sous-barre d'événements est
 * voulue un jour, elle se câble depuis les types réels (`/evenements?type=…`), pas depuis
 * une liste que personne ne lit.
 */

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
