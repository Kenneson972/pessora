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
-- Cette migration : (1) ajoute le type d'événement 'challenge', (2) lie
-- chaque créneau de bilan à l'édition de challenge dont il dépend
-- (fenêtre J-14→J calculée par événement, pas globalement), (3) retire
-- la policy INSERT permissive et la remplace par une garde réelle,
-- (4) empêche la double réservation d'un même créneau au niveau base
-- (résiste à la concurrence, pas seulement au cas séquentiel),
-- (5) bascule `disponible=false` de façon atomique côté serveur —
-- jamais côté client (RLS le bloquait déjà, silencieusement, d'où le
-- bug historique de BilanBienEtre.tsx/MesBilans.tsx).

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
  'Édition de challenge (events.type=challenge) dont dépend ce créneau. NULL = créneau orphelin, non réservable publiquement tant qu''il n''est pas rattaché.';

-- ── 3. Fonction pure : un créneau est-il réservable MAINTENANT ? ─────
-- Fenêtre J-14 → J inclus, calculée à la lecture (pas d'ordonnanceur),
-- en heure Martinique (UTC-4, pas de DST) contre des colonnes naïves.
CREATE OR REPLACE FUNCTION public.fn_bilan_slot_bookable(p_slot_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
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
  'Vrai si le créneau existe, est disponible, rattaché à un challenge actif, et dans la fenêtre J-14→J inclus (heure Martinique). Utilisée dans la garde RLS — jamais seulement à l''affichage.';

-- ── 4. INSERT sur bilan_bookings : retire le trou, pose la vraie garde ──
-- Deux formes valides :
--   (a) slot_id NULL   = demande hors-date (toujours acceptée, va en file
--       admin `statut='en_attente'` + notification e-mail côté appli) ;
--   (b) slot_id renseigné = doit passer fn_bilan_slot_bookable.
-- Dans les deux cas, la ligne ne peut être attribuée qu'à soi-même
-- (ou à personne, réservation invité — user_id déjà nullable).
DROP POLICY IF EXISTS "bilan_bookings_insert_public" ON public.bilan_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bilan_bookings;

CREATE POLICY "bilan_bookings_insert_guarded" ON public.bilan_bookings
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND (slot_id IS NULL OR public.fn_bilan_slot_bookable(slot_id))
  );

-- ── 5. 1 créneau = 1 personne, garanti par la base (pas par l'UI) ───
-- Partiel : exclut les annulations (un créneau annulé redevient
-- réservable par quelqu'un d'autre) et les demandes hors-date
-- (slot_id NULL, non concernées par l'unicité de créneau).
-- C'est CETTE contrainte qui protège contre la double réservation en
-- PARALLÈLE (deux transactions concurrentes) — fn_bilan_slot_bookable
-- seule ne suffit pas : elle peut lire `disponible=true` deux fois
-- avant qu'aucune des deux insertions n'ait abouti.
CREATE UNIQUE INDEX IF NOT EXISTS bilan_bookings_slot_unique_active
  ON public.bilan_bookings (slot_id)
  WHERE slot_id IS NOT NULL AND statut <> 'annule';

-- ── 6. Bascule disponible=false atomique, côté serveur uniquement ───
-- Remplace les 2 appels client bugués (BilanBienEtre.tsx:238,
-- member/MesBilans.tsx:257) qui échouaient silencieusement contre la
-- RLS admin-only sur bilan_slots. SECURITY DEFINER : s'exécute avec
-- les droits du propriétaire de la table, contourne légitimement la
-- policy UPDATE admin-only, exactement comme le ferait un admin.
CREATE OR REPLACE FUNCTION public.fn_bilan_booking_close_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slot_id IS NOT NULL AND NEW.statut <> 'annule' THEN
    UPDATE public.bilan_slots SET disponible = false WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bilan_booking_close_slot ON public.bilan_bookings;
CREATE TRIGGER trg_bilan_booking_close_slot
  AFTER INSERT ON public.bilan_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bilan_booking_close_slot();

-- ── 7. Un membre ne peut qu'annuler sa propre réservation ────────────
-- L'ancienne policy n'avait aucune restriction de colonne : un membre
-- pouvait en théorie passer sa propre ligne à statut='confirme'.
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bilan_bookings;

CREATE POLICY "bilan_bookings_update_own_cancel_only" ON public.bilan_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND statut = 'annule');
