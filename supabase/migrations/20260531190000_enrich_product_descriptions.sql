-- PESSORA — Enrichir les descriptions produits avec les textes officiels Herbalife

-- ══════════════════════ WELLNESS ══════════════════════

UPDATE public.gamme_products SET description = 'Une boisson rafraîchissante à base de jus d''Aloe vera de haute qualité. Savoureuse et désaltérante, elle s''intègre parfaitement dans une routine bien-être quotidienne. Riche en composés naturels issus de la feuille d''aloe vera.'
  WHERE gamme = 'wellness' AND name ILIKE '%aloe%vera%';

UPDATE public.gamme_products SET description = 'Complément développé par des experts pour une peau d''apparence plus saine. Formulé avec du collagène hydrolysé, de la vitamine C et de la biotine, il contribue à l''élasticité et à la fermeté de la peau tout en soutenant la santé des ongles et des articulations.'
  WHERE gamme = 'wellness' AND name ILIKE '%collagène%';

UPDATE public.gamme_products SET description = 'Une boisson instantanée rafraîchissante et faible en calories à savourer tout au long de la journée. À base de thé et d''extraits végétaux, elle offre un coup de fouet naturel grâce à la caféine qu''elle contient. Disponible en plusieurs saveurs fruitées.'
  WHERE gamme = 'wellness' AND name ILIKE '%thé%detox%';

UPDATE public.gamme_products SET description = 'Un mélange exclusif formulé avec des fibres solubles et insolubles pour soutenir un transit intestinal régulier. Sans gluten, il se mélange facilement à vos boissons et préparations. Idéal pour compléter votre apport quotidien en fibres.'
  WHERE gamme = 'wellness' AND name ILIKE '%fibre%';

UPDATE public.gamme_products SET description = 'Complexe multivitaminé complet conçu pour les hommes. Formulé avec des vitamines et minéraux essentiels pour soutenir le métabolisme énergétique, le système immunitaire et la vitalité au quotidien. Un apport équilibré en micronutriments clés.'
  WHERE gamme = 'wellness' AND name ILIKE '%complex%vitamine%';

UPDATE public.gamme_products SET description = 'Complément en minéraux essentiels pour l''équilibre de l''organisme. Calcium, magnésium, zinc et autres oligo-éléments soigneusement sélectionnés pour soutenir la santé osseuse, la fonction musculaire et le métabolisme cellulaire.'
  WHERE gamme = 'wellness' AND name ILIKE '%minéral%complex%';

-- ══════════════════════ SPORT ══════════════════════

UPDATE public.gamme_products SET description = 'Notre produit phare : un délicieux substitut de repas riche en protéines (18 g par portion), en fibres et en vitamines essentielles. Idéal pour le contrôle du poids et la nutrition sportive. Disponible en plusieurs saveurs gourmandes. 950 g — format économique.'
  WHERE gamme = 'sport' AND name ILIKE '%formula%1%950%';

UPDATE public.gamme_products SET description = 'Complément de créatine monohydrate pure pour soutenir vos objectifs de performance. La créatine contribue à améliorer la puissance et l''endurance lors d''exercices de haute intensité. Certifié Informed Sport, sans substances interdites.'
  WHERE gamme = 'sport' AND name ILIKE '%créatine%';

UPDATE public.gamme_products SET description = 'Shake de récupération à base de protéines végétales premium (pois, quinoa, lin). 25 g de protéines par portion, formulé à partir d''ingrédients de sources naturelles. Idéal après l''effort pour la reconstruction musculaire.'
  WHERE gamme = 'sport' AND name ILIKE '%rebuild%whey%';

UPDATE public.gamme_products SET description = 'Gel énergétique formulé pour les efforts prolongés. Apport rapide en glucides pour maintenir la performance pendant l''exercice. Pratique à emporter, il se consomme avant ou pendant l''effort pour éviter les coups de fatigue.'
  WHERE gamme = 'sport' AND name ILIKE '%gel%prolong%';

UPDATE public.gamme_products SET description = 'Boisson hypotonique conçue pour l''endurance. Développée avec Cristiano Ronaldo, la gamme CR7 Drive contient un mélange d''électrolytes, de vitamines B et de glucides pour une hydratation et une énergie optimales avant et pendant l''effort. Format boîte économique.'
  WHERE gamme = 'sport' AND name ILIKE '%electrolytes%cr7%';

UPDATE public.gamme_products SET description = 'Sachets individuels d''électrolytes pour une hydratation optimale pendant l''effort. Pratique à glisser dans le sac de sport, chaque sachet contient la dose parfaite pour une bouteille d''eau. Formule hypotonique à absorption rapide.'
  WHERE gamme = 'sport' AND name ILIKE '%electrolytes%sachet%';

