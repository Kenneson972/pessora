# BRIEF NEWSLETTER — Pessóra — 17/09/2026

> 🔒 **RÈGLE DES DOCUMENTS.** *Tout item du brainstorm de Ken reste dans ce document. S'il gêne une
> garde, on garde l'item et on contraint le **comment** — ou on demande avant. Aucun retrait sans une
> ligne qui dit pourquoi.* Et ce qui n'est pas écrit dans ce que Claude lit n'existe pas pour lui :
> une décision qui ne vit que dans le fil du chat sera réinventée (ou oubliée) à la passe suivante.

> **Déclinaison technique :** `docs/superpowers/specs/2026-09-17-newsletter-v2-design.md` — **révision 2**
> (les deux documents vivent sur la branche `docs/newsletter-v2-spec`). En cas de désaccord,
> **ce brief gagne**.

> **Un seul fichier à lire.** Il rassemble, dans l'ordre : les règles de travail, ce qu'il faut
> écrire, les arbitrages figés (pièges), la copie client **déjà validée**, le design à réutiliser,
> et les critères de recette sur lesquels le travail sera jugé.
>
> Rédigé par la salle (Élise, nova, lyra, vela, alcyone) — consolidé par Élise.
> Base : `origin/main` = **`2a2a00d`**. **À lire en entier avant d'écrire une ligne de code.**

---

## 0. RÈGLES DE TRAVAIL (non négociables)

