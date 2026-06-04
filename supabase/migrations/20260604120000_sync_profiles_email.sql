-- Fiabilise profiles.email : backfill depuis auth.users + sync au changement d'email.
-- Contexte : certains profils (créés hors flux app / avant trigger / email modifié dans Auth)
-- avaient profiles.email NULL, rendant l'email invisible dans l'espace admin.
-- Le trigger INSERT (on_auth_user_created → handle_new_user) couvre déjà les nouveaux comptes.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 1) Backfill des emails manquants depuis auth.users
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND (p.email IS NULL OR btrim(p.email) = '')
  AND u.email IS NOT NULL;

-- 2) Garder profiles.email synchronisé quand l'email change côté Auth
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();
