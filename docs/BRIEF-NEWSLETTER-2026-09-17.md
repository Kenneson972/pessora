# BRIEF NEWSLETTER — Pessóra — 17/09/2026

> **Un seul fichier à lire.** Il rassemble, dans l'ordre : les règles de travail, ce qu'il faut
> écrire, les arbitrages figés (pièges), la copie client **déjà validée**, le design à réutiliser,
> et les critères de recette sur lesquels le travail sera jugé.
>
> Rédigé par la salle (Élise, nova, lyra, vela, alcyone) — consolidé par Élise.
> Base : `origin/main` = **`2a2a00d`**. **À lire en entier avant d'écrire une ligne de code.**

---

## 0. RÈGLES DE TRAVAIL (non négociables)

```
- Pars de origin/main. Travaille dans un WORKTREE À PART :
    git worktree add -b <ta-branche> /opt/data/repos/pessora-<ta-branche> origin/main
  Le clone /opt/data/repos/pessora est posé sur lot/porte-admin — n'y travaille pas.
- PAS de `npm install` : symlink de node_modules
    ln -s /opt/data/repos/pessora/node_modules /opt/data/repos/pessora-<ta-branche>/node_modules
- CE REPO NE SE BUILDE PAS EN LOCAL (@heroui-pro/react = installeur sans dist).
  Le seul filet local est `npx tsc --noEmit` (exit 0 exigé). La preuve visuelle se fait
  sur le DÉPLOYÉ (preview de branche), jamais sur une capture « depuis mon poste ».
- TU N'APPLIQUES RIEN EN BASE : pas de `supabase db push`, pas de Management API.
  L'application des migrations est faite par @alcyone, après relecture et go nommé de Ken.
- Tu ne merges pas : tu pousses une branche. Le merge est fait par @alcyone après recette.
- Migration en fichier SQL, horodatage UNIQUE et POSTÉRIEUR à `20260917120000`.
  Deux fichiers de même horodatage : le second est ignoré SANS erreur.
- Tout idempotent : CREATE OR REPLACE / CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
  DROP POLICY IF EXISTS avant CREATE POLICY.
```

---

## 1. CE QU'IL FAUT ÉCRIRE

**Périmètre de cette passe — la newsletter conforme, de bout en bout :**

