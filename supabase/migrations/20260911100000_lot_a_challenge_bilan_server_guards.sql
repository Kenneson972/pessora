-- PESSORA — Lot A (Challenge 21 jours + Bilan) : garanties serveur.
--
-- Contexte (docs/brief-lot-a-challenge-bilan-2026-09-10.md) : le parcours
-- Bilan revient avec une réservation garantie côté serveur — jamais
-- décorative. En concevant cette garantie, une policy existante a été
-- trouvée bien plus permissive que documenté :
--
--   bilan_bookings_insert_public : WITH CHECK (true), et `anon` a le
--   grant INSERT sur la table → n'importe quel visiteur non connecté
--   pouvait déjà insérer une ligne bilan_bookings arbitraire (user_id
--   forgé, slot_id forgé, statut='confirme' direct), sans passer par
--   aucune UI. Table vide (0 ligne) au moment du fix — non exploité.
--
-- Révisée après relecture équipe (6 corrections) :
--   1. bilan_slots_select_public (USING true) écrasait la policy correcte
--      (disponible=true AND date>=CURRENT_DATE) → anon voyait des créneaux
--      passés/indisponibles. Droppée.
--   2. fn_bilan_slot_bookable passée en SECURITY DEFINER : une garde RLS
--      ne doit pas dépendre de la visibilité SELECT de l'appelant sur les
--      tables qu'elle interroge — sinon elle devient fragile au moindre
--      changement de policy ailleurs (exactement le risque soulevé par le
--      point 1).
--   3. L'annulation ne rouvrait jamais le créneau (trigger AFTER INSERT
--      seulement) → étendu à AFTER UPDATE, avec condition d'absence de
--      toute autre réservation active sur ce créneau.
--   4. Le chemin hors-date (slot_id NULL) ne contraignait pas `statut` →
--      un invité pouvait s'auto-confirmer en volume illimité. La garde
--      impose désormais statut='en_attente' pour TOUT insert public,
--      avec ou sans créneau (la confirmation reste un acte admin).
--   5. Les 7 créneaux existants n'ont pas de challenge_event_id (aucun
--      événement type='challenge' n'existait avant cette migration) : ils
--      deviennent des créneaux orphelins, non réservables publiquement
--      tant qu'un admin ne les rattache pas à une édition — décision
--      explicite, pas un oubli. Ils sont de toute façon tous à une date
--      passée (vérifié), donc déjà hors de toute fenêtre bookable.
--   6. Pas de données de test insérées ici (une migration ne doit pas
--      écrire de données jetables) — à la charge de la recette de créer
--      un événement type='challenge' futur + un créneau lié avant de
--      dérouler les critères ci-dessous.
--
-- Addendum 10/09 soir — points 7/8/9 (relecture équipe, après v2) :
--   7. Chemin hors-créneau (slot_id NULL) non borné — un visiteur anon
--      pouvait insérer un nombre illimité de demandes, une par créneau
--      touché, une par e-mail admin envoyé. Dédupliqué en base (index
--      unique sur user_id ou téléphone normalisé) + rate-limit réutilisant
--      public.check_rate_limit() déjà en place.
--   8. Le canon téléphone existant (lower + suppression espaces) ne
--      suffit pas à dédupliquer — 0696000000 et +596 696 000 000 restent
--      deux clés. normalize_phone() ajoutée (9 derniers chiffres),
--      appliquée AVANT la déduplication, via trigger BEFORE INSERT.
--   9. Règle arbitrée par la cliente le 10/09 : après J, les demandes
--      restent acceptées jusqu'à J+7 (pas indéfiniment). Le serveur
--      déduit lui-même le challenge concerné (dernier événement
--      type='challenge' actif et déjà passé) — jamais transmis par le
--      client. Vérifié par un helper SECURITY DEFINER dédié, même
--      raisonnement que le point 2 (une garde RLS ne doit pas dépendre
--      d'une policy SELECT externe).
--
-- v4 — 3 corrections bloquantes trouvées en revue puis en re-test (avant
-- toute application en prod, donc aucun impact réel) :
--   a. Le §3 droppait bilan_slots_select_public mais ne créait aucune
--      policy de remplacement propre — seule restait "Anyone can view
--      available slots" (CURRENT_DATE en UTC, pas Martinique, et sans
--      filtre challenge). Remplacée par une policy unique qui appelle
--      fn_bilan_slot_bookable() — même vérité que la garde INSERT,
--      jamais deux calculs de fenêtre qui peuvent diverger dans le temps.
--   b. Dans fn_bilan_booking_before_insert, le chemin slot_id IS NULL
--      écrasait TOUJOURS challenge_event_id via la déduction générique —
--      y compris si l'appelant (ex. la future RPC du questionnaire
--      post-inscription) avait déjà posé la bonne valeur. Corrigé : ne
--      déduire que si NULL.
--   c. normalize_phone() renvoie '' (pas NULL) pour un téléphone
--      inexploitable → stocker '' tel quel aurait fait de tous les
--      invités sans numéro exploitable une seule et même clé de
--      déduplication (index §5g), se bloquant mutuellement en 23505 sur
--      une demande qui n'est pas la leur. NULLIF(..., '') corrige : NULL
--      n'entre jamais en conflit dans un index unique.
--      ⚠️ Effet de bord trouvé en re-testant ce correctif : si user_id ET
--      telephone_normalized sont tous deux NULL, la clé de rate-limit
--      devient NULL, et rate_limits.key est NOT NULL → l'insertion
--      entière plantait (23502) au lieu de simplement ignorer le
--      rate-limit. Corrigé : le rate-limit n'est appelé que si la clé
--      n'est pas NULL (un visiteur non traçable n'est de toute façon pas
--      rate-limitable — la dédup, elle, s'applique correctement : NULL
--      n'entrant jamais en conflit, deux personnes sans numéro exploitable
--      restent deux lignes distinctes, jamais bloquées l'une par l'autre).
--
-- v5 — 4 corrections avant application (dernier tour, rien d'autre en
-- attente) :
--   d. DoS ouvert par la v4 elle-même : un visiteur avec un téléphone
--      inexploitable avait telephone_normalized=NULL → ni dédupliqué
--      (l'index unique ignore NULL, par construction) ni rate-limité (le
--      garde-fou du point c skippe justement si la clé est NULL) →
--      volume illimité de demandes. Un numéro à 9 chiffres après
--      normalisation est désormais obligatoire sur le chemin public
--      (RAISE 'invalid_phone' / P0003) — jamais pour un insert admin
--      (saisie manuelle au bar, formats libres).
--   e. La clé d'identité (dédup ET rate-limit) était user_id d'abord,
--      téléphone en repli — un même client connecté puis invité déposait
--      deux lignes sous deux clés différentes. Inversé :
--      COALESCE(NULLIF(telephone_normalized,''), user_id::text) — le
--      téléphone (identifiant stable, présent des deux côtés) passe
--      avant le user_id (qui, lui, change selon l'état de connexion).
--   f. Un code d'erreur par type de refus, pour que le front puisse
--      afficher le bon message et que la recette distingue quelle garde
--      a joué : 23505 = créneau déjà pris (index §6, inchangé) ·
--      P0001 = trop de demandes (rate-limit) · P0002 = demande déjà en
--      attente (pré-vérifiée dans le trigger avant l'index §5g, qui
--      reste le filet de sécurité en cas de vraie course concurrente —
--      dans ce cas rare, 23505 peut encore sortir : l'index garantit la
--      correction, le pré-check n'est que pour le message) · P0003 =
--      numéro invalide.
--   g. Colonne `origine` ('visiteur'/'questionnaire'/'admin'), purement
--      descriptive pour la file admin — JAMAIS dans une garde (dédup,
--      rate-limit, WITH CHECK) et JAMAIS lue depuis le payload client :
--      NEW.origine est systématiquement écrasé par le trigger, qu'il
--      soit NULL ou non — un POST anon avec {"origine":"admin"} ne doit
--      jamais passer, contrairement à challenge_event_id (point b) où
--      l'écrasement était conditionnel (NULL seulement).
--      ⚠️ Ni via current_user, ni via session_user : à l'intérieur d'un
--      trigger SECURITY DEFINER, current_user devient TOUJOURS le
--      propriétaire de la fonction (postgres) — inutilisable. Et
--      session_user ne distinguerait pas non plus : la future RPC du
--      questionnaire sera appelée par un membre authentifié via
--      PostgREST normal (rôle authenticated), donc indistinguable d'un
--      insert direct sur la table par ce biais. Mécanisme retenu : un
--      GUC de session (pessora.bilan_origine) positionné par la RPC via
--      set_config() juste avant son propre INSERT — un corps JSON
--      PostgREST ne peut pas définir un GUC arbitraire en effet de bord
--      d'un POST, contrairement à une colonne de la ligne.
--
-- Dette assumée, écrite ici plutôt que corrigée en douce : la policy
-- autorise déjà un insert admin (saisie manuelle au bar), mais aucun
-- écran ne le propose aujourd'hui — c'est un manque de fonctionnalité,
-- pas une régression de cette migration.
--
-- Testée sur une branche Supabase jetable avant la 1ʳᵉ version (v1) ; v2
-- (6 corrections), v3 (points 7/8/9), v4 (3 corrections) et v5 (4
-- corrections ci-dessus) ont chacune été re-testées de la même façon
-- avant application en prod.

-- ── 1. Nouveau type d'événement 'challenge' ──────────────────────────
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type = ANY (ARRAY[
    'run_club', 'popup', 'atelier', 'event', 'partenariat', 'bilan', 'challenge'
  ]::text[]));

-- ── 2. Un créneau de bilan est toujours rattaché à une édition de challenge ──
ALTER TABLE public.bilan_slots
  ADD COLUMN IF NOT EXISTS challenge_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bilan_slots_challenge_event_id
  ON public.bilan_slots(challenge_event_id);

COMMENT ON COLUMN public.bilan_slots.challenge_event_id IS
  'Édition de challenge (events.type=challenge) dont dépend ce créneau. NULL = créneau orphelin, non réservable publiquement tant qu''il n''est pas rattaché (cas des 7 créneaux pré-existants, tous à une date passée).';

-- ── 3. SELECT sur bilan_slots : retire les 2 policies publiques existantes ──
-- "bilan_slots_select_public" (USING true) rendait visibles TOUS les
-- créneaux à n'importe qui, y compris passés/indisponibles. Et
-- "Anyone can view available slots" (disponible=true AND date>=CURRENT_DATE)
-- ne suffit pas non plus : CURRENT_DATE est en UTC (pas Martinique) — le
-- critère de visibilité aurait pu basculer selon l'heure de la journée —
-- et ne filtre pas sur le challenge (un créneau orphelin ou lié à un
-- challenge désactivé resterait visible). Remplacées ensemble par une
-- policy unique après la définition de fn_bilan_slot_bookable (§4) :
-- la visibilité SELECT est désormais EXACTEMENT la même vérité que la
-- garde INSERT — un seul calcul de fenêtre, jamais deux versions qui
-- peuvent diverger.
DROP POLICY IF EXISTS "bilan_slots_select_public" ON public.bilan_slots;
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.bilan_slots;

-- ── 4. Fonction pure : un créneau est-il réservable MAINTENANT ? ─────
-- Fenêtre J-14 → J inclus, calculée à la lecture (pas d'ordonnanceur),
-- en heure Martinique (UTC-4, pas de DST) contre des colonnes naïves.
-- SECURITY DEFINER : la garde ne doit jamais dépendre des policies SELECT
-- de l'appelant sur bilan_slots/events — elle porte sa propre vérité.
CREATE OR REPLACE FUNCTION public.fn_bilan_slot_bookable(p_slot_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bilan_slots s
    JOIN public.events e ON e.id = s.challenge_event_id
    WHERE s.id = p_slot_id
      AND s.disponible = true
      AND e.type = 'challenge'
      AND e.active = true
      AND (now() AT TIME ZONE 'America/Martinique')::date BETWEEN (e.date - 14) AND e.date
  );
$$;

COMMENT ON FUNCTION public.fn_bilan_slot_bookable(uuid) IS
  'Vrai si le créneau existe, est disponible, rattaché à un challenge actif, et dans la fenêtre J-14→J inclus (heure Martinique). Utilisée dans la garde RLS — jamais seulement à l''affichage. SECURITY DEFINER : indépendante des policies SELECT de l''appelant.';

-- ── 4b. SELECT public : remplace les 2 policies droppées au §3 ──────
-- Visible seulement si réellement réservable maintenant — même fonction
-- que la garde INSERT, donc même fenêtre (Martinique) et même filtre
-- challenge. Un anon ne peut plus voir un créneau passé, indisponible,
-- orphelin ou lié à un challenge désactivé/hors-fenêtre.
CREATE POLICY "bilan_slots_select_bookable" ON public.bilan_slots
  FOR SELECT
  USING (public.fn_bilan_slot_bookable(id));

-- ── 5a. Colonnes support pour le chemin hors-créneau ─────────────────
-- challenge_event_id : rattachement déduit par le serveur (jamais transmis
-- par le client) — l'admin doit voir de quel challenge dépend la demande.
-- telephone_normalized : canon 9-derniers-chiffres pour dédupliquer,
-- distinct de `telephone` (affichage) — voir normalize_phone() plus bas.
ALTER TABLE public.bilan_bookings
  ADD COLUMN IF NOT EXISTS challenge_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS telephone_normalized text,
  ADD COLUMN IF NOT EXISTS origine text;

ALTER TABLE public.bilan_bookings DROP CONSTRAINT IF EXISTS bilan_bookings_origine_check;
ALTER TABLE public.bilan_bookings ADD CONSTRAINT bilan_bookings_origine_check
  CHECK (origine IS NULL OR origine = ANY (ARRAY['visiteur', 'questionnaire', 'admin']::text[]));

COMMENT ON COLUMN public.bilan_bookings.origine IS
  'Purement descriptif pour la file admin (jamais lu par une garde, jamais lu depuis le payload client). Toujours écrasé par le trigger : admin si is_admin(), questionnaire si le GUC pessora.bilan_origine=questionnaire (posé par la future RPC via set_config, jamais par un client), visiteur sinon.';

-- ── 5b. normalize_phone : canon avant déduplication (point 8) ───────
-- Chiffres seuls, 9 derniers conservés → 0696000000 / +596 696 000 000 /
-- 596696000000 / 696000000 convergent tous vers '696000000'.
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
$$;

-- ── 5c. Le serveur déduit le challenge concerné pour une demande
--        hors-créneau — dernier événement type='challenge' actif déjà
--        passé (le plus récent dont la date est avant aujourd'hui).
CREATE OR REPLACE FUNCTION public.fn_deduce_hors_date_challenge()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.events
  WHERE type = 'challenge'
    AND active = true
    AND date < (now() AT TIME ZONE 'America/Martinique')::date
  ORDER BY date DESC
  LIMIT 1;
$$;

-- ── 5d. Fenêtre du chemin hors-créneau (point 9, arbitrage client) ──
-- Ouverte de J+1 à J+7 (J = date du dernier challenge passé). Le RDV
-- souhaité doit tomber entre aujourd'hui et J+7. SECURITY DEFINER pour
-- la même raison que fn_bilan_slot_bookable (point 2) : ne pas dépendre
-- de la policy SELECT d'`events` vue par l'appelant.
CREATE OR REPLACE FUNCTION public.fn_challenge_window_ok(p_date_rdv date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Martinique')::date;
  v_challenge_date date;
BEGIN
  SELECT date INTO v_challenge_date
  FROM public.events
  WHERE type = 'challenge' AND active = true AND date < v_today
  ORDER BY date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_today > v_challenge_date + 7 THEN
    RETURN false;
  END IF;

  RETURN p_date_rdv BETWEEN v_today AND (v_challenge_date + 7);
END;
$$;

COMMENT ON FUNCTION public.fn_challenge_window_ok(date) IS
  'Vrai si on est entre J+1 et J+7 (J = dernier challenge actif passé) ET que la date de RDV souhaitée tombe entre aujourd''hui et J+7. Chemin hors-créneau uniquement — jamais avant J.';

-- ── 5e. BEFORE INSERT : normalise le téléphone, déduit le challenge,
--        applique le rate-limit sur le chemin hors-créneau (point 7) ──
-- Le rate-limit doit vivre en base : l'INSERT est un appel REST direct,
-- ne traverse aucune edge function — le rate-limiter en mémoire des
-- fonctions edge ne peut pas le voir.
CREATE OR REPLACE FUNCTION public.fn_bilan_booking_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_identity_key text;
BEGIN
  -- NULLIF : normalize_phone() renvoie '' (pas NULL) pour un téléphone
  -- inexploitable ("N/A", "---"...). NULL n'entre jamais en conflit dans
  -- un index unique — voir la garde ci-dessous qui rend ce cas impossible
  -- sur le chemin public de toute façon (numéro obligatoire).
  NEW.telephone_normalized := NULLIF(public.normalize_phone(NEW.telephone), '');

  -- (d) Numéro exploitable obligatoire sur le chemin public. Sans lui,
  -- telephone_normalized reste NULL → ni dédupliqué (index ignore NULL)
  -- ni rate-limité (garde ci-dessous skippe si la clé est NULL) → volume
  -- illimité de demandes avec un téléphone bidon. Jamais pour un insert
  -- admin (saisie manuelle au bar, formats libres, pas de DoS possible
  -- puisqu'elle nécessite déjà d'être admin).
  IF NOT public.is_admin() AND NEW.telephone_normalized IS NULL THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE = 'P0003';
  END IF;

  -- (g) Origine descriptive pour la file admin — JAMAIS lue depuis le
  -- payload client (NEW.origine est systématiquement écrasé ci-dessous,
  -- qu'il soit NULL ou non) : un POST anon avec {"origine":"admin"} ne
  -- doit jamais passer.
  --
  -- ⚠️ Pas de détection par current_user/session_user : à l'intérieur
  -- d'un trigger SECURITY DEFINER, current_user devient TOUJOURS le
  -- propriétaire de la fonction (postgres), quel que soit l'appelant
  -- réel — et la future RPC du questionnaire sera appelée par un membre
  -- authentifié via PostgREST normal (rôle authenticated), pas
  -- postgres/service_role : indistinguable d'un insert direct par ce
  -- biais. Mécanisme retenu à la place : un GUC de session
  -- (pessora.bilan_origine) que seule la RPC — du code SQL de confiance
  -- que j'écris, pas un corps JSON client — pourra positionner juste
  -- avant son propre INSERT via set_config(). Un payload PostgREST ne
  -- peut pas définir un GUC arbitraire en effet de bord d'un simple
  -- POST, contrairement à une colonne de la ligne.
  IF public.is_admin() THEN
    NEW.origine := 'admin';
  ELSIF current_setting('pessora.bilan_origine', true) = 'questionnaire' THEN
    NEW.origine := 'questionnaire';
  ELSE
    NEW.origine := 'visiteur';
  END IF;

  IF NEW.slot_id IS NOT NULL THEN
    SELECT challenge_event_id INTO NEW.challenge_event_id
    FROM public.bilan_slots WHERE id = NEW.slot_id;
  ELSE
    -- Ne déduire que si l'appelant n'a pas déjà posé une valeur (ex. la
    -- future RPC du questionnaire post-inscription, qui connaît le
    -- challenge exact de l'inscription et ne doit jamais se faire
    -- écraser silencieusement par la déduction générique).
    IF NEW.challenge_event_id IS NULL THEN
      NEW.challenge_event_id := public.fn_deduce_hors_date_challenge();
    END IF;

    -- (e) Téléphone d'abord, user_id en repli : un même client connecté
    -- puis invité (ou l'inverse) doit désigner la MÊME clé d'identité —
    -- sinon la dédup et le rate-limit le traitent comme deux personnes.
    v_identity_key := coalesce(NULLIF(NEW.telephone_normalized, ''), NEW.user_id::text);

    IF NOT public.is_admin() THEN
      -- (f) P0002 : pré-vérification pour un message clair et un code
      -- distinct de 23505. Reste un filet secondaire — l'index unique
      -- (§5g) est la vraie garantie sous concurrence ; en cas de vraie
      -- course, 23505 peut encore sortir ici, ce qui est correct (la
      -- ligne concurrente a gagné pendant l'évaluation de ce SELECT).
      IF v_identity_key IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.bilan_bookings
        WHERE statut = 'en_attente'
          AND slot_id IS NULL
          AND coalesce(NULLIF(telephone_normalized, ''), user_id::text) = v_identity_key
      ) THEN
        RAISE EXCEPTION 'duplicate_pending_request' USING ERRCODE = 'P0002';
      END IF;

      -- Pas de rate-limit si la clé serait NULL (ne devrait plus arriver
      -- sur le chemin public depuis (d), gardé en défense supplémentaire).
      IF v_identity_key IS NOT NULL AND NOT public.check_rate_limit(
        'bilan_hors_date:' || v_identity_key, 3, 86400
      ) THEN
        RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bilan_booking_before_insert ON public.bilan_bookings;
CREATE TRIGGER trg_bilan_booking_before_insert
  BEFORE INSERT ON public.bilan_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bilan_booking_before_insert();

-- ── 5f. INSERT sur bilan_bookings : retire le trou, pose la vraie garde ──
-- Deux formes valides :
--   (a) slot_id NULL   = demande hors-créneau, seulement si
--       fn_challenge_window_ok(date_rdv) — jamais avant J, jamais après
--       J+7 (point 9) ;
--   (b) slot_id renseigné = doit passer fn_bilan_slot_bookable (J-14→J).
-- Dans les deux cas : attribuable seulement à soi-même (ou à personne,
-- invité), et TOUJOURS statut='en_attente' — la confirmation est un acte
-- admin exclusivement (policy "Admins manage bilan_bookings" séparée).
DROP POLICY IF EXISTS "bilan_bookings_insert_public" ON public.bilan_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bilan_bookings;

CREATE POLICY "bilan_bookings_insert_guarded" ON public.bilan_bookings
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND statut = 'en_attente'
    AND (
      (slot_id IS NOT NULL AND public.fn_bilan_slot_bookable(slot_id))
      OR (slot_id IS NULL AND public.fn_challenge_window_ok(date_rdv))
    )
  );

-- ── 5g. Déduplication des demandes hors-créneau (point 7/8, clé revue au v5.e) ──
-- 1 numéro normalisé (ou 1 user_id en repli si pas de téléphone exploitable
-- — cas admin uniquement depuis (d)) = 1 demande en_attente à la fois.
-- Téléphone d'abord : un même client connecté puis invité doit tomber sur
-- la même clé (voir le pré-check P0002 dans le trigger, même expression).
-- Index unique — pas de IF NOT EXISTS applicatif seul, qui laisserait
-- passer une course sous insertions simultanées (même doctrine que le
-- point 6 pour les créneaux) ; le pré-check du trigger n'est qu'un
-- message plus clair dans le cas non-concurrent, cet index reste la
-- garantie réelle.
DROP INDEX IF EXISTS public.bilan_bookings_hors_date_dedup;
CREATE UNIQUE INDEX IF NOT EXISTS bilan_bookings_hors_date_dedup
  ON public.bilan_bookings (COALESCE(NULLIF(telephone_normalized, ''), user_id::text))
  WHERE statut = 'en_attente' AND slot_id IS NULL;

-- ── 6. 1 créneau = 1 personne, garanti par la base (pas par l'UI) ───
-- Partiel : exclut les annulations (un créneau annulé redevient
-- réservable par quelqu'un d'autre) et les demandes hors-date
-- (slot_id NULL, non concernées par l'unicité de créneau).
-- C'est CETTE contrainte qui protège contre la double réservation en
-- PARALLÈLE (deux transactions concurrentes) — fn_bilan_slot_bookable
-- seule ne suffit pas : elle peut lire `disponible=true` deux fois
-- avant qu'aucune des deux insertions n'ait abouti. Testé en v1 : même en
-- contournant RLS avec disponible=true, une 2ᵉ insertion sur le même
-- créneau échoue (23505) — c'est la vraie garantie, pas le flag.
CREATE UNIQUE INDEX IF NOT EXISTS bilan_bookings_slot_unique_active
  ON public.bilan_bookings (slot_id)
  WHERE slot_id IS NOT NULL AND statut <> 'annule';

-- ── 7. Bascule disponible=false/true atomique, côté serveur uniquement ──
-- Remplace les 2 appels client bugués (BilanBienEtre.tsx:238,
-- member/MesBilans.tsx:257) qui échouaient silencieusement contre la
-- RLS admin-only sur bilan_slots. SECURITY DEFINER : s'exécute avec les
-- droits du propriétaire de la table, contourne légitimement la policy
-- UPDATE admin-only, exactement comme le ferait un admin.
--
-- INSERT (statut != 'annule') → ferme le créneau.
-- UPDATE vers statut='annule' → rouvre le créneau, SAUF s'il existe une
-- autre réservation active dessus (ne devrait jamais arriver grâce à
-- l'index unique du point 6, mais gardé en garde-fou explicite plutôt que
-- supposé impossible).
CREATE OR REPLACE FUNCTION public.fn_bilan_booking_sync_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slot_id IS NOT NULL AND NEW.statut <> 'annule' THEN
      UPDATE public.bilan_slots SET disponible = false WHERE id = NEW.slot_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.slot_id IS NOT NULL
       AND NEW.statut = 'annule'
       AND OLD.statut <> 'annule'
       AND NOT EXISTS (
         SELECT 1 FROM public.bilan_bookings
         WHERE slot_id = NEW.slot_id AND statut <> 'annule' AND id <> NEW.id
       )
    THEN
      UPDATE public.bilan_slots SET disponible = true WHERE id = NEW.slot_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bilan_booking_close_slot ON public.bilan_bookings;
DROP TRIGGER IF EXISTS trg_bilan_booking_sync_slot ON public.bilan_bookings;
CREATE TRIGGER trg_bilan_booking_sync_slot
  AFTER INSERT OR UPDATE ON public.bilan_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bilan_booking_sync_slot();

-- ── 8. Un membre ne peut qu'annuler sa propre réservation ────────────
-- L'ancienne policy n'avait aucune restriction de colonne : un membre
-- pouvait en théorie passer sa propre ligne à statut='confirme'.
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bilan_bookings;

CREATE POLICY "bilan_bookings_update_own_cancel_only" ON public.bilan_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND statut = 'annule');

-- ── 9. Sur-privilège de grants (audit équipe, non exploitable en l'état
--        mais c'est ce qui rendrait une future policy mal écrite
--        exploitable) : anon avait DELETE/TRUNCATE/REFERENCES/TRIGGER en
--        plus de SELECT/INSERT/UPDATE, hérités du GRANT ALL par défaut
--        Supabase. Resserré au strict nécessaire sur cette table.
REVOKE ALL ON public.bilan_bookings FROM anon, authenticated;
GRANT SELECT, INSERT ON public.bilan_bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.bilan_bookings TO authenticated;
