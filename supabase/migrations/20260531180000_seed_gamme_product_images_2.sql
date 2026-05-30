-- PESSORA — Seed gamme_products v2 — SKU trouvés par Élise + corrections

-- Sport : LiftOff Pamplemousse (192k)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-192k-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%liftoff%pamplemousse%';

-- Sport : Gel Prolong (1424)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1424-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%gel%prolong%';

-- Skin : Gommage (508k)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-508k-fr.png'
  WHERE gamme = 'skin' AND name ILIKE '%gommage%';

-- Skin : Lotion Tonique Revitalisant (539k)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-539k-fr.png'
  WHERE gamme = 'skin' AND name ILIKE '%lotion%tonique%';
