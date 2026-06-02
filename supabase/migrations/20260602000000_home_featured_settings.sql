-- PESSORA — Réglage global section "À la une"
CREATE TABLE IF NOT EXISTS public.home_featured_settings (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active      boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed row par défaut
INSERT INTO public.home_featured_settings (id, active)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.home_featured_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "home_featured_settings_select_public" ON public.home_featured_settings;
CREATE POLICY "home_featured_settings_select_public"
  ON public.home_featured_settings FOR SELECT
  USING (true);

-- Admin update uniquement
DROP POLICY IF EXISTS "home_featured_settings_update_admin" ON public.home_featured_settings;
CREATE POLICY "home_featured_settings_update_admin"
  ON public.home_featured_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
