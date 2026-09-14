-- Permet à un inscrit du Challenge 21j de modifier âge / profession / timing / créneaux de rappel
-- APRÈS son inscription, sans compte (garde-fou sessionStorage côté front, 14/09).
--
-- Il n'existe AUJOURD'HUI aucune policy RLS "UPDATE" publique sur event_registrations
-- (vérifié en base, tulhiipucrnyejheuitv : seule "event_registrations_admin_update" existe,
-- réservée à is_admin()) — un simple .update() depuis le front échouerait en 42501.
-- Même modèle de sécurité que fn_save_post_registration_survey (20260425120000) :
-- SECURITY DEFINER + vérification du téléphone, jamais d'accès direct à la table.
CREATE OR REPLACE FUNCTION public.fn_update_challenge21j_registration(
  p_registration_id uuid,
  p_telephone text,
  p_age text,
  p_profession text,
  p_timing_demarrage text,
  p_creneau_rappel text[]
)
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
BEGIN
  SELECT * INTO v_reg
  FROM public.event_registrations
  WHERE id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'registration_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_norm_reg := lower(regexp_replace(trim(coalesce(v_reg.telephone, '')), '\s+', '', 'g'));
  v_norm_in := lower(regexp_replace(trim(coalesce(p_telephone, '')), '\s+', '', 'g'));

  IF v_norm_reg IS DISTINCT FROM v_norm_in THEN
    RAISE EXCEPTION 'telephone_mismatch' USING ERRCODE = 'P0001';
  END IF;

  SELECT e.type INTO v_event_type
  FROM public.events e
  WHERE e.id = v_reg.event_id;

  IF v_event_type IS DISTINCT FROM 'challenge' THEN
    RAISE EXCEPTION 'not_a_challenge_registration' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.event_registrations
  SET
    age = p_age,
    profession = p_profession,
    timing_demarrage = p_timing_demarrage,
    creneau_rappel = p_creneau_rappel
  WHERE id = p_registration_id;

  RETURN jsonb_build_object(
    'age', p_age,
    'profession', p_profession,
    'timing_demarrage', p_timing_demarrage,
    'creneau_rappel', p_creneau_rappel
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_update_challenge21j_registration(uuid, text, text, text, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_update_challenge21j_registration(uuid, text, text, text, text, text[]) TO anon, authenticated;
