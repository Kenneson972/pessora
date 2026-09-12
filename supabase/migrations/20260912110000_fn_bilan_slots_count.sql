-- Landing challenge, "le CTA suit la FENÊTRE, pas isPast" (docs/CONSIGNES-CLAUDE.md,
-- 12/09, décision @user = option B). Trou mesuré en base le 12/09 : un
-- challenge daté J+30, registration_open=true, 0 créneau rattaché -> le
-- visiteur voit le CTA, le parcours auquel il mène est fermé (RLS refuse
-- toute réservation, aucun créneau visible en anon).
--
-- bilan_slots_select_bookable (RLS anon) n'expose QUE les créneaux
-- réservables -> un COUNT(*) en invoker s'effondre silencieusement :
-- "0 créneau créé" et "tous pris" rendent le même 0. Seule une fonction
-- SECURITY DEFINER voit aussi les créneaux pris, ce qui permet de
-- distinguer les deux (cas 3 "complets" vs cas 4 "pas encore créés").
--
-- Aucune fuite : bilan_slots = 5 colonnes, zéro donnée nominative (id,
-- date, heure, disponible, challenge_event_id) -- le PII vit dans
-- bilan_bookings, jamais dans ce qu'on compte ici. Un compteur ne dit pas
-- LESQUELS sont pris.

CREATE OR REPLACE FUNCTION public.fn_bilan_slots_count(p_challenge_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT count(*)::int FROM public.bilan_slots s
  JOIN public.events e ON e.id = s.challenge_event_id
  WHERE s.challenge_event_id = p_challenge_id AND e.type = 'challenge' AND e.active = true
$$;

-- active=true : même garde que fn_bilan_slot_bookable -- empêche de sonder
-- le compteur d'un challenge désactivé. Sans objet en pratique aujourd'hui
-- (ChallengeLandingPage filtre déjà type='challenge' AND active=true AND
-- date >= today), mais un challenge désactivé ne doit jamais répondre.

GRANT EXECUTE ON FUNCTION public.fn_bilan_slots_count(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.fn_bilan_slots_count(uuid) IS
  'Nombre total de créneaux de bilan (pris ou libres) rattachés à un '
  'challenge actif -- SECURITY DEFINER pour voir aussi les créneaux pris, '
  'que bilan_slots_select_bookable masque à anon. Sert uniquement à '
  'distinguer "complets" de "pas encore créés" sur la landing challenge ; '
  'ne révèle aucune ligne, seulement un entier.';
