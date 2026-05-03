-- Post-registration questionnaire: generic JSON on registrations + SECURITY DEFINER RPC.

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS post_registration_details jsonb;

COMMENT ON COLUMN public.event_registrations.post_registration_details IS
  'Post-registration survey (JSON). Run Club-only keys rejected server-side for other event types.';

CREATE OR REPLACE FUNCTION public.fn_save_post_registration_survey(
  p_registration_id uuid,
  p_telephone text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

  IF coalesce(trim(p_payload->>'bilan_offert'), '') = '' THEN
    RAISE EXCEPTION 'missing_bilan_offert' USING ERRCODE = 'P0001';
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
$fn$;

REVOKE ALL ON FUNCTION public.fn_save_post_registration_survey(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_save_post_registration_survey(uuid, text, jsonb) TO anon, authenticated;
