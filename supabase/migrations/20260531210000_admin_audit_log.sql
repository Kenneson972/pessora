-- PESSORA — Table d'audit admin (Phase 1)

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin peut tout voir
CREATE POLICY "Admins read all audit logs" ON public.admin_audit_log
  FOR SELECT
  USING (public.is_admin());

-- Admin peut créer des logs
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (public.is_admin());
