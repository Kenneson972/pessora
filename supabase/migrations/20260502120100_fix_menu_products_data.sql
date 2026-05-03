-- PESSORA — Corrections catalogue boissons bar
-- 1. Supprimer Coco Boost (n'existe plus)
DELETE FROM public.products WHERE slug = 'coco-boost';

-- 2. Archiver Detox My Body et Tiramisu Gourmand
UPDATE public.products SET active = false
WHERE slug IN ('detox-my-body', 'tiramisu-gourmand');

-- 3. Renommer Immune Paradis → Immuni'Tea + update ingrédients/bénéfices
UPDATE public.products SET
  slug        = 'immuni-tea',
  name        = 'IMMUNI''TEA',
  icon_emoji  = '🌺',
  ingredients = ARRAY['Baie sauvage', 'Collagène', 'Citron']::text[],
  benefits    = ARRAY['Système immunitaire', 'Articulation', 'Brûle graisse']::text[],
  pitch       = 'Renforce vos défenses naturelles',
  description = 'Renforce vos défenses naturelles'
WHERE slug = 'immune-paradis';

-- 4. Ajouter Hydra Boost Litchi
INSERT INTO public.products (slug, name, category, price, price_small, price_medium, price_large, calories, description, ingredients, benefits, pitch, icon_emoji, active, badges)
VALUES (
  'hydra-boost-litchi',
  'HYDRA BOOST LITCHI',
  'energie',
  10,
  8, 10, 12,
  40,
  'Hydratation profonde & récupération',
  ARRAY['Orange', 'Litchi', 'Électrolytes']::text[],
  ARRAY['Hydratation profonde', 'Récupération', 'Endurance']::text[],
  'Hydratation profonde & récupération',
  '🍊',
  true,
  ARRAY[]::text[]
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_small = EXCLUDED.price_small,
  price_medium = EXCLUDED.price_medium,
  price_large = EXCLUDED.price_large;

-- 5. Appliquer prix multi-tailles — Shakes (P:10 / M:14 / G:16)
UPDATE public.products SET
  price_small  = 10,
  price_medium = 14,
  price_large  = 16
WHERE category = 'shakes' AND active = true;

-- 6. Appliquer prix multi-tailles — Énergie (P:8 / M:10 / G:12)
UPDATE public.products SET
  price_small  = 8,
  price_medium = 10,
  price_large  = 12
WHERE category = 'energie' AND active = true;

-- 7. Appliquer prix multi-tailles — Wellness bar (P:8 / M:10 / G:12)
UPDATE public.products SET
  price_small  = 8,
  price_medium = 10,
  price_large  = 12
WHERE category = 'wellness' AND active = true;
