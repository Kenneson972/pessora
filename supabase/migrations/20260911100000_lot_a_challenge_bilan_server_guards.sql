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
-- Testée sur une branche Supabase jetable avant la 1ʳᵉ version (v1) ; la
-- présente révision (v2) intègre les 6 corrections et doit être re-testée
-- de la même façon avant application en prod.

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

-- ── 5. INSERT sur bilan_bookings : retire le trou, pose la vraie garde ──
-- Deux formes valides :
--   (a) slot_id NULL   = demande hors-date (toujours acceptée, va en file
--       admin + notification e-mail côté appli) ;
--   (b) slot_id renseigné = doit passer fn_bilan_slot_bookable.
-- Dans les deux cas : attribuable seulement à soi-même (ou à personne,
-- invité), et TOUJOURS statut='en_attente' — la confirmation est un acte
-- admin exclusivement (policy "Admins manage bilan_bookings" séparée),
-- jamais quelque chose qu'un visiteur peut s'auto-attribuer, avec ou sans
-- créneau choisi.
DROP POLICY IF EXISTS "bilan_bookings_insert_public" ON public.bilan_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bilan_bookings;

CREATE POLICY "bilan_bookings_insert_guarded" ON public.bilan_bookings
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND statut = 'en_attente'
    AND (slot_id IS NULL OR public.fn_bilan_slot_bookable(slot_id))
  );

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
