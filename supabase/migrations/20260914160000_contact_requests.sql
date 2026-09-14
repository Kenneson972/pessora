-- Les demandes de contact (/contact, /contact-partenariat) partaient uniquement par email via
-- l'edge function send-contact-email : zéro trace en base, aucun écran admin pour les relire si
-- l'email est perdu, filtré en spam, ou si Catherine change d'adresse.
--
-- Cette table est écrite par l'edge function (service_role, RLS bypass) — pas d'INSERT public ici,
-- volontairement : le rate-limit et la validation Zod restent le seul chemin d'écriture.
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  nom text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contact_requests IS
  'Trace en base des messages envoyés depuis /contact et /contact-partenariat, écrite par l''edge function send-contact-email (service_role). Le message part toujours aussi par email (Resend) — cette table est le filet, pas le canal principal.';

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_requests_admin_select"
  ON public.contact_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "contact_requests_admin_update"
  ON public.contact_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_requests_admin_delete"
  ON public.contact_requests FOR DELETE
  USING (public.is_admin());
