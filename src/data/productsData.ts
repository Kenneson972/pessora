import { Sparkles, Zap, Droplet } from 'lucide-react';

export const rangesData = {
  wellness: {
    id: 'wellness',
    title: 'Gamme Wellness',
    subtitle: 'Nutrition & équilibre',
    description:
      'Une sélection de compléments essentiels pour nourrir votre corps, soutenir votre bien-être et votre équilibre au quotidien.',
    icon: Sparkles,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-noir/[0.03]',
    heroImage:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200',
    products: [
      { name: 'Aloe Vera',        description: "Concentré d'aloé vera pour l'hydratation.",           price: '60€' },
      { name: 'Collagène',        description: 'Collagène marin pour peau, ongles, articulations.',   price: '85€' },
      { name: 'Thé Detox',        description: 'Mélange détoxifiant pour drainer et purifier.',       price: '45€' },
      { name: 'Fibres',           description: 'Mélange riche en fibres pour confort digestif.',      price: '45€' },
      { name: 'Complex Vitamine', description: 'Complexe multivitaminé quotidien.',                   price: '35€' },
      { name: 'Minéral Complex',  description: "Minéraux essentiels pour l'équilibre.",              price: '45€' },
    ],
  },
  sport: {
    id: 'sport',
    title: 'Gamme Sport',
    subtitle: 'Performance & récupération',
    description:
      'Conçue pour les athlètes de tous niveaux : énergie, endurance et récupération musculaire au meilleur niveau.',
    icon: Zap,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-noir/[0.03]',
    heroImage:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    products: [
      { name: 'Formula 1 950g',          description: 'Repas nutritionnel complet en shake.',               price: '65€' },
      { name: 'Créatine',                description: 'Améliore la force et la puissance musculaire.',     price: '45€' },
      { name: 'Rebuild Whey',            description: 'Shake de récupération post-effort.',                price: '90€' },
      { name: 'Gel Prolong',             description: 'Énergie soutenue pour efforts longs.',              price: '35€' },
      { name: 'Electrolytes CR7 Boîte',  description: 'Boisson hypotonique endurance.',                   price: '40€' },
      { name: 'Electrolytes Sachet x10', description: "Sachet pratique pour l'hydratation.",              price: '30€' },
      { name: 'Omega 3',                 description: 'Acides gras essentiels santé cardiaque.',           price: '40€' },
      { name: 'Hydrate',                 description: "Électrolytes pour l'hydratation optimale.",        price: '50€' },
      { name: 'Protein Drink PDM',       description: 'Boisson protéinée prête à boire.',                 price: '75€' },
      { name: 'LiftOff Pamplemousse',    description: 'Tablette effervescente énergie — pamplemousse.',   price: '40€' },
      { name: 'LiftOff Citron',          description: 'Tablette effervescente énergie — citron.',         price: '40€' },
    ],
  },
  skin: {
    id: 'skin',
    title: 'Gamme Skin',
    subtitle: 'Beauté & éclat',
    description:
      "Révélez l'éclat naturel de votre peau avec des soins enrichis en actifs ciblés, du nettoyage profond aux sérums anti-âge.",
    icon: Droplet,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-white',
    heroImage: '/hero-skin.png',
    products: [
      { name: 'Gel Nettoyant Resurface',    description: 'Nettoyage en profondeur sans dessécher.',        price: '29€ / 39€' },
      { name: 'Gommage',                    description: 'Exfoliant doux pour peau lumineuse.',            price: '29€' },
      { name: 'Lotion Tonique Revitalisant',description: 'Tonifie et revitalise le teint.',               price: '22€' },
      { name: 'Crème Hydratante FPS 30',    description: 'Protection solaire + hydratation intense.',     price: '55€' },
      { name: 'Sérum Rides',                description: 'Concentré anti-rides haute efficacité.',        price: '75€' },
      { name: 'Crème Tension Ultime',       description: 'Raffermissement et densité cutanée.',           price: '89€' },
      { name: 'Crème Contour Yeux',         description: 'Anti-rides et raffermissement contour yeux.',   price: '49€' },
    ],
  },
};
