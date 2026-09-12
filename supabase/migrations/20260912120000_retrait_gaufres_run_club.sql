-- PESSORA — fn_save_post_registration_survey : les gaufres ne sont plus exigées.
--
-- Contexte : décision Ken du 12/09 — les gaufres (et les deux formules de
-- précommande « boisson + encas » / « boisson + repas léger ») sont une ANCIENNE
-- FORMULE d'événement, obsolète. Le front ne les envoie plus
-- (feat/retrait-formules-obsoletes, 1bdce3a) : l'étape 'gaufres' est retirée du
-- questionnaire et les 3 champs gaufre_* ne sont plus dans le schéma.
--
-- MAIS cette RPC les exigeait encore (`missing_gaufre_salee`), exactement comme
-- elle exigeait `bilan_offert` avant le fix du 10/09 : sans ce correctif, TOUTE
-- soumission RUN CLUB échoue côté serveur, avec une erreur que le front ne sait
-- pas expliquer. Même famille que le trigger de rattachement et que le compteur :
-- LA SURFACE CHANGE, LA BASE GARDE LA RÈGLE.
--
-- ⚠️ ORDRE DE POSE : APPLIQUER CETTE MIGRATION AVANT DE MERGER LE FRONT.
-- Dans l'autre sens, on retire le champ d'un questionnaire que la base refuse
-- encore de recevoir.
--
-- Ce qui est GARDÉ, et pourquoi :
--   - `objectif_principal` reste obligatoire (son étape existe toujours) ;
--   - `precommande_offre` reste obligatoire (il reste « Boisson individuelle seule »
--     et « Aucune précommande » : l'étape n'est pas vide) ;
--   - la LISTE DES CLÉS REJETÉES (precommande_offre, gaufre_salee, gaufre_salee_autre,
--     gaufre_sucree_notes) est CONSERVÉE TELLE QUELLE : c'est elle qui empêche une
--     inscription de type 'challenge' d'envoyer une clé de précommande. On retire
--     seulement l'OBLIGATION, jamais la protection.
--
-- Retiré : le bloc `IF gaufre_salee ... missing_gaufre_salee` et
-- `IF gaufre_salee = 'Autre' ... missing_gaufre_salee_autre`.
--
-- Mesure avant application (PAT, projet tulhiipucrnyejheuitv) : 2 inscriptions
-- portent un JSON, toutes deux des fixtures de recette ; 0 valeur gaufre / formule
-- en base ; 0 ligne portant la clé complement_revenus. Rien n'est rendu orphelin.

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

  IF coalesce(trim(p_payload->>'objectif_principal'), '') = '' THEN
    RAISE EXCEPTION 'missing_objectif_principal' USING ERRCODE = 'P0001';
  END IF;

  IF v_event_type = 'run_club' THEN
    IF coalesce(trim(p_payload->>'precommande_offre'), '') = '' THEN
      RAISE EXCEPTION 'missing_precommande_offre' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.event_registrations
  SET post_registration_details = p_payload
  WHERE id = p_registration_id;

  RETURN p_payload;
END;
$function$;
