-- Google OAuth : Google fournit `full_name` (ex "Kenneson") mais PAS `first_name`/`last_name`.
-- Le trigger `on_auth_user_created` (→ handle_new_user) lit first_name/last_name → NULL pour un
-- compte Google → le profil tombe en fallback sur le préfixe de l'email ("karibloom972").
-- Fix : backfill des comptes Google existants + trigger complémentaire (AFTER INSERT, donc
-- exécuté après on_auth_user_created qui trie avant par ordre alphabétique) qui splitte
-- full_name en prénom (1er mot) / nom (le reste) quand first_name est absent.
-- Cas limites couverts : nom à un seul mot → last_name NULL ; prénom composé "Jean-Marc" conservé.

-- 1) Backfill des profils existants (comptes Google déjà créés)
WITH name_parts AS (
  SELECT
    p.id AS profile_id,
    regexp_split_to_array(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), '\s+') AS arr
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE NULLIF(TRIM(p.first_name), '') IS NULL
    AND NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '') IS NOT NULL
)
UPDATE public.profiles p
SET
  first_name = np.arr[1],
  last_name = NULLIF(array_to_string(np.arr[2:], ' '), '')
FROM name_parts np
WHERE p.id = np.profile_id;

-- 2) Trigger pour les futurs comptes Google
CREATE OR REPLACE FUNCTION public.fill_profile_name_from_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full text;
  parts text[];
BEGIN
  full := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  IF full IS NULL THEN
    RETURN NEW;
  END IF;
  -- Ne pas écraser un first_name déjà fourni (signup email/mdp)
  IF NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '')), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;
  parts := regexp_split_to_array(full, '\s+');
  UPDATE public.profiles
  SET
    first_name = parts[1],
    last_name = NULLIF(array_to_string(parts[2:], ' '), '')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_fill_name ON auth.users;
CREATE TRIGGER on_auth_user_created_fill_name
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_profile_name_from_full_name();
