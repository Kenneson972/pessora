-- Pessora 18/09/2026 : resserrage du rate limiter distribué (P1-16).
--
-- check_rate_limit (créée par 20260601210000_rate_limiter_pg.sql) est STATEFUL
-- (INSERT/UPDATE dans rate_limits) et était EXECUTABLE par PUBLIC + anon + authenticated
-- (grant par défaut de Postgres) → un visiteur peut pré-remplir le bucket d'un autre
-- appelant pour lui faire prendre un 429 (DoS ciblé). Les seuls appelants légitimes sont
-- SECURITY DEFINER (le propriétaire garde son EXECUTE, ex. fn_bilan_booking_before_insert)
-- et les edge functions (service_role).
--
-- ⚠️ MOTIF MAISON CORRIGÉ — ne pas « simplifier » en `FROM PUBLIC` seul :
--   PUBLIC             = le grant `=X` de l'ACL (tout rôle en hérite implicitement) ;
--   anon/authenticated = leurs grants EXPLICITES (posés en plus du grant par défaut).
--   Le précédent (20260424220000, fn_pessobot_rate_check) a fait `REVOKE … FROM PUBLIC`
--   seul → anon/authenticated ont gardé leur `X` explicite et la fonction est restée
--   appelable en anon (mesuré 200 en prod). Les TROIS doivent partir ensemble.
--
-- Idempotent : REVOKE rejouable sans erreur (pas de IF EXISTS, donc le fichier doit être
-- POSTÉRIEUR à la création de la fonction).
revoke execute on function public.check_rate_limit(text, integer, integer)
  from PUBLIC, anon, authenticated;
