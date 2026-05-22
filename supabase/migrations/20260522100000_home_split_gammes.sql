-- Table des 4 onglets "Choisis ton moment"
CREATE TABLE IF NOT EXISTS home_split_gammes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key              TEXT UNIQUE NOT NULL,
  position         INTEGER NOT NULL,
  label            TEXT NOT NULL,
  eyebrow          TEXT NOT NULL,
  title            TEXT NOT NULL,
  link_to          TEXT NOT NULL,
  main_image_url   TEXT,
  side_image_1_url TEXT,
  side_image_2_url TEXT,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE home_split_gammes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "split_gammes_public_read"
  ON home_split_gammes FOR SELECT
  USING (true);

CREATE POLICY "split_gammes_admin_update"
  ON home_split_gammes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4 onglets pré-chargés avec les textes actuels
INSERT INTO home_split_gammes (key, position, label, eyebrow, title, link_to)
VALUES
  ('wellness', 1, 'Wellness', 'Wellness · PessÓra',  'Un concentré de bien-être au naturel', '/menu?gamme=wellness'),
  ('energie',  2, 'Énergie',  'Énergie · PessÓra',   'Ton boost pour la journée',             '/menu?gamme=energie'),
  ('shakes',   3, 'Shakes',   'Shakes · PessÓra',    'Protéines & gourmandise',               '/menu?gamme=shakes'),
  ('coffee',   4, 'Coffee',   'Coffee · Martinique',  'Café glacé à la martiniquaise',          '/menu?gamme=coffee')
ON CONFLICT (key) DO NOTHING;

-- Bucket Storage pour les photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'split-gammes-images',
  'split-gammes-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "split_gammes_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'split-gammes-images');

CREATE POLICY "split_gammes_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'split-gammes-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "split_gammes_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'split-gammes-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
