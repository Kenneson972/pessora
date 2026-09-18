-- Newsletter v2 : désabonnement conforme, envoi par destinataire, vue source de vérité.
-- Voir docs/BRIEF-NEWSLETTER-2026-09-17.md (fait autorité) et
-- docs/superpowers/specs/2026-09-17-newsletter-v2-design.md (révision 2, déclinaison technique).
-- Idempotent de bout en bout — rejouable sans erreur.

-- ─── 1. Jeton de désinscription sur newsletter_subscribers ────────────────────────
alter table newsletter_subscribers
  add column if not exists token uuid not null default gen_random_uuid();

-- Arbitrage #5 (brief) : AUCUNE policy UPDATE sur newsletter_subscribers, jamais.
-- Un consentement ne se bascule pas — un désabonnement s'écrit en ligne datée dans
-- newsletter_unsubscribes (append-only), voir plus bas. Ne pas ajouter de policy
-- UPDATE ici, même pour l'admin : si un besoin apparaît un jour, il passe par une
-- ligne dans newsletter_unsubscribes, pas par une mutation de cette table.

-- ─── 2. Campagnes (l'email que Catherine écrit) ────────────────────────────────────
create table if not exists newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  image_url text,
  event_id uuid references events(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── 3. Envois — une ligne par destinataire, jamais un compteur agrégé ─────────────
create table if not exists newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references newsletter_subscribers(id) on delete cascade,
  -- pending : réservé, envoi en cours, pas encore de réponse Resend
  -- sent    : Resend a accepté l'appel (resend_id renseigné)
  -- failed  : Resend a répondu une erreur explicite et lisible
  -- unknown : timeout / réponse illisible — PAS un échec confirmé, jamais reclassé
  --           automatiquement en failed (un retry sur unknown doublonnerait un envoi
  --           qui a peut-être réussi côté Resend)
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'unknown')),
  resend_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Idempotence de la reprise : impossible de créer 2 lignes pour le même couple
  -- campagne/abonné, donc une reprise ne peut jamais doublonner un envoi.
  unique (campaign_id, subscriber_id)
);

-- ─── 4. Désinscriptions — append-only, jamais un UPDATE sur subscribers ───────────
create table if not exists newsletter_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references newsletter_subscribers(id) on delete cascade,
  unsubscribed_at timestamptz not null default now(),
  unique (subscriber_id)
);

-- ─── 5. Vue newsletter_sendable — LA source de vérité de « qui reçoit » ────────────
-- Compteur d'envoi, filtre « jamais demandé », export CSV ET send-newsletter lisent
-- TOUS cette vue, jamais la table brute (arbitrage #4 : sinon une exclusion posée ici
-- serait purement décorative pour l'edge function qui, elle, continuerait de lire
-- la table en service_role).
create or replace view newsletter_sendable as
select s.id, s.email, s.source, s.token, s.created_at
from newsletter_subscribers s
where s.consent = true
  and lower(s.source) not like 'test-%'
  and not exists (
    select 1 from newsletter_unsubscribes u where u.subscriber_id = s.id
  );

-- ─── 6. RLS ─────────────────────────────────────────────────────────────────────
alter table newsletter_campaigns enable row level security;
alter table newsletter_sends enable row level security;
alter table newsletter_unsubscribes enable row level security;

drop policy if exists "Admin read newsletter campaigns" on newsletter_campaigns;
create policy "Admin read newsletter campaigns"
  on newsletter_campaigns for select
  using (is_admin());

drop policy if exists "Admin read newsletter sends" on newsletter_sends;
create policy "Admin read newsletter sends"
  on newsletter_sends for select
  using (is_admin());

drop policy if exists "Admin read newsletter unsubscribes" on newsletter_unsubscribes;
create policy "Admin read newsletter unsubscribes"
  on newsletter_unsubscribes for select
  using (is_admin());

-- Aucune policy INSERT/UPDATE/DELETE pour anon/authenticated sur ces 3 tables :
-- seul le service role (edge functions) y écrit, RLS ferme tout le reste par défaut.

-- ─── 7. Grants explicites (arbitrage #7) ───────────────────────────────────────────
-- Ce motif nous a déjà valu un DELETE oublié sur bilan_bookings : on ne compte pas
-- sur le GRANT ALL par défaut aux rôles publics, on écrit ce qu'on autorise.
revoke all on newsletter_subscribers from anon, authenticated;
grant insert on newsletter_subscribers to anon, authenticated;   -- formulaire public
grant select, delete on newsletter_subscribers to authenticated; -- admin (RLS: is_admin())
-- Pas de grant UPDATE, jamais, pour aucun rôle — cf. §1.

revoke all on newsletter_campaigns from anon, authenticated;
grant select on newsletter_campaigns to authenticated; -- admin (RLS: is_admin())

revoke all on newsletter_sends from anon, authenticated;
grant select on newsletter_sends to authenticated; -- admin (RLS: is_admin())

revoke all on newsletter_unsubscribes from anon, authenticated;
grant select on newsletter_unsubscribes to authenticated; -- admin (RLS: is_admin())

grant select on newsletter_sendable to authenticated; -- admin (hérite du filtre RLS via subscribers? non : vue = security invoker par défaut, donc RLS de newsletter_subscribers s'applique déjà)
