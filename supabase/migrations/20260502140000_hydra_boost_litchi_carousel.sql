-- Hydra Boost Litchi : présence sur le carrousel d’accueil (tri entre Blue Lagoon et Cookie Cream).
-- Avant cette migration le produit était inséré sans carousel_sort → invisible dans useHomeCarousel.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.products WHERE slug = 'hydra-boost-litchi' AND carousel_sort IS NULL
  ) THEN
    UPDATE public.products
    SET carousel_sort = carousel_sort + 1
    WHERE carousel_sort >= 3;

    UPDATE public.products
    SET carousel_sort = 3
    WHERE slug = 'hydra-boost-litchi';
  END IF;
END $$;
