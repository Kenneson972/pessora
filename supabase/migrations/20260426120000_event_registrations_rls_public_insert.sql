-- Inscriptions événements : la politique FOR ALL réservée aux admins bloquait anon/membres (42501).
-- On scinde l’admin et on autorise INSERT public pour événements actifs + ouverture des inscriptions.
-- Idempotent : DROP de toutes les politiques gérées ici (réexécution SQL Editor / repair).

DROP POLICY IF EXISTS "Admins manage all registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_select_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_insert_public" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_select" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_insert" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_select_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_public" ON public.event_registrations;

-- Admin : lecture / écriture complète
CREATE POLICY "event_registrations_admin_select"
  ON public.event_registrations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "event_registrations_admin_insert"
  ON public.event_registrations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "event_registrations_admin_update"
  ON public.event_registrations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_registrations_admin_delete"
  ON public.event_registrations FOR DELETE
  USING (public.is_admin());

-- Membre connecté : ses lignes
CREATE POLICY "event_registrations_select_own"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Formulaire public / membre : une inscription par événement ouvert
CREATE POLICY "event_registrations_insert_public"
  ON public.event_registrations FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_id
        AND coalesce(e.active, true) = true
        AND coalesce(e.registration_open, true) = true
    )
  );
