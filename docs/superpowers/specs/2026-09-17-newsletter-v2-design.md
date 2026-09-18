# Design — Newsletter v2 (upload image, types, désabonnement, CRUD abonnés)

**Date :** 2026-09-17 · **RÉVISION 2** — revue par la salle (Élise, nova, lyra, vela, alcyone)

> ⚠️ **Ce document remplace la rev 1 (`50a94d3`).** La rev 1 rouvrait quatre décisions prises le
> 17/09 et il lui manquait six exigences. Tout ce qui change est justifié par un arbitrage daté,
> pas par un goût.
>
> **PÉRIMÈTRE — les trois demandes du brainstorm de Ken sont TOUTES dedans** : ① upload d'image
> par glisser-déposer, ② types de campagne **avec leurs gabarits de départ**, ③ CRUD abonnés
> (date d'inscription, désabonner/réabonner, badge « membre du site »). Ce que cette révision
> change, ce n'est pas **ce qui est livré** mais **comment** : aucun de ces gestes ne doit
> écrire un consentement en silence (§1.2, §6). Si un jour un item du brainstorm semble disparaître
> d'un document, c'est un bug de rédaction, pas une décision — on le dit.
>
> **Le brief `docs/BRIEF-NEWSLETTER-2026-09-17.md` (même branche) reste la source** : règles de
> travail, pièges, **copie client validée**, design, et **critères de recette**. Ce document-ci en
> est la déclinaison technique — en cas de désaccord entre les deux, **le brief gagne**.

## Contexte

`newsletter_subscribers` (id, email, consent, source, created_at) n'a **ni preuve de consentement
datée, ni mécanisme de désabonnement** — pas même un lien dans l'e-mail. `AdminCommunications.tsx`
compose sujet + corps + `image_url` (texte libre) et envoie via `send-newsletter` en **un seul
appel Resend, tous les abonnés en BCC**. L'historique d'envoi est en `useState` (perdu au refresh).

⚠️ **État réel du code à ne pas oublier** : `send-newsletter` lit aujourd'hui la **table** en
service_role, **sans filtre `consent` ni `source`**. Envoyer à toute la table, c'est envoyer à des
gens qui n'ont jamais dit oui. C'est le point que ce lot ferme.

**Périmètre (ordre d'importance) :** ① qui a le droit de recevoir (le consentement, daté) ·
② le lien de sortie qui fonctionne vraiment · ③ l'envoi individualisé avec une trace par
destinataire · ④ le confort de l'admin (upload d'image, types, historique).

---

## 1. Migration base de données

**Fichier :** `supabase/migrations/20260917<HHMMSS>_newsletter_v2.sql`
**Horodatage unique et postérieur à `20260917120000`.** Tout idempotent. **Claude ne l'applique
pas** : l'application est faite par @alcyone (BEGIN/COMMIT + vérification du blob) après go nommé
de Ken.

### 1.1 Abonnés — le consentement devient une **preuve datée**

```sql
alter table public.newsletter_subscribers
  add column if not exists consented_at   timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Reprise de l'existant : la seule ligne réelle (17/09) a `consent = true` sans date.
update public.newsletter_subscribers
   set consented_at = created_at
 where consent is true and consented_at is null;
```

- **`consented_at` est la source de vérité du « oui »** (et sa date — c'est elle qui permet
  d'écrire « oui, 16/09 »). `consent` reste pour compatibilité, **aucun nouveau code ne le lit
  seul**.
- **`unsubscribe_token` est opaque** (`gen_random_uuid()`) : **jamais dérivé de l'adresse**.
- **AUCUNE policy UPDATE** sur cette table. Un consentement ne se bascule pas par un UPDATE
  d'admin : on écrit une ligne / une date. *(La rev 1 ajoutait exactement cette policy — c'est le
  piège n°1 du brief.)*

### 1.2 Les deux seuls chemins d'écriture sur les abonnés

1. **Inscription** = `INSERT` (policy existante : `consent = true` forcé, `source` **requis** —
   la prop est déjà requise côté écran depuis le lot `newsletterSources.ts`). **Case non cochée =
   0 ligne écrite.**
2. **Désinscription** = `fn_unsubscribe(p_token uuid)` **SECURITY DEFINER**, `search_path` fixé,
   **seul écrivain de `unsubscribed_at`**, exposée à `anon`. Idempotente (déjà désabonné →
   « déjà »), **sans PII dans la réponse**, **jamais 500**.
3. **Réinscription** — ⚠️ **cas à traiter, la copie le promet** (« pour revenir, il suffit de vous
   réinscrire depuis le site ») : `email` est unique, donc un simple INSERT échoue en `23505`.
   🔴 **Le chemin est un JETON ENVOYÉ PAR E-MAIL, jamais une fonction qui prend une adresse.**
   Une fonction `fn_resubscribe(email)` — même `SECURITY DEFINER`, même réservée à `is_admin()` —
   écrit `consented_at = now()` : une **adresse suffirait donc à signer un « oui » daté**, y compris
   sur une ligne importée « jamais demandé ». **Règle dure : la seule écriture d'un consentement
   est faite par la personne elle-même, depuis un lien reçu sur sa boîte.** Le formulaire demande
   la réinscription → un e-mail part → le clic écrit (`consented_at = now()`,
   `unsubscribed_at = null`). Le message d'écran dit l'**attente** (« regardez vos e-mails : votre
   inscription sera active après confirmation »), jamais le résultat.

### 1.3 Campagnes et envois

```sql
create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  type text not null,              -- promo | challenge | evenement | info — valeurs DOCUMENTÉES,
                                   -- pas de CHECK fermé (cf. §2.1 du brief : une liste fermée
                                   -- tue chaque surface future ; l'union vit côté TypeScript)
  subject text not null,
  body text not null,
  image_url text,
  event_id uuid,                   -- nullable : « le mail du challenge de janvier »
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  email text not null,             -- figé tel qu'envoyé
  status text not null,            -- pending | delivered | bounced | failed | unknown
  resend_id text,
  error text,
  sent_at timestamptz not null default now(),
  unique (campaign_id, subscriber_id)   -- = CLÉ D'IDEMPOTENCE
);
```

- **`unknown` est un état à part entière** (timeout, 5xx : le mail est *peut-être* parti). Le
  traiter comme `failed` = **doublon chez la cliente**. Une ligne `unknown` ne se renvoie **jamais**
  toute seule : elle s'affiche, Catherine tranche.
- **`unique (campaign_id, subscriber_id)`** rend la reprise idempotente : relancer un envoi
  interrompu ne renvoie rien à personne.

### 1.4 La vue — **le prédicat n'existe qu'une fois**

```sql
create or replace view public.newsletter_sendable
with (security_invoker = true) as
select id, email, source, consented_at
  from public.newsletter_subscribers
 where unsubscribed_at is null              -- encore inscrite
   and consented_at is not null             -- a dit OUI (« non » et « jamais demandé » exclus)
   and lower(source) not like 'test-%';     -- exclusion des lignes de test, jamais un CHECK fermé
```

- **TOUS les consommateurs lisent cette vue** : le compteur, le filtre « Jamais demandé »,
  l'export CSV **et la fonction d'envoi**. Une exclusion posée ailleurs serait décorative.
- **`security_invoker = true`** (PG 15+) : sans ça, une vue s'exécute avec les droits de son
  propriétaire et **contourne les RLS** — c'est le trou classique. Et **aucun `GRANT` à `anon`**.
- La rev 1 écrivait `unsubscribed_at is null` comme « le SEUL critère d'envoi » : c'était la
  version qui envoie aux gens qui n'ont jamais dit oui.

### 1.5 Grants explicites

`GRANT SELECT` sur la vue aux seuls rôles utiles ; `REVOKE INSERT/UPDATE/DELETE/TRUNCATE/
REFERENCES/TRIGGER ... FROM anon` sur les tables du lot. La table hérite du `GRANT ALL` par défaut
aux rôles publics : c'est RLS qui protège aujourd'hui, et **c'est ce motif qui nous a valu le DELETE
oublié sur `bilan_bookings`** — on l'écrit.

### 1.6 Bucket `newsletter-images`

Public en lecture, écriture admin (`is_admin()`), **ET** : `allowed_mime_types` =
`jpeg, png, webp, **heic, heif**`, `file_size_limit = 5242880`. ⚠️ **Catherine déposera ses
images depuis son téléphone** : un HEIC (iPhone) doit être **converti en JPEG dans le navigateur
avant l'envoi**, sinon l'image casse hors Safari — même traitement que la galerie Skin.

---

## 2. Edge function `send-newsletter` (réécrite)

1. Lit **`newsletter_sendable`** (jamais la table).
2. **Écrit la trace AVANT d'envoyer** : une ligne `newsletter_campaigns`, puis **une ligne
   `newsletter_sends` par destinataire en `pending`** — sans ça, un envoi interrompu ne laisse
   aucune trace et « combien sont partis » devient un chiffre inventé.
3. Envoie via **`POST /emails/batch`** (100 messages/appel, **un destinataire par message**), avec
   `Idempotency-Key`. Le BCC unique disparaît.
4. **Pied de chaque e-mail** : la **copie validée** (voir brief §3) + le lien de sortie. Et les
   **en-têtes** : `List-Unsubscribe: <https://www.pessora.fr/newsletter/desinscription?token=…>`
   et `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. *(Absents de la rev 1 : un lien dans le
   corps ne suffit pas pour un expéditeur en nombre — Gmail/Outlook.)*
5. Après chaque lot : met à jour les lignes (`delivered` / `failed` / `unknown`).
6. **Réponse : `{ success, sent, failed, unknown, total }`.** ⚠️ **Jamais `success: true` tant
   qu'une ligne est `failed` ou `unknown`** — la rev 1 renvoyait `success: true` avec un simple
   log serveur : l'admin voit un succès, personne ne sait qui n'a rien reçu.
7. **Reprise** : ne relance que les `pending` et les `failed` réessayables (jamais `delivered`,
   jamais `unknown`).
8. **Pas de pixel de suivi** (décision : aucune ouverture suivie).

---

## 3. Désabonnement — `fn_unsubscribe` + fonction publique `newsletter-unsubscribe`

- La fonction publique (edge, `verify_jwt = false`) **appelle `fn_unsubscribe`**, qui est le seul
  écrivain. Elle est **rate-limitée** et **ne renvoie jamais l'adresse** associée au jeton.
- **L'e-mail ne contient aucun lien à effet direct** : la page publique fait un **GET sans effet**
  (confirmation) puis un **POST** au clic. C'est le dessin de la rev 1, et **on le garde** : les
  clients mail pré-chargent les liens, un GET qui désabonnerait viderait la liste toute seule.
- Réponses (copie validée, brief §3 — jamais un `404` sec, jamais 500) :
  `{ ok: true }` · `{ ok: true, already: true }` · jeton inconnu → le message neutre prévu.
- La page publique est **non indexable** (`X-Robots-Tag: noindex, nofollow`).

## 4. Page publique `/newsletter/desinscription`

Copie **mot pour mot** (brief §3) : l'écran d'avant-confirmation (« Rien n'a encore été modifié —
confirmez ci-dessous. »), le bouton **« Me désinscrire »** *(pas « Confirmer la désinscription »)*,
« Non merci, je reste inscrit·e », la phrase de l'expéditeur légitime, l'écran d'après
(« Votre désinscription est enregistrée ») et le message de jeton inconnu. Design : gabarit du site,
**390 px sans zoomer**, bouton ≥ 44 px, **aucune promo**.

## 5. Composer admin — upload, types, historique

- **Upload d'image** : drag & drop vers `newsletter-images`, aperçu, retrait. Réutilise le
  composant d'upload existant (pas de nouveau composant générique) + conversion HEIC (§1.6).
- **Sélecteur de type** (4 valeurs : Promo/Nouveau produit · Challenge 21j · Événement · Info
  générale) **avec pré-remplissage** : changer de type **avant** d'avoir tapé quoi que ce soit
  remplit sujet + corps avec un **brouillon** de départ, modifiable ; si du texte est déjà saisi,
  le changement de type ne l'écrase pas (confirmation).
  ⚠️ **Ces 4 brouillons sont de la copie neuve destinée à ses clientes** : ils partent marqués
  **« brouillon — à personnaliser »**, l'admin peut tout réécrire, et **Ken les valide** (ou les
  fait valider par Catherine) — c'est une validation à faire, **pas une raison de retirer la
  fonction**. Extraits de départ : Promo *« Nouveau à la carte »* · Challenge *« Le prochain
  Challenge 21 jours ouvre bientôt »* · Événement *« On vous attend au bar ! »* · Info : sujet
  libre, corps vide (pas de gabarit forcé).
- **L'écran de la seconde avant l'envoi** (absent de la rev 1) — le seul geste **irréversible** de
  son site : ce qui part, à **qui** (« 12 personnes — celles qui ont dit oui »), **l'aperçu
  téléphone**, et la phrase qui dit la vérité : *« Tu ne pourras plus le modifier après l'envoi. »*
  Plus la ligne des exclues : « 34 personnes ont dit non ou n'ont jamais été demandées : elles ne
  recevront rien. »
- **Le bouton a trois états** (conséquence du `pending`) : `Envoyer` → `Envoi en cours…`
  (**inactif**) → `Reprendre l'envoi (N restants)`. Sans ça, un double clic écrit deux fois chez ses
  clientes.
- **Historique** : lit `newsletter_sends` agrégé par campagne (partis / échoués / inconnus), plus
  les 20 dernières campagnes — au lieu du `useState` perdu au refresh.

## 6. Écran abonnés — **trois états en mots**, et des gestes qui écrivent des dates

| État affiché | Calcul |
|---|---|
| **Inscrit·e** | `consented_at` renseigné **et** `unsubscribed_at` vide |
| **Désinscrit·e** | `unsubscribed_at` renseigné **et** retrait par la personne (son lien) |
| **Retiré·e au bar** | `unsubscribed_at` renseigné **et** retrait par l'admin (`fn_admin_set_subscription`) |
| **Jamais demandé** | `consented_at` vide |

- Chaque ligne porte **sa provenance et sa date** (« oui, 16/09 » · « import du bar, 12/09 »).
- 🔴 **DEUX RETRAITS DISTINCTS, jamais fusionnés** : « **Désinscrit·e, elle-même 17/09** » (la
  personne a cliqué son lien) ≠ « **Retiré·e au bar, 17/09** » (geste de l'admin). Le mot est une
  **provenance**, pas un jugement — et sans cette distinction, Catherine ne peut pas savoir si sa
  cliente est partie d'elle-même ou si c'est le bar : la fonction d'admin serait *datée* mais pas
  *attribuée*, donc auditables « à moitié ». `fn_admin_set_subscription` écrit **la provenance en
  même temps que la date**.
- **Filtre « Jamais demandé »** = sa liste d'invitation, son outil de tous les jours.
- **Compteur en mots** : « Envoyer à 12 personnes — celles qui ont dit oui » ; à zéro :
  « Personne n'a dit oui — rien à envoyer », bouton inactif. Deuxième ligne obligatoire :
  « 34 personnes ont dit non ou n'ont jamais été demandées : elles ne recevront rien. »
- Lisible **en noir et blanc** : la couleur renforce, elle ne porte jamais l'information.
- **Export CSV** : `email, consented_at, source` **+ l'état en mots** (la date, pas un booléen nu).
- **Désabonner / réabonner quelqu'un depuis l'admin** (demande de Ken) : la fonction existe et
  elle est **nécessaire** — quelqu'un appelle le bar pour demander à sortir de la liste. Elle
  passe par **une fonction dédiée** `fn_admin_set_subscription(subscriber_id, action)`
  **SECURITY DEFINER**, réservée à `is_admin()`, qui **écrit une date** (`unsubscribed_at = now()`
  ou un `consented_at` neuf) — **jamais un simple basculement de booléen**. C'est ce qui rend le
  geste auditable, et c'est **exactement** ce que la règle « aucun UPDATE sur les abonnés »
  protège : la règle vise le **flip silencieux**, pas l'action de l'admin. Confirmation avant
  l'action (dialogue existant), et l'état affiché suit les **trois mots** du §6.
- **Badge « membre du site »** (demande de Ken) : affiché quand l'e-mail de l'abonné existe dans
  `profiles.email` — **une seule requête** au chargement de la liste (`select email from profiles
  where email = any(emails)`), jointure côté client, **pas de colonne dénormalisée**.
- **Date d'inscription** (demande de Ken) : `created_at` est déjà en base — il est **affiché**
  (`dd/mm/yyyy`), à côté de la provenance et de la date de consentement.
- La **suppression définitive** (RGPD, droit à l'oubli) reste inchangée et **distincte** :
  désabonner ne supprime pas la ligne, effacer efface vraiment.

⚠️ Ce qui est interdit n'est pas **le geste de l'admin** — c'est **le basculement muet d'un
booléen**. La rev 1 affichait « Statut : toggle Actif/Désabonné » : un mot qui n'est pas celui de
la cliente **et** un flip sans trace. Ici : l'**affichage** porte les trois mots (calculés sur les
colonnes) et l'**action** passe par `fn_admin_set_subscription` (§6, plus haut), qui écrit une
date. On garde la fonction **et** la garde.

---

## 7. Critères de recette — fonctionnel (@vela)

**Source unique : §5 du brief consolidé.** Ce qui suit ne le répète pas : ce sont les points que ce
dessin-ci ajoute.

```
1. Désinscription : le POST derrière un bouton de confirmation ferme le pré-chargement des liens
   PAR CONSTRUCTION — on garde ce dessin. À mesurer quand même : GET répété 5 fois → la vue
   d'envoi ne bouge pas · POST sans le bon jeton → rien · POST joué deux fois → une seule sortie,
   jamais 500.
2. Envoi : une ligne par destinataire, jamais un seul compteur. 2 destinataires dont un en échec
   → la réponse ne dit PAS « success: true » comme si tout était parti. « On ne sait pas »
   (timeout, 5xx) est un état à part.
3. Reprise : relancer un envoi interrompu ne renvoie rien à personne (clé d'idempotence + la ligne
   par destinataire). On compare les LIGNES créées, pas la réponse du serveur.
4. Bouton : les trois états sont obligatoires — double clic rapide → un seul envoi part.
5. Compteur : le chiffre affiché est celui que le SERVEUR accepte, jamais celui de la liste
   cliquée ; recompté en lecture seule, il tombe juste.
6. Filtre « jamais demandé » : il existe, et « N personnes ne recevront rien » est recomputable.
7. Consentement : aucun UPDATE sur les abonnés (vérifié dans les policies) ; case non cochée = 0
   ligne (delta compté avant/après).
8. Jeton : ne dit rien de l'adresse, ne se devine pas, page non indexable.
9. Envoi réel : le statut confirmé (delivered/bounced) se lit EN BASE — sans webhook signé ni clé
   lisible, ce critère reste OUVERT (voir §9).
```

**Toutes ces mesures se font sur le DÉPLOYÉ, base en lecture seule.** Aucun critère ne se déclare
vert sur une preview ni sur la réponse d'une fonction. **Un vert s'attache à une révision.**

---

## 8. Hors périmètre (explicitement)

Pas de préférence d'abonnement **par type** (YAGNI) · pas d'éditeur HTML riche · pas d'envoi
programmé · **pas de suivi d'ouverture** (RGPD + inutile).

## 9. Questions ouvertes (Ken)

1. **Statut d'envoi lisible** : la clé Resend actuelle est en **envoi seul** (`401 restricted_api_key`).
   Il faut un **webhook Resend signé** (à préférer : la donnée reste chez la cliente) ou une clé à
   accès complet. **Sans ça, le critère 9 reste ouvert.**
2. **Le banc d'essai écrit-il une ligne d'abonné ?** Recommandation : oui, avec `source = 'test-bench'`
   — elle traverse tout le parcours et exerce l'exclusion `test-%` pour de vrai.
3. **Adresse de test** `test-…` pour exercer la désinscription sans toucher la seule adresse réelle.
4. **Gabarits de campagne** : les valider, ou laisser les champs vides (défaut retenu).

## 10. Fichiers

| Action | Fichier |
|--------|---------|
| CRÉER | `supabase/migrations/20260917<HHMMSS>_newsletter_v2.sql` (tables + vue + `fn_unsubscribe` + `fn_resubscribe` + bucket) |
| MODIFIER | `supabase/functions/send-newsletter/index.ts` |
| CRÉER | `supabase/functions/newsletter-unsubscribe/index.ts` |
| CRÉER | `src/pages/NewsletterUnsubscribe.tsx` |
| MODIFIER | `src/App.tsx` (route `/newsletter/desinscription`) + `vercel.json` (`X-Robots-Tag`) |
| MODIFIER | `src/pages/admin/AdminCommunications.tsx` (upload, types, aperçu d'envoi, historique, liste abonnés) |
| MODIFIER | `src/types/database.ts` |

**Et les règles de travail du brief §0 s'appliquent** : worktree à part, `tsc --noEmit` exigé, **tu
n'appliques rien en base, tu ne merges pas** — tu pousses, @vela recette, @alcyone merge.

---

*Révision 2 — Élise, d'après les blocs de nova (copie), vela (critères), alcyone (SQL) — 17/09/2026.*
