-- ─────────────────────────────────────────────────────────────────────────────
-- PessoBot S3 — Rate limit + catalogue événements pour tool-calling
--
-- Objectifs :
--   1. Table `pessobot_rate_limit` append-only pour compter les requêtes.
--   2. RPC `fn_pessobot_rate_check(ip, session)` SECURITY DEFINER qui :
--        - purge les entrées > 10 min (housekeeping borné à 200 lignes / appel)
--        - compte la fenêtre IP (30 / 10 min) + session (5 / 10 s)
--        - insère un hit si autorisé
--        - renvoie { allowed boolean, reason text, retry_after_seconds int }
--   3. Vue `v_pessobot_events_upcoming` : prochains événements publics
--      (pour le futur tool `get_upcoming_events` du workflow n8n v3).
--   4. Grants au rôle `pessobot` : EXECUTE sur la RPC + SELECT sur la vue.
--      Aucun accès direct à la table `pessobot_rate_limit`.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Table append-only (une ligne par requête)
CREATE TABLE IF NOT EXISTS public.pessobot_rate_limit (
  id         bigserial PRIMARY KEY,
  bucket     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pessobot_rl_bucket_time
  ON public.pessobot_rate_limit (bucket, created_at DESC);

-- RLS en deny-all : seule la RPC SECURITY DEFINER peut y toucher.
ALTER TABLE public.pessobot_rate_limit ENABLE ROW LEVEL SECURITY;

-- 2. RPC rate-check
CREATE OR REPLACE FUNCTION public.fn_pessobot_rate_check(
  p_ip      text,
  p_session text
)
RETURNS TABLE (
  allowed             boolean,
  reason              text,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now        timestamptz := now();
  v_ip_bucket  text := 'ip:' || coalesce(nullif(p_ip, ''),      'unknown');
  v_sess_bucket text := 'session:' || coalesce(nullif(p_session, ''), 'unknown');
  v_ip_limit   int := 30;     -- 30 req / 10 min
  v_ip_window  interval := interval '10 minutes';
  v_sess_limit int := 5;      -- 5 req / 10 s
  v_sess_window interval := interval '10 seconds';
  v_ip_count   int;
  v_sess_count int;
  v_oldest_ip  timestamptz;
  v_oldest_sess timestamptz;
  v_retry_ip   int := 0;
  v_retry_sess int := 0;
BEGIN
  -- Housekeeping borné : purge les lignes > 1h (on garde ~10m actives seulement)
  DELETE FROM public.pessobot_rate_limit
  WHERE id IN (
    SELECT id FROM public.pessobot_rate_limit
    WHERE created_at < v_now - interval '1 hour'
    LIMIT 200
  );

  -- Fenêtre IP
  SELECT COUNT(*), MIN(created_at)
    INTO v_ip_count, v_oldest_ip
    FROM public.pessobot_rate_limit
   WHERE bucket = v_ip_bucket
     AND created_at > v_now - v_ip_window;

  IF v_ip_count >= v_ip_limit THEN
    v_retry_ip := GREATEST(1, ceil(extract(epoch FROM (v_oldest_ip + v_ip_window - v_now)))::int);
    RETURN QUERY SELECT false,
      format('Trop de requêtes (%s/%s en 10 min) — patience %s s', v_ip_count, v_ip_limit, v_retry_ip),
      v_retry_ip;
    RETURN;
  END IF;

  -- Fenêtre session
  SELECT COUNT(*), MIN(created_at)
    INTO v_sess_count, v_oldest_sess
    FROM public.pessobot_rate_limit
   WHERE bucket = v_sess_bucket
     AND created_at > v_now - v_sess_window;

  IF v_sess_count >= v_sess_limit THEN
    v_retry_sess := GREATEST(1, ceil(extract(epoch FROM (v_oldest_sess + v_sess_window - v_now)))::int);
    RETURN QUERY SELECT false,
      format('Rafale détectée (%s messages en 10 s) — pause %s s', v_sess_count, v_retry_sess),
      v_retry_sess;
    RETURN;
  END IF;

  -- Autorisé → on insère les 2 hits (IP + session)
  INSERT INTO public.pessobot_rate_limit (bucket) VALUES (v_ip_bucket);
  INSERT INTO public.pessobot_rate_limit (bucket) VALUES (v_sess_bucket);

  RETURN QUERY SELECT true, NULL::text, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_pessobot_rate_check(text, text) FROM PUBLIC;

-- 3. Vue événements à venir (publics, ouverts à l'inscription, actifs)
CREATE OR REPLACE VIEW public.v_pessobot_events_upcoming
WITH (security_invoker = on)
AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.date,
  e.heure,
  e.location,
  e.type,
  e.description,
  e.price,
  e.is_free,
  e.places_max,
  e.registration_open
FROM public.events e
WHERE e.active = true
  AND e.date >= CURRENT_DATE
ORDER BY e.date ASC, e.heure ASC;

COMMENT ON VIEW public.v_pessobot_events_upcoming IS
  'PessoBot tool get_upcoming_events : prochains événements publics actifs.';

-- 4. Grants rôle pessobot
GRANT EXECUTE ON FUNCTION public.fn_pessobot_rate_check(text, text) TO pessobot;
GRANT SELECT ON public.v_pessobot_events_upcoming TO pessobot;

-- Aucune autre ouverture : la table pessobot_rate_limit reste RLS deny-all,
-- seule la RPC SECURITY DEFINER peut y écrire et lire.
