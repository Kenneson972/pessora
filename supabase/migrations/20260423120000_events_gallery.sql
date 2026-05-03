-- Galerie multi-photos pour les événements.
-- `image_url` reste l'image de couverture (rétrocompatibilité complète).
-- `gallery` stocke les photos additionnelles (URLs publiques Supabase Storage).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.gallery IS
  'Galerie additionnelle — URLs publiques du bucket event-images. La couverture reste dans image_url.';
