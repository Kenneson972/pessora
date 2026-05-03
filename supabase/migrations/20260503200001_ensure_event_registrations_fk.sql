-- Garantir la FK events.id → event_registrations.event_id
-- (nécessaire pour la sub-query Supabase event_registrations(count) dans l'admin)
-- Idempotent : FK IF NOT EXISTS

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.constraint_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'event_registrations'
      AND rc.referenced_table_name = 'events'
  ) THEN
    ALTER TABLE public.event_registrations
      ADD CONSTRAINT fk_event_registrations_event
      FOREIGN KEY (event_id) REFERENCES public.events(id)
      ON DELETE CASCADE;
  END IF;
END $$;
