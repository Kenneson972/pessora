-- PESSORA — Seed gamme_products v3 — SKU trouvés par Élise

-- Collagène (076k)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-076k-fr.png'
  WHERE gamme = 'wellness' AND name ILIKE '%collagène%';

-- Omega 3 — source externe vercorssportsteam
UPDATE public.gamme_products SET image_url = 'https://www.vercorssportsteam.com/wp-content/uploads/2019/04/vercorssportsteam-photo-Herbalife-line-Max-Herbalife-600x600.jpg'
  WHERE gamme = 'sport' AND name ILIKE '%omega%3%';

-- Hydrate (3150)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-3150-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%hydrate%';

-- Lotion Tonique Revitalisant
UPDATE public.gamme_products SET image_url = 'https://cdn.webshopapp.com/shops/68973/files/30395316/555x555x2/lotion-tonique-revitalisant.jpg'
  WHERE gamme = 'skin' AND name ILIKE '%lotion%tonique%';
