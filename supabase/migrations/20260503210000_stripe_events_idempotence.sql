-- PESSORA — Idempotence Stripe Webhook Events
--
-- Empêche le traitement en double des événements Stripe
-- quand Stripe renvoie un webhook (retry, latence réseau, etc.)

CREATE TABLE IF NOT EXISTS public.stripe_events_processed (
  id               text        PRIMARY KEY,
  type             text        NOT NULL,
  handled_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.stripe_events_processed IS 'Trace les événements Stripe déjà traités (idempotence webhook)';
COMMENT ON COLUMN public.stripe_events_processed.id   IS 'Identifiant unique Stripe de l''événement (event.id)';
COMMENT ON COLUMN public.stripe_events_processed.type IS 'Type d''événement (ex: checkout.session.completed)';

-- Nettoyage automatique des vieilles entrées (> 30 jours)
CREATE INDEX IF NOT EXISTS stripe_events_processed_handled_at_idx
  ON public.stripe_events_processed (handled_at);
