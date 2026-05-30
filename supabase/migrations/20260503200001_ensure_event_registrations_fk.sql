-- Garantir la FK events.id → event_registrations.event_id
-- (nécessaire pour la sub-query Supabase event_registrations(count) dans l'admin)
-- Idempotent : FK IF NOT EXISTS

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_event_registrations_event'
      AND conrelid = 'event_registrations'::regclass
  ) THEN
    ALTER TABLE public.event_registrations
      ADD CONSTRAINT fk_event_registrations_event
      FOREIGN KEY (event_id) REFERENCES public.events(id)
      ON DELETE CASCADE;
  END IF;
END $$;
