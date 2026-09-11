-- Bloquant post-merge lot A (docs/CONSIGNES-CLAUDE.md) : aucun chemin ne
-- rattachait un créneau à un challenge. AdminBilans.tsx:createSlotAtSelected()
-- insère { date, heure, disponible } sans challenge_event_id -> tout créneau
-- créé depuis l'admin est orphelin -> fn_bilan_slot_bookable() = false ->
-- invisible sur la page publique, même disponible=true.
--
-- Page blanche confirmée en base : aucun trigger n'existe aujourd'hui sur
-- bilan_slots. Pas de backfill à prévoir : les 7 créneaux legacy sont tous
-- passés (25/04→13/05), ils restent orphelins à juste titre.
--
-- Doctrine de la soirée : la règle vit côté serveur, l'UI se contente
-- d'afficher (état lisible ajouté dans AdminBilans.tsx).

CREATE OR REPLACE FUNCTION public.fn_bilan_slot_attach_challenge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Rattache si le lien est vide, ou le recalcule si la date a bougé et que
  -- le lien n'a pas été posé explicitement dans la même requête (NEW ==
  -- OLD == valeur automatique précédente). Un lien explicitement modifié
  -- par l'appelant n'est jamais écrasé.
  IF NEW.challenge_event_id IS NULL
     OR (TG_OP = 'UPDATE'
         AND NEW.date IS DISTINCT FROM OLD.date
         AND NEW.challenge_event_id IS NOT DISTINCT FROM OLD.challenge_event_id) THEN
    -- Départage déterministe : le challenge dont la date est la plus proche
    -- au-dessus de celle du créneau (celui que le créneau prépare). Sans ce
    -- ORDER BY, un chevauchement de deux challenges actifs donnerait un
    -- résultat dépendant du plan d'exécution.
    SELECT e.id INTO NEW.challenge_event_id
    FROM public.events e
    WHERE e.type = 'challenge'
      AND e.active = true
      AND NEW.date BETWEEN (e.date - 14) AND e.date
    ORDER BY e.date ASC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bilan_slot_attach_challenge ON public.bilan_slots;
CREATE TRIGGER trg_bilan_slot_attach_challenge
  BEFORE INSERT OR UPDATE ON public.bilan_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bilan_slot_attach_challenge();

COMMENT ON FUNCTION public.fn_bilan_slot_attach_challenge() IS
  'Rattache automatiquement un créneau bilan au challenge actif dont la '
  'fenêtre J-14..J couvre sa date. Départage déterministe par date de '
  'challenge la plus proche (ORDER BY e.date ASC LIMIT 1). Recalcule sur '
  'changement de date si le lien n''a pas été posé explicitement par '
  'l''appelant. Aucun match -> orphelin assumé, comme les 7 créneaux legacy.';
