-- PESSORA — P1-16: Rate limiter distribué (PostgreSQL)
-- Remplace le Map in-memory par une table partagée entre instances Deno

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 minute'),
  PRIMARY KEY (key)
);

-- Fonction pour vérifier et incrémenter un compteur (atomique)
-- Retourne TRUE si la limite n'est pas dépassée, FALSE sinon
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER DEFAULT 30,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Nettoyer les entrées expirées
  DELETE FROM public.rate_limits WHERE reset_at < NOW();

  -- Insérer ou mettre à jour
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
  SET count = rate_limits.count + 1,
      reset_at = CASE
        WHEN rate_limits.reset_at < NOW()
        THEN NOW() + (p_window_seconds || ' seconds')::INTERVAL
        ELSE rate_limits.reset_at
      END
  RETURNING count, reset_at INTO v_count, v_reset;

  RETURN v_count <= p_max;
END;
$$;

-- Job pg_cron pour nettoyer périodiquement (toutes les 5 minutes)
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/5 * * * *',
  $$ DELETE FROM public.rate_limits WHERE reset_at < NOW() $$
);
