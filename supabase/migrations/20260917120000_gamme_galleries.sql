-- Galerie « photos partagées » par GAMME (Skin d'abord ; le même mécanisme servira Sport/Wellness).
-- Même motif que events.gallery (page Challenge) : Catherine dépose depuis son admin, le bloc
-- reste invisible tant que la galerie est vide, jamais de photo de démonstration ni achetée.
-- Distinct de gamme_products.gallery (= flacons) : un flacon ne doit jamais apparaître sous le
-- titre « photos partagées par les participantes ». Les photos sont des URLs publiques du
-- bucket dédié gamme-gallery-images.

CREATE TABLE IF NOT EXISTS public.gamme_galleries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gamme      TEXT UNIQUE NOT NULL,          -- 'skin' | 'sport' | 'wellness' (aligné sur gamme_products.gamme)
  gallery    TEXT[] NOT NULL DEFAULT '{}',  -- URLs publiques (gamme-gallery-images)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gamme_galleries IS
  'Photos avant/après déposées par Catherine, une ligne par gamme.';

ALTER TABLE public.gamme_galleries ENABLE ROW LEVEL SECURITY;

-- Lecture publique : les photos publiées sont visibles par tout visiteur.
DROP POLICY IF EXISTS "gamme_galleries_public_read" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_public_read"
  ON public.gamme_galleries FOR SELECT
  USING (true);

-- Écriture réservée à l'admin (Catherine).
DROP POLICY IF EXISTS "gamme_galleries_admin_insert" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_insert"
  ON public.gamme_galleries FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gamme_galleries_admin_update" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_update"
  ON public.gamme_galleries FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gamme_galleries_admin_delete" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_delete"
  ON public.gamme_galleries FOR DELETE
  USING (public.is_admin());

-- Ligne 'skin' pré-créée (galerie vide) : le bloc reste invisible tant qu'elle est vide.
INSERT INTO public.gamme_galleries (gamme, gallery)
VALUES ('skin', '{}')
ON CONFLICT (gamme) DO NOTHING;

-- Bucket Storage dédié (lecture publique, écriture admin).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gamme-gallery-images',
  'gamme-gallery-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gamme_gallery_images_public_read" ON storage.objects;
CREATE POLICY "gamme_gallery_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gamme-gallery-images');

DROP POLICY IF EXISTS "gamme_gallery_images_admin_insert" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gamme-gallery-images' AND public.is_admin());

DROP POLICY IF EXISTS "gamme_gallery_images_admin_update" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gamme-gallery-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'gamme-gallery-images' AND public.is_admin());

DROP POLICY IF EXISTS "gamme_gallery_images_admin_delete" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gamme-gallery-images' AND public.is_admin());
