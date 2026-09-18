export interface SplitGammeConfig {
  key: 'wellness' | 'energie' | 'shakes' | 'coffee';
  label: string;
  eyebrow: string;
  title: string;
  mainImage: string | null;
  sideImages: [string | null, string | null];
  linkTo: string;
}

export const splitGammesData: SplitGammeConfig[] = [
  {
    key: 'wellness',
    label: 'Wellness',
    eyebrow: 'Wellness · PessÓra',
    title: 'Un concentré de bien-être au naturel',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=mega_the',
  },
  {
    key: 'energie',
    label: 'Énergie',
    eyebrow: 'Énergie · PessÓra',
    title: 'Ton boost pour la journée',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=mega_the',
  },
  {
    key: 'shakes',
    label: 'Shakes',
    eyebrow: 'Shakes · PessÓra',
    title: 'Protéines & gourmandise',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=protein_shake',
  },
  {
    key: 'coffee',
    label: 'Coffee',
    eyebrow: 'Coffee · Martinique',
    title: 'Café glacé à la martiniquaise',
    mainImage: null,
    sideImages: [null, null],
    linkTo: '/menu?gamme=coffee',
  },
];