1. **Base** — une seule migration :
   - `newsletter_subscribers` : `id, email, consent, source, created_at` + colonne **`token uuid
     DEFAULT gen_random_uuid()`** (le jeton de désinscription) ;
   - `newsletter_campaigns` (l'email que Catherine écrit : sujet, image, corps) — `event_id`
     **nullable** (« le mail du challenge de janvier ») ;
   - `newsletter_sends` : **une ligne par destinataire** (`campaign_id, subscriber_id, status,
     resend_id, error`) ;
   - la table du **pied de mail / gabarit** si elle est nécessaire, sinon rien de plus ;
   - **la VUE `newsletter_sendable`** — c'est elle la source de vérité de « qui reçoit » ;
   - policies + grants explicites (voir §2).

2. **Fonction de désinscription** — edge function **dédiée**, `verify_jwt = false`, déployée
   **nommément**. GET = confirmation sans effet ; POST = retrait effectif. Idempotente,
   sans PII dans la réponse, rate-limitée.

3. **Fonction d'envoi** — `send-newsletter` réécrite : elle **lit la vue**, pas la table, et
   envoie via **`/emails/batch`** (100/appel, un destinataire par ligne) avec `Idempotency-Key`.

4. **Pied de mail** — ajouté au gabarit existant (voir §4) : mention d'inscription + lien
   **« Se désinscrire »** texte, sur sa propre ligne + en-têtes `List-Unsubscribe` et
   `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.

5. **Deux pages publiques** : GET (confirmation, sans effet) et POST (désinscription enregistrée).

**Hors périmètre de cette passe** (ne pas les ouvrir sans un mot de Ken) : import du CSV de
Catherine · colonne `email` sur `event_registrations` · CRUD des campagnes côté admin ·
suivi des ouvertures (**on n'en veut pas** : pas de pixel de suivi).

---

## 2. ARBITRAGES FIGÉS — LES PIÈGES QUI CASSENT EN SILENCE

1. **Prédicat NÉGATIF, jamais de `CHECK (source IN (...))`.** Une liste fermée tue chaque
   surface future. Les littéraux réels sont **6** (`footer`, `challenge-closed`,
   `challenge-ended`, `challenge-full`, `challenge-not-yet-created`, `challenge-outside-window`).
   L'exclusion des tests s'écrit **`lower(source) LIKE 'test-%'`** — nouvelle surface réelle :
   zéro migration.
2. **`source` devient REQUIS côté écran.** Le vrai piège : `NewsletterSignup.tsx` pose un défaut
   JS `source = 'footer'` avec une prop optionnelle → un insert non nommé devient un faux
   abonné du footer. Deux filets : `DEFAULT` levé en base **et** prop obligatoire côté composant.
3. **Le banc d'essai n'est jamais touché.** Ne purge rien, ne ferme rien, ne renomme rien :
   les événements `TEST-KEN-*` sont le terrain d'essai de Ken et ses inscriptions restent
   ouvertes. Le filet de non-indexation est le `noindex`, jamais la suppression.
4. **L'envoi lit la VUE, jamais la table.** `send-newsletter` lit aujourd'hui la table en
   service_role, sans filtre `consent` ni `source`, puis envoie en bcc : une exclusion posée
   dans la vue y serait **purement décorative**. Tous les consommateurs lisent la vue — le
   compteur, le filtre « Jamais demandé », l'export CSV **et** la fonction d'envoi.
5. **Aucune policy UPDATE sur `newsletter_subscribers`.** Un consentement ne se bascule pas :
   on écrit une ligne datée. **Case non cochée = 0 ligne écrite** (vérifié en delta).
6. **Rien ne part vers quelqu'un qui n'a pas dit oui** : un inscrit qui a dit non, ou très
   exactement « jamais demandé », ne reçoit rien.
7. **Grants explicites.** La table hérite du `GRANT ALL` par défaut aux rôles publics ; écris
   le `GRANT SELECT` et le `REVOKE` des écritures pour `anon`. Le motif nous a déjà valu un
   DELETE oublié (`bilan_bookings`).
8. **Cliquet de contraste** : un fichier **neuf** qui porte un jeton de texte sous AA fait
   échouer la suite (`text-black/45` = 3,31:1 → interdit ; `text-black/60` = 5,59:1 → OK).
   **On corrige le jeton. `CONTRAST_BASELINE=write` est interdit.**
9. **Fuseau** : « aujourd'hui » ne se calcule jamais avec `toISOString()` ni avec le fuseau du
   visiteur → `new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' })`.
10. **Aucune donnée inventée** : pas de chiffre, pas de témoignage, pas de photo de banque
    d'images, jamais une promesse de résultat.

---

## 3. LA COPIE CLIENT — DÉJÀ VALIDÉE, À REPRENDRE MOT POUR MOT

> Ces textes sont validés. **Les réécrire, c'est envoyer à ses clientes une page que personne
> n'a relue.** À reprendre tel quel.

```
Pied de mail : « Vous recevez cet e-mail car vous vous êtes inscrit·e à la newsletter
de PessÓra. » + « Se désinscrire » en lien TEXTE, sur sa propre ligne, même contraste
que le corps.

Page (GET) : « Se désinscrire de la newsletter — Votre adresse sera retirée de notre
liste d'envoi. Rien n'a encore été modifié — confirmez ci-dessous. » → [Me désinscrire]
· Non merci, je reste inscrit·e + « Si vous n'êtes pas à l'origine de cette demande,
fermez cette page : votre inscription reste active. »

Page (POST) : « Votre désinscription est enregistrée — Vous ne recevrez plus d'e-mails
de la part de PessÓra. Pour revenir, il suffit de vous réinscrire depuis le site. »

Lien déjà utilisé ou inconnu : « Ce lien n'est plus valide — il a déjà été utilisé, ou
l'adresse n'est plus inscrite. Dans tous les cas, vous ne recevrez plus d'e-mails de
notre part. » (jamais 500, idempotent)

Contraintes : aucune promo ni offre dans ces écrans · « Se désinscrire » écrit en clair
(jamais « gérer mes préférences ») · jamais culpabilisant · lien texte, pas du 11 px gris.
```

---

## 4. DESIGN — RÉUTILISER, NE PAS INVENTER

```
1. RÉUTILISE `email-templates/` — il y en a DÉJÀ 5 (01-confirmation, 02-invitation,
   03-magic-link, 04-reset-password, 05-change-email). Leur forme est la bonne :
   carte 520 px, fond #f9f7f4, vert sapin #1E3529, logo servi depuis le stockage,
   pile de polices SYSTÈME. N'invente pas un nouveau gabarit mail : tu ajoutes le
   pied manquant (dont le lien « Se désinscrire ») à cette forme-là.

2. POLICES : la charte (Berthold Baskerville Book, Akkurat Pro) n'est livrée à personne
   — déclarée seulement en `local()` dans src/index.css, et de toute façon un client mail
   ne charge jamais nos webfonts. Garde la pile système existante, n'ajoute PAS la police
   de la charte en tête de pile.

3. LE LIEN « SE DÉSINSCRIRE » est le seul chemin de sortie : il ne peut pas être le texte
   le plus pâle du mail. Le gabarit contient un gris #888888 (≈ 2,9:1 sur blanc) : ne
   l'utilise PAS ici. Prends #3a3a3a (déjà dans le gabarit, ≈ 10:1) ou #1E3529.
   Corps ≥ 13 px, sur sa propre ligne, lien TEXTE (jamais une image : les images sont
   bloquées par défaut chez beaucoup de clients mail).

4. LES DEUX PAGES (GET/POST) sont des pages PUBLIQUES du site, pas des écrans de service :
   charte du site, QA vision en 1440 ET 390, AUCUNE promo, aucun CTA boutique.

5. CLIQUET DE CONTRASTE : cf. §2.8 — on corrige le jeton.

6. CE REPO NE SE BUILDE PAS EN LOCAL : la preuve visuelle se fait sur le DÉPLOYÉ.
```

---

## 5. CRITÈRES DE RECETTE — LE TRAVAIL EST JUGÉ DESSUS

### Fonctionnel (@vela)

1. **Un e-mail arrive vraiment** : statut réel (`delivered`/`bounced`) et destinataire lus,
   jamais « envoyé » d'après le récap du code.
2. **Le lien retire vraiment** : GET puis POST → l'adresse **sort de la vue d'envoi**
   (vérifié **dans la vue**, pas dans la table — la table garde l'historique).
3. **Deux clics ne cassent rien** : lien déjà utilisé, inconnu, tronqué → le message prévu,
   **jamais 500**.
4. **Une case non cochée n'écrit rien** (0 ligne) et **aucun consentement ne se bascule**
   (vérifié dans les policies).
5. **Le jeton ne dit rien de l'adresse** et ne se devine pas ; la page publique n'est pas
   indexable.
6. **Le chiffre affiché est celui que le serveur accepte**, jamais celui de la liste cliquée.
7. 🔴 **Les clients mail PRÉ-CHARGENT les liens** (scanners Gmail/Outlook) : le **GET ne doit
   avoir aucun effet**, sinon la liste se vide toute seule à l'envoi sans qu'un humain ait
   cliqué. Recette : récupérer le lien plusieurs fois, sans JavaScript, puis relire la vue →
   personne n'a bougé ; un POST sans le bon jeton ne fait rien non plus.

### Visuel (@lyra)

1. **Le lien de sortie est le texte le plus sûr du mail** : « Se désinscrire » en clair, sur sa
   propre ligne, corps ≥ 13 px, contraste **mesuré ≥ 4,5:1 contre le fond réel**, lien texte.
2. **Capture 390 px sans zoomer** : aucun texte coupé ni débordant, bouton ≥ 44 px.
3. **Les états sont visuellement distincts** : « rien n'a encore été modifié », « c'est retiré »,
   « ce lien n'est plus valide » — **un échec ne ressemble jamais à un succès**.
4. **Aucune promo, aucun CTA boutique** : le seul lien sortant est le site.
5. **Le mot-symbole est le vrai fichier** servi depuis le stockage, jamais un texte qui l'imite.
6. **Même gabarit que les 5 mails existants** : un sixième gabarit différent est un refus.
7. **Aucun texte sous AA** sur les deux pages (cliquet).

**Ce que les deux passes ne couvrent pas**, et qui est déclaré plutôt que promis : le rendu réel
dans Gmail, Outlook et l'app Mail d'iPhone. Il se prouve par **un vrai envoi ouvert sur un
téléphone** — c'est la seule preuve qui vaille, et elle se tire avec Ken.

---

## 6. TESTS — CE QUI DOIT POUVOIR ROUGIR

- Le nombre de tests exécutés fait partie de la preuve : **un run qui n'exécute rien ressemble
  exactement à une baseline**. Annonce le compte, pas le silence.
- La suite de contraste est fail-closed ; l'arbre de référence est celui de `main`.
- Éprouve tes gardes **par mutation** (casse la garde, vérifie que le test rougit, restaure) :
  un test qui n'a jamais rougi ne prouve rien.

---

## 7. QUESTIONS OUVERTES (Ken)

- **Le banc d'essai écrit-il une ligne d'abonné ?** Recommandation de la salle : **oui**, avec
  une provenance nommée (`source = 'test-bench'`) — elle traverse tout le parcours pour de vrai,
  elle exerce la règle d'exclusion `test-%`, et elle n'est jamais comptée comme une cliente.
- **Adresse de test pour la désinscription** : une adresse **nommée `test-…`** (pas une fausse
  cliente, pas la seule adresse réelle de la liste).
- **Statut d'envoi** : le lire en base suppose un **webhook Resend signé** qui alimente
  `newsletter_sends.status` — **la clé Resend actuelle est en envoi seul** (`401
  restricted_api_key`, testé le 17/09) et ne permet pas de relire un statut `delivered`/`bounced`.
  Un mot de Ken : **webhook** (à préférer — la donnée reste chez la cliente), ou **clé à accès
  complet** (secret, donc sa décision et pas celle de Claude). Sans l'un des deux, le critère
  fonctionnel ① (« un e-mail arrive vraiment ») ne peut pas être prouvé.
  Si le webhook est retenu, **il doit refuser tout appel non signé** — sinon n'importe qui peut
  marquer ses abonnées comme « bounced » et les couper de ses envois.

---

*Élise — 17/09/2026, d'après les arbitrages de la salle PESSORA 2.*
