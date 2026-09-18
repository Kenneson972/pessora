# Design — Newsletter v2 (upload image, types, désabonnement, CRUD abonnés)

**Date :** 2026-09-17

## Contexte

La newsletter existe déjà (spec `2026-06-03-newsletter-admin-design.md`, implémentée) :
`AdminCommunications.tsx` compose sujet + corps + `image_url` (texte libre) et envoie
via l'edge function `send-newsletter` en un seul appel Resend, tous les abonnés en BCC.
`newsletter_subscribers` (id, email, consent, source, created_at) n'a ni statut, ni
mécanisme de désabonnement — même pas un lien dans l'email. L'historique d'envoi est
en `useState` local (perdu au refresh).

Ce lot ajoute 4 choses, discutées et validées avec Ken :
1. Upload d'image par drag & drop dans le composer (remplace le champ URL texte).
2. Sélecteur de type de newsletter (Promo/Nouveau produit, Challenge 21j, Événement,
   Info générale) qui pré-remplit un gabarit sujet/corps.
3. Désabonnement en un clic (lien magique par token, dans le footer de chaque email).
4. CRUD abonnés enrichi (date d'inscription, toggle actif/désabonné, badge membre du site).
5. Historique des envois persisté en base (nouvelle table `newsletter_campaigns`).

## 1. Migration base de données

**Fichier :** `supabase/migrations/20260917<HHMMSS>_newsletter_v2.sql`

```sql
-- Désabonnement
alter table newsletter_subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz;

-- Admin peut désabonner/réabonner manuellement depuis l'admin (pas de policy anon)
create policy "Admin update newsletter subscriber"
  on newsletter_subscribers for update
  using (is_admin())
  with check (is_admin());

-- Historique des envois
create table newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('promo', 'challenge', 'evenement', 'info')),
  subject text not null,
  body text not null,
  image_url text,
  recipient_count integer not null default 0,
  sent_at timestamptz not null default now()
);

alter table newsletter_campaigns enable row level security;

create policy "Admin read newsletter campaigns"
  on newsletter_campaigns for select
  using (is_admin());

-- Écriture réservée au service role (l'edge function insère après envoi réussi) :
-- aucune policy INSERT pour authenticated/anon — RLS ferme par défaut.
```

Bucket Storage `newsletter-images` : public en lecture, écriture réservée admin — même
pattern que `carousel-images` / `event-images` (policy `profiles.role = 'admin'`).

**Filet obligatoire (cohérence avec le reste du projet) :** `unsubscribed_at is null` est
le SEUL critère d'envoi. Le token a un défaut (`gen_random_uuid()`), donc toujours présent
— il sert uniquement à générer le lien de désinscription, jamais à filtrer les destinataires.

## 2. Edge function `send-newsletter` (réécrite)

**Fichier :** `supabase/functions/send-newsletter/index.ts`

Changements par rapport à l'existant :
- Reçoit en plus `{ type }` (une des 4 valeurs).
- Sélectionne les abonnés avec `unsubscribed_at is null` (au lieu de tous).
- **Envoi individualisé par lot** au lieu d'un seul BCC : l'API batch de Resend
  (`POST /emails/batch`, jusqu'à 100 messages par requête) — un message par abonné,
  chacun avec son propre lien `https://www.pessora.fr/newsletter/desinscription?token=<unsubscribe_token>`
  inséré dans le footer HTML (remplace la ligne « Vous recevez cet email... »).
  Découpage en tranches de 100 si plus d'abonnés.
- `image_url` : image uploadée (bucket `newsletter-images`), même rendu HTML qu'aujourd'hui.
- Après envoi réussi (au moins 1 lot OK), insère une ligne dans `newsletter_campaigns`
  (`type`, `subject`, `body`, `image_url`, `recipient_count`, `sent_at`) via service role.
- Retour : `{ success: true, count: N }` (inchangé côté contrat pour le front).
- Échec partiel (certains lots Resend en erreur) : logger côté serveur, compter les
  succès réels dans `recipient_count`, retourner quand même `success: true` avec le
  count réel — ne jamais faire échouer tout l'envoi pour un lot en erreur isolé.

## 3. Edge function `newsletter-unsubscribe` (nouvelle)

**Fichier :** `supabase/functions/newsletter-unsubscribe/index.ts`

- Publique, `verify_jwt = false` (comme `send-contact-email`).
- Reçoit `{ token }` (POST, JSON — appelé depuis la page publique, pas un lien GET direct
  pour éviter qu'un scanner d'email/antivirus désabonne les gens en pré-chargeant le lien).
- Vérifie que le token existe dans `newsletter_subscribers` ; si trouvé et pas déjà
  désabonné, pose `unsubscribed_at = now()` via service role.
- Réponses : `{ success: true }` / `{ success: true, already: true }` (déjà désabonné,
  pas une erreur) / `404` si token inconnu.
- Pas de fuite d'info : ne jamais renvoyer l'email associé au token.

## 4. Page publique `/newsletter/desinscription`

**Fichier :** `src/pages/NewsletterUnsubscribe.tsx` + route dans `App.tsx` (lazy, comme
les autres pages).

- Lit `?token=` dans l'URL, affiche un état de confirmation **avant** d'appeler la
  fonction (bouton "Confirmer la désinscription" — pas d'action au simple chargement de
  la page, cf. remarque anti-prefetch ci-dessus).
- Après confirmation : message de succès ("Vous êtes désinscrit·e de la newsletter
  PessÓra.") ou message d'erreur neutre si token invalide.
- `X-Robots-Tag: noindex, nofollow` dans `vercel.json` (page technique, même règle que
  `/connexion`, `/mon-espace`).

## 5. Composer admin — upload image + types

**Fichier :** `src/pages/admin/AdminCommunications.tsx`

- Le champ texte `image_url` est remplacé par une zone drag & drop (ou clic pour
  parcourir) qui upload vers `newsletter-images`, affiche l'aperçu, et permet de retirer
  l'image. Réutilise le composant d'upload déjà utilisé ailleurs dans l'admin (même
  pattern que `AdminGammes`/carrousel — pas de nouveau composant générique à inventer).
- Nouveau sélecteur **Type** (4 boutons/segment : Promo, Challenge 21j, Événement, Info
  générale) au-dessus du sujet. Changer de type **avant** d'avoir tapé quoi que ce soit
  pré-remplit sujet + corps avec un gabarit de départ (texte simple, modifiable) :
  - Promo/Nouveau produit : sujet « Nouveau à la carte 🍹 », corps amorce présentation.
  - Challenge 21j : sujet « Le prochain Challenge 21 jours ouvre bientôt », corps amorce
    inscription.
  - Événement : sujet « On vous attend au bar ! », corps amorce date/lieu.
  - Info générale : sujet libre, corps vide (pas de gabarit forcé).
  Si l'admin a déjà tapé du texte, changer de type ne l'écrase pas (confirmation si
  contenu non vide).
- `sendNewsletter` envoie `type` en plus de `subject`/`body`/`image_url`.
- Historique : nouvel onglet ou section "Derniers envois" qui lit `newsletter_campaigns`
  (les 20 derniers, triés par `sent_at desc`) au lieu du `nlLastSent` en state local.

## 6. CRUD abonnés

**Fichier :** `src/pages/admin/AdminCommunications.tsx` (section liste existante)

- Colonne **Date d'inscription** : `created_at` déjà en base, affichage `dd/mm/yyyy`.
- Colonne **Statut** avec toggle Actif/Désabonné : bascule `unsubscribed_at` (now / null)
  via update direct (RLS admin ajoutée en migration). Confirmation avant désabonnement
  manuel (` ConfirmDialog` déjà utilisé ailleurs dans ce fichier).
- Colonne **Membre du site** : badge si l'email de l'abonné existe dans `profiles.email`
  (une requête `select email from profiles where email = any(emails)` au chargement de
  la liste, jointure faite côté client — pas de nouvelle colonne dénormalisée).
- La suppression définitive existante (RGPD "droit à l'oubli") reste inchangée et
  distincte du toggle — désabonner ne supprime pas la ligne, effacer l'efface vraiment.
- L'export CSV existant s'enrichit des colonnes statut + date (pas de nouveau champ requis
  côté logique, juste les colonnes déjà présentes dans le state).

## Hors périmètre (explicitement, pour ce lot)

- Pas de préférence d'abonnement **par type** (un abonné reçoit tous les types, ou plus
  rien) — Ken n'a pas demandé de ciblage fin, YAGNI.
- Pas d'éditeur HTML riche pour le corps de l'email (reste un textarea texte brut comme
  aujourd'hui) — seul l'ajout d'image change.
- Pas de programmation d'envoi différé (l'envoi reste immédiat, déclenché par l'admin).
- Pas de tracking d'ouverture/clics (aucune demande, ajouterait de la complexité RGPD).

## Fichiers

| Action | Fichier |
|--------|---------|
| CRÉER | `supabase/migrations/20260917<HHMMSS>_newsletter_v2.sql` |
| MODIFIER | `supabase/functions/send-newsletter/index.ts` |
| CRÉER | `supabase/functions/newsletter-unsubscribe/index.ts` |
| CRÉER | `src/pages/NewsletterUnsubscribe.tsx` |
| MODIFIER | `src/App.tsx` (route `/newsletter/desinscription`) |
| MODIFIER | `vercel.json` (X-Robots-Tag sur la nouvelle route) |
| MODIFIER | `src/pages/admin/AdminCommunications.tsx` (upload, types, historique, CRUD) |
| MODIFIER | `src/types/database.ts` (types `NewsletterSubscriber` + `NewsletterCampaign`) |
