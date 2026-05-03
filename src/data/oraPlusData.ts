/**
 * Contenu page Óra+ — version éditoriale longue.
 *
 * Structure inspirée du handoff luxe/éditorial :
 *   Hero 2-col → Stats band → Privilèges → Comparator → Pricing → Quote → Explorer → Final CTA.
 *
 * Rétro-compat : `oraPlusPricing.price` / `.period`, `oraPlusBenefits`,
 * `oraPlusCrossLinks`, `oraPlusEditorialImages` restent consommables par
 * `OraPlusTeaserStrip` et `DrinkDetail`.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OraPlusMetric = {
  /** Partie chiffrée (italique serif) */
  emphasis: string;
  /** Template incluant l'unité — `{n}` sera remplacé par `emphasis` */
  template: string;
  /** Libellé sous la métrique */
  label: string;
};

export type OraPlusPrivilege = {
  num: string;
  titleHead: string;
  titleEmphasis: string;
  titleTail?: string;
  body: string;
  metric: {
    value: string;
    unit: string;
    sublabel: string;
  };
};

export type OraPlusCompareRow = {
  name: string;
  category: string;
  priceRetail: string;
  priceOraPlus: string;
  savings: string;
};

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

export const oraPlusHero = {
  eyebrow: 'L’abonnement Óra+',
  /** Conservé pour rétro-compat si un composant tiers l'utilise */
  title: 'Óra+',
  titleHead: 'La carte,',
  titleEmphasis: 'mieux qu’ailleurs.',
  sub: 'Boissons à moitié prix au bar, sans engagement.',
  ctaPrimary: { label: 'Rejoindre Óra+', href: '/inscription' },
  ctaSecondary: { label: 'Se connecter', href: '/connexion' },
  metrics: [
    { emphasis: '24,90', template: '{n}€', label: 'par mois' },
    { emphasis: '50', template: '−{n}%', label: 'jusqu’à · sur la carte' },
    { emphasis: '0', template: '{n}€', label: 'engagement' },
  ] satisfies OraPlusMetric[],
  /** Image éditoriale du hero — reprend la collection existante, traitée en N&B */
  image: {
    src: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=1400',
    alt: 'Rituel Óra+ — plan rapproché d’un shake protéiné, lumière studio',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Stats band (social proof)
// ─────────────────────────────────────────────────────────────

export const oraPlusStats = {
  label: 'Plus de 1 200 membres.',
  items: [
    { emphasis: '4,9', template: '{n}/5', label: 'Avis membres · Google' },
    { emphasis: '180', template: '{n}€', label: 'Économie moyenne · an' },
    { emphasis: '4', template: '{n}e', label: 'Rentable dès la boisson' },
  ] satisfies OraPlusMetric[],
} as const;

// ─────────────────────────────────────────────────────────────
// Privilèges
// ─────────────────────────────────────────────────────────────

export const oraPlusHeadCopy = {
  eyebrow: 'Les privilèges',
  titleHead: 'En tant que ',
  titleEmphasis: 'membre Óra+,',
  titleTail: ' vous recevez…',
  intro: '−50 % sur les boissons, bilan offert, événements prioritaires — sans engagement.',
} as const;

export const oraPlusPrivileges: OraPlusPrivilege[] = [
  {
    num: 'I',
    titleHead: 'La carte, ',
    titleEmphasis: 'à moitié prix.',
    body: '−50 % sur toutes les boissons, appliqué automatiquement au passage.',
    metric: { value: '−50', unit: '%', sublabel: 'sur les boissons' },
  },
  {
    num: 'II',
    titleHead: 'Un ',
    titleEmphasis: 'bilan bien-être',
    titleTail: ' offert.',
    body: '30 minutes avec notre naturopathe, une fois par an.',
    metric: { value: '30', unit: '’', sublabel: 'offertes · chaque année' },
  },
  {
    num: 'III',
    titleHead: 'Des ',
    titleEmphasis: 'événements prioritaires.',
    body: 'Invitations prioritaires aux ateliers et lancements.',
    metric: { value: '+1', unit: '', sublabel: 'invité · par événement' },
  },
  {
    num: 'IV',
    titleHead: 'Un ',
    titleEmphasis: 'rituel',
    titleTail: ', sans engagement.',
    body: 'Résiliable en un clic depuis votre espace.',
    metric: { value: '0', unit: '€', sublabel: 'engagement · 1 clic' },
  },
];

/** Résumé court pour l'encart pricing (rétro-compat) */
export const oraPlusBenefits = [
  'Jusqu’à −50 % sur les boissons',
  'Bilan bien-être offert chaque année',
  'Événements & lancements prioritaires',
  'Sans engagement, résiliable en 1 clic',
] as const;

// ─────────────────────────────────────────────────────────────
// Comparator
// ─────────────────────────────────────────────────────────────

export const oraPlusCompare = {
  titleHead: 'Le prix, ',
  titleEmphasis: 'avant et après.',
  intro: 'Exemples sur la carte.',
  rows: [
    { name: 'Wellness / shake', category: 'Repères', priceRetail: '10–14 €', priceOraPlus: '5–7 €', savings: '−50 %' },
    { name: 'Café long', category: 'Coffee', priceRetail: '4,00 €', priceOraPlus: '2,00 €', savings: '−2 €' },
  ] satisfies OraPlusCompareRow[],
  total: {
    label: 'Exemple · 4 boissons / sem.',
    retail: '44,00 €',
    oraPlus: '22,00 €',
    savings: '−22 €',
  },
  footnote: '* Tarifs indicatifs carte 2026.',
} as const;

// ─────────────────────────────────────────────────────────────
// Calculator (ROI)
// ─────────────────────────────────────────────────────────────

export const oraPlusCalculator = {
  eyebrow: 'Estimation',
  titleHead: 'Votre ',
  titleEmphasis: 'économie.',
  intro: 'Deux réglages — projection sur 12 mois (48 semaines actives).',
  /** Prix mensuel Óra+ (source de vérité) */
  subscriptionPrice: 24.9,
  /** Remise membre sur boissons (0,5 = −50 %) */
  memberDiscount: 0.5,
  /** Semaines prises en compte dans l’année (sans slider) */
  weeksPerYear: 48,
  sliders: {
    drinks: {
      min: 1,
      max: 20,
      default: 4,
      step: 1,
      hint: '',
    },
    avgPrice: {
      min: 2.5,
      max: 14,
      default: 10,
      step: 0.5,
      hint: '',
    },
  },
  result: {
    headline: 'Économie estimée · 12 mois',
    rowTotal: 'Économie (abonnement déjà déduit)',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Pricing (rétro-compat sur `price` + `period`)
// ─────────────────────────────────────────────────────────────

export const oraPlusPricing = {
  /** Rétro-compat : utilisé par OraPlusTeaserStrip et DrinkDetail */
  price: '24,90€',
  period: '/ mois',
  badge: 'Offre lancement',
  cta: 'S’abonner',
  highlight: 'Rentable dès la 4ᵉ boisson du mois.*',
  footnote: '* Estimation membre actif.',
  /** Copy éditoriale (section pricing sur fond noir) */
  eyebrow: 'Offre lancement · 2026',
  titleHead: 'Vingt-quatre euros ',
  titleEmphasis: 'quatre-vingt-dix.',
  body: '24,90 € / mois — sans engagement.',
  card: {
    priceValue: '24,90',
    currency: '€',
    period: '/ mois',
    meta: ['Sans engagement', 'Résiliable en 1 clic'],
    cta: { label: 'S’abonner', href: '/inscription' },
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Testimonial
// ─────────────────────────────────────────────────────────────

export const oraPlusPrivilegeCards = [
  {
    num: 'I',
    accent: 'Énergie',
    color: 'bg-noir',
    image: {
      src: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800&h=1000',
      alt: 'Shake protéiné — rituel post-entraînement',
    },
    titleHead: 'La carte, ',
    titleEmphasis: 'à moitié prix.',
    titleTail: '',
    body: '−50 % sur toutes les boissons — appliqué automatiquement au passage en caisse.',
    metric: { value: '−50', unit: '%', sublabel: 'sur les boissons' },
  },
  {
    num: 'II',
    accent: 'Récupération',
    color: 'bg-anthracite',
    image: {
      src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800&h=1000',
      alt: 'Bilan bien-être — consultation naturopathie',
    },
    titleHead: 'Bilan ',
    titleEmphasis: 'bien-être',
    titleTail: ' offert.',
    body: '30 minutes avec notre naturopathe, une fois par an. Bilan personnalisé.',
    metric: { value: '30', unit: '’', sublabel: 'offertes · chaque année' },
  },
  {
    num: 'III',
    accent: 'Communauté',
    color: 'bg-noir',
    image: {
      src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800&h=1000',
      alt: 'Événement sportif collectif — atelier bien-être',
    },
    titleHead: 'Événements ',
    titleEmphasis: 'prioritaires.',
    titleTail: '',
    body: 'Invitations prioritaires aux ateliers, lancements et challenges sportifs.',
    metric: { value: '+1', unit: '', sublabel: 'invité · par événement' },
  },
  {
    num: 'IV',
    accent: 'Liberté',
    color: 'bg-anthracite',
    image: {
      src: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&q=80&w=800&h=1000',
      alt: 'Sans engagement — liberté totale',
    },
    titleHead: 'Sans ',
    titleEmphasis: 'engagement.',
    titleTail: '',
    body: 'Résiliable en un clic depuis votre espace membre.',
    metric: { value: '0', unit: '€', sublabel: 'engagement · 1 clic' },
  },
] as const;

export const oraPlusQuote = {
  quoteHead: '« Óra+, c’est simple : ',
  quoteEmphasis: 'je paie moins, je viens plus souvent.',
  quoteTail: ' »',
  author: 'Laure S.',
  location: 'Fort-de-France',
  memberSince: 'membre depuis 2024',
  /** Photo du membre pour le témoignage */
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
} as const;

// ─────────────────────────────────────────────────────────────
// Explorer + Final CTA
// ─────────────────────────────────────────────────────────────

export const oraPlusCrossLinks = [
  { label: 'La Carte', to: '/menu' },
  { label: 'Événements', to: '/evenements' },
  { label: 'Bilan', to: '/bilan-bien-etre' },
  { label: 'Contact', to: '/contact' },
] as const;

export const oraPlusExplorer = {
  eyebrow: 'Explorer',
  menuLink: { label: 'Voir la carte', to: '/menu' },
} as const;

export const oraPlusFinalCta = {
  titleHead: 'Rejoignez ',
  titleEmphasis: 'Óra+.',
  body: 'Créez votre compte en quelques minutes.',
  cta: { label: 'Créer mon compte', href: '/inscription' },
} as const;

// ─────────────────────────────────────────────────────────────
// Visuels éditoriaux (conservés)
// ─────────────────────────────────────────────────────────────

export const oraPlusEditorialImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=900',
] as const;
