-- Préférences UI admin (filtres listes, recherche) — synchronisées depuis le dashboard.
-- Stockage JSON par clé (ex. members_filters_v1) dans un objet unique par profil.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_ui_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.admin_ui_prefs IS
  'Préférences dashboard admin (JSON). Clés typiques : members_filters_v1, admin_events_filters_v1, admin_products_filters_v1.';
