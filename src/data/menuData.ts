export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: 'wellness' | 'energie' | 'shakes' | 'coffee';
  price: number;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  calories?: number;
  protein?: number;
  ingredients: string[];
  benefits: string[];
  pitch: string;
  icon?: string;
  image_url?: string | null;
  badges?: ('vegan' | 'glutenfree' | 'vitamins')[];
  gallery?: string[];
}

export interface Booster {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface MilkOption {
  id: string;
  name: string;
  icon: string;
}

// WELLNESS - Bien-être & Douceur
export const wellnessItems: MenuItem[] = [
  {
    id: 'glow-my-skin',
    name: 'GLOW MY SKIN',
    description: 'Le cocktail beauté par excellence',
    category: 'wellness',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 30,
    ingredients: ['Hibiscus', 'Collagène', 'Fraise', 'Citron'],
    benefits: ['Articulation', 'Circulation sanguine', 'Peau', 'Ongles et cheveux'],
    pitch: 'Le cocktail beauté par excellence',
    icon: '✨',
    badges: [],
  },
  {
    id: 'immuni-tea',
    name: "IMMUNI'TEA",
    description: 'Renforce vos défenses naturelles',
    category: 'wellness',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 35,
    ingredients: ['Baie sauvage', 'Collagène', 'Citron'],
    benefits: ['Système immunitaire', 'Articulation', 'Brûle graisse'],
    pitch: 'Renforce vos défenses naturelles',
    icon: '🌺',
    badges: [],
  },
];

// ENERGIE DRINK - Pré-Workout
export const energieItems: MenuItem[] = [
  {
    id: 'spicy-mango',
    name: 'SPICY MANGO',
    description: 'Le boost tropical et puissant',
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 50,
    ingredients: ['Mangue épicée', 'Açaï', 'Hibiscus', 'Orange', 'Électrolytes'],
    benefits: ['Énergie douce', 'Anti-crampe', 'Endurance', 'Puissance'],
    pitch: 'Le boost tropical et puissant',
    icon: '🔥',
    badges: [],
  },
  {
    id: 'hydra-boost-litchi',
    name: 'HYDRA BOOST LITCHI',
    description: 'Hydratation profonde & récupération',
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 40,
    ingredients: ['Orange', 'Litchi', 'Électrolytes'],
    benefits: ['Hydratation profonde', 'Récupération', 'Endurance'],
    pitch: 'Hydratation profonde & récupération',
    icon: '🍊',
    badges: [],
  },
  {
    id: 'blue-lagoon',
    name: 'BLUE LAGOON',
    description: "L'électrochoc frais pour se réveiller",
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 50,
    ingredients: ['Créatine', 'Yuzu', 'Açaï', 'Citron', 'Curaçao', 'Menthe', 'Caféine de Guarana', 'Biotine', 'Taurine'],
    benefits: ['Énergie immédiate', 'Réduction de la fatigue', 'Puissance', 'Force'],
    pitch: "L'électrochoc frais pour se réveiller",
    icon: '💙',
    badges: [],
  },
];

// SHAKES PROTÉINÉS - Post-Workout
export const shakesItems: MenuItem[] = [
  {
    id: 'pink-dragon',
    name: 'PINK DRAGON',
    description: 'Fruité & Beauté',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Fruit du dragon', 'Collagène', 'Fraise'],
    benefits: ['Récupération', 'Beauté', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Fruité & Beauté',
    icon: '🐉',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'cookie-cream',
    name: 'COOKIE CREAM',
    description: 'Gourmandise pure',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 330,
    protein: 30,
    ingredients: ['Cookies', 'Caramel', 'Chocolat'],
    benefits: ['Récupération', 'Gourmand', '30g protéines', '25 vitamines & minéraux'],
    pitch: 'Gourmandise pure',
    icon: '🍪',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'choco-prot',
    name: 'PROTEIN CHOC',
    description: 'Le classique efficace',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Chocolat', 'Vanille'],
    benefits: ['Récupération', 'Classique', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Le classique efficace',
    icon: '🍫',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'caramel-glace',
    name: 'CARAMEL GLACÉ',
    description: 'Le coup de fouet gourmand',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Vanille', 'Caramel', 'Café'],
    benefits: ['Récupération', 'Énergie', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Le coup de fouet gourmand',
    icon: '☕',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'glam-matcha',
    name: 'GLAM MATCHA',
    description: "L'option zen & fruitée",
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 210,
    protein: 21,
    ingredients: ['Matcha', 'Framboise', 'Vanille'],
    benefits: ['Récupération', 'Antioxydants', '21g protéines', '25 vitamines & minéraux'],
    pitch: "L'option zen & fruitée",
    icon: '🍵',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
];

// COFFEE
export const coffeeItems: MenuItem[] = [
  {
    id: 'espresso',
    name: 'ESPRESSO',
    description: 'Court et intense',
    category: 'coffee',
    price: 2.5,
    calories: 5,
    ingredients: ['Café arabica'],
    benefits: ['Énergie', 'Concentration'],
    pitch: 'Le classique italien',
    icon: '☕',
    badges: []
  },
  {
    id: 'cafe-long',
    name: 'CAFÉ LONG',
    description: 'Allongé et doux',
    category: 'coffee',
    price: 4,
    calories: 10,
    ingredients: ['Café arabica', 'Eau'],
    benefits: ['Énergie douce', 'Hydratation'],
    pitch: 'Pour prendre son temps',
    icon: '☕',
    badges: []
  }
];

// Tous les items combinés
export const menuItems: MenuItem[] = [
  ...wellnessItems,
  ...energieItems,
  ...shakesItems,
  ...coffeeItems
];

// BOOSTERS
export const boosters: Booster[] = [
  { id: 'collagene', name: 'Collagène', price: 1, description: 'Peau, ongles, cheveux' },
  { id: 'creatine', name: 'Créatine', price: 1, description: 'Force & performance' },
  { id: 'proteine', name: '12g Protéines', price: 1, description: 'Récupération musculaire' },
  { id: 'electrolytes', name: 'Électrolytes', price: 1, description: 'Hydratation & anti-crampe' },
  { id: 'fibres', name: 'Fibres', price: 1, description: 'Confort digestif' },
  { id: 'aloe-vera', name: 'Aloé Vera', price: 1, description: 'Détox & hydratation' }
];

// LAITS VÉGÉTAUX
export const milkOptions: MilkOption[] = [
  { id: 'avoine', name: 'Avoine', icon: '🌾' },
  { id: 'amandes', name: 'Amandes', icon: '🌰' },
  { id: 'coco', name: 'Coco', icon: '🥥' },
  { id: 'riz', name: 'Riz', icon: '🌾' }
];

export const categoryNames = {
  wellness: 'Wellness',
  energie: 'Énergie Drink',
  shakes: 'Shakes Protéinés',
  coffee: 'Coffee'
};

export const categoryDescriptions = {
  wellness: 'Bien-être & Douceur — P 8€ · M 10€ · G 12€',
  energie: 'Pré-Workout — P 8€ · M 10€ · G 12€',
  shakes: 'Post-Workout — P 10€ · M 14€ · G 16€ · 21-30g protéines',
  coffee: 'À partir de 2,50€',
};

export const getCategoryIcon = (category: MenuItem['category']): string => {
  const icons = {
    wellness: '✨',
    energie: '⚡',
    shakes: '🥤',
    coffee: '☕'
  };
  return icons[category];
};

export const badgeLabels = {
  vegan: '🌱 Végan',
  glutenfree: '🌾 Sans Gluten',
  vitamins: '💊 25 Vitamines & Minéraux'
};
