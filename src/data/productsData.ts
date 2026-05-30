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
      { name: 'Aloe Vera',        description: "Boisson rafraîchissante à base de jus d'Aloe vera de haute qualité. Riche en composés naturels, elle s'intègre parfaitement dans une routine bien-être quotidienne.", price: '60€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1065-fr.png' },
      { name: 'Collagène',        description: "Complément au collagène hydrolysé, vitamine C et biotine. Contribue à l'élasticité et la fermeté de la peau tout en soutenant la santé des ongles et des articulations.", price: '85€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-076k-fr.png' },
      { name: 'Thé Detox',        description: "Boisson instantanée rafraîchissante et faible en calories à base de thé et d'extraits végétaux. Un coup de fouet naturel grâce à la caféine qu'elle contient.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-182k-fr.png' },
      { name: 'Fibres',           description: "Mélange exclusif formulé avec des fibres solubles et insolubles pour soutenir un transit intestinal régulier. Se mélange facilement à vos boissons et préparations.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2554-fr.png' },
      { name: 'Complex Vitamine', description: "Complexe multivitaminé complet avec vitamines et minéraux essentiels pour soutenir le métabolisme énergétique, le système immunitaire et la vitalité au quotidien.", price: '35€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1745-fr.png' },
      { name: 'Minéral Complex',  description: "Complément en minéraux essentiels — calcium, magnésium, zinc — pour soutenir la santé osseuse, la fonction musculaire et le métabolisme cellulaire.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-0111-fr.png' },
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
      { name: 'Formula 1 950g',          description: "Notre produit phare : un délicieux substitut de repas riche en protéines (18 g), fibres et vitamines essentielles. Format économique 950 g.", price: '65€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-048k-fr.png' },
      { name: 'Créatine',                description: "Créatine monohydrate pure certifiée Informed Sport. Améliore la puissance et l'endurance lors d'exercices de haute intensité. Sans substances interdites.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-488k-fr.png' },
      { name: 'Rebuild Whey',            description: "Shake de récupération aux protéines végétales premium (pois, quinoa, lin). 25 g de protéines par portion pour la reconstruction musculaire post-effort.", price: '90€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-013k-fr.png' },
      { name: 'Gel Prolong',             description: "Gel énergétique pour efforts prolongés. Apport rapide en glucides pour maintenir la performance. Pratique à emporter avant ou pendant l'effort.", price: '35€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1424-fr.png' },
      { name: 'Electrolytes CR7 Boîte',  description: "Boisson hypotonique développée avec Cristiano Ronaldo. Mélange d'électrolytes, vitamines B et glucides pour une hydratation et énergie optimales. Format boîte.", price: '40€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1466-fr.png' },
      { name: 'Electrolytes Sachet x10', description: "Sachets individuels d'électrolytes pour l'hydratation pendant l'effort. Format pratique à glisser dans le sac de sport. Formule hypotonique à absorption rapide.", price: '30€' },
      { name: 'Omega 3',                 description: "Complément en acides gras oméga-3 d'origine marine. Contribue à la santé cardiovasculaire, au bon fonctionnement cérébral et à la réduction des inflammations.", price: '40€', image: 'https://www.vercorssportsteam.com/wp-content/uploads/2019/04/vercorssportsteam-photo-Herbalife-line-Max-Herbalife-600x600.jpg' },
      { name: 'Hydrate',                 description: "Boisson d'hydratation formulée pour remplacer les électrolytes perdus pendant l'exercice. Aide à prévenir les crampes et maintenir les performances.", price: '50€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-3150-fr.png' },
      { name: 'Protein Drink PDM',       description: "Boisson protéinée prête à boire, sans préparation. Riche en protéines de lactosérum, faible en matières grasses. Format nomade idéal en déplacement.", price: '75€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2600-fr.png' },
      { name: 'LiftOff Pamplemousse',    description: "Comprimé effervescent énergisant au pamplemousse. Caféine et vitamines B pour un coup de boost avant l'entraînement. Se dissout dans l'eau en 30 secondes.", price: '40€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-192k-fr.png' },
      { name: 'LiftOff Citron',          description: "Comprimé effervescent énergisant au citron. Formulé avec de la caféine et des vitamines essentielles pour un coup de fouet avant ou pendant l'effort.", price: '40€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-3152-fr.png' },
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
      { name: 'Gel Nettoyant Resurface',    description: "Gel moussant qui nettoie en douceur sans dessécher. Élimine les impuretés et l'excès de sébum tout en préservant la barrière cutanée. Usage quotidien.", price: '29€ / 39€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-511k-fr.png' },
      { name: 'Gommage',                    description: "Exfoliant doux pour peau lumineuse. Élimine les cellules mortes et affine le grain de peau pour un teint éclatant et uniforme.", price: '29€' },
      { name: 'Lotion Tonique Revitalisant',description: "Tonifie et revitalise le teint. Prépare la peau à recevoir les soins suivants tout en resserrant les pores pour un fini lisse et frais.", price: '22€', image: 'https://cdn.webshopapp.com/shops/68973/files/30395316/555x555x2/lotion-tonique-revitalisant.jpg' },
      { name: 'Crème Hydratante FPS 30',    description: "Protection solaire SPF 30 + hydratation intense. Une crème deux-en-un qui protège des UV tout en nourrissant la peau en profondeur au quotidien.", price: '55€' },
      { name: 'Sérum Rides',                description: "Concentré anti-rides haute efficacité. Formule enrichie en actifs régénérants qui ciblent les rides installées et préviennent l'apparition de nouvelles rides.", price: '75€' },
      { name: 'Crème Tension Ultime',       description: "Crème anti-âge qui cible visiblement les rides et renforce l'élasticité de la peau. Texture riche et veloutée à pénétration rapide pour un effet liftant immédiat.", price: '89€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-513k-fr.png' },
      { name: 'Crème Contour Yeux',         description: "Crème nourrissante pour la zone délicate du contour des yeux. Réduit visiblement cernes, poches et rides. Texture légère non grasse à absorption rapide.", price: '49€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-515k-fr.png' },
    ],
  },
};
