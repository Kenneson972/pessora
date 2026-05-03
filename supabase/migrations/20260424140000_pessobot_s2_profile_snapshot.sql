-- PESSORA — PessoBot S2 (Personnalisation minimale)
-- 1. Extension bar_settings.subscription_info (pitch Óra+ éditable)
-- 2. RPC fn_pessobot_profile_snapshot(user_id)
-- 3. Role pessobot (read-only, privilège minimum)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. bar_settings.subscription_info
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bar_settings
  ADD COLUMN IF NOT EXISTS subscription_info jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.bar_settings
SET subscription_info = jsonb_build_object(
  'ora_plus', jsonb_build_object(
    'name', 'Óra+',
    'tagline', 'Remises au bar, bilan bien-être, événements en priorité — sans engagement.',
    'price', '24,90€',
    'period', '/ mois',
    'highlight', 'Rentable dès la 4ᵉ boisson (2 boissons / semaine en moyenne)',
    'benefits', jsonb_build_array(
      'Jusqu''à -50% sur les boissons',
      'Sans engagement — résiliable à tout moment',
      'Bilan bien-être prioritaire',
      'Places prioritaires aux événements communauté'
    ),
    'cta_url', 'https://pessora.mq/ora-plus'
  )
)
WHERE id = 1 AND (subscription_info IS NULL OR subscription_info = '{}'::jsonb);

COMMENT ON COLUMN public.bar_settings.subscription_info IS
  'Détail des formules d''abonnement (Óra+, futurs plans) — injecté dans le system prompt PessoBot.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC fn_pessobot_profile_snapshot
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_pessobot_profile_snapshot(p_user_id uuid)
RETURNS TABLE (
  first_name            text,
  role                  text,
  plan                  text,
  subscription_status   text,
  subscription_end_date date,
  favorite_product      jsonb,
  upcoming_event        jsonb,
  upcoming_bilan        jsonb,
  total_orders          integer,
  last_order_at         timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.first_name,
    p.role,
    sub.plan,
    sub.status AS subscription_status,
    sub.end_date AS subscription_end_date,
    fav.favorite_product,
    ev.upcoming_event,
    bil.upcoming_bilan,
    COALESCE(ords.total_orders, 0)::int AS total_orders,
    ords.last_order_at
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT s.plan, s.status, s.end_date
    FROM public.subscriptions s
    WHERE s.user_id = p.id AND s.status = 'active'
    ORDER BY s.start_date DESC
    LIMIT 1
  ) sub ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'product_id', oi.product_id,
      'name', COALESCE(pr.name, oi.product_name),
      'slug', pr.slug,
      'orders_count', SUM(oi.quantity)
    ) AS favorite_product
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products pr ON pr.id = oi.product_id
    WHERE o.user_id = p.id AND o.status IN ('paid','completed','fulfilled')
    GROUP BY oi.product_id, pr.name, oi.product_name, pr.slug
    ORDER BY SUM(oi.quantity) DESC
    LIMIT 1
  ) fav ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'slug', e.slug,
      'date', e.date,
      'heure', e.heure,
      'location', e.location
    ) AS upcoming_event
    FROM public.event_registrations er
    JOIN public.events e ON e.id = er.event_id
    WHERE er.user_id = p.id AND e.date >= CURRENT_DATE
    ORDER BY e.date ASC, e.heure ASC
    LIMIT 1
  ) ev ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'id', bb.id,
      'date_rdv', bb.date_rdv,
      'heure_rdv', bb.heure_rdv,
      'statut', bb.statut
    ) AS upcoming_bilan
    FROM public.bilan_bookings bb
    WHERE bb.user_id = p.id
      AND bb.date_rdv >= CURRENT_DATE
      AND bb.statut <> 'annule'
    ORDER BY bb.date_rdv ASC, bb.heure_rdv ASC
    LIMIT 1
  ) bil ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_orders,
      MAX(o.created_at) AS last_order_at
    FROM public.orders o
    WHERE o.user_id = p.id AND o.status IN ('paid','completed','fulfilled')
  ) ords ON true
  WHERE p.id = p_user_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.fn_pessobot_profile_snapshot(uuid) IS
  'Snapshot d''un profil pour PessoBot (first_name, plan actif, produit favori, prochain événement/bilan, totaux commandes). SECURITY DEFINER : lit les tables sensibles de manière contrôlée.';

REVOKE ALL ON FUNCTION public.fn_pessobot_profile_snapshot(uuid) FROM PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Rôle pessobot (read-only — privilège minimum pour n8n)
-- ─────────────────────────────────────────────────────────────────────────────
-- Note : le password est à définir post-migration via ALTER ROLE
-- (ne pas committer en dur). Exemple : ALTER ROLE pessobot WITH PASSWORD '...';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pessobot') THEN
    CREATE ROLE pessobot LOGIN NOINHERIT;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO pessobot;
GRANT USAGE ON SCHEMA public TO pessobot;

GRANT EXECUTE ON FUNCTION public.fn_pessobot_profile_snapshot(uuid) TO pessobot;
GRANT SELECT ON public.bar_settings TO pessobot;
GRANT SELECT ON public.v_pessobot_menu TO pessobot;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM pessobot;
GRANT SELECT ON public.bar_settings TO pessobot;
GRANT SELECT ON public.v_pessobot_menu TO pessobot;

COMMENT ON ROLE pessobot IS
  'Role read-only utilisé par n8n pour PessoBot. Accès limité à fn_pessobot_profile_snapshot + bar_settings + v_pessobot_menu.';
