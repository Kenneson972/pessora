-- Lot `profils` (docs/CONSIGNES-CLAUDE.md, 12/09) : un membre modifie son
-- profil -> l'interface dit "enregistré", rien n'est écrit. Prouvé en live :
-- PATCH { phone: ... } -> 204, la valeur ne bouge pas.
--
-- Cause : `pg_policy` sur public.profiles ne contient AUCUNE policy UPDATE
-- pour le propriétaire de la ligne -- seulement `profiles_insert_own`
-- (INSERT), `Users can read own profile` (SELECT, propriétaire ou admin) et
-- `Admins update all profiles` (UPDATE, is_admin() seulement). Un membre en
-- self-update n'a donc aucune ligne RLS qui matche : PostgREST renvoie 204
-- (0 ligne touchée), et le front (AuthContext.updateProfile) ne vérifie
-- jamais le nombre de lignes -> faux succès.
--
-- "Policy self-update sans `role`" n'est pas exprimable en RLS (la RLS est
-- au niveau ligne, pas colonne) -- d'où le trigger, qui remet les colonnes
-- protégées à leur valeur d'origine quand l'appelant n'est pas admin.
--
-- ⚠️ BEFORE INSERT OR UPDATE, pas UPDATE seul : `profiles_insert_own`
-- (WITH CHECK auth.uid() = id) existe déjà et n'interdit pas role='admin'
-- sur une ligne absente -- un self-signup pourrait s'auto-promouvoir à
-- l'insertion si le trigger ne couvrait que l'UPDATE.

CREATE OR REPLACE FUNCTION public.fn_profiles_guard_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- role : jamais choisi par l'appelant, sauf un admin qui crée la ligne
    -- lui-même (ex. depuis l'admin). Par défaut : 'member'.
    IF NOT public.is_admin() THEN
      NEW.role := 'member';
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- UPDATE : created_at ne bouge jamais, updated_at est toujours géré serveur.
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();

  -- stripe_customer_id et email sont posés par des chemins serveur dédiés
  -- (webhook Stripe, sync auth.users) -- jamais par un PATCH profiles,
  -- admin compris.
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.email := OLD.email;

  -- role : modifiable seulement par un admin (recette : Catherine change un
  -- rôle depuis l'admin -> ça marche toujours). Un membre qui l'envoie dans
  -- son propre PATCH le voit revenir à sa valeur actuelle, en silence.
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;

  -- Modifiables par le propriétaire ET l'admin : first_name, last_name,
  -- phone, avatar_url, preferences, admin_ui_prefs -- aucune restriction
  -- supplémentaire ici, la policy RLS ci-dessous gère déjà "sa propre ligne
  -- ou admin".
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_protected_columns ON public.profiles;
CREATE TRIGGER trg_profiles_guard_protected_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_profiles_guard_protected_columns();

COMMENT ON FUNCTION public.fn_profiles_guard_protected_columns() IS
  'Protège role/stripe_customer_id/email/created_at/updated_at sur '
  'public.profiles. Un self-update ne peut modifier que first_name, '
  'last_name, phone, avatar_url, preferences, admin_ui_prefs -- role reste '
  'modifiable par un admin (is_admin()). Ne pas révoquer la colonne role à '
  '`authenticated` : Catherine EST authenticated, seule la RLS/trigger '
  'distingue le rôle applicatif.';

-- Policy manquante qui empêchait tout self-update (RLS dit non avant même
-- que le trigger n'entre en jeu) : le propriétaire peut mettre à jour sa
-- propre ligne. Le trigger ci-dessus, pas cette policy, protège les
-- colonnes sensibles -- WITH CHECK reste volontairement large (auth.uid() =
-- id), la RLS ne sait pas restreindre par colonne.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