UPDATE public.gamme_products SET description = 'Complément en acides gras essentiels oméga-3 d''origine marine. Contribue à la santé cardiovasculaire, au bon fonctionnement cérébral et à la réduction des inflammations. Purifié pour éliminer les métaux lourds et autres contaminants.'
  WHERE gamme = 'sport' AND name ILIKE '%omega%3%';

UPDATE public.gamme_products SET description = 'Boisson d''hydratation formulée pour remplacer les électrolytes perdus pendant l''exercice. Aide à prévenir les crampes et à maintenir les performances. Faible en calories, sans colorants artificiels.'
  WHERE gamme = 'sport' AND name ILIKE '%hydrate%';

UPDATE public.gamme_products SET description = 'Une boisson protéinée prête à boire — aucune préparation nécessaire. Riche en protéines de lactosérum, faible en matières grasses, elle constitue un en-cas ou un complément post-entraînement idéal. Format nomade à emporter partout.'
  WHERE gamme = 'sport' AND name ILIKE '%protein%drink%pdm%';

UPDATE public.gamme_products SET description = 'Comprimé effervescent énergisant au pamplemousse, faible en calories. Contient de la caféine et un mélange de vitamines B pour un coup de boost avant l''entraînement. Se dissout dans l''eau en 30 secondes.'
  WHERE gamme = 'sport' AND name ILIKE '%liftoff%pamplemousse%';

UPDATE public.gamme_products SET description = 'Comprimé effervescent énergisant au citron, faible en calories. Formulé avec de la caféine et des vitamines essentielles pour vous donner un coup de fouet avant ou pendant l''effort. Pratique, il suffit de le diluer dans un verre d''eau.'
  WHERE gamme = 'sport' AND name ILIKE '%liftoff%citron%';

-- ══════════════════════ SKIN ══════════════════════

UPDATE public.gamme_products SET description = 'Un gel moussant qui nettoie en douceur sans dessécher. Sa formule resurfaçante élimine les impuretés et l''excès de sébum tout en préservant la barrière cutanée. Convient à tous les types de peau. Utilisation quotidienne matin et soir.'
  WHERE gamme = 'skin' AND name ILIKE '%gel%nettoyant%';

UPDATE public.gamme_products SET description = 'Crème tension ultime anti-âge qui cible visiblement les rides et renforce l''élasticité de la peau en profondeur. Sa texture riche et veloutée pénètre rapidement pour un effet liftant immédiat. Résultats visibles en 4 semaines.'
  WHERE gamme = 'skin' AND name ILIKE '%crème%tension%';

UPDATE public.gamme_products SET description = 'Crème nourrissante spécialement conçue pour la zone délicate du contour des yeux. À absorption rapide et non grasse, elle réduit visiblement les cernes, les poches et les rides. Testée sous contrôle dermatologique.'
  WHERE gamme = 'skin' AND name ILIKE '%crème%contour%yeux%';

UPDATE public.gamme_products SET description = 'Sérum visage à 10% de niacinamide (vitamine B3) formulé pour renforcer la barrière cutanée, réduire l''apparence des pores et raviver l''éclat. Texture aqueuse légère qui pénètre instantanément. Pour un teint lumineux et visiblement plus sain.'
  WHERE gamme = 'skin' AND name ILIKE '%sérum%niacinamide%';

UPDATE public.gamme_products SET description = 'Crème de nuit revitalisante qui nourrit intensément la peau pendant votre sommeil. Sa formule riche en actifs régénérants stimule le renouvellement cellulaire nocturne. Au réveil, la peau est reposée, repulpée et éclatante.'
  WHERE gamme = 'skin' AND name ILIKE '%crème%de%nuit%';

UPDATE public.gamme_products SET description = 'Lotion nourrissante légère pour les mains et le corps qui offre une hydratation longue durée sans effet gras. Enrichie en aloe vera et en vitamine E, elle adoucit et protège la peau au quotidien. Absorption rapide.'
  WHERE gamme = 'skin' AND name ILIKE '%lotion%nourrissante%';

UPDATE public.gamme_products SET description = 'Masque à l''argile bentonite purifiante enrichi à la menthe. Il absorbe l''excès de sébum, désobstrue les pores et affine le grain de peau. La sensation de fraîcheur immédiate laisse la peau nette, lisse et matifiée.'
  WHERE gamme = 'skin' AND name ILIKE '%masque%argile%';

UPDATE public.gamme_products SET description = 'Gel contour des yeux décongestionnant qui réduit visiblement les poches et les cernes. Sa formule fraîche enrichie en extraits végétaux apaise et lisse le regard. Appliquer matin et soir par tapotements légers.'
  WHERE gamme = 'skin' AND name ILIKE '%gel%contour%yeux%';
