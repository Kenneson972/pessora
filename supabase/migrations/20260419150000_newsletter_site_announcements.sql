-- PESSORA — Newsletter + popups d’annonces (homepage)
-- Prérequis : public.is_admin() (migration dashboard).

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 1. Popups site (inspiré du modèle DALCIELO : types, priorité, dismiss) ──
CREATE TABLE IF NOT EXISTS public.site_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'promo'
    CHECK (type IN ('featured', 'promo', 'event', 'alert')),
  title text NOT NULL,
  subtitle text,
  message text,
  image_url text,
  cta_label text,
  cta_url text,
  price numeric(10,2),
  expires_at date,
  active boolean NOT NULL DEFAULT false,
  dismiss_mode text NOT NULL DEFAULT 'once_daily'
    CHECK (dismiss_mode IN ('once_daily', 'once_session')),
  priority int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_announcements_active_priority_idx
  ON public.site_announcements (active, priority, created_at DESC);

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active site announcements"
  ON public.site_announcements FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND (expires_at IS NULL OR expires_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date)
  );

CREATE POLICY "Admin read all site announcements"
  ON public.site_announcements FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin insert site announcements"
  ON public.site_announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update site announcements"
  ON public.site_announcements FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete site announcements"
  ON public.site_announcements FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS site_announcements_updated_at ON public.site_announcements;
CREATE TRIGGER site_announcements_updated_at
  BEFORE UPDATE ON public.site_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. Inscriptions newsletter ──
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  consent boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'footer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_idx
  ON public.newsletter_subscribers (created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe with valid email"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    consent = true
    AND char_length(email) <= 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

CREATE POLICY "Admin read newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin delete newsletter subscriber"
  ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (public.is_admin());
