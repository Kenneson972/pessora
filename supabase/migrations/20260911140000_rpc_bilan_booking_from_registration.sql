-- PESSORA — Lot "PROCHAIN LOT #1" (docs/CONSIGNES-CLAUDE.md) : RPC questionnaire
-- post-inscription -> file de Catherine (bilan_bookings), débloque le critère ⑨
-- (origine = 'questionnaire').
--
-- Avant ce lot : la réponse "je veux mon bilan" du questionnaire partait dans
-- event_registrations.post_registration_details (jsonb) que personne
-- n'affiche. Cette migration ajoute une RPC dédiée qui transforme cette
-- réponse en une vraie ligne bilan_bookings, visible dans l'onglet
-- "Demandes" de AdminBilans.

-- 1) fn_save_post_registration_survey : bilan_offert redevient obligatoire,
--    mais UNIQUEMENT pour les événements type='challenge' (pas pour tous les
--    types comme avant le 10/09 -- c'était l'erreur d'origine, cf.
--    20260910180000). Les autres types (run_club, event, ...) restent
--    inchangés : bilan_offert y est toujours optionnel/ignoré.
CREATE OR REPLACE FUNCTION public.fn_save_post_registration_survey(p_registration_id uuid, p_telephone text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reg public.event_registrations;
  v_event_type text;
  v_norm_reg text;
  v_norm_in text;
  v_key text;
BEGIN
  SELECT * INTO v_reg
  FROM public.event_registrations
  WHERE id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'registration_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_reg.post_registration_details IS NOT NULL THEN
    RAISE EXCEPTION 'already_completed' USING ERRCODE = 'P0001';
  END IF;

  v_norm_reg := lower(regexp_replace(trim(coalesce(v_reg.telephone, '')), '\s+', '', 'g'));
  v_norm_in := lower(regexp_replace(trim(coalesce(p_telephone, '')), '\s+', '', 'g'));

  IF v_norm_reg IS DISTINCT FROM v_norm_in THEN
    RAISE EXCEPTION 'telephone_mismatch' USING ERRCODE = 'P0001';
  END IF;

  SELECT e.type INTO v_event_type
  FROM public.events e
  WHERE e.id = v_reg.event_id;

  IF v_event_type IS NULL THEN
    RAISE EXCEPTION 'event_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_event_type <> 'run_club' THEN
    FOR v_key IN SELECT jsonb_object_keys(p_payload)
    LOOP
      IF v_key IN (
        'precommande_offre',
        'gaufre_salee',
        'gaufre_salee_autre',
        'gaufre_sucree_notes'
      ) THEN
        RAISE EXCEPTION 'invalid_payload_keys' USING ERRCODE = 'P0001';
      END IF;
    END LOOP;
  END IF;

  IF v_event_type = 'challenge' THEN
    IF coalesce(trim(p_payload->>'bilan_offert'), '') = '' THEN
      RAISE EXCEPTION 'missing_bilan_offert' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF coalesce(trim(p_payload->>'objectif_principal'), '') = '' THEN
    RAISE EXCEPTION 'missing_objectif_principal' USING ERRCODE = 'P0001';
  END IF;

  IF v_event_type = 'run_club' THEN
    IF coalesce(trim(p_payload->>'precommande_offre'), '') = '' THEN
      RAISE EXCEPTION 'missing_precommande_offre' USING ERRCODE = 'P0001';
    END IF;
    IF coalesce(trim(p_payload->>'gaufre_salee'), '') = '' THEN
      RAISE EXCEPTION 'missing_gaufre_salee' USING ERRCODE = 'P0001';
    END IF;
    IF trim(p_payload->>'gaufre_salee') = 'Autre' THEN
      IF coalesce(trim(p_payload->>'gaufre_salee_autre'), '') = '' THEN
        RAISE EXCEPTION 'missing_gaufre_salee_autre' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  UPDATE public.event_registrations
  SET post_registration_details = p_payload
  WHERE id = p_registration_id;

  RETURN p_payload;
END;
$function$;

-- 2) fn_create_bilan_booking_from_registration : lit event_registrations
--    (jamais le payload client) pour nom/prenom/telephone, refuse si
--    l'événement n'est pas un challenge, et crée la ligne bilan_bookings.
CREATE OR REPLACE FUNCTION public.fn_create_bilan_booking_from_registration(
  p_registration_id uuid,
  p_telephone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_reg public.event_registrations;
  v_event_type text;
  v_norm_reg text;
  v_norm_in text;
  v_booking_id uuid;
BEGIN
  SELECT * INTO v_reg
  FROM public.event_registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'registration_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- Vérification d'appartenance sans auth obligatoire (même mécanisme que
  -- fn_save_post_registration_survey) : ferme le forgeage d'un
  -- p_registration_id d'un autre visiteur.
  v_norm_reg := lower(regexp_replace(trim(coalesce(v_reg.telephone, '')), '\s+', '', 'g'));
  v_norm_in := lower(regexp_replace(trim(coalesce(p_telephone, '')), '\s+', '', 'g'));

  IF v_norm_reg IS DISTINCT FROM v_norm_in THEN
    RAISE EXCEPTION 'telephone_mismatch' USING ERRCODE = 'P0001';
  END IF;

  SELECT e.type INTO v_event_type
  FROM public.events e
  WHERE e.id = v_reg.event_id;

  IF v_event_type IS DISTINCT FROM 'challenge' THEN
    RAISE EXCEPTION 'event_not_challenge' USING ERRCODE = 'P0004';
  END IF;

  -- origine = 'questionnaire' lu par le trigger trg_bilan_booking_before_insert
  -- (fn_bilan_booking_before_insert, migration 20260911100000) via ce GUC.
  -- 'true' = is_local obligatoire : sans lui la valeur persisterait sur la
  -- connexion PostgREST (poolée) et étiquetterait la requête suivante d'un
  -- AUTRE client comme "questionnaire" -- fuite silencieuse, cosmétique
  -- mais réelle (cf. docs/CONSIGNES-CLAUDE.md).
  PERFORM set_config('pessora.bilan_origine', 'questionnaire', true);

  -- SECURITY DEFINER : cette RPC contourne les policies RLS. Elle pose donc
  -- elle-même statut/date/origine (via le trigger) et challenge_event_id.
  -- Volontairement, ce chemin N'HÉRITE PAS de la garde J+7
  -- (fn_challenge_window_ok, policy bilan_bookings_insert_guarded) : au
  -- moment du questionnaire le challenge est EN COURS, cette garde le
  -- refuserait elle-même. Ne pas "harmoniser" ce chemin sur la policy
  -- publique un jour sans relire cette note -- ça casserait le
  -- questionnaire.
  INSERT INTO public.bilan_bookings (
    nom, prenom, telephone, date_rdv, heure_rdv, notes, challenge_event_id, statut
  ) VALUES (
    v_reg.nom,
    v_reg.prenom,
    v_reg.telephone,
    (now() AT TIME ZONE 'America/Martinique')::date,
    '00:00',
    'Demande via questionnaire post-inscription',
    v_reg.event_id,
    'en_attente'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$fn$;

COMMENT ON FUNCTION public.fn_create_bilan_booking_from_registration(uuid, text) IS
  'Crée une demande de bilan (bilan_bookings, statut=en_attente, slot_id=NULL) '
  'à partir d''une inscription challenge existante. N''hérite PAS de la garde '
  'J+7 (SECURITY DEFINER, voir commentaire dans le corps). ERRCODE P0004 = '
  'événement pas de type challenge (distinct de P0001, déjà utilisé par '
  'fn_save_post_registration_survey pour un tout autre vocabulaire d''erreurs).';

REVOKE ALL ON FUNCTION public.fn_create_bilan_booking_from_registration(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_create_bilan_booking_from_registration(uuid, text) TO anon, authenticated;
