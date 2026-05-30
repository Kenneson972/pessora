-- PESSORA — RLS bilan_slots + bilan_bookings + standardisation is_admin() + corrections

-- ══════════════════════════════════════════════════════════════════════════
-- 1. Standardisation : remplacer les anciennes politiques inline par is_admin()
-- ══════════════════════════════════════════════════════════════════════════

-- 1a. products — recréer les politiques admin avec is_admin()
DROP POLICY IF EXISTS "products_select_admin" ON public.products;
CREATE POLICY "products_select_admin"
  ON public.products FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- 1b. events — recréer les politiques admin avec is_admin()
DROP POLICY IF EXISTS "events_select_admin" ON public.events;
CREATE POLICY "events_select_admin"
  ON public.events FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
CREATE POLICY "events_insert_admin"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_update_admin" ON public.events;
CREATE POLICY "events_update_admin"
  ON public.events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
CREATE POLICY "events_delete_admin"
  ON public.events FOR DELETE
  USING (public.is_admin());

-- 1c. home_banner — recréer la politique admin avec is_admin()
DROP POLICY IF EXISTS "home_banner_update_admin" ON public.home_banner;
CREATE POLICY "home_banner_update_admin"
  ON public.home_banner FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 2. bilan_slots — RLS complet
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.bilan_slots ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les créneaux disponibles
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.bilan_slots;
CREATE POLICY "Anyone can view available slots" ON public.bilan_slots
  FOR SELECT
  USING (is_available = true AND slot_date >= CURRENT_DATE);

-- Admin peut tout voir
DROP POLICY IF EXISTS "Admins can view all slots" ON public.bilan_slots;
CREATE POLICY "Admins can view all slots" ON public.bilan_slots
  FOR SELECT
  USING (public.is_admin());

-- Admin peut créer des créneaux
DROP POLICY IF EXISTS "Admins can insert slots" ON public.bilan_slots;
CREATE POLICY "Admins can insert slots" ON public.bilan_slots
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admin peut modifier des créneaux
DROP POLICY IF EXISTS "Admins can update slots" ON public.bilan_slots;
CREATE POLICY "Admins can update slots" ON public.bilan_slots
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin peut supprimer des créneaux
DROP POLICY IF EXISTS "Admins can delete slots" ON public.bilan_slots;
CREATE POLICY "Admins can delete slots" ON public.bilan_slots
  FOR DELETE
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 3. bilan_bookings — RLS complet (membres + admin)
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.bilan_bookings ENABLE ROW LEVEL SECURITY;

-- Admin peut tout voir
DROP POLICY IF EXISTS "Admins read all bilan bookings" ON public.bilan_bookings;
CREATE POLICY "Admins read all bilan bookings" ON public.bilan_bookings
  FOR SELECT
  USING (public.is_admin());

-- Membre voit SES réservations
DROP POLICY IF EXISTS "Users read own bookings" ON public.bilan_bookings;
CREATE POLICY "Users read own bookings" ON public.bilan_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Membre peut réserver un créneau
DROP POLICY IF EXISTS "Users can create bookings" ON public.bilan_bookings;
CREATE POLICY "Users can create bookings" ON public.bilan_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Membre peut annuler sa réservation
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bilan_bookings;
CREATE POLICY "Users can cancel own bookings" ON public.bilan_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin peut modifier toute réservation
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bilan_bookings;
CREATE POLICY "Admins can update bookings" ON public.bilan_bookings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin peut supprimer toute réservation
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bilan_bookings;
CREATE POLICY "Admins can delete bookings" ON public.bilan_bookings
  FOR DELETE
  USING (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 4. profiles UPDATE — ajouter WITH CHECK
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 5. stripe_events_processed — deny all via API publique
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access" ON public.stripe_events_processed;
CREATE POLICY "Deny all access" ON public.stripe_events_processed
  FOR ALL
  USING (false)
  WITH CHECK (false);