```
- **AVANT TOUT, récupère une base à jour.** S'il reste des modifications non committées,
  `git rebase` refuse de démarrer (`cannot rebase: You have unstaged changes`) :
      git add -A && git commit -m "wip"
      git fetch origin
      git rebase origin/docs/brief-newsletter-2026-09-17   # = main + ce fichier
  (`git merge origin/docs/brief-newsletter-2026-09-17` marche aussi — un conflit se lit mieux
  dans un merge que dans un rebase.)
- Travaille dans un WORKTREE À PART :
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

**Déjà livré — à RÉUTILISER, pas à réécrire :**

- **`src/lib/newsletterSources.ts`** — l'union **fermée** des 6 origines réelles, **le seul lieu
  d'édition du vocabulaire** (une faute de frappe ne compile pas), et côté lecture la
  correspondance littéral → mots de l'admin (jamais un slug affiché à Catherine).
- **`NewsletterSignup` porte déjà `source` comme prop REQUISE** (le défaut JS `'footer'` est
  retiré, ses deux points d'appel du footer sont nommés) — c'est le piège §2.2, **déjà fermé**.
- Ces deux pièces viennent de la branche `lot/lyra-source-required` @ `088ab84`, **recettée**
  (@vela, `tsc` vert, épreuve par mutation) et **mergée le 17/09**. Si le fichier n'est pas dans
  ton arbre : `git show origin/lot/lyra-source-required:src/lib/newsletterSources.ts`.
- ⚠️ **N'écris pas une septième liste d'origines.** Cette liste est une **garde de frappe**, elle
  ne remplace pas le tri côté envoi, qui reste le prédicat en base (`lower(source) LIKE 'test-%'`).

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
   exactement « jamais demandé », ne reçoit rien. **Et aucune écriture de consentement ne se fait
   sans la personne** : pas de fonction qui prend une adresse et pose `consented_at = now()` —
   l'accord s'écrit depuis un **lien reçu par e-mail**, ou il ne s'écrit pas. (Trouvé le 17/09 :
   `fn_resubscribe(email)` ouvert à `anon` et `authenticated` signait un « oui » daté avec une
   simple adresse — l'invariant n°1 atteint par un autre chemin.)
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
- ⚠️ **Un compte absolu ne se cite qu'avec trois précisions** (règle du 17/09, mesurée deux fois) :
  **la révision**, **la présence du `.env`**, et le fait que **« 10 rouges » = `cartStore` seul**.
  Motif : `menuCatalog.test.ts` **ne se collecte pas** sans `.env` (erreur de chargement) → un
  worktree nu perd **8 cas** en silence et ressemble à une régression. Un vert signé dans un
  worktree nu est donc **plus faible** qu'il n'y paraît : copier `.env` avant de mesurer
  (`cp /opt/data/repos/pessora/.env .env`).
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

## 8. ADDENDUM 18/09/2026 — LES MAILS FONT PARTIE DE CE LOT

> Ajouté par Élise le 18/09 au matin, d'après les mesures de @lyra et @vela (relevé
> indépendant, recompté deux fois). **À lire avant de coder.** Chiffres mesurés, pas estimés.

**Deux choses à faire dans le même lot** — sinon le mail part chez les abonnées avec une ligne
illisible, et personne ne le verra (le cliquet de contraste scanne `src/**` en classes `text-*` ;
le corps des mails est en **styles en ligne** : aucun autre instrument ne regarde ces fichiers).

**A. La ligne de `main` est déjà dedans — mesuré le 18/09 à 13h55.** Claude a **mergé** `origin/main`
dans la branche (`b8a14a7 Merge remote-tracking branch 'origin/main' into feat/newsletter-v2-impl`)
au lieu de rebaser : **`main` est donc ancêtre de la branche**, et le merge final sera un
**fast-forward**. **Décision (Élise, 18/09) : on garde ce merge, on ne re-rebase pas** — réécrire un
historique déjà poussé ferait bouger les 2 commits de @lyra pour un gain cosmétique, c'est plus de
risque que de bénéfice. **Ce qui compte : le SHA recetté sera le SHA de `main`.** Rien à faire côté
rebase — **ne relance pas de `git rebase`.**

**B. Trois corrections de couleur — dans cet ordre, et une seule valeur suffit (`#6b6b6b`) :**

| # | Fichier | Défaut mesuré | Correction |
|---|---|---|---|
| ① | `supabase/functions/newsletter-request-resubscribe/index.ts` | pied `#888` 11 px sur `#f5f3f0` = **3,20:1** (sous AA) | `#6b6b6b` → **4,81:1** |
| ② | `supabase/functions/_shared/sendOrderConfirmation.ts` (l. 106 et 111) | « Des questions ?… » `#888` 12 px / blanc = **3,54:1** ; « © PessÓra · Fort-de-France, Martinique » `#999` 11 px — **hors de la carte**, sur le fond extérieur `#F7F5F1` = **2,62:1** | `#6b6b6b` → **5,33:1** (le « Des questions ? ») et **4,89:1** (la signature) |
| ③ | `email-templates/01-confirmation.html` … `05-change-email.html` — **à la racine du repo**, PAS sous `supabase/functions/` (×2 lignes `#888888` : l'adresse et « Message automatique ») | **3,20:1** | `#6b6b6b` |

**B bis. Le geste exact — mesuré, pas approximé :** **14 occurrences, 8 fichiers, rien d'autre**
(14 insertions / 14 suppressions) : **10** dans les 5 templates (`color:#888888`, ×2 chacun), **1** dans
`send-newsletter`, **1** dans `newsletter-request-resubscribe`, **2** dans `sendOrderConfirmation`
(`color:#888` **et** `color:#999`).

⚠️ **Le remplacement porte sur `color:` — JAMAIS sur `#888` tout court.** Sinon on réécrit aussi le
**commentaire** de `send-newsletter` (lignes 49-51 : *« jamais le #888 utilisé pour le reste du pied
de mail »*) — c'est-à-dire la phrase qui explique **pourquoi** la règle existe. Un remplacement global
efface l'explication et laisse le suivant refaire l'erreur. **Les tests de la garde, les commentaires
et le reste du fichier ne bougent pas.** Mesuré : un `s/#888/#6b6b6b/g` sur les 5 templates ne corrige
**rien** (leurs valeurs sont `#888888`) et écrit **10 couleurs invalides `#6b6b6b888`** ; dans
`send-newsletter` il touche le commentaire **et laisse le défaut en place**. Ordre sûr, vérifiable au
diff : **`color:#888888` d'abord**, puis **`color:#888` non suivi d'un chiffre hexa**, puis
**`color:#999`**. Le diff doit rendre **14 insertions / 14 suppressions sur 8 fichiers** et
**zéro `#6b6b6b888`**.

*(Une seule valeur `#6b6b6b` passe AA sur les **trois** fonds du parc : **4,81:1** sur `#f5f3f0`,
**4,89:1** sur `#F7F5F1`, **5,33:1** sur blanc — rien à décider, aucun cas particulier.)*

⚠️ **① est un fichier AJOUTÉ par ce lot** — sans la correction, le lot publie le défaut qu'on
répare juste à côté. **② est déjà en production aujourd'hui** (c'est le mail que reçoit une
cliente après commande) : c'est le seul des trois qui est visible tout de suite.
Les 5 templates de ③ portent **déjà** `#6b6b6b` ailleurs : la cible est l'encre maison, **rien d'inventé**.

**C. N'écris PAS la garde.** La garde de contraste des gabarits est apportée **par @lyra après**
ces corrections, **dans ce même lot**, comme preuve. Deux commits écrivant la même constante
(la table des fonds) = exactement le cas du **+3/−3 qui s'annule** au merge et masque une
régression : on ne le crée pas.

**C bis. LE CÂBLAGE DE LA SORTIE — 2 lignes, dans la même passe que les couleurs.** Aujourd'hui
`send-newsletter` pose **la même URL** dans le lien visible **et** dans l'en-tête `List-Unsubscribe`,
et déclare `List-Unsubscribe-Post: One-Click`. Or un clic Gmail/Apple fait un **POST** sur cette URL :
mesuré en live, **405, 0 octet** — Vercel sert une page statique, aucun code ne se déclenche, et le
fournisseur enregistre un « one-click » **en échec**.

**Le patch :** `unsubscribeUrl` (`siteUrl`) **reste** le lien visible ; on ajoute à côté
`const oneClickUrl = \`${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${r.token}\`` et
**seule** la ligne `'List-Unsubscribe'` pointe dessus. `List-Unsubscribe-Post: One-Click` reste — il
devient **vrai**. ⚠️ **`supabaseUrl` existe déjà** dans le fichier (utilisé pour le logo, l. 186) :
**aucune nouvelle valeur codée en dur** — c'est le piège qui a déjà mordu ce projet
(`send-contact-email`, adresse en dur).

**Deux portes, deux cibles, chacune déclarée :** l'**en-tête** (machine) → la fonction ; le **lien
visible** (humain) → la page du site. ⚠️ **Ne réouvre PAS le GET sur la fonction pour « simplifier »** :
son non-POST sort **avant toute écriture** (`no_op`) **exprès** — c'est l'anti-scanner (Outlook
SafeLinks et les proxys d'images font des GET sur tous les liens d'un mail : un GET désabonnant
**vide la liste**). Cette protection est une décision, pas un oubli.

**D. Hors de ton périmètre (geste manuel, aucun code) :** le collage des 5 templates d'auth dans
le **Dashboard Supabase** (Authentication → Email Templates) — **le fichier du repo n'est pas ce
qui part**. Recette associée : déclencher un **vrai magic-link** vers une boîte QA et mesurer
l'encre **dans le HTML reçu**, pas dans le fichier (@vela). **Le commit ne prouve pas cet envoi** —
personne ne doit le dire « vérifié » sans ça.

**E. La gate s'attache au tip FINAL** — la branche avec le merge de `main` **+** les 2 commits de
lyra — **pas à `0899a9c`** (ce SHA ne contient ni l'un ni les autres). @alcyone recette ce tip-là,
**fichier par fichier** (dont `GABARIT`), et c'est aussi le tip qui partira en fast-forward.

**G. Comment lire ce brief.** `git fetch` puis
`git show origin/docs/newsletter-v2-spec:docs/BRIEF-NEWSLETTER-2026-09-17.md` — **ne fais pas de
`checkout` de la branche de doc** : tu écris sur `feat/newsletter-v2-impl`, et 3 corrections
atterries sur la branche de doc feraient comparer des branches décalées à la recette.

**F. Rien d'autre ne bouge** : aucun prix, aucun abonnement Stripe, aucun produit du catalogue.

---

## 9. LE DÉPLOIEMENT — LE MAILLON ENTRE LA GATE ET LA CLIENTE (ajouté 18/09)

> Relevé par @vela, revérifié par Élise le 18/09 à 14h05 sur le projet `tulhiipucrnyejheuitv`.

**Ce repo n'a aucune CI** (pas de `.github/`) : merger sur `main` fait redéployer **le site** par
Vercel — **pas les edge functions Supabase**, qui se déploient **à la main**. Une gate verte ne veut
donc **pas** dire « la cliente reçoit ». **État live mesuré à l'instant :**

| Fonction | État live |
|---|---|
| `newsletter-request-resubscribe` | **404 NOT_FOUND — pas déployée** |
| `newsletter-resubscribe` | **404 NOT_FOUND — pas déployée** |
| `newsletter-unsubscribe` | **404 NOT_FOUND — pas déployée** |
| `send-newsletter` | déployée (401 sans en-tête) |
| `stripe-webhook` | déployée (401 « Invalid signature ») |

**Conséquence sur les 3 corrections de couleurs** : celle de `sendOrderConfirmation` **ne partira pas**
avec le merge — cette fonction voyage **dans** `stripe-webhook` (c'est lui qui l'importe). Corriger le
repo sans redéployer `stripe-webhook` laisse le mail de commande en `#888`/`#999` chez les clientes.

**Après la recette verte et le merge, quatre fonctions à déployer — nommément, par Ken (PAT) :**

```
npx supabase functions deploy newsletter-request-resubscribe newsletter-resubscribe \
  newsletter-unsubscribe --no-verify-jwt --project-ref tulhiipucrnyejheuitv
```

⚠️ **`stripe-webhook` est à part, et ne se déploie pas dans la même fenêtre** : c'est le chemin des
paiements **en production** (clé live). Son redéploiement se fait **seul**, avec un **GO explicite de
Ken**, une fois vérifié que le code de la branche est bien celui qui tourne aujourd'hui. **Personne ne
le déploie « au passage »**, et **ni Claude ni Élise ne le font sans ce GO nommé.**

**La commande de ④, avec le drapeau — il n'est pas négociable :**

```
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref tulhiipucrnyejheuitv
```

`config.toml` **ne déclare aucune section `[functions.*]`** : un déploiement **nu** repart sur le
**défaut** de la plateforme (`verify_jwt = True`) → les appels de Stripe prendraient
`UNAUTHORIZED_NO_AUTH_HEADER` et **les confirmations de commande s'arrêteraient en silence**. État
mesuré avant ④ : `stripe-webhook` est en `verify_jwt = False`, sa fonction répond `{"error":"Invalid
signature"}` à un POST sans en-tête.

⚠️ **Le contrôle de ④ se lit dans le CORPS, jamais dans le code HTTP — les deux cas rendent `401`** :

| Corps de la réponse | Ce qui parle | Verdict |
|---|---|---|
| `{"error":"Invalid signature"}` | **la fonction** | ✅ Stripe arrive jusqu'à elle |
| `{"code":"UNAUTHORIZED_NO_AUTH_HEADER",…}` | **la plateforme** | ❌ elle coupe — les commandes ne se confirment plus |

*(Vérifié le 18/09 : le premier est le corps de `stripe-webhook`, le second celui de `send-newsletter`,
dont la fonction protégée n'est pas atteinte. Un contrôle qui ne regarde que le `401` ne distingue
pas les deux.)*

**L'ORDRE COMPTE — les deux moitiés du même maillon.** La migration (`newsletter_v2.sql`) est appliquée
par **@alcyone**, après relecture et **go nommé de Ken** (§0.4) ; les fonctions sont déployées par
**Ken**. **Ne déploie pas les fonctions avant que la migration soit en base** : elles parlent à des
tables qui n'existent pas encore. L'ordre : **migration → fonctions → recette live**.

**Recette du déploiement** (@vela, après coup) : `bash /opt/data/clients/pessora/fonctions-live.sh` —
les 3 fonctions passent de **404** à une réponse métier, et le pied du mail de commande se mesure
**dans le HTML reçu**, pas dans le fichier.

### 9.1 Les réglages qui ne vivent QUE dans le Dashboard (aucune recette au repo ne les voit)

**a) `verify_jwt` des 3 fonctions.** `supabase/config.toml` porte **0** bloc `[functions.*]` et **0**
`no-verify-jwt` : le réglage vit dans le Dashboard, pas dans le repo. Conséquence mesurée :
`POST /functions/v1/send-newsletter` **sans en-tête → 401** (défaut de la plateforme).
→ **`--no-verify-jwt` est obligatoire pour les 3**, sinon le POST en un-clic de Gmail/Apple prend un
**401**, le code n'est jamais atteint, et **la sortie annoncée reste morte — en silence**. La recette
depuis le site ne le verrait pas : la page, elle, envoie la clé anon. *(Deux chemins, deux verdicts :
visiteur → la clé anon passe ; fournisseur → aucun en-tête, refusé.)*

**b) `check_rate_limit` est exécutable par n'importe qui.** Elle est appelable **avec la clé anon**
(mesuré), elle est **étatique donc écrivante**, et `p_key` est un **paramètre du client** : un visiteur
peut faire grossir `rate_limits` et pré-remplir le bucket d'un autre appelant pour lui faire prendre
**429** — donc bloquer une désinscription. Les 3 fonctions newsletter en sont **les premières
consommatrices publiques**. ⚠️ **Le correctif ne peut pas être un `REVOKE … FROM anon, authenticated`** :
la fonction porte le grant **PUBLIC** (`=X`, accordé par défaut par Postgres — la migration
`20260601210000` qui la crée ne pose aucun GRANT/REVOKE), et tout rôle est membre de PUBLIC : un revoke
nominal laisserait la porte ouverte. Le bon geste :
`REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;`
→ **@alcyone le porte, versionné en fichier de migration** (pas un apply ad-hoc : sinon on recrée le
drift « le repo ne reflète pas la base »), **dans le même GO** que la migration v2.

### 9.2 La chaîne réelle — 4 maillons, pas 1

| # | Maillon | Qui | État mesuré le 18/09 |
|---|---|---|---|
| ① | **Migration** `newsletter_v2.sql` en base | @alcyone, **GO nommé de Ken** | **PAS appliquée** (5 colonnes d'origine, 0 fonction, 0 table v2) — sûre et idempotente, le prod actuel n'utilise ni le DELETE anon ni l'UPDATE que la migration révoque |
| ② | **Merge du site** | @alcyone (fast-forward) | en attente du vert |
| ③ | **Déploiement des fonctions** (avec `--no-verify-jwt`) | Ken (PAT) ; `stripe-webhook` **à part**, GO explicite | 3 fonctions en **404** |
| ④ | **Recette live** | @vela | à faire après ③ |

**La recette live, en signatures exactes** (@vela) — c'est la seule qui prouve que la cliente peut sortir :

| test | attendu |
|---|---|
| `POST` sans en-tête, **jeton bidon** | `200 {"outcome":"already_or_invalid"}` — **jamais 401** (il manquerait `--no-verify-jwt`), jamais 404/405 |
| `POST` sans en-tête, **jeton réel** (boîte QA) | `200 {"outcome":"unsubscribed"}` **et** `unsubscribed_at` non nul |
| `GET` | `200 {"outcome":"no_op"}` **et** `unsubscribed_at` **inchangé** — le seul 200 qui est un succès **et** une absence d'effet |

**Portée honnête :** ce § dit **qui** et **quand**, sur un état **mesuré**. Il ne dit pas que le
déploiement est fait — il ne le sera qu'après le GO.

---

## 10. REPRISE APRÈS LE MERGE DIRECT DU 18/09 — `main` n'est PAS complet

> Mesuré par Élise le 18/09 à 15h05 sur `origin/main` = `f621fbd`.

**Le lot est passé sur `main` par un merge direct, sans la gate.** Ce qui est **bien** dedans :
les **14 couleurs** (`#6b6b6b`, vérifié fichier par fichier), le **câblage `List-Unsubscribe`**
vers la fonction, les gabarits et le CRUD. Ce qui **manque**, et c'est mesuré :

| Manque | État sur `main` |
|---|---|
| La correction de l'étiquette « Paiement confirmé » | **ABSENTE** — `sendOrderConfirmation.ts` l. 82 garde `color:#1E3529;opacity:0.5` = **2,91:1** |
| La garde des mails | **ABSENTE** (`mailTemplateContrast.test.ts` n'est pas sur `main`) — elle vit sur `lot/lyra-garde-mail` (`9a6a885`), **5 commits** d'écart avec `main` → **rebase nécessaire**, plus un fast-forward |
| Le revoke `check_rate_limit` | **appliqué ad-hoc en base, non versionné** → drift à fermer par un fichier de migration |

**Ce que la cliente reçoit aujourd'hui, dit exactement** : `stripe-webhook` **n'a pas été
redéployé** (corps déployé lu : `#999` ×3, `#888` ×3, `#6b6b6b` ×0). Le mail de commande part donc
toujours avec ses **trois** défauts d'origine — mais **rien n'est perdu** : un **seul** redéploiement,
**après** la correction de l'étiquette, les corrige tous les trois d'un coup.

**Ordre de reprise (aucune étape sautable) :**
1. **@lyra** rebase sa garde sur `main` → **@alcyone** merge (un seul SHA, la garde devient la preuve) ;
2. **@alcyone** commite le revoke en **fichier de migration** (postérieur à `20260917210111`) ;
3. **@vela** recette live (les 4 signatures + `42501`) ;
4. **`stripe-webhook`** : redéploiement **seul**, sur **GO nommé de Ken** — et **seulement après 1 et 2**,
   sinon on remet en production le mail à 2,91:1.

**Le fait à garder, sans le maquiller :** la gate n'a pas servi sur ce merge. Le code corrigé est bien
en ligne dans le repo, mais **sans son test** — c'est-à-dire sans rien qui empêche le prochain commit
de le redéfaire. C'est exactement ce que la garde existe pour empêcher.

---

## 11. ④ LE REDÉPLOIEMENT — FAIT LE 18/09, SUR GO NOMMÉ DE KEN

**Commande lancée** : `npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref
tulhiipucrnyejheuitv` → **exit 0**, « Deployed Functions ». Lancée **depuis un worktree de `main`**
(3c9d938) — jamais depuis un checkout de branche ancienne.

**Les trois preuves, mesurées après coup :**

| Preuve | Mesure | Verdict |
|---|---|---|
| La fonction parle-t-elle encore elle-même ? | `POST` sans en-tête → **`401 {"error":"Invalid signature"}`** (jamais `UNAUTHORIZED_NO_AUTH_HEADER`) | ✅ le drapeau a pris |
| L'inventaire de la plateforme | `stripe-webhook` **v15 → v16**, `verify_jwt=False`, `ACTIVE` | ✅ |
| **Les sources DÉPLOYÉES** (`supabase functions download`) | `sendOrderConfirmation.ts` : **`#6b6b6b`** sur les **3** lignes (étiquette, « Des questions ? », la signature) ; **`#999` : 0** · **`#888` : 0** · **`opacity:0.5` : 0** | ✅ le mail de commande part lisible |

**Non-régression, vérifiée au diff** : le lot n'a apporté à `stripe-webhook` + `_shared` que
**3 lignes** dans `sendOrderConfirmation.ts` (les encres). **Aucun autre changement** dans le chemin
des paiements.

⚠️ **Leçon d'instrument, à garder** : **compter une chaîne dans le binaire eszip n'est pas fiable** —
les sources y sont compressées, donc une chaîne courte sort en **faux positif** et le comptage ne
veut rien dire. La méthode qui tranche : **télécharger les sources déployées**
(`npx supabase functions download <slug> --project-ref … --use-api`) **et compter dans les fichiers
extraits**. C'est celle utilisée ici.

**Limite nommée** : aucun **événement Stripe signé** n'a été envoyé (cela toucherait un vrai
paiement). La preuve porte donc sur **« la fonction répond et son code déployé est celui attendu »**,
pas sur « un paiement de test s'est confirmé ».

---

*Élise — 17/09/2026, d'après les arbitrages de la salle PESSORA 2.*
