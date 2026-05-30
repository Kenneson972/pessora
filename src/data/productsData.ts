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
      'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1065-fr.png',
    products: [
      { name: 'Aloe Vera',        description: "Concentré d'aloé vera pour l'hydratation.",           price: '60€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1065-fr.png' },
      { name: 'Collagène',        description: 'Collagène marin pour peau, ongles, articulations.',   price: '85€' },
      { name: 'Thé Detox',        description: 'Mélange détoxifiant pour drainer et purifier.',       price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-182k-fr.png' },
      { name: 'Fibres',           description: 'Mélange riche en fibres pour confort digestif.',      price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2554-fr.png' },
      { name: 'Complex Vitamine', description: 'Complexe multivitaminé quotidien.',                   price: '35€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1745-fr.png' },
      { name: 'Minéral Complex',  description: "Minéraux essentiels pour l'équilibre.",              price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-0111-fr.png' },
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
      'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-048k-fr.png',
    products: [
      { name: 'Formula 1 950g',          description: 'Repas nutritionnel complet en shake.',               price: '65€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-048k-fr.png' },
      { name: 'Créatine',                description: 'Améliore la force et la puissance musculaire.',     price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-488k-fr.png' },
      { name: 'Rebuild Whey',            description: 'Shake de récupération post-effort.',                price: '90€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-013k-fr.png' },
      { name: 'Gel Prolong',             description: 'Énergie soutenue pour efforts longs.',              price: '35€' },
      { name: 'Electrolytes CR7 Boîte',  description: 'Boisson hypotonique endurance.',                   price: '40€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1466-fr.png' },
      { name: 'Electrolytes Sachet x10', description: "Sachet pratique pour l'hydratation.",              price: '30€' },
      { name: 'Omega 3',                 description: 'Acides gras essentiels santé cardiaque.',           price: '40€' },
      { name: 'Hydrate',                 description: "Électrolytes pour l'hydratation optimale.",        price: '50€' },
      { name: 'Protein Drink PDM',       description: 'Boisson protéinée prête à boire.',                 price: '75€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2600-fr.png' },
      { name: 'LiftOff Pamplemousse',    description: 'Tablette effervescente énergie — pamplemousse.',   price: '40€' },
      { name: 'LiftOff Citron',          description: 'Tablette effervescente énergie — citron.',         price: '40€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-3152-fr.png' },
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
    heroImage:
      'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-513k-fr.png',
    products: [
      { name: 'Gel Nettoyant Resurface',    description: 'Nettoyage en profondeur sans dessécher.',        price: '29€ / 39€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-511k-fr.png' },
      { name: 'Gommage',                    description: 'Exfoliant doux pour peau lumineuse.',            price: '29€' },
      { name: 'Lotion Tonique Revitalisant',description: 'Tonifie et revitalise le teint.',               price: '22€' },
      { name: 'Crème Hydratante FPS 30',    description: 'Protection solaire + hydratation intense.',     price: '55€' },
      { name: 'Sérum Rides',                description: 'Concentré anti-rides haute efficacité.',        price: '75€' },
      { name: 'Crème Tension Ultime',       description: 'Raffermissement et densité cutanée.',           price: '89€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-513k-fr.png' },
      { name: 'Crème Contour Yeux',         description: 'Anti-rides et raffermissement contour yeux.',   price: '49€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-515k-fr.png' },
    ],
  },
};
