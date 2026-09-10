-- PESSORA — correctif : l'admin doit pouvoir DELETE une ligne de bilan_bookings
--
-- Contexte : la migration 20260911100000 (blob 709359a949cf0220de9abd9941fc830b0ced42ee)
-- a resserre les grants herites du GRANT ALL par defaut :
--   REVOKE ALL ... FROM anon, authenticated;
--   GRANT SELECT, INSERT            TO anon;            -- DELETE volontairement exclu
--   GRANT SELECT, INSERT, UPDATE    TO authenticated;   -- DELETE oublie
--
-- Or l'ecran admin AdminBilans.tsx (l.168) supprime des lignes de la file, et
-- la policy "Admins can delete bookings" (is_admin()) l'autorise : il manquait
-- le privilege, pas la policy. Sans ce grant, le bouton supprimer est mort.
-- anon reste volontairement SANS DELETE.

BEGIN;
GRANT DELETE ON public.bilan_bookings TO authenticated;
COMMIT;
