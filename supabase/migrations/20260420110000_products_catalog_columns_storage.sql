-- PESSORA — Catalogue produits (slug, pitch, badges, carrousel) + buckets Storage

-- ── Colonnes products ─────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS pitch text,
  ADD COLUMN IF NOT EXISTS icon_emoji text,
  ADD COLUMN IF NOT EXISTS badges text[],
  ADD COLUMN IF NOT EXISTS carousel_sort int,
  ADD COLUMN IF NOT EXISTS carousel_badge text;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_carousel_badge_check;
ALTER TABLE public.products ADD CONSTRAINT products_carousel_badge_check
  CHECK (carousel_badge IS NULL OR carousel_badge IN ('nouveaute', 'coup-de-coeur'));

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON public.products (slug);

COMMENT ON COLUMN public.products.slug IS 'Slug URL (ex. pink-dragon), stable pour /menu/:slug';

-- ── Storage : images produits & événements ────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies storage.objects (RLS activé par défaut sur Supabase)
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
CREATE POLICY "product_images_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_admin" ON storage.objects;
CREATE POLICY "product_images_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
CREATE POLICY "product_images_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'product-images' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;
CREATE POLICY "product_images_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "event_images_select_public" ON storage.objects;
CREATE POLICY "event_images_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "event_images_insert_admin" ON storage.objects;
CREATE POLICY "event_images_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "event_images_update_admin" ON storage.objects;
CREATE POLICY "event_images_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'event-images' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "event_images_delete_admin" ON storage.objects;
CREATE POLICY "event_images_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images' AND (SELECT public.is_admin()));
