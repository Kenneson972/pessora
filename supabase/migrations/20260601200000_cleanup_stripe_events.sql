-- PESSORA — P2-19: Nettoyage périodique stripe_events_processed (> 30 jours)
-- pg_cron doit être activé dans Supabase (Extensions → pg_cron)

-- Créer un job pg_cron pour purger les événements Stripe de plus de 30 jours
-- Exécution quotidienne à 3h du matin UTC
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-stripe-events',
      '0 3 * * *',
      $sql$ DELETE FROM public.stripe_events_processed WHERE created_at < NOW() - INTERVAL '30 days' $sql$
    );
  END IF;
END $do$;

-- Si pg_cron n'est pas disponible, exécuter manuellement de temps en temps :
-- DELETE FROM public.stripe_events_processed WHERE created_at < NOW() - INTERVAL '30 days';
