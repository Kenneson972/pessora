-- Galerie « photos partagées » par GAMME (Skin d'abord ; le même mécanisme servira Sport/Wellness).
-- Même motif que events.gallery (page Challenge) : Catherine dépose depuis son admin, le bloc
-- reste invisible tant que la galerie est vide, jamais de photo de démonstration ni achetée.
-- Distinct de gamme_products.gallery (= flacons) : un flacon ne doit jamais apparaître sous le
-- titre « photos partagées par les participantes ». Les photos sont des URLs publiques du
-- bucket dédié gamme-gallery-images.

CREATE TABLE IF NOT EXISTS public.gamme_galleries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gamme      TEXT UNIQUE NOT NULL,          -- 'skin' | 'sport' | 'wellness' (aligné sur gamme_products.gamme)
  pairs      JSONB NOT NULL DEFAULT '[]',  -- [{"avant": url, "apres": url, "legende": null}] — une paire = l'avant et l'après de la même personne
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gamme_galleries IS
  'Paires avant/après déposées par Catherine, une ligne par gamme (pairs = jsonb).';

COMMENT ON COLUMN public.gamme_galleries.pairs IS
  'JSONB : [{"avant": url, "apres": url, "legende": null}]. Une paire incomplète ne doit jamais être publiée (filtrée côté front).';

ALTER TABLE public.gamme_galleries ENABLE ROW LEVEL SECURITY;

-- Intention lisible : anon lit, n'écrit jamais (et n'a ni TRUNCATE ni DDL). L'écriture passe
-- par authenticated + RLS is_admin(). Le GRANT ALL par défaut de Supabase est resserré ici.
GRANT SELECT ON public.gamme_galleries TO anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.gamme_galleries FROM anon;

-- Lecture publique : les photos publiées sont visibles par tout visiteur.
DROP POLICY IF EXISTS "gamme_galleries_public_read" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_public_read"
  ON public.gamme_galleries FOR SELECT
  USING (true);

-- Écriture réservée à l'admin (Catherine), rôle authentifié uniquement.
DROP POLICY IF EXISTS "gamme_galleries_admin_insert" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_insert"
  ON public.gamme_galleries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gamme_galleries_admin_update" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_update"
  ON public.gamme_galleries FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gamme_galleries_admin_delete" ON public.gamme_galleries;
CREATE POLICY "gamme_galleries_admin_delete"
  ON public.gamme_galleries FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Ligne 'skin' pré-créée (galerie vide) : le bloc reste invisible tant qu'elle est vide.
INSERT INTO public.gamme_galleries (gamme, pairs)
VALUES ('skin', '[]')
ON CONFLICT (gamme) DO NOTHING;

-- updated_at rafraîchi à chaque modification — fonction canonique set_updated_at()
-- (déjà utilisée par site_announcements et bar_settings), pas une copie.
DROP TRIGGER IF EXISTS trg_gamme_galleries_set_updated_at ON public.gamme_galleries;
CREATE TRIGGER trg_gamme_galleries_set_updated_at
  BEFORE UPDATE ON public.gamme_galleries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bucket Storage dédié (lecture publique, écriture admin). HEIC/HEIF acceptés : c'est le
-- premier bucket que Catherine remplit depuis son iPhone — le FRONT doit les convertir en
-- JPEG avant de publier (un HEIC ne s'affiche que dans Safari, pas dans Chrome/Firefox).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gamme-gallery-images',
  'gamme-gallery-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gamme_gallery_images_public_read" ON storage.objects;
CREATE POLICY "gamme_gallery_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gamme-gallery-images');

DROP POLICY IF EXISTS "gamme_gallery_images_admin_insert" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gamme-gallery-images' AND public.is_admin());

DROP POLICY IF EXISTS "gamme_gallery_images_admin_update" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gamme-gallery-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'gamme-gallery-images' AND public.is_admin());

DROP POLICY IF EXISTS "gamme_gallery_images_admin_delete" ON storage.objects;
CREATE POLICY "gamme_gallery_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gamme-gallery-images' AND public.is_admin());
