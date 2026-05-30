-- PESSORA — RLS products + events (Post-Audit P0)

-- ══════════════════════════════════════════════════════════════════════════
-- 1. products
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public : lecture de tous les produits (le filtrage active/inactif est côté app)
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

-- Admin : lecture complète (y compris inactifs)
DROP POLICY IF EXISTS "products_select_admin" ON public.products;
CREATE POLICY "products_select_admin"
  ON public.products FOR SELECT
  USING (public.is_admin());

-- Admin : création
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

-- Admin : modification
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin : suppression
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 2. events
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public : lecture de tous les événements (le filtrage active/inactif est côté app)
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  USING (true);

-- Admin : lecture complète
DROP POLICY IF EXISTS "events_select_admin" ON public.events;
CREATE POLICY "events_select_admin"
  ON public.events FOR SELECT
  USING (public.is_admin());

-- Admin : création
DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
CREATE POLICY "events_insert_admin"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin());

-- Admin : modification
DROP POLICY IF EXISTS "events_update_admin" ON public.events;
CREATE POLICY "events_update_admin"
  ON public.events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin : suppression
DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
CREATE POLICY "events_delete_admin"
  ON public.events FOR DELETE
  USING (public.is_admin());
