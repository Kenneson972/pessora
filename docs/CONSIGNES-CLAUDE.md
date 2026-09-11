# CONSIGNES À CLAUDE — Pessora

**Ce fichier est le point d'entrée unique.** Toute consigne destinée à Claude y est écrite par l'équipe (Nova, Alcyone, Vela, Élise), avec sa date et son état. Rien ne se transmet par chat : ce qui n'est pas ici n'est pas une consigne.

> **Pour Ken :** « pull, lis `docs/CONSIGNES-CLAUDE.md` » — il a tout.
> **Pour Claude :** lis ce fichier en entier avant de coder. Il fait autorité sur les briefs plus anciens quand les deux se contredisent.

---

## RÈGLES GÉNÉRALES (permanentes)

- **Une branche par lot** · jamais de push direct sur `main` · **aucun merge sans recette verte de @vela**.
- **Gate** : `npx tsc --noEmit` + build Vercel. (Le build local est impossible : `@heroui-pro/react` postinstall.) Les 10 échecs `cartStore.test.ts` sont **pré-existants**.
- **Une seule personne dans le repo à la fois.**
- **Une migration appliquée = le fichier mergé.** Si la base change après coup, on ajoute une **migration de suivi datée** — on ne modifie **jamais** un fichier déjà appliqué (le blob appliqué doit rester celui qui a été relu).
- 🔐 **Depuis le 11/09 — l'écriture en base s'ANNONCE, et se VÉRIFIE.** Plusieurs personnes ont le PAT (c'est normal) : l'obligation n'est pas de demander la permission, c'est de **dire qu'on a écrit** (quoi, en une transaction). Protocole, à chaque application :
  `python3 /opt/data/cache/base_fingerprint.py --snapshot avant-application` → **application en une transaction** → `--snapshot apres-application` → `--diff`. Le diff dit **où ET quoi** (les corps `prosrc` sont stockés) ; aucune écriture non annoncée ne peut plus passer inaperçue. C'est le `git status` de la base — et il est **muet quand rien n'a bougé** (vérifié).
  ⚠️ **`supabase_migrations.schema_migrations` ne dit PAS l'état de la base** : elle ignore nos applications (API Management) et enregistre celles du MCP Supabase. Un écart entre cette table et le repo est **normal** — la vérification se fait **par objet** (`prosrc`, `pg_trigger`, `pg_policies`, `pg_indexes`), jamais par cette table.
- 🔒 **Une seule personne écrit en base à la fois — et elle l'ANNONCE.** Plusieurs personnes ont le PAT (c'est normal, @elise et @alcyone l'ont aussi) : ce qui rend l'écriture sûre, ce n'est pas le privilège, c'est **l'annonce + la relecture par un autre**. Celui qui applique **dit ce qu'il applique** (quoi, en une transaction, sur quel objet), applique **en une transaction**, et **quelqu'un d'autre vérifie par objet** (`prosrc`, `pg_trigger`, `pg_policies`). Sur Pessora, **l'écrivain de référence est @alcyone** ; **Claude écrit le code** et, s'il applique quelque chose en base, **il le dit** — jamais en silence. C'est « une seule personne dans le repo à la fois », appliqué à la base.
  - *Motif (11/09)* : une migration **`20260911125459`** — absente de **tout** fichier du repo — est apparue en base **sans avoir été annoncée** (version à mi-lot du travail en cours ; base intacte par chance). Le problème n'est **pas** l'accès : c'est **l'écriture non annoncée**, qu'on ne peut ni dater, ni relire, ni contrôler.
  - **L'obligation, c'est l'ANNONCE** (arbitrage Ken, 11/09) : « tant que le travail est fait ». On ne se demande pas la permission d'écrire — on **dit qu'on l'a fait**, et quelqu'un relit. La relecture est un **filet de sécurité**, jamais un droit de veto : personne n'attend un « go » pour appliquer une migration déjà relue. Ce qui est interdit, c'est **l'écriture silencieuse**.
  - Conséquence de méthode : après chaque application, **vérifier qu'aucune migration inconnue n'est apparue** dans la table de suivi — et garder en tête que **`supabase_migrations.schema_migrations` ne dit pas l'état de la base** (elle **ignore** nos applications par API Management et **enregistre** les autres : fausse dans les deux sens).
- **Les migrations ne sont PAS la source de vérité de la base.** Trois cas ce soir : `bilan_bookings_insert_public`, `bilan_slots_select_public`, `profiles_insert_own` existent en base et dans **aucune** migration. Tout audit RLS se fait **en live** (`pg_policies`, `information_schema`), jamais en relisant les fichiers.
- **RLS dit oui ≠ privilège dit oui.** Les deux sont nécessaires. Une policy correcte avec un `GRANT` manquant = fonctionnalité cassée (le bouton DELETE de l'admin, ce soir). On le prouve en **faisant l'action pour de vrai avec le bon rôle**.
- **Une garde dont l'entrée vient de l'appelant n'est pas une garde.** Toute règle validée côté client doit exister côté serveur.
- **Jamais de faux succès** : une écriture ne vaut que si l'on sait qu'elle a touché une ligne (et sur un `INSERT`, un `RETURNING` exige une policy SELECT — attention aux chemins invités).
- **Devis :** rien de tout ça ne touche le périmètre vendu.

---

## 🧪 À FAIRE MAINTENANT — test end-to-end (Playwright, sous les yeux de Ken)

**Scénario complet, prêt à dérouler : `docs/test-e2e-challenge-2026-09-11.md`.**

Il couvre : créer un challenge (`TEST-KEN-`) depuis l'admin → créer 2 créneaux → le parcours public complet (inscription → étape bilan → réservation → demande dans la file de Catherine) → l'annulation (ligne **et** créneau) → le test de l'e-mail du balayage → **et le nettoyage obligatoire** (`TEST-%` = 0, retour au baseline).

**Points non négociables de ce test** : tout est préfixé `TEST-KEN-` · on teste **en production** · les identifiants admin se lisent **à l'exécution** depuis le fichier de secrets (jamais dans le code, jamais dans un chat) · **aucun e-mail ne doit partir chez la cliente** (vérifier `ADMIN_EMAIL` = `ken972@yopmail.com` **avant**) · et le nettoyage + l'empreinte de sortie font partie du test.

⚠️ **L'étape 6 (e-mail du balayage) nécessite le lot ② codé** — le reste est testable **tout de suite**.

---

## ÉTAT AU 10/09/2026 (nuit) — clôture de journée

- **`origin/main` = `c4325d6`** · **production déployée** (Vercel READY).
- **Les 3 migrations du Challenge/Bilan sont en base ET dans `main`** → **aucune migration appliquée hors du repo** (le motif corrigé toute la journée). Ne pas modifier les fichiers déjà appliqués : tout correctif passe par une **migration de suivi datée**.
- **Branches mergées ce soir** : `chore/gitignore-env`, `feat/bloc-partenariat-page-contact`, `feat/tests-paiement-stripe`, `fix/google-full-name` (fonction et trigger **déjà en base** → merger a **aligné** repo↔base ; personne ne l'applique).
- ⚠️ **`feat/tests-paiement-stripe` ne contient AUCUN test** — une seule doc de 47 lignes. **Ne jamais dire « les tests Stripe sont faits »** : un nom de branche n'est pas une preuve.
- ⚠️ **`feat/bloc-partenariat-page-contact` est un ajout hors brief** (demande de Ken) : à déclarer comme tel, ce n'est pas un point du CR de Catherine. Vérifié en live après merge : `/contact` sert le CTA, le lien mène à `/contact-partenariat`, 0 erreur console.
- **Prochaine étape** : la **RPC questionnaire** (lot 1 ci-dessous), puis l'edge function, puis `X-Robots-Tag`, le lot `profils`, la conformité.

---

## 2026-09-10 (soir) — LOT A : Challenge / Bilan — ✅ MERGÉ

**État : le merge du lot A est `047c294`** (17 fichiers, +1029/−12) — vérifié comme **déploiement de production servi** (Vercel, ref `main`, état READY). Les deux migrations sont en base. *(`origin/main` a avancé depuis — c'est normal, ce SHA est la trace du lot A, pas la tête de branche.)*

Contenu : garanties serveur (fenêtre J-14→J, anti double-réservation, dédup hors-date, téléphone normalisé, `origine`), widget de réservation, catégories d'erreur partagées, validation téléphone 9 chiffres, accroches Challenge.

**Réserve écrite, à ne pas oublier :** le critère **⑨** (`origine = 'questionnaire'`) **n'est PAS validé** — aucun appelant n'existe tant que la RPC n'est pas écrite. Il se recettera **avec** elle.

**À attendre, ce n'est pas un bug :** le widget ne se monte que sur un événement `type = 'challenge'` (`EvenementDetail.tsx:364`). Comme **aucun challenge n'existe en base**, **aucune page ne l'affiche aujourd'hui** — un visiteur ne voit rien de nouveau (vérifié en live : `/evenements` et `/evenements/runclub` rendent sans erreur console). Dès que Catherine crée son challenge, la page affichera **ses** créneaux — et **0** tant qu'aucun créneau ne lui est rattaché : les 7 créneaux historiques sont **orphelins** (sans `challenge_event_id`), donc invisibles par construction.

**Fichiers d'historique (ne pas modifier) :** `20260911100000_lot_a_challenge_bilan_server_guards.sql` (blob `709359a9…`, appliqué) + `20260911120000_grant_delete_bilan_bookings.sql` (`d777652`, correctif daté).

---

## ✅ 2026-09-10 (nuit) — RÉSOLU : rattachement créneau → challenge (mergé `c4325d6`)

**État : mergé et déployé (Vercel READY).** La 3ᵉ migration `20260911130000_attach_slot_to_challenge.sql` est **en base et dans `main`** — le dépôt et la base sont au même niveau, **aucune migration appliquée hors du repo**.

Trigger `trg_bilan_slot_attach_challenge` + fonction `fn_bilan_slot_attach_challenge` (`SECURITY DEFINER`, `search_path=public`). **Recette serveur : 7/7 verts** — rattachement automatique (insert identique à celui de l'admin), déterminisme prouvé dans **les deux ordres de création**, recalcul sur changement de date, retour à `NULL` hors fenêtre, non-régression (une réservation ne touche pas le lien), visibilité en anon, base rendue intacte (7 créneaux / 0 booking / 1 événement).

⚠️ **Seul reste, purement visuel :** le libellé de l'admin. `slotChallengeLabel` rend `→ titre` **dès qu'un lien existe**, sans tester `active` ni la fenêtre → un créneau rattaché à un challenge **désactivé** ou **hors fenêtre** s'affiche comme normal alors qu'il est invisible côté public. Le cas **orphelin** est bien traité (message ambre). À corriger au prochain passage front : distinguer « **pas encore ouvert (J-14 → J)** » et « **challenge désactivé** » — les données (`active`, `date`) sont déjà dans le composant.

---

## 🔴 2026-09-10 (après merge) — HISTORIQUE : le constat qui a produit le correctif ci-dessus

**Constat vérifié dans le code de `main` (pas une hypothèse) :**

- `AdminBilans.tsx:190-199` — `createSlotAtSelected()` insère `{ date, heure, disponible: true }` : **jamais `challenge_event_id`**. Aucun écran, aucune fonction ne renseigne cette colonne (elle n'apparaît que dans `BilanBookingWidget.tsx:78` en **lecture**, et dans `types/database.ts`).
- `BilanBookingWidget.tsx:76-78` — le widget lit `.eq('challenge_event_id', challengeEventId)`.
- Conséquence : **tout créneau créé depuis son admin est orphelin** → `fn_bilan_slot_bookable()` = `false` → **invisible et non réservable**. Créer un challenge puis des créneaux **ne suffit pas** : la page affichera **0 créneau**, même avec des créneaux `disponible = true`.

**Régression induite par la v5 sur un flux existant** : avant la migration, la policy `bilan_slots_select_public (USING true)` rendait le créneau visible ; depuis, il ne l'est plus tant qu'il n'est pas rattaché. Le geste « ajouter un créneau » dans son admin est donc **sans effet visible** aujourd'hui — il faut le dire, sinon c'est un « ça ne marche pas » devant la cliente.

**Correctif retenu (doctrine : la règle vit côté serveur, l'UI affiche)** — **trigger `BEFORE INSERT OR UPDATE`** sur `bilan_slots` (⚠️ **aucun trigger n'existe aujourd'hui sur cette table** : c'est une page blanche, et il n'y a **aucun backfill** à prévoir — les 7 créneaux historiques restent orphelins, ce qui est correct puisqu'ils sont passés).

1. **Rattachement** : si `challenge_event_id IS NULL`, rattacher au challenge `active` dont la fenêtre couvre la date (`events.date - 14 <= NEW.date <= events.date`, `type = 'challenge'`) ; **départage déterministe obligatoire** s'il y en a plusieurs : **le challenge dont la date est la plus proche au-dessus de celle du créneau** (`ORDER BY e.date ASC LIMIT 1`) — sinon le résultat dépend du plan d'exécution. Si aucun ne correspond → laisser `NULL` (orphelin assumé).
2. **Recalcul** : recalculer aussi quand `NEW.date IS DISTINCT FROM OLD.date` (déplacer un créneau hors fenêtre laisserait sinon un lien **périmé mais d'apparence correcte** → invisible et **indiagnosticable à l'écran**). **Ne jamais écraser un lien posé explicitement** par l'admin.
3. **État lisible dans l'admin (exigence cliente)** : un créneau orphelin **ne doit pas disparaître en silence**. L'admin doit dire **pourquoi** — « ce créneau ne s'affichera pas : sa date est hors de la fenêtre du challenge ». Même logique que la colonne `origine` dans l'onglet « Demandes ».
4. Un sélecteur « challenge concerné » dans l'admin reste souhaitable **plus tard** (lisibilité), mais ne doit **jamais** être la seule garantie.

**Critères de recette (à jouer tels quels)** : ① créer un challenge dans l'admin → **ajouter un créneau depuis l'admin** → rattaché, **visible et réservable** sur la page du challenge, **sans aucun SQL** · ② créneau hors de toute fenêtre → reste orphelin **et l'admin dit pourquoi** · ③ **chevauchement de deux challenges, créés dans les deux ordres** (20/09 puis 05/10, et l'inverse) → **le même créneau tombe sur le même challenge** dans les deux cas (déterminisme prouvé, pas seulement écrit) · ④ déplacer la date d'un créneau existant → le lien se **recalcule**. Aujourd'hui : ❌ sur les quatre.

**Lien avec la migration v5** : ce n'est **pas** un oubli du lot A côté client — c'est un lien manquant entre deux lots (la colonne est arrivée avec la v5, l'écran de saisie des créneaux est antérieur et n'a pas suivi). À traiter comme un correctif **avant** la démo du Challenge.

---

**BASELINE AVANT v6 — à repasser APRÈS application (écart = fixture oubliée)**
Relevé du 10/09 (indépendamment par @vela et @alcyone) : `bilan_slots` = **7 lignes**, **7 orphelins** (`challenge_event_id = NULL`), toutes `disponible = true`, datées du **25/04 au 13/05** · `bilan_bookings` = **0** · `events` = **1**, dont **0 `challenge`** · **0 trigger** sur `bilan_slots`.
➡️ Le contrôle discriminant n'est pas « 7 lignes » mais « **7 lignes ET 7 liens toujours NULL** » : un backfill oublié garderait le compte **et** changerait les liens.
➡️ **Fixtures de demain** : tout challenge/créneau de test doit porter un nom **traçable** (préfixe `TEST-`) et entrer dans l'inventaire de purge du go-live. **Mieux** : si Catherine a créé son vrai challenge, **la démo se joue dessus** — le test est réel et il n'y a rien à purger.

---

## PROCHAIN LOT — dans l'ordre

### 1. RPC questionnaire post-inscription (débloque le critère ⑨)
La réponse « je veux mon bilan » du questionnaire doit créer **une demande dans la file de Catherine** — aujourd'hui elle part dans un JSON que **personne n'affiche**.

- **Une seule file** : la RPC écrit une ligne `bilan_bookings` (`slot_id = NULL`, `statut = 'en_attente'`).
- **Champ `bilan_offert` réactivé** dans `getPostRegistrationSteps` **pour le type `challenge` uniquement** (jamais pour tous les types — c'est l'erreur d'origine). Les options `BILAN_OFFERT_OPTIONS` existent déjà.
- **Elle lit `event_registrations`** pour `nom`, `prenom`, `telephone` (jamais le payload client — ça ferme le forgeage et fiabilise la clé de dédup).
- **`challenge_event_id` = l'événement de l'inscription** (pas la déduction générique : pendant le challenge, aucun challenge passé n'existe).
- ⚠️ **Et conditionné au TYPE de l'événement** (ajout du 11/09, @alcyone) : si l'événement de l'inscription n'est **pas** de type `challenge` → **REFUS**. Raison : la RPC est générique et `bilan_offert` **n'est pas** dans les clés rejetées des autres types (`precommande_offre`, `gaufre_salee`, `gaufre_salee_autre` seulement) → une inscription `event` ou `run_club` peut envoyer cette clé, et on créerait une demande de bilan **rattachée à un événement qui n'est pas un challenge**, ce que le brief interdit (l.27). **Pas de repli sur `fn_deduce_hors_date_challenge()`** sur ce chemin : cette déduction sert au chemin **public hors-date**, qui n'a **pas** d'inscription à rattacher.
  - **Contrôle associé** : après la RPC, **aucune ligne de `bilan_bookings` ne doit pointer vers un `events.type <> 'challenge'`** — à jouer en même temps que la recette ⑨.
- **`user_id = v_reg.user_id`** dans l'`INSERT` (ajout du 11/09, @vela + @alcyone) : sans lui, la ligne **n'appartient à personne** → dans l'espace membre, **l'annulation filtre la ligne** (`auth.uid() = user_id`) → **0 ligne, aucune erreur** : le membre lit « Annulé », la demande reste `en_attente` dans la file de Catherine, **et le créneau n'est pas rouvert** (le trigger `AFTER UPDATE` ne voit rien). Un invité (`user_id` NULL) reste non annulable — c'est cohérent, et ça se recette : **après annulation par un membre, relire la ligne (`statut = 'annule'`) ET le créneau (redevenu réservable)**.
- `date_rdv = today`, `heure_rdv = 00:00`, `notes = 'Demande via questionnaire post-inscription'` (les 5 colonnes `NOT NULL` sont `nom`, `prenom`, `telephone`, `date_rdv`, `heure_rdv`).
- **`origine = 'questionnaire'`** via le GUC de session : `set_config('pessora.bilan_origine', 'questionnaire', **true**)` — le trigger lit `current_setting('pessora.bilan_origine', true)`.
  ⚠️ **Le 3ᵉ argument `true` (`is_local`) n'est pas optionnel** : il limite la valeur à **la transaction**. Avec `false`, le réglage **persiste sur la connexion** — et comme PostgREST **pool** ses connexions, la requête suivante d'un **autre** client serait étiquetée « questionnaire ». Le trigger ne lit `origine` dans **aucune garde** (c'est descriptif) : la fuite serait donc **cosmétique, mais silencieuse** — des demandes mal étiquetées dans la file de Catherine, sans aucune erreur.
- **Critère de recette ⑫ (non-fuite du GUC)** — il ne se lit pas, il se **teste**, et **un seul contrôle ne prouve rien** (la requête suivante peut tomber sur une autre connexion du pool) : appeler la RPC, puis enchaîner **10 inserts REST directs d'affilée** → **les 10** doivent être étiquetés `visiteur` (plus une variante après une pause). Un critère qui ne peut pas échouer n'est pas un critère.
- **Absorber** `23505` (dédup) et `P0001` (rate-limit) avec un message clair — jamais une erreur brute.
- **La RPC est `SECURITY DEFINER`** : elle contourne les policies. Donc **elle pose elle-même** statut/date/origine, et **le chemin questionnaire n'hérite PAS de la règle J+7** (au moment du questionnaire, le challenge est en cours → la garde le refuserait lui-même). À écrire en commentaire, sinon quelqu'un « harmonisera » un jour et cassera le questionnaire.
- 🔴 **TROU VIVANT, PROUVÉ LE 11/09 — pas une dette** : un **visiteur** (REST anon) peut créer une ligne `bilan_bookings` avec `challenge_event_id` = un événement **`type='event'`** → mesuré : **201**, la valeur est **conservée telle quelle**. Mécanisme : le trigger ne **déduit** le challenge que si la valeur est **NULL** (`IF NEW.challenge_event_id IS NULL`) → une valeur **fournie par le client passe**, et le `WITH CHECK` de la policy ne regarde pas le type de l'événement. Conséquence : la règle portée par la **RPC** (`refus si l'événement de l'inscription n'est pas un challenge`) ne ferme **que le chemin questionnaire** — le chemin public reste ouvert, et le CR (« le bilan est toujours rattaché à un challenge ») n'est pas tenu.
- **Garde à poser DANS CE LOT** (même doctrine que le rattachement du créneau) : un trigger **`BEFORE INSERT OR UPDATE OF challenge_event_id`** sur `bilan_bookings` qui **refuse** si `NEW.challenge_event_id IS NOT NULL` et que l'événement n'est **pas `type = 'challenge'`**. **SQLSTATE `P0004`** (`23505`/`P0001`/`P0002`/`P0003` sont déjà pris) pour que la recette le nomme sans ambiguïté.
  - 🔴 **Deux exigences non négociables sur ce trigger** :
    - **`SECURITY DEFINER` + `SET search_path TO 'public'`** (comme le trigger de déduction). Sinon la garde interroge `events` **avec la RLS de l'appelant** : en `anon`, son `EXISTS` ne voit pas l'événement → elle **refuse des inserts parfaitement légitimes**. Une garde qui produit de **faux refus** est plus difficile à diagnostiquer qu'un trou.
    - **Le nom doit trier APRÈS `trg_bilan_booking_before_insert`** → **`trg_bilan_booking_guard_challenge_type`**. PostgreSQL déclenche les `BEFORE` **par ordre alphabétique du nom** : une garde nommée avant s'exécuterait sur `challenge_event_id = NULL` (valeur autorisée), **passerait**, et la déduction poserait ensuite son lien → la garde n'aurait **jamais validé la valeur déduite**. Corollaire honnête : **ce cas ne se mesure pas** (la déduction ne produit que des challenges valides) → la réponse est **le nom**, pas un critère de plus.
  - ⚠️ **DÉCISION (11/09, @nova + @alcyone) : `type` SEUL — PAS `active`.** `active` est un **réglage d'affichage** que Catherine bascule elle-même ; lier une **garantie d'écriture** à un **toggle** reproduirait le scénario du créneau orphelin : le jour où elle désactive un challenge terminé, les questionnaires **en cours** échoueraient **en silence**, chez de vrais clients, sur un formulaire qu'ils croient envoyé. L'invariant du CR est « rattaché à un **challenge** », pas « à un challenge visible ».
  - **La déduction, elle, garde `type='challenge' AND active=true`** : elle choisit un rattachement automatique, donc elle doit viser un challenge **vivant**. Les deux règles sont cohérentes : *déduction = vivant*, *garde = de type challenge*.
  - **Un questionnaire rempli pendant un challenge désactivé doit produire sa demande** — c'est Catherine qui arbitre dans sa file ; refuser perdrait une vraie demande.
  - **La garde tourne pour TOUS les rôles**, y compris `postgres` dans la RPC `SECURITY DEFINER` → après elle, **tout écrivain est validé**, déduction comprise.
  - **Aucun backfill** : `bilan_bookings` est **vide** (compté le 11/09).
- ⚠️ **Rappel structurel** : la clé étrangère ne référence que `events(id)`, **sans contrôle de `type`** — c'est ce qui rend la garde nécessaire, et c'est le même motif « une colonne, un seul écrivain » que le créneau orphelin du lot A.
- **Recette de cette garde** : POST anon avec `challenge_event_id` = un événement **non-challenge** → **refus `P0004`** · avec un challenge → **201** · **PATCH** d'une ligne vers un non-challenge → **`P0004`** (le `UPDATE OF` s'évalue sur la **liste `SET` du statement**, pas sur ce qu'un `BEFORE` réécrit ensuite — **à mesurer, pas à déduire**) · **annulation par un membre → relire la ligne (`statut = 'annule'`) ET le créneau (redevenu réservable)**, jamais le message de l'interface · puis `SELECT count(*) FROM bilan_bookings b JOIN events e ON e.id = b.challenge_event_id WHERE e.type <> 'challenge'` → **0**.
- 🔒 **CRITÈRES DE RECETTE DU LOT (contre-signature @vela — la liste de référence, à jouer telle quelle après application)** :
  1. **anon → `challenge_event_id` = événement `type='event'`** : refus **`P0004`** (aujourd'hui : **201** — c'est le trou prouvé du 11/09) ;
  2. **anon → `challenge_event_id` = challenge valide** : **201** (la garde ne doit pas produire de faux refus — d'où le `SECURITY DEFINER`) ;
  2bis. 🔴 **NON-RÉGRESSION DU CHEMIN NORMAL (le plus important, et le plus facile à casser)** : une réservation **par créneau** (le parcours public habituel, `slot_id` renseigné) doit toujours rendre **201**, et le créneau passer `disponible = false`. ⚠️ La garde ne doit **refuser que** `challenge_event_id IS NOT NULL AND type <> 'challenge'` : elle doit **laisser passer `NULL`** — sinon elle casse la réservation par créneau (dont le lien peut être **NULL** si le créneau est orphelin) et le formulaire public avec. C'est le critère à jouer **avant** les autres : un correctif qui casse le parcours le plus courant est pire que le trou qu'il ferme ;
  3. **`PATCH` d'une ligne vers un non-challenge** → **`P0004`** (comportement `UPDATE OF` **mesuré**, pas supposé) ;
  3bis. **`challenge_event_id` = un uuid qui n'existe pas** → **`P0004`** : le `type` lu vaut alors `NULL`, et `NULL IS DISTINCT FROM 'challenge'` est **vrai** → refus ✅ (un `<> 'challenge'` aurait laissé passer — c'est la différence que la garde doit avoir). À jouer, c'est gratuit et ça prouve que la garde ne se contente pas des événements connus ;

  4. **croisement** `SELECT count(*) FROM bilan_bookings b JOIN events e ON e.id = b.challenge_event_id WHERE e.type <> 'challenge'` → **0** ;
  5. **dédup par téléphone** : 2ᵉ demande, même numéro **dans un autre format** → **`P0002`** ;
  6. **annulation par le membre** → relire **la ligne** (`statut = 'annule'`) **ET le créneau** (redevenu réservable) — pas le message de l'interface ;
  7. **⑫ non-fuite du GUC** : après un appel RPC **réel**, **10 inserts REST consécutifs** tous étiquetés `visiteur` (+ variante après une pause, + variante **après échec/rollback**) ;
  8bis. 🔴 **Conséquence non évidente à vérifier** : l'`INSERT` de la RPC traverse **le même trigger `BEFORE INSERT`** que le parcours public → donc le questionnaire **hérite** de la dédup (`P0002`), du rate-limit (`P0001`) et du contrôle de téléphone (`P0003`). Cas à jouer : **une 2ᵉ demande pour une personne qui a déjà une demande en attente → `P0002`, message propre, jamais une erreur brute** (le front mappe bien `P0001`→`P0004`, vérifié). Un chemin « de confiance » n'est pas un chemin sans garde : c'est le même trigger pour tout le monde.
  8. **⑨** : demande créée via le questionnaire → `origine = 'questionnaire'` **et** `challenge_event_id` = l'événement de l'inscription, visible dans l'onglet « Demandes » ;
  9. **contrôle STRUCTUREL (comportement non mesurable, dépendance vérifiable)** : le **dernier** trigger `BEFORE INSERT` de `bilan_bookings` en ordre alphabétique doit être la garde — `SELECT tgname FROM pg_trigger WHERE tgrelid='public.bilan_bookings'::regclass AND NOT tgisinternal AND (tgtype & 2)=2 AND (tgtype & 4)=4 AND tgenabled <> 'D' ORDER BY tgname;` (⚠️ pas `tgtype = 7` : la garde sera **`INSERT OR UPDATE`**, donc **23** → un filtre exact donnerait un **faux rouge permanent**) ;
  10. **sortie de recette** : retour **au baseline, à l'identique** — **8 inscriptions (dont 7 `TEST*` héritées, celles de la purge go-live) / 7 créneaux / 1 événement (type `event`) / 0 booking**.
      ⚠️ **Deux critères différents, à ne pas confondre** : la **recette** exige le **retour au baseline** (les 7 `TEST*` historiques sont toujours là — les compter comme un échec serait un critère mal calibré, vécu le 11/09) ; c'est la **purge go-live** qui exige **`TEST-%` = 0**.
- **Recette ⑨** : après une demande via questionnaire → `origine = 'questionnaire'` **et** `challenge_event_id` = l'`event_id` de l'inscription, **et** la ligne apparaît dans l'**onglet « Demandes »** de `AdminBilans` avec son origine **lisible**.

### 2. Edge function « notification admin » (demandes hors-date)
Pattern `send-contact-email` / Resend. Elle **lit** les demandes en attente et **envoie l'e-mail** — elle n'écrit pas dans la table (c'est la RPC qui écrit). Contenu : nom, prénom, téléphone, origine, challenge.

### 3. `X-Robots-Tag` par chemin (`vercel.json`)
Dernier « petit » en suspens depuis plusieurs sessions (item 14 de la checklist go-live). Ordre impératif : (1) headers par chemin, (2) vérification **chemin par chemin**, (3) **ensuite seulement** lever le `noindex` global, puis régénérer le sitemap.

### 4. Lot `profils` — bug actif (migration séparée)
Un membre modifie son profil → l'interface dit « enregistré », **rien n'est écrit** (prouvé en live : `PATCH` → **204**, valeur inchangée). **5 profils sur 5** n'ont aucun numéro exploitable → c'est ce qui vide le pré-remplissage du téléphone à l'inscription.

- **Trigger `BEFORE INSERT OR UPDATE`** (pas UPDATE seul : `profiles_insert_own` existe en base et permet `role='admin'` sur une ligne absente).
- **Colonnes protégées** : `role`, `stripe_customer_id`, `email`, `created_at`/`updated_at`. Modifiables : `first_name`, `last_name`, `phone`, `avatar_url`, `preferences`, `admin_ui_prefs`.
- ⚠️ **« Policy self-update sans `role` » n'est pas exprimable en RLS** (la RLS est au niveau ligne, pas colonne) — d'où le trigger. Et **ne pas** révoquer la colonne à `authenticated` : Catherine EST `authenticated`.
- **La self-SELECT existe** (`GET profiles` en membre → 200) → le contrôle de lignes côté client est possible.
- **Règle des 9 chiffres** aussi sur le **formulaire de profil** (4ᵉ endroit) — module partagé `phone.ts`.
- **Recette** : `PATCH {"role":"admin"}` → rôle inchangé · `PATCH {"phone":"…"}` → **écrit pour de vrai** · non-régression : Catherine change un rôle depuis l'admin → ça marche toujours.

### 5. Passe conformité (après le lot A, en une fois)
- **Mentions légales** : raison sociale = *Catherine EDOUARD, entrepreneur individuel, enseigne PessÓra* · forme juridique = *Entrepreneur individuel* · **SIRET 941 411 159 00010** (absent aujourd'hui) · **directeur de la publication** = Catherine EDOUARD · **hébergeur** = *Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis* · adresse **légale** = le siège (`OSMAN NADEAU, RAVINE VILAINE, 97200 Fort-de-France`) — Cluny reste l'adresse **commerciale**.
- **⚠️ 17 occurrences de `pessora.fr@gmail.com`** (relevé du 11/09 : **12 fichiers**, `docs/` comprise) à remplacer par **`pessora.mq@gmail.com`** (décision de Ken) : `src/data/infoData.ts`, `CGV.tsx` (×2), `MentionsLegales.tsx` (×2), `PolitiqueConfidentialite.tsx` (×2), `AdminInfosBar.tsx` (placeholder), `send-contact-email/index.ts:63` (fallback en dur), `.env.example`, `docs/` (×3), **`template/client.config.ts`**. La base porte déjà la bonne adresse (`bar_settings.email`) → le site et le chatbot se contredisent aujourd'hui.
- **`template/client.config.ts` contient les coordonnées réelles de Catherine** (adresse du bar, lien Maps, email) → **tout doit devenir placeholder** (`contact@exemple.fr`, `00000`, Maps vide). Sinon chaque futur client publie les coordonnées d'un autre commerce. Critère : **zéro coordonnée réelle dans `template/`**.
- **Crédit footer** « Site réalisé par Karibloom » (avec l'accord de Catherine) — ligne typo fine, intégrée à la ligne légale.
- **Franchise de TVA** : la mention « **TVA non applicable, art. 293 B du CGI** » doit remplacer tout « **TTC** » ambigu. ⚠️ Il n'y en a **pas seulement dans les mentions légales** : le relevé live en trouve aussi dans **`/cgv`** (page où le client lit ses droits). Mesuré en rendu navigateur, pas dans le HTML brut.
- **`/confidentialite` ne porte AUCUNE adresse de contact** (page de 888 caractères, zéro e-mail) — or c'est la page où l'on exerce ses droits RGPD : y mettre **la même adresse arbitrée** que les mentions légales, sinon le droit d'accès n'a pas de voie affichée.
- **Les 4 `[À compléter]` visibles en production** (relevé live de `/mentions-legales`) : *Forme juridique*, *Directeur de la publication*, *Hébergeur*, *Adresse* (celle de l'hébergeur). Les autres pages légales (`/cgv`, `/confidentialite`, `/contact`) sont propres.
- 🔒 **Critères de recette de cette passe (contre-signature @vela — écrits AVANT la passe, pas après)** :
  1. **zéro occurrence de l'ancienne adresse dans TOUT le repo**, `docs/` comprise (`grep -rn` sur la racine, hors `node_modules`). ⚠️ **Ce critère est aujourd'hui INATTEIGNABLE tel qu'écrit** : le doc de consignes **et** la checklist go-live la citent eux-mêmes (relevé du 11/09 : **17 occurrences dans 12 fichiers**). Donc **on masque l'adresse dans les documents de pilotage** (`pessora[.]fr@gmail.com`) et le critère reste **absolu** — on ne l'affaiblit pas en « hors docs », sinon un oubli réel s'y cacherait ;

  2. **`template/client.config.ts` ne contient plus AUCUNE coordonnée réelle** de Catherine — ni adresse, ni lien Maps, ni e-mail, **ni Instagram, ni domaine, ni logo** (relevé : **14 lignes** marquées « ⟶ À CHANGER » : `brand`, `legalName`, `street`, `fullAddress`, `mapsUrl`, `email`, `instagram`, `instagramUrl`, `baseUrl`, `defaultTitle`, `ogImage`…). ⚠️ **Précision du critère** : il porte sur les **valeurs**, pas sur les commentaires — les commentaires d'exemple (« Base de référence : PessÓra ») restent légitimes, sinon le critère est lui aussi inatteignable ;

  3. **chaque valeur légale est vérifiée contre la fiche INSEE/INPI**, jamais contre notre propre rédaction (SIRET `941 411 159 00010`, siège ≠ Cluny, forme juridique) ;
  4. les pages légales sont contrôlées **rendues en live** (mentions légales, CGV, confidentialité) — pas seulement présentes dans le code : une page peut être écrite et ne jamais s'afficher ;
  5. **médiateur conditionnel** : tant que Catherine n'a pas désigné le sien, on ne met **rien** — jamais un médiateur inventé ou générique (une désignation fausse est pire qu'une absence) ;
  6. **et l'écart repo↔base est vérifié à la fin** de la passe : toute valeur corrigée doit exister **dans le repo ET en base** (ici la base porte déjà `bar_settings.email = pessora.mq@gmail.com` → le code doit la rejoindre, pas l'inverse).
  7. 🔴 **ET la fonction DÉPLOYÉE — pas seulement le repo** (trouvé par @alcyone, 11/09) : l'ancienne adresse est **codée en dur dans `send-contact-email`** (2 occurrences : le `from:` **et** le `to:` de repli). Donc remplacer les 17 occurrences **ne suffit pas** : il faut **redéployer la fonction**, sinon l'adresse **survit en production** et la passe rend un **faux vert**. Le contrôle se fait sur le **déployé** (version + `verify_jwt`), jamais sur le seul fichier du repo — c'est la même leçon que « les migrations ne sont pas la source de vérité de la base ».
- **Médiateur de la consommation** : obligatoire (L612-1 · L616-1/R616-1 · amende L641-1 jusqu'à 3 000 €). **C'est Catherine qui le désigne** → coordonnées à inscrire sur le site **et** dans les CGV dès qu'elle répond.
- **Newsletter conforme** : colonne `token uuid DEFAULT gen_random_uuid()`, **fonction de désinscription dédiée en `verify_jwt = false`** (déployée **nommément**), **`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`**, réponse **sans PII**, idempotente, rate-limitée. **DMARC absent** : `_dmarc.pessora.fr TXT "v=DMARC1; p=none"` (chez OVH). ⚠️ L'apex a un SPF **strict** (`include:mx.ovh.com -all`) → aucun envoi depuis `@pessora.fr` hors Resend.

---

## DETTE ÉCRITE (ne pas confondre avec « à faire »)

- **~25 tables** portent le `GRANT ALL` hérité Supabase (INSERT/UPDATE/DELETE pour `anon`/`authenticated`) protégées **uniquement par l'absence de policy**. Non exploitable aujourd'hui. **Priorité avant la bascule Stripe live** : `orders`, `order_items`, `subscriptions` (données d'argent) → `profiles` (avec son lot) → le reste. À traiter **avec le test de la vraie action**, jamais en relisant les `GRANT`.
- **`bilan_slots` garde son `GRANT ALL`** alors que `bilan_bookings` est resserré → asymétrie assumée, à ne pas confondre avec « les deux tables sont protégées pareil ».
- **Les 2 vues `v_pessobot_*`** portent INSERT/UPDATE/DELETE sans objet : testé en anon → **aucun contournement de RLS** (`42501` / ligne intacte). Privilèges à nettoyer, pas un trou.
- **`P0002`/`P0003` sortent en HTTP 500** (PostgREST ne connaît pas ces codes) → le front mappe sur **`error.code`**, jamais sur le statut HTTP ni sur le texte du message.
- **« Saisie manuelle au bar »** : la policy le permet (`Admins manage bilan_bookings`, `ALL`), **aucun écran ne le propose**. Manque de fonctionnalité, pas une régression. Si un jour un écran admin insère : poser `statut = 'confirme'` (hors du prédicat de l'index de dédup → aucune friction).
- **`bilan_slots` n'a pas de lien vers un événement** pour les créneaux historiques : les 7 créneaux legacy sont orphelins (dates passées).
- **Notification e-mail des demandes hors-date** : à ne câbler qu'avec la borne (rate-limit + dédup en base) — sinon un visiteur peut remplir la boîte de Catherine.

---

## EN ATTENTE DE CATHERINE (rien à coder)

1. **Sa carte complète** (catégorie + prix par produit) → débloque les 3 catégories (MEGA THÉ / PROTEIN SHAKE / COFFEE), les prix (Mega Thé 600 cl 10 €, Shake Grand 14 €), le moteur Formules, et PessoBot v2. **C'est le plus gros morceau restant.**
2. **Son médiateur de la consommation.**
3. **Son accord** pour le crédit footer.
4. **Le lien Easy Ta Vie.**
5. **La recette du module « Bilan » dans son admin** (elle est la seule à pouvoir juger).

---

## GO-LIVE — voir `docs/CHECKLIST-GO-LIVE-PESSORA.md`

Purge des données de test (8 inscriptions `TEST-VELA`, comptes QA, lignes `cs_test_…`, fixtures) · bascule **Stripe live** · `ADMIN_EMAIL` → `pessora.mq@gmail.com` · **compte admin réel** de Catherine (aujourd'hui `admin@pessora.mq` fictif + mot de passe faible) · **lever le noindex** (après les `X-Robots-Tag`) · **PAT Supabase expire le 16/11/2026**.
