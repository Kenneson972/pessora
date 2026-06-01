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
      { name: 'Aloe Vera',        description: "Une boisson rafraîchissante à base de jus d'Aloe vera de haute qualité. Savoureuse et désaltérante, elle s'intègre parfaitement dans une routine bien-être quotidienne. Riche en composés naturels issus de la feuille d'aloe vera.", price: '60€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1065-fr.png' },
      { name: 'Collagène',        description: "Complément développé par des experts pour une peau d'apparence plus saine. Formulé avec du collagène hydrolysé, de la vitamine C et de la biotine, il contribue à l'élasticité et à la fermeté de la peau tout en soutenant la santé des ongles et des articulations.", price: '85€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-076k-fr.png' },
      { name: 'Thé Detox',        description: "Une boisson instantanée rafraîchissante et faible en calories à savourer tout au long de la journée. À base de thé et d'extraits végétaux, elle offre un coup de fouet naturel grâce à la caféine qu'elle contient. Disponible en plusieurs saveurs fruitées.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-182k-fr.png' },
      { name: 'Fibres',           description: "Un mélange exclusif formulé avec des fibres solubles et insolubles pour soutenir un transit intestinal régulier. Sans gluten, il se mélange facilement à vos boissons et préparations. Idéal pour compléter votre apport quotidien en fibres.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2554-fr.png' },
      { name: 'Complex Vitamine', description: "Complexe multivitaminé complet conçu pour les hommes. Formulé avec des vitamines et minéraux essentiels pour soutenir le métabolisme énergétique, le système immunitaire et la vitalité au quotidien. Un apport équilibré en micronutriments clés.", price: '35€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1745-fr.png' },
      { name: 'Minéral Complex',  description: "Complément en minéraux essentiels pour l'équilibre de l'organisme. Calcium, magnésium, zinc et autres oligo-éléments soigneusement sélectionnés pour soutenir la santé osseuse, la fonction musculaire et le métabolisme cellulaire.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-0111-fr.png' },
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
      { name: 'Gel Contour Yeux',           description: "Gel contour des yeux décongestionnant qui réduit visiblement les poches et les cernes. Sa formule fraîche enrichie en extraits végétaux apaise et lisse le regard. Appliquer matin et soir par tapotements légers.", price: '45€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2561-fr.png' },
      { name: 'Crème Hydratante FPS 30',    description: "Protection solaire SPF 30 + hydratation intense. Une crème deux-en-un qui protège des UV tout en nourrissant la peau en profondeur au quotidien. Texture légère non grasse qui pénètre rapidement.", price: '55€' },
      { name: 'Sérum Rides',                description: "Concentré anti-rides haute efficacité. Formule enrichie en actifs régénérants qui ciblent les rides installées et préviennent l'apparition de nouvelles rides. Texture soyeuse à absorption rapide pour un fini lisse et tendu.", price: '75€' },
      { name: 'Gel Nettoyant Resurface',    description: "Gel moussant qui nettoie en douceur sans dessécher. Sa formule resurfaçante élimine les impuretés et l'excès de sébum tout en préservant la barrière cutanée. Convient à tous les types de peau. Utilisation quotidienne matin et soir.", price: '29€ / 39€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-511k-fr.png' },
      { name: 'Crème Hydrant Éclat',        description: "Crème hydratante quotidienne qui révèle l'éclat naturel de la peau. Sa formule légère enrichie en actifs illuminateurs unifie le teint et atténue les signes de fatigue. Pénètre rapidement sans laisser de film gras. Idéale comme base de maquillage.", price: '55€' },
      { name: 'Crème Hydrant Yeux',         description: "Crème hydratante spécifiquement formulée pour la zone fragile du contour des yeux. Sa texture fluide et pénétrante apporte une hydratation intense et continue tout au long de la journée. Apaise les tiraillements et lisse les ridules de déshydratation.", price: '45€' },
      { name: 'Sérum Niacinamide 10%',      description: "Sérum visage à 10% de niacinamide (vitamine B3) formulé pour renforcer la barrière cutanée, réduire l'apparence des pores et raviver l'éclat. Texture aqueuse légère qui pénètre instantanément. Pour un teint lumineux et visiblement plus sain.", price: '55€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-508k-fr.png' },
      { name: 'Gommage',                    description: "Exfoliant doux pour peau lumineuse. Élimine les cellules mortes et affine le grain de peau pour un teint éclatant et uniforme. Sa formule aux micro-grains lisse sans agresser.", price: '29€' },
      { name: 'Lotion Nourrissante',        description: "Lotion nourrissante légère pour les mains et le corps qui offre une hydratation longue durée sans effet gras. Enrichie en aloe vera et en vitamine E, elle adoucit et protège la peau au quotidien. Absorption rapide.", price: '29€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-514k-fr.png' },
      { name: 'Lotion Tonique Revitalisant',description: "Tonifie et revitalise le teint. Prépare la peau à recevoir les soins suivants tout en resserrant les pores pour un fini lisse et frais. Sans alcool, respecte l'équilibre cutané.", price: '22€', image: 'https://cdn.webshopapp.com/shops/68973/files/30395316/555x555x2/lotion-tonique-revitalisant.jpg' },
      { name: 'Crème Tension Ultime',       description: "Crème tension ultime anti-âge qui cible visiblement les rides et renforce l'élasticité de la peau en profondeur. Sa texture riche et veloutée pénètre rapidement pour un effet liftant immédiat. Résultats visibles en 4 semaines.", price: '89€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-513k-fr.png' },
      { name: 'Crème Contour Yeux',         description: "Crème nourrissante spécialement conçue pour la zone délicate du contour des yeux. À absorption rapide et non grasse, elle réduit visiblement les cernes, les poches et les rides. Testée sous contrôle dermatologique.", price: '49€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-515k-fr.png' },
      { name: 'Crème de Nuit',              description: "Crème de nuit revitalisante qui nourrit intensément la peau pendant votre sommeil. Sa formule riche en actifs régénérants stimule le renouvellement cellulaire nocturne. Au réveil, la peau est reposée, repulpée et éclatante.", price: '88€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-539k-fr.png' },
      { name: 'Masque d\'Argile',            description: "Masque à l'argile bentonite purifiante enrichi à la menthe. Il absorbe l'excès de sébum, désobstrue les pores et affine le grain de peau. La sensation de fraîcheur immédiate laisse la peau nette, lisse et matifiée.", price: '25€', image: 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-0773-fr.png' },
      { name: 'Exfoliant',                  description: "Gommage corps à grains fins pour une peau douce et lumineuse. Sa formule enrichie en agents exfoliants naturels élimine en douceur les cellules mortes et les aspérités. La peau est lissée, revitalisée et parfaitement préparée à recevoir les soins hydratants.", price: '24€' },
    ],
  },
};
