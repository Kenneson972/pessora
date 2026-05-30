-- PESSORA — Seed gamme_products avec URLs images Herbalife officielles
-- Pattern: https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png

-- ══════════════════════ WELLNESS ══════════════════════
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1065-fr.png'
  WHERE gamme = 'wellness' AND name ILIKE '%aloe%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-182k-fr.png'
  WHERE gamme = 'wellness' AND name ILIKE '%thé%detox%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2554-fr.png'
  WHERE gamme = 'wellness' AND name ILIKE '%fibre%';

-- Collagène → Collagen Skin Booster (SKU 076K)
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-076k-fr.png'
  WHERE gamme = 'wellness' AND name ILIKE '%collagène%';

-- ══════════════════════ SPORT ══════════════════════
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-048k-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%formula%1%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-488k-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%créatine%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-013k-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%rebuild%whey%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-2600-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%protein%drink%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-3152-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%liftoff%citron%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-192k-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%liftoff%pamplemousse%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-1424-fr.png'
  WHERE gamme = 'sport' AND name ILIKE '%gel%prolong%';

-- ══════════════════════ SKIN ══════════════════════
UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-511k-fr.png'
  WHERE gamme = 'skin' AND name ILIKE '%gel%nettoyant%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-513k-fr.png'
  WHERE gamme = 'skin' AND name ILIKE '%crème%tension%';

UPDATE public.gamme_products SET image_url = 'https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-515k-fr.png'
  WHERE gamme = 'skin' AND name ILIKE '%contour%yeux%';

-- Gommage → PAS pc-508k (c'est Sérum Niacinamide). Image réelle à trouver.
-- Lotion Tonique → PAS pc-539k (c'est Crème de Nuit). Image réelle à trouver.
