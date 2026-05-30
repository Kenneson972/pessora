-- PESSORA — Bannière home indépendante
CREATE TABLE IF NOT EXISTS public.home_banner (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title       text NOT NULL DEFAULT 'Un concentré de bien-être au naturel',
  subtitle    text NOT NULL DEFAULT '',
  image_url   text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed row par défaut
INSERT INTO public.home_banner (id, title, subtitle)
VALUES (1, 'Un concentré de bien-être au naturel', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.home_banner ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "home_banner_select_public" ON public.home_banner;
CREATE POLICY "home_banner_select_public"
  ON public.home_banner FOR SELECT
  USING (true);

-- Admin update uniquement (pas de delete/insert supplémentaire)
DROP POLICY IF EXISTS "home_banner_update_admin" ON public.home_banner;
CREATE POLICY "home_banner_update_admin"
  ON public.home_banner FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
