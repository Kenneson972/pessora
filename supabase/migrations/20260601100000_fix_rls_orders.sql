-- PESSORA — Fix P0-1: RLS orders — restreindre la lecture par token
-- Remplace la policy trop permissive "Anyone can read order by access token"
-- qui exposait toutes les commandes (nom, tel, montants) via la clé anon

-- 1. Supprimer l'ancienne policy dangereuse
DROP POLICY IF EXISTS "Anyone can read order by access token" ON public.orders;

-- 2. Nouvelle policy : lecture authentifiée uniquement (admin + owner)
-- Les admins peuvent tout lire (via is_admin())
-- Les owners (user_id) peuvent lire leurs commandes
-- Les invités passent par l'Edge Function get-order-by-token (service_role, bypass RLS)
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'member') = 'admin')
  );

-- 3. Restreindre INSERT aux utilisateurs authentifiés OU à l'Edge Function (service_role)
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
