-- PESSORA — Fix RLS public SELECT (trop restrictif → blocage PGRST201)
-- Les policies précédentes filtraient sur active=true, ce qui cassait les
-- embeddings (event_registrations(count)) et le carrousel (pas de filtre active).

-- products : lecture publique sans filtre (le filtrage est côté app)
DROP POLICY IF EXISTS "products_select_public_active" ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

-- events : lecture publique sans filtre (le filtrage est côté app)
DROP POLICY IF EXISTS "events_select_public_active" ON public.events;
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  USING (true);
