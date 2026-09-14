-- Fix normalisation téléphone (14/09) : appeler public.normalize_phone() partout.
-- Quatre RPC comparaient le téléphone par regexp_replace(...,'\s+') (espaces seuls) :
-- '+596 696...' != '0696...' pour le serveur, bloquant la correspondance téléphone
-- (modification, complément revenus, réservation de bilan).
-- La clé telephone_normalized est écrite par le trigger via normalize_phone() ;
-- les gardes doivent utiliser la MÊME règle. La seule normalisation admise est
-- public.normalize_phone() (chiffres seuls, 9 derniers).


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

  v_norm_reg := public.normalize_phone(v_reg.telephone);
  v_norm_in := public.normalize_phone(p_telephone);

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

CREATE OR REPLACE FUNCTION public.fn_save_complement_revenus(p_registration_id uuid, p_telephone text, p_complement_revenus text)
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

  v_norm_reg := public.normalize_phone(v_reg.telephone);
  v_norm_in := public.normalize_phone(p_telephone);

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

CREATE OR REPLACE FUNCTION public.fn_create_bilan_booking_from_registration(p_registration_id uuid, p_telephone text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_norm_reg := public.normalize_phone(v_reg.telephone);
  v_norm_in := public.normalize_phone(p_telephone);

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
  --
  -- user_id = v_reg.user_id est OBLIGATOIRE (docs/CONSIGNES-CLAUDE.md,
  -- ajout du 11/09 @vela + @alcyone) : sans lui la ligne n'appartient à
  -- personne. Dans l'espace membre, l'annulation filtre par
  -- `auth.uid() = user_id` (policy bilan_bookings_update_own_cancel_only)
  -- -- avec user_id NULL, ce filtre ne matche jamais : 0 ligne mise à jour,
  -- aucune erreur renvoyée, le membre lit "Annulé" alors que la demande
  -- reste `en_attente` dans la file de Catherine (et, sur le chemin par
  -- créneau, le trigger AFTER UPDATE fn_bilan_booking_sync_slot ne voit
  -- jamais l'UPDATE, donc le créneau ne se rouvre pas). Un invité
  -- (event_registrations.user_id NULL) reste non-annulable -- c'est
  -- cohérent avec le reste du système, pas un oubli.
  INSERT INTO public.bilan_bookings (
    nom, prenom, telephone, user_id, date_rdv, heure_rdv, notes, challenge_event_id, statut
  ) VALUES (
    v_reg.nom,
    v_reg.prenom,
    v_reg.telephone,
    v_reg.user_id,
    (now() AT TIME ZONE 'America/Martinique')::date,
    '00:00',
    'Demande via questionnaire post-inscription',
    v_reg.event_id,
    'en_attente'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_update_challenge21j_registration(p_registration_id uuid, p_telephone text, p_age text, p_profession text, p_timing_demarrage text, p_creneau_rappel text[])
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

  v_norm_reg := public.normalize_phone(v_reg.telephone);
  v_norm_in := public.normalize_phone(p_telephone);

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
