# Phase 1 — P0 Sécurité (Stripe + Admin) — Pessora

> Audit du 1er Juin 2026. Fix CES bugs avant toute mise en prod.

---

## 🚨 P0-1 : RLS leak — Commandes lisibles publiquement

**Fichier** : `supabase/migrations/20260531220000_guest_checkout_fields.sql:15-17`

**Problème** : La policy `Anyone can read order by access_token` vérifie seulement `access_token IS NOT NULL`. N'importe qui avec la clé anon peut lire toutes les commandes (nom, téléphone, montants).

**À faire** :
- Supprimer cette policy
- Créer une Edge Function qui vérifie le token côté serveur
- Ou utiliser `USING (access_token = current_setting('request.jwt.claims')::json->>'token')`

---

## 🚨 P0-2 : access_token dans l'URL Stripe

**Fichier** : `supabase/functions/create-checkout-session/index.ts:255`

**Problème** : `success_url: ...&token=${accessToken}` → token dans l'historique navigateur, logs, Referer.

**À faire** :
- Ne passer QUE `session_id` dans l'URL
- Récupérer le token via une Edge Function après redirection (utiliser `orders.stripe_session_id` pour retrouver l'order)

---

## 🚨 P0-3 : Usurpation email dans create-subscription-session

**Fichier** : `supabase/functions/create-subscription-session/index.ts:10,95`

**Problème** : Le champ `email` vient du body client → un user peut lier l'abonnement à un autre email.

**À faire** :
- Ignorer `email` du body
- Toujours utiliser `user.email` du JWT vérifié

---

## 🔴 P0-4 : Clé ANON pour mutations admin

**Fichier** : `src/lib/supabaseClient.ts:15`

**Problème** : Toute la sécurité admin repose sur les RLS PostgreSQL. Si une RLS est mal configurée, bypass admin.

**À faire** :
- Auditer TOUTES les politiques RLS pour : `gamme_products`, `bilan_slots`, `bilan_bookings`, `home_carousel_cards`, `split_gammes`, `bar_settings`, `home_banner`
- Vérifier que `is_admin()` est bien appelé dans chaque policy de mutation

---

## 🔴 P0-5 : Validation upload images (magic bytes)

**Fichier** : `src/lib/storageUpload.ts`

**Problème** : Seul `file.type` (MIME) est vérifié — trivial à spoof.

**À faire** :
- Ajouter vérification magic bytes côté client
- Optionnel : Edge Function de validation/redimensionnement

---

**Contexte** : Projet Pessora, /opt/data/repos/pessora. Stack React+TS+Tailwind+Supabase+Stripe.
