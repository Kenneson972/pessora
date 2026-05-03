/**
 * Grille d’accueil « type Nespresso » : 3 visuels par gamme.
 * Renseignez les URLs (Unsplash, CDN, /public/…) quand les photos sont prêtes ; `null` = placeholder.
 * (Coffee n’apparaît pas sur l’accueil — la gamme reste sur /menu.)
 */
export type HomeShowcaseGamme = 'wellness' | 'energie' | 'shakes';

export interface HomeDrinkShowcaseImages {
  /** Bloc large gauche */
  large: string | null;
  /** Bloc droit haut */
  stackedTop: string | null;
  /** Bloc droit bas */
  stackedBottom: string | null;
}

export interface HomeDrinkShowcaseEntry {
  label: string;
  /** Sous la grande image à gauche uniquement ; si absent, on utilise `label` (onglets = toujours `label`). */
  largeImageCaption?: string;
  href: string;
  /** Fond placeholder si pas d’image (classes Tailwind) */
  placeholderClass: string;
  images: HomeDrinkShowcaseImages;
}

export const homeDrinkShowcase: Record<HomeShowcaseGamme, HomeDrinkShowcaseEntry> = {
  wellness: {
    label: 'Wellness',
    href: '/menu?gamme=wellness',
    placeholderClass: 'bg-gradient-to-br from-[oklch(96%_0.03_145)] to-[oklch(92%_0.04_150)]',
    images: { large: null, stackedTop: null, stackedBottom: null },
  },
  energie: {
    label: 'Énergie',
    href: '/menu?gamme=energie',
    placeholderClass: 'bg-gradient-to-br from-[oklch(96%_0.02_55)] to-[oklch(90%_0.05_55)]',
    images: { large: null, stackedTop: null, stackedBottom: null },
  },
  shakes: {
    label: 'Shakes',
    largeImageCaption: 'Pink Dragon',
    href: '/menu?gamme=shakes',
    placeholderClass: 'bg-gradient-to-b from-surface-muted to-[oklch(88%_0.02_55)]',
    images: {
      large: '/home-showcase-pink-dragon.png',
      stackedTop: '/home-showcase-pink-dragon-shake.png',
      stackedBottom: '/home-showcase-pink-dragon-macro.png',
    },
  },
};

export const homeDrinkShowcaseOrder: HomeShowcaseGamme[] = ['wellness', 'energie', 'shakes'];
