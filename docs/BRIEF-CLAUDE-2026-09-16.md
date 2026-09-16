# BRIEF CLAUDE — Pessora — 16/09/2026 (soir)

> Rédigé par Élise à partir du brainstorm de Ken et des specs de la team (nova, lyra, vela, alcyone).
> **À coller tel quel dans la session Claude Code du repo `pessora`.**
> Repo : `/opt/data/repos/pessora` · `main` = `faac1bd`

## ⚠️ OÙ TU TE TIENS (avant tout)

Le clone `/opt/data/repos/pessora` **n'est PAS sur `main`** : il est sur `lot/porte-admin` @ `8ea1444`, avec une **suppression non committée** (`src/__tests__/adminOrigin.test.ts`). Ce WIP n'est pas à nous — **ne pas y toucher**.

→ `git checkout main` (arbre propre), ou ouvre un **worktree dédié** avant d'écrire une ligne. Vérifie `git rev-parse --abbrev-ref HEAD` en tête de script : ce clone est partagé.

---

## LA PHRASE QUI TRANCHE TOUT (à garder en tête à chaque commit)

**On ne promet que ce qu'on livre, et rien ne part vers une personne qui n'a pas dit oui.**

Les 4 items sont des déclinaisons de cette phrase. Si un arbitrage est ambigu, c'est elle qui tranche.

---

## ÉTAPE 0 — TROIS CHOSES À DÉCIDER AVANT DE CODER (Ken)

1. **Merge de la garde ?** `fix/contraste-fiche-inscrit-challenge` @ **`59e462c`** (4 fichiers : la garde de contraste, son cliquet, la fiche inscrit, `EventForm.tsx`). QA passée par vela sur le tip distant. **Tant qu'elle n'est pas dans `main`, la garde n'existe pas** — et Claude a déjà reposé **18** jetons sous AA dans `EventForm.tsx` aujourd'hui. Sans ce merge, on lui donne une porte.
2. **GO migration ?** Sans lui, **② et ③ ne se codent pas** (ils touchent la base de Catherine). Le go est **additif** : une colonne, une table, des policies — **aucune ligne existante n'est réécrite**.
3. **Le banc d'essai s'affiche sur la home publique** (mesuré en live) : `TEST-KEN-Challenge 21 jours`, daté du **24/09**, compte à rebours vivant, inscription **ouverte**, lien public `/evenements/test-ken-challenge-21-jours`. Le geste est à Ken, **on ne touche pas son banc**.

**Sans décisions 1 et 2 : seul ④ est codable ce soir.**

---

## LE DÉPLOIEMENT DES EDGE FUNCTIONS — À LIRE AVANT D'EN ÉCRIRE UNE

**Vercel ne déploie PAS les edge functions.** Le déploiement est **manuel et nominatif**, fonction par fonction.

