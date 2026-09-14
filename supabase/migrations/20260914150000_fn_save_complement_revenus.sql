-- Complément de revenus (opportunité Herbalife) — décision de Catherine du 12/09
-- (docs/CONSIGNES-CLAUDE.md, "REVIREMENT DU 12/09") : une section visible, un choix simple,
-- gérée au bilan en présentiel, aucune promesse de revenus.
--
-- Demande @user (14/09) : poser cette question dans un MODAL SÉPARÉ, après le questionnaire
-- (bilan + objectif), pas comme une étape de plus dans PostRegistrationWizard.
--
-- Piège : fn_save_post_registration_survey (20260425120000) refuse d'écrire
-- post_registration_details si la colonne n'est déjà PLUS NULL ('already_completed') — or elle
-- l'est déjà à ce stade (le questionnaire vient de la remplir). Cette RPC ne réécrit donc jamais
-- la colonne entière : elle FUSIONNE une seule clé dans le jsonb existant (opérateur ||),
-- possible même une fois la colonne remplie.
CREATE OR REPLACE FUNCTION public.fn_save_complement_revenus(
  p_registration_id uuid,
  p_telephone text,
  p_complement_revenus text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reg public.event_registrations;
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

  IF coalesce(trim(p_complement_revenus), '') = '' THEN
    RAISE EXCEPTION 'missing_complement_revenus' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.event_registrations
  SET post_registration_details = coalesce(post_registration_details, '{}'::jsonb)
    || jsonb_build_object('complement_revenus', p_complement_revenus)
  WHERE id = p_registration_id;

  RETURN jsonb_build_object('complement_revenus', p_complement_revenus);
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_save_complement_revenus(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_save_complement_revenus(uuid, text, text) TO anon, authenticated;
