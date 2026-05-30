-- Migration: synchroniser les données statiques menuData.ts → table products
-- À exécuter dans le SQL Editor de Supabase (https://tulhiipucrnyejheuitv.supabase.co)
-- Date: 2026-05-29

-- WELLNESS
UPDATE products SET
  ingredients = ARRAY['Hibiscus', 'Collagène', 'Fraise', 'Citron'],
  benefits = ARRAY['Articulation', 'Circulation sanguine', 'Peau', 'Ongles et cheveux'],
  description = 'Le cocktail beauté par excellence',
  pitch = 'Le cocktail beauté par excellence',
  icon_emoji = '✨',
  calories = 30,
  badges = ARRAY[]::text[]
WHERE slug = 'glow-my-skin' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

UPDATE products SET
  ingredients = ARRAY['Baie sauvage', 'Collagène', 'Citron'],
  benefits = ARRAY['Système immunitaire', 'Articulation', 'Brûle graisse'],
  description = 'Renforce vos défenses naturelles',
  pitch = 'Renforce vos défenses naturelles',
  icon_emoji = '🌺',
  calories = 35,
  badges = ARRAY[]::text[]
WHERE slug = 'immuni-tea' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- ÉNERGIE
UPDATE products SET
  ingredients = ARRAY['Mangue épicée', 'Açaï', 'Hibiscus', 'Orange', 'Électrolytes'],
  benefits = ARRAY['Énergie douce', 'Anti-crampe', 'Endurance', 'Puissance'],
  description = 'Le boost tropical et puissant',
  pitch = 'Le boost tropical et puissant',
  icon_emoji = '🔥',
  calories = 50,
  badges = ARRAY[]::text[]
WHERE slug = 'spicy-mango' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

UPDATE products SET
  ingredients = ARRAY['Orange', 'Litchi', 'Électrolytes'],
  benefits = ARRAY['Hydratation profonde', 'Récupération', 'Endurance'],
  description = 'Hydratation profonde & récupération',
  pitch = 'Hydratation profonde & récupération',
  icon_emoji = '🍊',
  calories = 40,
  badges = ARRAY[]::text[]
WHERE slug = 'hydra-boost-litchi' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

UPDATE products SET
  ingredients = ARRAY['Créatine', 'Yuzu', 'Açaï', 'Citron', 'Curaçao', 'Menthe', 'Caféine de Guarana', 'Biotine', 'Taurine'],
  benefits = ARRAY['Énergie immédiate', 'Réduction de la fatigue', 'Puissance', 'Force'],
  description = 'L''électrochoc frais pour se réveiller',
  pitch = 'L''électrochoc frais pour se réveiller',
  icon_emoji = '💙',
  calories = 50,
  badges = ARRAY[]::text[]
WHERE slug = 'blue-lagoon' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- PROTEIN CHOC (slug = 'choco-prot' en DB, 'protein-choc' n'existe pas)
UPDATE products SET
  ingredients = ARRAY['Chocolat', 'Vanille'],
  benefits = ARRAY['Récupération', 'Classique', '25g protéines', '25 vitamines & minéraux'],
  description = 'Le classique efficace',
  pitch = 'Le classique efficace',
  icon_emoji = '🍫',
  calories = 250,
  protein = 25,
  badges = ARRAY['vegan', 'glutenfree', 'vitamins']
WHERE slug = 'choco-prot' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- CARAMEL GLACÉ (slug = 'iced-caramel-latte')
UPDATE products SET
  ingredients = ARRAY['Vanille', 'Caramel', 'Café'],
  benefits = ARRAY['Récupération', 'Énergie', '25g protéines', '25 vitamines & minéraux'],
  description = 'Le coup de fouet gourmand',
  pitch = 'Le coup de fouet gourmand',
  icon_emoji = '☕',
  calories = 250,
  protein = 25,
  badges = ARRAY['vegan', 'glutenfree', 'vitamins']
WHERE slug = 'iced-caramel-latte' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- PINK DRAGON
UPDATE products SET
  ingredients = ARRAY['Fruit du dragon', 'Collagène', 'Fraise'],
  benefits = ARRAY['Récupération', 'Beauté', '25g protéines', '25 vitamines & minéraux'],
  description = 'Fruité & Beauté',
  pitch = 'Fruité & Beauté',
  icon_emoji = '🐉',
  calories = 250,
  protein = 25,
  badges = ARRAY['vegan', 'glutenfree', 'vitamins']
WHERE slug = 'pink-dragon' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- COOKIE CREAM
UPDATE products SET
  ingredients = ARRAY['Cookies', 'Caramel', 'Chocolat'],
  benefits = ARRAY['Récupération', 'Gourmand', '30g protéines', '25 vitamines & minéraux'],
  description = 'Gourmandise pure',
  pitch = 'Gourmandise pure',
  icon_emoji = '🍪',
  calories = 330,
  protein = 30,
  badges = ARRAY['vegan', 'glutenfree', 'vitamins']
WHERE slug = 'cookie-cream' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- GLAM MATCHA
UPDATE products SET
  ingredients = ARRAY['Matcha', 'Framboise', 'Vanille'],
  benefits = ARRAY['Récupération', 'Antioxydants', '21g protéines', '25 vitamines & minéraux'],
  description = 'L''option zen & fruitée',
  pitch = 'L''option zen & fruitée',
  icon_emoji = '🍵',
  calories = 210,
  protein = 21,
  badges = ARRAY['vegan', 'glutenfree', 'vitamins']
WHERE slug = 'glam-matcha' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- ESPRESSO
UPDATE products SET
  ingredients = ARRAY['Café arabica'],
  benefits = ARRAY['Énergie', 'Concentration'],
  description = 'Court et intense',
  pitch = 'Le classique italien',
  icon_emoji = '☕',
  calories = 5,
  badges = ARRAY[]::text[]
WHERE slug = 'espresso' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- CAFÉ LONG
UPDATE products SET
  ingredients = ARRAY['Café arabica', 'Eau'],
  benefits = ARRAY['Énergie douce', 'Hydratation'],
  description = 'Allongé et doux',
  pitch = 'Pour prendre son temps',
  icon_emoji = '☕',
  calories = 10,
  badges = ARRAY[]::text[]
WHERE slug = 'cafe-long' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);

-- IMMUNE PARADISE (existe en DB, pas dans le snapshot statique actuel — on complète juste si vide)
UPDATE products SET
  ingredients = ARRAY['Baies sauvages', 'Passion', 'Rose', 'Aloe vera'],
  benefits = ARRAY['Système immunitaire', 'Antioxydant', 'Douceur', 'Vitalité'],
  description = 'Contribue au fonctionnement du système immunitaire',
  pitch = 'Contribue au fonctionnement du système immunitaire',
  icon_emoji = '🌸',
  calories = 35,
  badges = ARRAY[]::text[]
WHERE slug = 'immune-paradise' AND (ingredients IS NULL OR array_length(ingredients, 1) IS NULL);
