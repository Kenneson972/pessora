-- Newsletter v2 (révision 3) : consentement daté, désabonnement conforme (fn_unsubscribe),
-- réinscription (fn_resubscribe), geste admin audité (fn_admin_set_subscription), envoi
-- par destinataire tracé, vue source de vérité unique.
-- Voir docs/BRIEF-NEWSLETTER-2026-09-17.md (fait autorité) et
-- docs/superpowers/specs/2026-09-17-newsletter-v2-design.md (révision 3, déclinaison technique).
-- Idempotent de bout en bout — rejouable sans erreur.

-- ─── 1.1 Le consentement devient une preuve DATÉE ──────────────────────────────────
alter table public.newsletter_subscribers
  add column if not exists consented_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Reprise de l'existant : consent = true sans date devient consented_at = created_at.
update public.newsletter_subscribers
   set consented_at = created_at
 where consent is true and consented_at is null;

-- AUCUNE policy UPDATE sur cette table, jamais — même pour l'admin. Le seul chemin
-- d'écriture de consented_at/unsubscribed_at passe par les 3 fonctions SECURITY DEFINER
-- ci-dessous : c'est ce qui rend chaque désabonnement/réinscription auditable (une date,
-- jamais un flip muet de booléen).
revoke update, truncate, references, trigger on public.newsletter_subscribers from anon, authenticated;

