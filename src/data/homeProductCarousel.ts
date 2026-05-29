import { menuItems } from './menuData';

/** Pastille type vitrine (texte vertical sur l’image) */
export type HomeCarouselBadge = 'nouveaute' | 'coup-de-coeur';

export type HomeCarouselEntry = {
  id: string;
  badge?: HomeCarouselBadge;
  /** Photo optionnelle dans `public/` ; sinon fond + emoji du menu */
  imageSrc?: string | null;
};

/**
 * Ordre et métadonnées des boissons sur l’accueil (carrousel type « coups de cœur »).
 * Les libellés viennent de `menuData` ; ajoutez des `imageSrc` quand les visuels sont prêts.
 */
export const homeProductCarousel: HomeCarouselEntry[] = [
  { id: 'pink-dragon', badge: 'nouveaute', imageSrc: '/home-showcase-pink-dragon-shake.png' },
  { id: 'blue-lagoon', imageSrc: '/home-showcase-blue-lagoon.png' },
  { id: 'hydra-boost-litchi' },
  { id: 'cookie-cream', badge: 'coup-de-coeur' },
  { id: 'choco-prot' },
  { id: 'caramel-glace' },
  { id: 'glam-matcha' },
  { id: 'glow-my-skin', imageSrc: '/home-showcase-glow-my-skin.png' },
];

const BADGE_LABEL: Record<HomeCarouselBadge, string> = {
  nouveaute: 'Nouveauté',
  'coup-de-coeur': 'Coup de cœur',
};

export function carouselBadgeLabel(b: HomeCarouselBadge): string {
  return BADGE_LABEL[b];
}

/** Résout un item menu ; ignore les entrées dont l’id n’existe pas */
export function getCarouselMenuItems(entries: HomeCarouselEntry[]) {
  return entries
    .map((e) => {
      const item = menuItems.find((m) => m.id === e.id);
      return item ? { entry: e, item } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}
