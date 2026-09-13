-- Retrait 12/09 (décision Ken) : la commande de formule des événements (précommande)
-- et les gaufres sont obsolètes — ancienne formule d'avant le RDV de Catherine, et les
-- CGV §2 ne listent QUE des boissons (le site vendait hors contrat). Le front ne les
-- envoie plus ; cette migration met la RPC en accord :
--   1. les 4 clés obsolètes (precommande_offre, gaufre_*) sont rejetées pour TOUS les
--      types d'événement (avant : rejetées seulement hors run_club) ;
--   2. le bloc run_club qui les EXIGEAIT (missing_precommande_offre,
--      missing_gaufre_salee, missing_gaufre_salee_autre) est supprimé — sans quoi le
--      questionnaire run_club, qui ne les envoie plus, échouerait sur une clé manquante.

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

  v_norm_reg := lower(regexp_replace(trim(coalesce(v_reg.telephone, '')), '\\s+', '', 'g'));
  v_norm_in := lower(regexp_replace(trim(coalesce(p_telephone, '')), '\\s+', '', 'g'));

  IF v_norm_reg IS DISTINCT FROM v_norm_in THEN
    RAISE EXCEPTION 'telephone_mismatch' USING ERRCODE = 'P0001';
  END IF;

  SELECT e.type INTO v_event_type
  FROM public.events e
  WHERE e.id = v_reg.event_id;

  IF v_event_type IS NULL THEN
    RAISE EXCEPTION 'event_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- Clés obsolètes (commande de formule + gaufres) rejetées pour TOUS les types.
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

  IF v_event_type = 'challenge' THEN
    IF coalesce(trim(p_payload->>'bilan_offert'), '') = '' THEN
      RAISE EXCEPTION 'missing_bilan_offert' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF coalesce(trim(p_payload->>'objectif_principal'), '') = '' THEN
    RAISE EXCEPTION 'missing_objectif_principal' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.event_registrations
  SET post_registration_details = p_payload
  WHERE id = p_registration_id;

  RETURN p_payload;
END;
$function$;
