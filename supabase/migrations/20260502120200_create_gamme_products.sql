-- PESSORA — Table gamme_products (Sport / Skin / Wellness)
CREATE TABLE IF NOT EXISTS public.gamme_products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gamme       text        NOT NULL CHECK (gamme IN ('sport', 'skin', 'wellness')),
  subcategory text,
  name        text        NOT NULL,
  description text,
  price       numeric     NOT NULL,
  price_alt   numeric,
  active      boolean     NOT NULL DEFAULT true,
  image_url   text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.gamme_products                IS 'Produits physiques vendus (Sport, Skin, Wellness)';
COMMENT ON COLUMN public.gamme_products.subcategory    IS 'Sous-catégorie : sport|encas (sport) · nettoyage|korean|contour|serum (skin) · null (wellness)';
COMMENT ON COLUMN public.gamme_products.price_alt      IS 'Prix alternatif — ex: Gel Nettoyant 29€/39€ (format différent)';

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS gamme_products_gamme_idx      ON public.gamme_products (gamme);
CREATE INDEX IF NOT EXISTS gamme_products_active_idx     ON public.gamme_products (active);
CREATE INDEX IF NOT EXISTS gamme_products_sort_order_idx ON public.gamme_products (gamme, sort_order);

-- RLS
ALTER TABLE public.gamme_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamme_products_select_public"  ON public.gamme_products;
CREATE POLICY "gamme_products_select_public"
  ON public.gamme_products FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "gamme_products_select_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_select_admin"
  ON public.gamme_products FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_insert_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_insert_admin"
  ON public.gamme_products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_update_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_update_admin"
  ON public.gamme_products FOR UPDATE
  TO authenticated
  USING      ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_delete_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_delete_admin"
  ON public.gamme_products FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));
