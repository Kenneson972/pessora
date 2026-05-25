-- Ajout d'un slug URL pour les produits de gamme.
-- Remplit automatiquement les lignes existantes via le nom.
ALTER TABLE public.gamme_products
  ADD COLUMN IF NOT EXISTS slug text;

-- Slug unique par gamme (pas de doublons de slug dans une même gamme)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gamme_products_slug ON public.gamme_products (slug);

COMMENT ON COLUMN public.gamme_products.slug IS
  'Slug URL unique — auto-généré depuis le nom. Utilisé par RangeDetail et GammeProductDetail.';
