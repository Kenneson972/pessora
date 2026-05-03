-- Nettoyage RLS inscriptions : supprime les anciennes policies dashboard trop larges
-- et recrée l'accès voulu de façon idempotente.

DROP POLICY IF EXISTS "Admins manage all registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_select_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_insert_public" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_select" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_insert" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_select_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_public" ON public.event_registrations;

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

CREATE POLICY "event_registrations_select_own"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

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
