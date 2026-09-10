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
-- Testée sur une branche Supabase jetable avant la 1ʳᵉ version (v1) ; la
-- v2 (6 corrections) et cette v3 (points 7/8/9) ont chacune été
-- re-testées de la même façon avant application en prod.

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

-- ── 3. SELECT sur bilan_slots : retire le doublon trop permissif ────
-- "bilan_slots_select_public" (USING true) rendait visibles TOUS les
-- créneaux à n'importe qui, y compris passés/indisponibles — la policy
-- correcte ("Anyone can view available slots") était de fait inopérante
-- car les policies permissives s'additionnent par OR.
DROP POLICY IF EXISTS "bilan_slots_select_public" ON public.bilan_slots;

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

-- ── 5a. Colonnes support pour le chemin hors-créneau ─────────────────
-- challenge_event_id : rattachement déduit par le serveur (jamais transmis
-- par le client) — l'admin doit voir de quel challenge dépend la demande.
-- telephone_normalized : canon 9-derniers-chiffres pour dédupliquer,
-- distinct de `telephone` (affichage) — voir normalize_phone() plus bas.
ALTER TABLE public.bilan_bookings
  ADD COLUMN IF NOT EXISTS challenge_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS telephone_normalized text;

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
BEGIN
  NEW.telephone_normalized := public.normalize_phone(NEW.telephone);

  IF NEW.slot_id IS NOT NULL THEN
    SELECT challenge_event_id INTO NEW.challenge_event_id
    FROM public.bilan_slots WHERE id = NEW.slot_id;
  ELSE
    NEW.challenge_event_id := public.fn_deduce_hors_date_challenge();

    -- Pas de rate-limit sur les insertions admin (saisie manuelle au bar).
    IF NOT public.is_admin() AND NOT public.check_rate_limit(
      'bilan_hors_date:' || coalesce(NEW.user_id::text, NEW.telephone_normalized),
      3, 86400
    ) THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
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

-- ── 5g. Déduplication des demandes hors-créneau (point 7/8) ─────────
-- 1 personne (user_id) ou 1 numéro normalisé = 1 demande en_attente à la
-- fois. Index unique — pas de IF NOT EXISTS applicatif, qui laisserait
-- passer une course sous insertions simultanées (même doctrine que le
-- point 6 pour les créneaux).
CREATE UNIQUE INDEX IF NOT EXISTS bilan_bookings_hors_date_dedup
  ON public.bilan_bookings (COALESCE(user_id::text, telephone_normalized))
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