-- ─── 1.2.2 Désinscription — seul écrivain de unsubscribed_at ──────────────────────
-- Idempotente : rejouer avec le même jeton ne réécrit pas la date une 2e fois.
-- Jeton inconnu : v_id reste null, retourne already=false SANS lever d'erreur (la
-- fonction appelante décide de la réponse neutre — anti-énumération, cf. edge function).
create or replace function public.fn_unsubscribe(p_token uuid)
returns table(found boolean, already boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_already boolean;
begin
  select id, (unsubscribed_at is not null) into v_id, v_already
    from public.newsletter_subscribers
   where unsubscribe_token = p_token;

  if v_id is null then
    return query select false, false;
    return;
  end if;

  if not v_already then
    update public.newsletter_subscribers
       set unsubscribed_at = now()
     where id = v_id;
  end if;

  return query select true, v_already;
end;
$$;

revoke all on function public.fn_unsubscribe(uuid) from public;
grant execute on function public.fn_unsubscribe(uuid) to anon, authenticated;

-- ─── 1.2.3 Réinscription — la copie du site promet "réinscrivez-vous", il faut un chemin ──
-- email est UNIQUE : un second INSERT après désabonnement échoue en 23505. Le formulaire
-- public appelle cette fonction en repli sur ce conflit précis (voir NewsletterSignup.tsx).
create or replace function public.fn_resubscribe(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.newsletter_subscribers
     set consented_at = now(),
         unsubscribed_at = null
   where email = p_email;
end;
$$;

revoke all on function public.fn_resubscribe(text) from public;
grant execute on function public.fn_resubscribe(text) to anon, authenticated;

-- ─── Geste admin — écrit une date, jamais un simple basculement de booléen ─────────
-- La règle "aucun UPDATE sur les abonnés" vise le flip silencieux, pas l'action de
-- l'admin : ce geste existe (quelqu'un appelle le bar pour sortir de la liste), il est
-- juste tracé et réservé à is_admin().
create or replace function public.fn_admin_set_subscription(p_subscriber_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if p_action = 'unsubscribe' then
    update public.newsletter_subscribers set unsubscribed_at = now() where id = p_subscriber_id;
  elsif p_action = 'resubscribe' then
    update public.newsletter_subscribers set consented_at = now(), unsubscribed_at = null where id = p_subscriber_id;
  else
    raise exception 'invalid action: %', p_action;
  end if;
end;
$$;

revoke all on function public.fn_admin_set_subscription(uuid, text) from public;
grant execute on function public.fn_admin_set_subscription(uuid, text) to authenticated;

-- ─── 1.3 Campagnes et envois ────────────────────────────────────────────────────────
create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  -- promo | challenge | evenement | info — valeurs DOCUMENTÉES (src/lib/newsletterTypes.ts),
  -- pas de CHECK fermé : une liste fermée tue chaque surface future (même arbitrage que
  -- newsletterSources.ts pour `source`).
  type text not null,
  subject text not null,
  body text not null,
  image_url text,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  -- on delete set null (pas cascade) : si un abonné est effacé (RGPD), l'historique
  -- d'envoi survit — email est figé tel qu'envoyé, ci-dessous.
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  email text not null,
  -- pending : ligne réservée, pas encore d'attempt Resend.
  -- delivered : Resend a accepté l'appel (resend_id renseigné) — nom provisoire tant que
  --   le webhook signé n'existe pas (cf. spec §9, question ouverte pour Ken) : ça ne
  --   prouve pas la livraison boîte mail, seulement l'acceptation par Resend.
  -- bounced : réservé au webhook futur, jamais écrit par send-newsletter aujourd'hui.
  -- failed : erreur Resend explicite et lisible (4xx/5xx avec corps) — rejeu sûr.
  -- unknown : timeout/réseau/réponse illisible — PAS un échec confirmé, jamais relancé
  --   automatiquement (un retry sur unknown doublonnerait un envoi qui a peut-être réussi).
  status text not null default 'pending' check (status in ('pending', 'delivered', 'bounced', 'failed', 'unknown')),
  resend_id text,
  error text,
  sent_at timestamptz not null default now(),
  -- Idempotence de la reprise : impossible de créer 2 lignes pour le même couple
  -- campagne/abonné.
  unique (campaign_id, subscriber_id)
);

-- ─── 1.4 La vue — le prédicat n'existe qu'une fois ─────────────────────────────────
-- security_invoker = true (PG15+) : sans ça, la vue s'exécute avec les droits de son
-- propriétaire et contourne les RLS de newsletter_subscribers — le trou classique.
create or replace view public.newsletter_sendable
with (security_invoker = true) as
select id, email, source, consented_at
  from public.newsletter_subscribers
 where unsubscribed_at is null              -- encore inscrite
   and consented_at is not null             -- a dit OUI (« non » et « jamais demandé » exclus)
   and lower(source) not like 'test-%';     -- exclusion des lignes de test, jamais un CHECK fermé

-- ─── 1.5 RLS + grants explicites ───────────────────────────────────────────────────
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_sends enable row level security;

drop policy if exists "Admin read newsletter campaigns" on public.newsletter_campaigns;
create policy "Admin read newsletter campaigns"
  on public.newsletter_campaigns for select
  using (is_admin());

drop policy if exists "Admin read newsletter sends" on public.newsletter_sends;
create policy "Admin read newsletter sends"
  on public.newsletter_sends for select
  using (is_admin());

-- Aucune policy INSERT/UPDATE/DELETE anon/authenticated sur campaigns/sends : seul le
-- service role (edge function) y écrit.
revoke all on public.newsletter_campaigns from anon, authenticated;
grant select on public.newsletter_campaigns to authenticated; -- RLS: is_admin()

revoke all on public.newsletter_sends from anon, authenticated;
grant select on public.newsletter_sends to authenticated; -- RLS: is_admin()

-- La vue hérite du RLS de newsletter_subscribers (security_invoker) : un authenticated
-- non-admin n'y verra rien, faute de policy SELECT non-admin sur la table source.
grant select on public.newsletter_sendable to authenticated;
revoke all on public.newsletter_sendable from anon;

-- ─── 1.6 Bucket newsletter-images ──────────────────────────────────────────────────
-- Catherine dépose depuis son téléphone : HEIC/HEIF accepté en amont (conversion JPEG
-- côté navigateur avant l'envoi, cf. src/lib/heicToJpeg.ts — même traitement que la
-- galerie Skin), donc autorisé ici en filet si jamais la conversion est court-circuitée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'newsletter-images', 'newsletter-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

drop policy if exists "Public read newsletter-images" on storage.objects;
create policy "Public read newsletter-images"
  on storage.objects for select
  using (bucket_id = 'newsletter-images');

drop policy if exists "Admin write newsletter-images" on storage.objects;
create policy "Admin write newsletter-images"
  on storage.objects for insert
  with check (bucket_id = 'newsletter-images' and is_admin());

drop policy if exists "Admin update newsletter-images" on storage.objects;
create policy "Admin update newsletter-images"
  on storage.objects for update
  using (bucket_id = 'newsletter-images' and is_admin());

drop policy if exists "Admin delete newsletter-images" on storage.objects;
create policy "Admin delete newsletter-images"
  on storage.objects for delete
  using (bucket_id = 'newsletter-images' and is_admin());
