-- Pessora 19/09/2026 — nouveaux horaires d'ouverture (relevé de l'enseigne du bar).
--
-- Le modèle change : le LUNDI devient distinct du reste de la semaine
-- (16h00–19h00), ce que l'ancien `hours` (semaine / samedi / dimanche) ne peut pas
-- représenter. Deux gestes :
--   1. `opening_hours` — JSONB structuré, une plage par jour (index Date.getDay(),
--      0 = dimanche), la source unique lue par le front ;
--   2. rafraîchir l'ancien `hours` (JSONB array de {label, value}), que le PessoBot
--      n8n lit encore, pour qu'il ne réponde plus les vieilles heures.
--
-- Idempotent : ADD COLUMN IF NOT EXISTS + UPDATE (rejouable sans erreur).

ALTER TABLE public.bar_settings
  ADD COLUMN IF NOT EXISTS opening_hours jsonb;

UPDATE public.bar_settings
SET
  opening_hours = jsonb_build_object(
    '0', NULL,                                                       -- dimanche : fermé
    '1', jsonb_build_object('open', '16:00', 'close', '19:00'),      -- lundi
    '2', jsonb_build_object('open', '10:00', 'close', '19:00'),               -- mardi
    '3', jsonb_build_object('open', '10:00', 'close', '19:00'),               -- mercredi
    '4', jsonb_build_object('open', '10:00', 'close', '19:00'),               -- jeudi
    '5', jsonb_build_object('open', '10:00', 'close', '19:00'),               -- vendredi
    '6', jsonb_build_object('open', '09:00', 'close', '14:00')       -- samedi
  ),
  hours = jsonb_build_array(
    jsonb_build_object('label', 'Lundi',             'value', '16h00 - 19h00'),
    jsonb_build_object('label', 'Mardi au vendredi', 'value', '10h00 - 19h00'),
    jsonb_build_object('label', 'Samedi',            'value', '09h00 - 14h00'),
    jsonb_build_object('label', 'Dimanche',          'value', 'Fermé')
  )
WHERE id = 1;

COMMENT ON COLUMN public.bar_settings.opening_hours IS
  'Horaires structurés — source unique du front. { "0".."6" : {"open":"HH:MM","close":"HH:MM"} | null }, 0 = dimanche.';
