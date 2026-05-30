# Cursor Prompt — Fix RLS Supabase Pessora (31 Mai 2026)

## Contexte

Audit RLS complet effectué. 3 problèmes critiques, 2 élevés, 2 modérés.
Aucune régression à craindre — les Edge Functions Stripe bypassent RLS (service key).

---

## 🔴 CRITIQUE 1 : `bilan_slots` — ZÉRO politique RLS

**Problème :** La table `bilan_slots` n'a aucune politique RLS. Elle existe probablement dans le schéma baseline (pré-migrations). Si RLS est activé → tout le monde est bloqué. Si pas activé → fail-open.

**Action :** Créer une migration `supabase/migrations/20260531150000_rls_bilan_slots_bookings.sql`

```sql
-- 1. Activer RLS si pas déjà fait
ALTER TABLE public.bilan_slots ENABLE ROW LEVEL SECURITY;

-- 2. Tout le monde peut voir les créneaux disponibles
CREATE POLICY "Anyone can view available slots" ON public.bilan_slots
  FOR SELECT
  USING (is_available = true AND slot_date >= CURRENT_DATE);

-- 3. Admin peut tout voir (y compris indisponibles/passés)
CREATE POLICY "Admins can view all slots" ON public.bilan_slots
  FOR SELECT
  USING (public.is_admin());

-- 4. Admin peut créer des créneaux
CREATE POLICY "Admins can insert slots" ON public.bilan_slots
  FOR INSERT
  WITH CHECK (public.is_admin());

-- 5. Admin peut modifier des créneaux
CREATE POLICY "Admins can update slots" ON public.bilan_slots
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Admin peut supprimer des créneaux
CREATE POLICY "Admins can delete slots" ON public.bilan_slots
  FOR DELETE
  USING (public.is_admin());
```

---

## 🔴 CRITIQUE 2 : `bilan_bookings` — Membres ne voient pas leurs réservations

**Problème :** Une seule politique admin-select existe. Les membres ne peuvent pas :
- Voir leurs propres réservations (→ `MesBilans.tsx` cassé)
- Créer une réservation (→ `BilanBienEtre.tsx` cassé)
- Annuler une réservation

**Action :** Dans la même migration :

```sql
-- 1. Activer RLS si pas déjà fait
ALTER TABLE public.bilan_bookings ENABLE ROW LEVEL SECURITY;

-- 2. Admin peut tout voir (conserver l'existante si elle existe, ou la recréer)
DROP POLICY IF EXISTS "Admins read all bilan bookings" ON public.bilan_bookings;
CREATE POLICY "Admins read all bilan bookings" ON public.bilan_bookings
  FOR SELECT
  USING (public.is_admin());

-- 3. Membre voit SES réservations
CREATE POLICY "Users read own bookings" ON public.bilan_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Membre peut réserver un créneau
CREATE POLICY "Users can create bookings" ON public.bilan_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Membre peut annuler sa réservation (UPDATE status)
CREATE POLICY "Users can cancel own bookings" ON public.bilan_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Admin peut modifier/supprimer toute réservation
CREATE POLICY "Admins can update bookings" ON public.bilan_bookings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete bookings" ON public.bilan_bookings
  FOR DELETE
  USING (public.is_admin());
```

---

## 🟠 ÉLEVÉ 1 : Standardiser les checks admin sur `is_admin()`

**Problème :** Deux migrations récentes utilisent des sous-requêtes inline au lieu de `public.is_admin()` :

- `supabase/migrations/20260530120000_rls_products_events.sql`
- `supabase/migrations/20260531000000_home_banner.sql`

Pattern à remplacer :
```sql
-- AVANT (fragile — dépend de la RLS de profiles)
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')

-- APRÈS (robuste — SECURITY DEFINER, bypass la RLS)
USING (public.is_admin())
```

**Action :** Remplacer TOUTES les occurrences de `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'` par `public.is_admin()` dans ces deux fichiers.

Ne pas toucher aux autres migrations — elles utilisent déjà `is_admin()` correctement.

---

## 🟡 MODÉRÉ 1 : `profiles` UPDATE — ajouter WITH CHECK

**Problème :** La politique `Admins update all profiles` n'a que `USING`, pas de `WITH CHECK`. Un admin compromis pourrait modifier n'importe quel champ.

**Fichier :** La politique est dans le schéma baseline (pas dans une migration explicite). Le plus simple est d'ajouter une politique corrective dans la nouvelle migration :

```sql
-- Remplacer l'UPDATE policy existante par une version sécurisée
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

---

## 🟡 MODÉRÉ 2 : `stripe_events_processed` — RLS manquant

**Problème :** Table créée sans RLS. Principalement écrite par les Edge Functions (bypass RLS via service key), mais aucune protection si exposée via l'API publique.

**Action :** Dans la même migration :

```sql
ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;

-- Personne ne doit pouvoir lire/écrire cette table via l'API publique
-- (les Edge Functions utilisent la service_key et bypassent RLS)
CREATE POLICY "Deny all access" ON public.stripe_events_processed
  FOR ALL
  USING (false)
  WITH CHECK (false);
```

---

## 🟢 BONUS : Corriger le bug "?" dans l'admin

**Problème :** Des profils avec `first_name IS NULL AND last_name IS NULL AND email IS NULL` affichent "?" dans la liste admin. Ces comptes ont été créés sans métadonnées dans Supabase Auth.

**Action :** Exécuter cette requête de diagnostic (ne pas mettre dans la migration, c'est un one-shot) :

```sql
-- Identifier les profils fantômes
SELECT id, email, first_name, last_name, created_at 
FROM profiles 
WHERE first_name IS NULL AND last_name IS NULL;

-- Optionnel : les supprimer si ce sont des comptes tests
-- DELETE FROM auth.users WHERE id IN (<ids>);
```

Pour éviter que ça se reproduise, améliorer le trigger `on_auth_user_created` pour extraire `email` depuis `auth.users` et `first_name`/`last_name` depuis `raw_user_meta_data` avec fallback.

---

## Checklist

- [ ] Créer `supabase/migrations/20260531150000_rls_bilan_slots_bookings.sql` avec :
  - [ ] RLS + politiques `bilan_slots` (6 politiques)
  - [ ] RLS + politiques `bilan_bookings` (6 politiques)
  - [ ] Correction `profiles` UPDATE WITH CHECK
  - [ ] RLS `stripe_events_processed` (deny all)
- [ ] `20260530120000` : remplacer sous-requêtes inline par `is_admin()`
- [ ] `20260531000000` : remplacer sous-requêtes inline par `is_admin()`
- [ ] Vérifier que la migration s'applique sans erreur (`supabase db push` ou `supabase migration up`)
- [ ] Tester : admin peut voir/créer/modifier les créneaux de bilan
- [ ] Tester : membre peut voir SES réservations
- [ ] Tester : visiteur peut voir les créneaux disponibles
