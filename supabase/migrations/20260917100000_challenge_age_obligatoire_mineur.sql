-- Challenge 21 jours : âge obligatoire + réservé aux personnes majeures (décision @user, 17/09/2026).
-- « retirer l'âge facultatif » + « en dessous de 18 ans ils ne peuvent pas ».
--
-- Garde côté base : le refus d'un mineur doit se prouver à l'ÉCRITURE (appel API direct compris),
-- pas seulement dans l'UI (même règle que le cliquet : UI + garde serveur).
-- Ne s'applique qu'aux inscriptions de type 'challenge' : les 6 autres types d'événement
-- (ChallengeRegistrationCard.tsx, inchangé) n'écrivent pas de colonne age et ne sont pas concernés.
--
-- SECURITY DEFINER (comme fn_update_challenge21j_registration) : le trigger doit pouvoir lire
-- public.events quel que soit le rôle appelant (anon / authenticated / postgres).
-- BEFORE INSERT OR UPDATE : couvre le .insert() direct du front ET le UPDATE via la RPC d'édition.
-- Les contrôles sont SÉPARÉS (pas de OR enchaîné) : le cast ::int ne s'exécute qu'après le test
-- du format numérique, sinon une chaîne non numérique lèverait un 22P02 au lieu du P0001 voulu.

CREATE OR REPLACE FUNCTION public.enforce_challenge_age_majorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_type text;
BEGIN
  SELECT e.type INTO v_type
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF v_type = 'challenge' THEN
    -- 1. âge requis (plus de « facultatif » / « non renseigné »)
    IF NEW.age IS NULL OR NEW.age = '' OR NEW.age = 'non_renseigne' THEN
      RAISE EXCEPTION 'Age obligatoire - participation reservee aux personnes majeures (18 ans et plus).'
        USING ERRCODE = 'P0001';
    END IF;

    -- 2. format numérique (1 à 3 chiffres)
    IF NEW.age !~ '^[0-9]{1,3}$' THEN
      RAISE EXCEPTION 'Age invalide - participation reservee aux personnes majeures (18 ans et plus).'
        USING ERRCODE = 'P0001';
    END IF;

    -- 3. majorité (>= 18)
    IF NEW.age::int < 18 THEN
      RAISE EXCEPTION 'Age inferieur a 18 ans - participation reservee aux personnes majeures.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_challenge_age_majorite ON public.event_registrations;
CREATE TRIGGER trg_enforce_challenge_age_majorite
  BEFORE INSERT OR UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_challenge_age_majorite();

COMMENT ON COLUMN public.event_registrations.age IS
  'Challenge 21j uniquement. Obligatoire : age numerique >= 18 (garde trigger enforce_challenge_age_majorite).';
