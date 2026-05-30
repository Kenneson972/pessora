-- PESSORA — Supprime la FK dupliquée qui casse les embeddings PostgREST
-- La FK d'origine event_registrations_event_id_fkey suffit.
-- PGRST201: "more than one relationship was found for 'events' and 'event_registrations'"

ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS fk_event_registrations_event;
