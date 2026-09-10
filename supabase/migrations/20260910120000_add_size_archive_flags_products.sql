-- PESSORA — Archivage par taille (admin retire/remet une taille sans passer par nous)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_small_active  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price_medium_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price_large_active  boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.price_small_active  IS 'Taille Petit visible/vendable si true (indépendant de products.active)';
COMMENT ON COLUMN public.products.price_medium_active IS 'Taille Moyen visible/vendable si true';
COMMENT ON COLUMN public.products.price_large_active  IS 'Taille Grand visible/vendable si true';