- `supabase/config.toml` **ne contient aucune entrée `verify_jwt`** : la politique de déploiement ne vit **que dans la commande**, nulle part dans le repo.
- Script existant : `/opt/data/deploy_pessora_functions.sh` — liste **en dur**, `--project-ref tulhiipucrnyejheuitv`, **9 fonctions** en `verify_jwt=true` + **2** en `--no-verify-jwt`.
- ⚠️ **Ce script est périmé** : il déploie **11** fonctions alors que le repo en compte **14**. Il manque `get-order-by-token`, `get-order-for-success` (**les deux oubliées de l'incident CORS du 10/09**) et `stripe-webhook`.

**Donc, pour ce chantier :** `unsubscribe-newsletter` → **`--no-verify-jwt`** (appelée par un lien d'e-mail, pas par un utilisateur authentifié) · la fonction de rappel → **`verify_jwt=true`** · **et les deux ajoutées au script**, sinon le prochain déploiement complet les oubliera comme il a oublié les deux autres.

**Un code livré + « fait » sans déploiement = un lien de désinscription qui renvoie une erreur et un rappel qui ne part jamais.** C'est la leçon de `send-contact-email` : l'ancienne adresse y a survécu **dans le déployé** alors que le repo était corrigé. Déployer fait partie de la tâche.

---

## ÉTAPE 1 — ④ Gamme Skin (libre, aucune donnée, aucun go)

**L'intention : on vend un PROTOCOLE, jamais un résultat.** La page dit *quoi appliquer, dans quel ordre, combien de temps* — jamais *ce que ça donne*.

**Deux blocs, jamais un :**

- **Le protocole** J0 / J14 / J28 — part **maintenant**. Fond `surface-product-well`, 3 colonnes desktop / liste numérotée mobile, photos produits de Catherine. Il n'affirme aucun résultat, donc il n'attend ni photo de cliente ni accord.
- **L'avant/après** — reste **en veille** : 3 volontaires minimum, **accord écrit**, mêmes lumière / angle / distance. Sa légende décrit **le protocole**, jamais un résultat.

Jamais fusionnés : le protocole est vrai aujourd'hui, l'avant/après non — mélangés, c'est le protocole qu'on met en doute.

---

## ÉTAPE 2 — ② Email à l'inscription (bloqué : GO migration)

**L'intention : l'email est un SERVICE RENDU (ton créneau, ton rappel), pas une prise de contact.** La newsletter est **une question à part**, posée une fois, sans pré-cochage.

**Le formulaire :**

- **Champ email visible sur le formulaire**, placé **juste après le téléphone**, dans le bloc coordonnées — et il **ne devient jamais le dernier champ**.
- ⚠️ **On ne réordonne rien d'autre — en particulier PAS la case RGPD.** Dans le formulaire réel, l'ordre est `Prénom · Nom · Téléphone · Âge · Profession · timing · créneaux de rappel · case RGPD · bouton` (`Challenge21jRegistrationCard.tsx:539→724`) : il finit sur la case RGPD, et c'est très bien. **Déplacer cette case est un changement de consentement, pas de mise en page.**
- Raison écrite sous le champ, pas devinée : *« Ton email — pour t'envoyer ton créneau de bilan et te rappeler le rendez-vous. »*
- Puis **« Recevoir les nouveautés de PessÓra : Oui / Non »** — `z.enum(['oui','non'])`, **aucun défaut**, **requis au schéma** (même motif que `privacyAccepted`), **jamais** pré-coché. Non = **aucune ligne** écrite dans `newsletter_subscribers`. Jamais une valeur fabriquée, jamais via un `DEFAULT`.
- Même couple de questions sur les **événements standards** (même porte, même question). `souhait_info` devient une **archive froide** : on ne la route pas (« Non merci » y est pré-sélectionné, et l'ajout manuel écrit « Ajout manuel »).
- Confirmation après envoi, en clair : *« C'est noté. Rien d'autre que ton bilan tant que tu ne nous as pas dit oui pour les nouveautés. »*

**Le rappel de créneau (même lot) :**

- **Bouton admin « Envoyer les rappels de demain (N) »**, pas de cron (pas de `pg_cron`/`pg_net`, et Vercel Cron s'exprime en UTC sur un site en UTC−4).
- **Rien ne part avant que Catherine valide le créneau** — son geste. Un inscrit jamais validé ne reçoit rien.
- **Idempotent** : marqueur explicite `rappel_envoye_at`, jamais un état déduit.
- **Zéro promo dedans** — c'est le seul mail qu'on a le droit d'envoyer à tout le monde ; y glisser une offre brûle le canal sollicité.
- S'il n'y a rien à envoyer : *« aucun bilan confirmé demain »*, bouton **inactif**. Un bouton sans issue = un mensonge.

### ⚠️ « DEMAIN » SE CALCULE EN MARTINIQUE, JAMAIS EN UTC

La date UTC est **en avance d'un jour** entre **20h et minuit** heure de Martinique (00h–03h59 UTC). Mesuré : à 20h, 21h et 23h MQ, un « demain » calculé en UTC donne le **18/09** au lieu du **17/09**.

Or le bouton sera écrit côté **edge function Deno, donc en UTC** — et c'est **exactement l'heure à laquelle Catherine clique**, après la fermeture. Résultat : des rappels du mauvais jour envoyés **sans aucune erreur**, ou un *« aucun bilan confirmé demain »* affiché alors qu'il y en a un. Le bouton dirait la vérité au mauvais jour.

- Le front est couvert : `src/lib/martiniqueDate.ts` existe et porte **3 tests**, dont le cas 23h30 UTC.
- Mais **`_shared/` ne contient aucun helper de date** (7 fichiers : `cors`, `env`, `pricing`, `rate-limiter`, `verifyAdmin`, `sendOrderConfirmation`, `activateOraPlus`) et le code serveur fait déjà `new Date().toISOString().split('T')[0]` (`activateOraPlus.ts:114`).

→ **Calculer en `(now() AT TIME ZONE 'America/Martinique')::date`**, ou **dupliquer le helper dans `_shared/` avec son test**.
→ **Recette à 21h heure de Martinique, jamais à midi** : à midi la porte passe verte et le bug reste.

---

## ÉTAPE 3 — ③ Newsletter (bloqué : GO migration)

**L'intention : un seul métier — garder la relation vivante avec ceux qui l'ont demandé** (la boisson du mois, les dates du challenge), et se révoquer en un clic. Pas une vitrine, pas un catalogue.

**Base (alcyone) :**

- `token uuid` sur `newsletter_subscribers` ; désinscription **et** re-confirmation par **double opt-in**, toutes deux en service_role via l'edge function — **AUCUNE policy UPDATE anon** (avec la clé anon publique, `USING (consent=false)` laisserait un seul `PATCH` réinscrire tout le monde).
- `DROP DEFAULT` sur `consent` **ET** sur `source` (sinon un import oubliant `consent` **fabrique** un consentement, et une ligne déclare « footer » à tort) + `CHECK (source IN (...))`.
- **Le prédicat d'envoi n'existe qu'une fois** (vue `newsletter_sendable`, `consent = true`) — lue par la fonction d'envoi **et** par le compteur de l'admin. Sinon « affiché N » divergera de « envoyé M ».
- **L'admin n'édite jamais un consentement** : il peut seulement enregistrer une déclaration faite devant Catherine (`INSERT` avec `source='accueil-bar'` + `consent_at`), geste daté, jamais un basculement muet.
- Réutiliser `check_rate_limit(p_key, p_max, p_window)` (existe déjà, `SECURITY DEFINER`).

**Envoi (alcyone + invariants vela) :**

- Envois **individuels**, jamais de BCC ni de `to:` multiple (Resend exposerait les adresses entre elles) — c'est aussi la seule façon d'avoir un token par destinataire dans le corps.
- Décompte **honnête** : `{ sent, failed, failedEmails }`, jamais un `count` optimiste. Backoff sur 429 (~2 req/s).
- **GET ne mute jamais** (les scanners de webmail suivraient le lien) : le lien du corps ouvre une page de confirmation, seul le **POST** écrit. Plus `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`.
- **Zéro PII dans l'URL et dans la réponse** : token seul, jamais `?email=`.
- Au-delà de quelques dizaines d'adresses : noter une table `newsletter_sends` pour reprendre après timeout. Ne pas la créer (YAGNI).

**Copie (Élise — livrée) :**

- Pied de mail : *« Vous recevez cet e-mail car vous vous êtes inscrit·e à la newsletter de PessÓra. »* + **« Se désinscrire »** en lien **texte**, sur sa propre ligne, même contraste que le corps.
- Page GET : *« Se désinscrire de la newsletter — Votre adresse sera retirée de notre liste d'envoi. **Rien n'a encore été modifié** — confirmez ci-dessous. »* → `[Me désinscrire]` · *Non merci, je reste inscrit·e* + *« Si vous n'êtes pas à l'origine de cette demande, fermez cette page : votre inscription reste active. »*
- Page POST : *« Votre désinscription est enregistrée — Vous ne recevrez plus d'e-mails de la part de PessÓra. Pour revenir, il suffit de vous réinscrire depuis le site. »*
- Token inconnu / déjà utilisé (idempotent, jamais 500) : *« Ce lien n'est plus valide — il a déjà été utilisé, ou l'adresse n'est plus inscrite. Dans tous les cas, vous ne recevrez plus d'e-mails de notre part. »*
- Contraintes : **aucune promo ni offre** dans ces écrans · « Se désinscrire » **écrit en clair** (jamais « gérer mes préférences ») · jamais culpabilisant · lien **texte, pas 11 px gris**.

**Enveloppe (lyra) :** une colonne **600 px**, blanc, rayon **2 px** · mot-symbole **en texte** (Baskerville, majuscules espacées), **jamais une image de logo** · **une seule photo** · **trois blocs courts max** · **un seul bouton** noir/blanc · le reste en liens texte au contraste du corps · **l'or n'est jamais du texte** (2,26:1 — filet de 1 px seulement) · le mail doit **se lire images bloquées** (aucune info qui n'existe que dans l'image) · les pages de désinscription : même charte, **sans photo et sans or**.

**L'écran admin (lyra) :** une colonne **« État »** avec **trois mots différents** — `Inscrit·e` / `Désinscrit·e` / `Jamais demandé` — **lisibles en noir et blanc** (la couleur renforce, ne porte jamais ; WCAG 1.4.1). À côté, **provenance + date** : « oui, 16/09 » / « non, 16/09 » / « import du bar, 12/09 ». Le compteur dit le prédicat en mots : *« Envoyer à 12 personnes — celles qui ont dit oui »*, et à zéro *« Personne n'a dit oui — rien à envoyer »*, bouton **inactif**. Deuxième ligne obligatoire : *« 34 personnes ont dit non ou n'ont jamais été demandées : elles ne recevront rien. »* · **Filtre « Jamais demandé »** = la liste d'invitation de Catherine · **Export CSV** : `email, consent, source` + l'état en mots — jamais `true`/`false` seuls.

---

## ÉTAPE 4 — ① La liste du bar (bloqué : liste de Catherine)

**L'intention : ce n'est pas un import, c'est une INVITATION.** La liste sert à inviter, pas à envoyer.

- **Ce n'est pas une liste à importer, c'est une liste à rouvrir.** Son export est **majoritairement des numéros, sans email** → l'« email de re-consentement » ne peut pas partir. Le chemin est : invitation (SMS/WhatsApp, le canal du bar) → la personne crée son espace → le téléphone matche → on a l'email **et** le consentement dans le clic.
- **Pont téléphone → compte** façon Dal Cielo : table `customers` clé `phone_key`, `auth_user_id` unique et nullable rempli au rapprochement. Google **ne rend pas le téléphone** → le numéro entre après la création du compte, et la confirmation *« c'est bien ce numéro ? »* s'affiche **quand le numéro est saisi** (jamais au login).
- **Import toujours en `consent=false, source='import-catherine'`** — un import ne fabrique jamais un consentement. Ceux qui ne confirment pas restent `consent=false` : on n'a pas le droit de leur écrire, et c'est le but.
- **`normalize_phone` → NULL sous 9 chiffres** (canonisation, pas validation — pas de regex structurelle, elle casserait le `+596`) **+ le miroir `src/lib/phone.ts` aligné dans le même lot** + 2 cas de test · `phone_key` en `text unique check (phone_key ~ '^[0-9]{9}$')` · **une cellule = un numéro** (deux numéros dans une cellule donnent la clé du dernier, en silence → revue humaine) · le rapprochement **ne fait jamais échouer une inscription** (best-effort, catch-all).
- Le pont doit être **visible et contestable** par la personne, jamais silencieux.
- Catherine doit pouvoir **corriger un numéro à la main** depuis son admin, et être **la première utilisatrice** du pont.

### La carte d'invitation (A6, imprimable)

Mot-symbole + une ligne + QR, noir sur blanc, **un filet or — l'or jamais en texte**, aucune photo, aucun résultat promis. Elle pointe **la route stable `/evenements/challenge-21-jours`** (`App.tsx:177`), **jamais un slug d'événement**. Le texte de la ligne vient de Catherine : **on ne fabrique aucune promesse à sa place**.

⚠️ **Conséquence directe de l'invariant 7 :** aujourd'hui le seul slug public qui existe est celui du **banc d'essai** (`/evenements/test-ken-challenge-21-jours`, mesuré en live). Si la carte se fait avant la décision de Ken, **on imprime son banc sur un carton qui vivra des mois** — et un QR imprimé ne se remerge pas.

**Séquence :** le fichier est **préparé** maintenant ; il n'est **imprimé qu'en dernier**, une fois le site en ligne et la phrase de Catherine écrite.
**Recette du tirage (pas de l'écran) :** scanner le **PDF imprimé**, pas le fichier, avec **deux téléphones (iOS + Android)**, et vérifier que ça ouvre `/evenements/challenge-21-jours` **sur le site en ligne**. Un QR lisible sur un écran peut échouer sur un papier mat — la taille et le contraste se valident sur le scan.

---

## ÉTAPE 5 — CE QUE CATHERINE DOIT FAIRE SEULE, à son clavier, sans nous

Un chantier n'est pas livré quand le code est écrit : il est livré quand **elle s'en sert**. Le jour où la newsletter meurt, ce ne sera pas parce que la policy était fausse — ce sera parce qu'elle ne s'en sert pas.

1. lire ses trois états — **oui / non / jamais demandé** — et **filtrer « jamais demandé »** : c'est sa liste d'invitation, son outil de tous les jours ;
2. **envoyer les rappels de demain** en un clic, et lire *« aucun bilan confirmé demain »* **sans croire que c'est cassé** ;
3. **récupérer son export** (`email, consentement, provenance`) sans qu'un aller-retour puisse fabriquer un consentement ;
4. **ressortir son QR** quand elle change de vague — la route stable, jamais un slug.

**On recette ces quatre gestes avec elle.** Ce qu'on fait à sa place n'est pas livré.

**Critère de vela, à appliquer aux quatre :** chacun doit avoir un **état écrit quand il n'y a rien à voir**. Un écran vide et un écran cassé se ressemblent exactement pour elle — même piège que `no tests` qui ressemble à une baseline.

---

## LES 8 INVARIANTS DE RECETTE (vela) — à ne pas perdre

1. **Aucun consentement fabriqué** : case non cochée = **0 ligne** écrite (mesuré en delta). Jumeaux : `souhait_info` = archive froide · l'admin ne bascule pas un consentement (INSERT daté à la place) · `DROP DEFAULT` sur `consent` **et** `source`.
2. **Un échec d'écriture ne casse jamais l'inscription** (doublon `23505`, policy refusée) — et jamais un « succès » affiché sans écriture : ce repo a déjà livré un false-success sur un delete (`2f507a1`).
3. `newsletter_subscribers` : **aucune policy UPDATE**, et le **prédicat d'envoi existe une seule fois**.
4. **Clé de pont** : `normalize_phone` NULL sous 9 chiffres + le miroir aligné + `CHECK` sur `phone_key` ; clé invalide **jamais liée**.
5. **Import** : cellule à deux numéros → revue humaine, jamais de clé automatique.
6. **Rappel** : rien avant validation de Catherine, idempotent, rien pour un inscrit non validé.
7. **Aucune surface publique** ne pointe un événement qui n'est pas de Catherine — vérification : grep `TEST-|test-|dummy|exemple` sur le texte **rendu**, pas dans le diff.
8. **Un vert s'attache à un SHA**, et la recette se fait **sur le déployé** : **ce repo ne se builde pas en local** (`@heroui-pro/react` = installeur sans `dist`, `require.resolve` → `MODULE_NOT_FOUND`). Personne ne peut écrire « j'ai buildé en local » sur ce repo.

---

## LA GARDE DE CONTRASTE

Elle arrive **avec la branche `fix/contraste-fiche-inscrit-challenge`, tip `59e462c`** — **elle n'est pas encore dans `main`**.

- **Tant qu'elle n'y est pas, ne pas s'en servir comme garde.**
- Une fois mergée : `npx vitest run src/__tests__/challengeRegistrantDetailContrast.test.ts --pool=threads` échoue si le code ajoute **n'importe où dans `src`** un jeton de couleur de texte sous AA (`text-black/40` = 2,85:1, `text-red-500` = 3,76:1, `text-[#999]`…). Cliquet actuel : **101 fichiers / 926 occurrences** — aucun besoin de le régénérer au merge.
- La bonne réponse à un rouge est de **corriger le jeton** (`/60`, `red-600`+), **jamais** de régénérer le cliquet. `CONTRAST_BASELINE=write` n'existe que pour un arbitrage assumé et documenté.
- Limite déclarée : la garde lit la **source**, pas un rendu ; la famille **blanc** (`text-white`) n'est pas jugée.

### Compter les tests exécutés avant de conclure quoi que ce soit

Mesure du 16/09, même suite **avec et sans** `--pool=threads` : **11 fichiers, 65 tests, 10 échecs** — identique (trois mesures concordantes). **`--pool=threads` n'est donc pas une obligation, c'est une précaution sous charge.**

Mais sous forte charge (incident du 15/09, load 15+, ~24 worktrees), le pool par défaut (`forks`) peut mourir en `Timeout waiting for worker to respond` et afficher **`no tests` + `Errors 1`** : **un run qui n'exécute rien ressemble exactement à une baseline**.

→ **La garde réelle, c'est le nombre de tests exécutés, jamais le silence d'un run vide.**
→ Référence après merge : **11 fichiers / 65 tests** (`main` = 10 / 59). **Tout run qui annonce moins est rouge.**

---

## ÉTAT DES BRANCHES (vérifié)

- `main` = **`faac1bd`** (push Claude : bannière home + image dédiée pop-up + récap).
- `fix/contraste-fiche-inscrit-challenge` = **`59e462c`**, QA verte de vela sur le tip distant, **non mergée**. Diff vs main = **4 fichiers**, rien d'emporté. Baseline inchangée (10 échecs = `cartStore`/jsdom + `menuCatalog` sans `.env`).

---

*Élise — 16/09/2026*
