# BRIEF — LE FORMULAIRE DU CHALLENGE DOIT SUIVRE LA FICHE 21 JOURS

**Écrit le 14/09/2026 par @elise, sur consigne de Ken :**
> *« Il faut pas "combien d'inscrit la personne ramène" par exemple. **Il faut reprendre les questions
> de la fiche challenge 21 jours.** »*

**Source de vérité** : `docs/fiche-papier-challenge-21j.md` — la fiche papier que Catherine utilise
**au bar** pour recruter. C'est **elle** qui définit les questions, pas nous.

**Vérifié sur `origin/main` = `6bc79e2`.**

---

## ⚠️ Ce que ce brief remplace

Le `PLAN-13-09.md` posait la question ⒜ : *« deux formulaires, ou un seul ? »* et proposait
**« on unifie la partie commune »**. **Cette proposition est annulée.** Le formulaire du challenge
**doit différer** de celui d'un événement habituel — **c'est la consigne de Ken, et la fiche le
prouve** : un challenge est **individuel** (on ne « vient » pas à plusieurs), il a **son** objectif,
**son** timing de démarrage, **son** créneau de rappel.

---

## 1. Ce qui est affiché aujourd'hui

`src/components/events/ChallengeRegistrationCard.tsx` — **6 champs** :

| Champ | Ligne | Valeur par défaut | Verdict |
|---|---|---|---|
| `prenom` | 185 | — | ✅ garder |
| `nom` | 192 | — | ✅ garder |
| `telephone` | 201 | — | ✅ garder |
| **`nb_personnes`** | **19, 59, 88, 211-217** | **« Je viens seul »** | ❌ **RETIRER** |
| **`souhait_info`** | **20, 60, 89, 230-243** | **« Non merci »** | ❌ **REMPLACER** |
| `privacyAccepted` | 250 | — | ✅ garder |

**Et les étapes post-inscription** (`src/data/postRegistrationSurvey.ts:5`) :
`challenge` → `['bilan', 'objectif']` · les autres types → `['objectif']`.

---

## 2. Les questions de la FICHE, et ce qu'il en manque

### TES INFORMATIONS

| Fiche | Dans le code ? |
|---|---|
| Nom · Prénom | ✅ |
| **Âge** | ❌ **absent** |
| Téléphone | ✅ |
| **Que fais-tu dans la vie ?** | ❌ **absent** |

### TON BILAN BIEN-ÊTRE

| Fiche | Dans le code ? |
|---|---|
| ☐ Je souhaite réaliser un bilan bien-être | ✅ (`bilan_offert`) |
| **Mon objectif** — 4 options | ⚠️ **PRÉSENT MAIS FAUX** — voir §3 |

### CHALLENGE 21 JOURS

| Fiche | Dans le code ? |
|---|---|
| ☐ Je souhaite participer au Challenge 21 jours | ✅ (l'inscription elle-même) |
| Les 6 éléments inclus | ✅ (contenu de page) |
| **Quand souhaites-tu commencer ?** — *Ce mois-ci · Le mois prochain · Je souhaite en savoir plus* | ❌ **absent** → **c'est ce qui doit remplacer `souhait_info`** |

### COMPLÉMENT DE REVENUS

| Fiche | Dans le code ? |
|---|---|
| ☐ Oui, découvrir l'opportunité / ☐ Pas pour le moment | ❌ **absent** *(c'est l'item ② du plan)* |

### QUAND PEUT-ON TE RECONTACTER ?

| Fiche | Dans le code ? |
|---|---|
| ☐ Matin · ☐ Midi · ☐ Après-midi · ☐ Soir | ❌ **absent** |

---

## 3. ⚠️ Les objectifs : une seule option sur quatre correspond

**Dans le code** (`postRegistrationSurvey.ts:21-27`) :
```
Découverte / curiosité · Remise en forme · Perte de poids · Bien-être et lien social · Autre
```

**Dans la fiche** :
```
Perte de poids · Prise de masse / tonification · Plus d'énergie · Reprendre de bonnes habitudes
```

**Une seule est commune** (*Perte de poids*). **Trois manquent**, et **quatre options du code ne
viennent pas de la fiche.**

⚠️ **ET LA RÈGLE QUI VA AVEC** (`docs/CONSIGNES-CLAUDE.md:153`) : **on stocke la CLÉ, pas le libellé.**
Parce que le libellé change — et on est justement en train de le changer.
Donc `'perte_de_poids'`, `'prise_de_masse'`, `'plus_energie'`, `'bonnes_habitudes'` — **pas** les
libellés affichés.

---

## 4. ⚠️ LE PIÈGE SERVEUR — à lire avant d'écrire une ligne

`supabase/migrations/20260912120000_retrait_precommande_gaufres_rpc.sql` — RPC
`fn_save_post_registration_survey(p_registration_id, p_telephone, p_payload jsonb)`.

**Ce n'est PAS une liste blanche** — *j'ai vérifié, et c'est important* : le RPC **rejette 4 clés
obsolètes** (`precommande_offre`, `gaufre_salee`, `gaufre_salee_autre`, `gaufre_sucree_notes`), **et
accepte tout le reste.** Donc **ajouter `age`, `profession`, `timing_demarrage`,
`creneau_rappel`, `complement_revenus` ne demande AUCUNE migration** — le `jsonb` les prend. ✅

**⚠️ Mais deux clés sont EXIGÉES, et leur absence fait échouer la soumission :**

| Condition | Erreur si absente |
|---|---|
| `bilan_offert` (pour un challenge) | `missing_bilan_offert` — P0001 |
| `objectif_principal` (**tous types**) | `missing_objectif_principal` — P0001 |

**Donc : en retirant `nb_personnes` et en remplaçant `souhait_info`, on ne doit toucher NI à
`bilan_offert` NI à `objectif_principal`.** Le reste est libre.

**⚠️ Et la règle du 12/09 tient** *(RESTES item 24)* : *exiger une clé côté serveur, c'est dépendre
d'une étape rendue côté front ; si l'étape tombe, la soumission tombe — au submit, **sans erreur
visible**.* C'est **exactement** la panne du 10/09.

**⚠️ Et l'ordre compte** *(scan du 14/09)* : **la migration passe AVANT le merge du front** — l'ordre
inverse fait échouer **toute** soumission RUN CLUB.

---

## 4-bis. 📄 LE FICHIER DE MÉTIERS EST DANS LE DÉPÔT

**`public/data/metiers-rome.json`** — **14 619 libellés**, servi statiquement à **`/data/metiers-rome.json`**.

**Source** : **ROME 4.0** de **France Travail** (Répertoire Opérationnel des Métiers et des Emplois),
extrait du jeu de données officiel `data.gouv.fr`. **Licence Ouverte (`fr-lo`)** — usage commercial
autorisé, aucune attribution obligatoire.

**Format** : `[{"label": "Maçon / Maçonne", "rome": "F1703", "src": "fiche"}, …]`

| `src` | Nombre | Ce que c'est |
|---|---|---|
| `fiche` | **1 911** | le libellé officiel d'une fiche métier — **la couverture métier complète** |
| `principale` | **322** | une appellation principale rattachée à une fiche |
| `synonyme` | **12 386** | les autres appellations (« Mareyeur », « Accastilleur »…) |

**Poids** : **1 236 Ko brut · 168 Ko gzippé.** → ⚠️ **à charger À LA DEMANDE** (au premier clic dans
le champ), **jamais dans le bundle initial.**

### ⚠️ LA RÈGLE DE TRI — elle décide de l'utilité du champ

**N'afficher que les 14 619 dans l'ordre alphabétique rendrait le champ inutilisable** : quelqu'un qui
tape « maçon » recevrait *Maçon-limousinant · Maçon-boiseur · Maçon-carcasseur · Maçon-plâtrier…*
**Trente propositions découragent au lieu d'aider.**

**Donc on trie par `src`, on ne coupe PAS la liste :**

1. `fiche` et `principale` d'abord (**2 233 entrées** — ce sont les vrais métiers) ;
2. `synonyme` **en secours** — c'est ce qui permet de trouver en tapant *« accastilleur »*,
   *« mareyeur »*, *« bûcheron »* ;
3. **8 résultats affichés au maximum**.

**Couper la liste ferait perdre les mots rares — qui sont exactement ce qu'une autocomplétion doit
rattraper.** Garder les 14 619 et **trier** est la seule forme qui marche dans les deux cas.

### ⚠️ Ce que le fichier NE couvre PAS

**Le ROME est national.** Quelques métiers très locaux n'y figurent pas — **« coupeur de canne »**
n'existe pas *(son « canneur » est un rempailleur de chaises : autre métier)*.
**Vérifié en revanche : présent** — maçon, plombier, coiffeur, infirmier, aide-soignant, vendeur,
caissier, chauffeur, cuisinier, serveur en restauration, paysagiste, menuisier, électricien, peintre
en bâtiment, mécanicien, barman, pâtissier, boucher, jardinier, pompier, gendarme,
**planteur de bananes, opérateur en distillerie, marin-pêcheur, matelot de pêche.**

**Si on veut les métiers locaux manquants, il faut les ajouter à la main — et sourcés, pas inventés.**

---

## 5. Le geste, dans l'ordre

1. **Retirer `nb_personnes`** — les 4 occurrences (`l.19, 59, 88, 211-217`). ⚠️ Vérifier qu'aucun
   écran admin ni aucun export CSV ne le lit avant de le sortir du schéma.
2. **Remplacer `souhait_info`** par *« Quand souhaites-tu commencer ? »* — **3 options de la fiche**.
3. **Aligner `OBJECTIF_OPTIONS`** sur les **4 objectifs de la fiche**, **en clés** (pas en libellés).
4. **Ajouter** : âge · profession · les **4 créneaux de rappel**.
5. **Ajouter le complément de revenus** — c'est l'item ②, avec **les 5 portes du consentement**.
6. **Poser la lisibilité** au même passage : `text-black/45` → **≥ 60 %**. ⚠️ **Le token `labelBase`
   existe EN DOUBLE** (`eventEditorTypes.ts:57` **et** `AdminHomeBanner.tsx:11`) — corriger les deux.

---

## 6. ⚠️ DÉCISIONS DE KEN — 14/09/2026

| Question | Décision |
|---|---|
| **L'âge** | **Facultatif** — avec une option explicite **« Je ne veux pas renseigner »** |
| **« Que fais-tu dans la vie ? »** | **Champ libre**, avec **auto-remplissage** |
| **Le créneau de rappel** | ⏳ **« Je ne sais pas »** → **à demander à Catherine** (voir §7) |
| **Les 4 options du code qui ne viennent pas de la fiche** | ⏳ **Ken a demandé la différence** (voir §8) |

### ⚠️ Deux implications techniques, immédiates

**⒜ « Je ne veux pas renseigner » n'est PAS un champ vide.** C'est **une valeur explicite**, distincte
de « non rempli ». C'est la bonne décision : une donnée absente qui **veut dire** un refus n'est pas
la même chose qu'une absence. **Donc la clé stockée doit être du type
`'non_renseigne'`** — **jamais** une chaîne vide, sinon les deux cas redeviennent indiscernables.
*(Même règle que pour le consentement : une donnée doit pouvoir être racontée à voix haute.)*

**⒝ ⚠️ CORRECTION — « auto-remplissage » veut dire AUTOCOMPLÉTION, pas pré-remplissage.**
*(précision de Ken, 14/09 : « quand la personne commence à taper "med", ça écrit médecin »)*

**Ma première lecture était fausse** : j'avais compris « pré-remplir le champ depuis le profil du
compte ». **Ce n'est pas ça.** Il s'agit d'une **liste de suggestions qui s'ouvre pendant la frappe.**

**Ce que ça implique, et qui n'existe pas aujourd'hui** : une autocomplétion **a besoin d'un
dictionnaire de métiers**. Il n'y en a **aucun** dans le projet. Trois voies possibles :
1. **une liste statique** de métiers courants (ordre de grandeur : 50-100 entrées) — la plus simple,
   **aucune dépendance**, et suffisante pour un champ de qualification ;
2. **une API de suggestion** — ⚠️ coût réseau *et* **fuite de frappe** (chaque lettre part chez un
   tiers, et c'est une donnée personnelle en cours de saisie) ;
3. **l'autocomplétion native du navigateur** (`autocomplete="organization-title"`) — ⚠️ **elle ne
   propose pas « médecin » à partir de « med »** : elle restitue ce que **le navigateur** a déjà
   mémorisé. **Ça ne répond pas à la demande** si la liste doit être la même pour tout le monde.

**👉 Recommandation : la première** (liste statique locale). Et la règle de la salle tient
*(RESTES, §B)* : **valider la donnée AVANT de la réutiliser** — une valeur non validée qui remonte
d'une inscription à l'autre se propage sans contrôle.

⚠️ **Point à trancher** : la saisie reste-t-elle **libre** (on peut écrire « prof de danse » sans que
ça soit dans la liste), ou faut-il **choisir dans la liste** ? La première est plus juste, la seconde
donne une donnée exploitable. **Ce n'est pas la même colonne dans l'admin.**

---

## 7. ⏳ Le créneau de rappel — à demander à Catherine, pas à trancher ici

**Pourquoi on ne peut pas décider à sa place** : la question est *« quand peut-on te recontacter ? »* —
**et c'est Catherine qui appelle.** Le sens de la réponse dépend **entièrement de ce qu'elle en fait** :

- **si c'est une préférence** → elle appelle quand ça l'arrange, la donnée est **indicative** ;
- **si c'est une contrainte** → elle doit appeler **dans ce créneau**, sinon **elle perd le contact**.

**Les deux lectures produisent le même champ et deux usages opposés.** Et dans le second cas, un
créneau mal rempli = **un appel qui ne passe pas = une inscription perdue.**

**Pourquoi c'est dans SA liste** : elle est la seule à savoir **quand elle appelle**. Une préférence
« matin » collectée sur un site, pour une commerçante qui ouvre son bar le matin, ne décrit peut-être
**aucun moment réel** où elle décroche.

**👉 À ajouter à « en attente de Catherine »** (avec la carte, le médiateur, le lien Easy Ta Vie) :
**« le créneau de rappel, c'est une préférence ou une contrainte pour toi ? »**

---

## 8. ✅ LES OBJECTIFS — Ken a tranché : **on change**

> *« Je veux les mêmes trucs que la fiche, donc on va faire des cases "perte de poids" etc comme sur
> la fiche. **Donc on change.** »* — Ken, 14/09/2026

**Décision : les 4 objectifs de la fiche REMPLACENT les 5 du code. Ce sont des CASES.**

| | **Code aujourd'hui** (`postRegistrationSurvey.ts:22-26`) | **La fiche — ce qu'on fait** |
|---|---|---|
| | Découverte / curiosité | ❌ retiré |
| | Remise en forme | ❌ retiré |
| 1 | Perte de poids | ✅ **Perte de poids** |
| | Bien-être et lien social | ❌ retiré |
| | Autre | ⏳ *à confirmer — voir ci-dessous* |
| 2 | — | ✅ **Prise de masse / tonification** |
| 3 | — | ✅ **Plus d'énergie** |
| 4 | — | ✅ **Reprendre de bonnes habitudes** |

**Et la clé stockée suit la règle déjà posée** (`docs/CONSIGNES-CLAUDE.md:153`) : **on stocke la CLÉ,
pas le libellé** — `perte_de_poids`, `prise_de_masse`, `plus_energie`, `bonnes_habitudes`. Le libellé
changera encore ; la clé, non.

### 🔴 ⚠️ UNE CONTRADICTION À TRANCHER AVANT DE CODER

**La fiche pose 4 cases. Le serveur exige UN objectif.**

`fn_save_post_registration_survey` lève **`missing_objectif_principal` (P0001)** si
`objectif_principal` est vide — **au singulier**. Or la fiche laisse **cocher plusieurs cases** (quatre
`☐` indépendants, pas un `○`).

**Donc deux formes possibles, et elles ne produisent pas la même colonne dans l'admin :**

- **(a) Choix UNIQUE** *(boutons radio)* → une seule case cochée → `objectif_principal` reçoit
  directement la valeur. **Simple, et compatible avec le serveur tel qu'il est.**
- **(b) Choix MULTIPLE** *(cases à cocher)* → il faut **décider ce qui va dans `objectif_principal`**
  (la première cochée ? une case « objectif principal » distincte des autres ?), et **stocker les
  autres ailleurs** dans le `jsonb`. Sinon la 2ᵉ et la 3ᵉ case sont **perdues** — et Catherine voit
  **un seul** de ses objectifs.

⚠️ **Et c'est une décision de MÉTIER, pas de code** : sur la fiche papier, une personne qui coche
« perte de poids » **et** « plus d'énergie » a **un** objectif principal et **un** secondaire —
**ou deux objectifs** ? **Ken / Catherine le savent ; le code ne peut pas le deviner.**

### ✅ DÉCISION — un seul objectif *(14/09/2026)*

**Ce qu'on code : UN SEUL objectif, en boutons radio.** Les 4 objectifs de la fiche, **un choix**.

**Les trois raisons, dans l'ordre d'importance :**

1. **Sa fiche dit « Mon objectif » — au singulier.** C'est **son** document. Si elle avait voulu
   plusieurs, elle aurait écrit « Mes objectifs ».
2. **La liste contient une contradiction** : « Perte de poids » et « Prise de masse / tonification »
   **s'opposent**. Cochées ensemble, elles produisent **une donnée que Catherine ne peut pas
   utiliser** — elle ne saura pas s'il faut un shake minceur ou un shake protéiné.
3. **La règle de la donnée racontable** : « Perte de poids » → elle sait quoi dire. « Perte de poids
   + énergie + habitudes » → **elle ne sait plus lequel est le vrai.**

**⚠️ On ne bloque PAS sur la réponse de Catherine.** Le cas unique est codé maintenant *(c'est ce que
sa fiche dit et ce que le serveur attend)*. Si sa réponse est « je note tout », **on ajoutera un
objectif secondaire facultatif** — le `jsonb` l'accepte **sans migration**.

**📩 La question part quand même dans sa liste — elle AFFINE, elle ne BLOQUE pas :**
> **« Quand quelqu'un coche plusieurs cases sur ta fiche, tu fais quoi ? »**

*(Et c'est la bonne formulation : elle remplit ces fiches au bar depuis des mois — **sa pratique EST
la règle**, on n'a pas à l'inventer.)*

---

## 9. Ce que ce brief NE tranche PAS

*(les 4 questions de la première version — mises à jour du 14/09)*

- **L'âge** → ✅ **TRANCHÉ** : facultatif, avec « Je ne veux pas renseigner ».
- **« Que fais-tu dans la vie ? »** → ✅ **TRANCHÉ** : champ libre + **autocomplétion** *(⚠️ voir §6 ⒝)*.
- **Les options d'objectif** → ✅ **TRANCHÉ** : les 4 de la fiche remplacent celles du code *(§8)*.
  ⏳ **Reste** : une case ou plusieurs ? *(§8, la contradiction serveur)*
- **Le créneau de rappel** → ⏳ **à Catherine** (§7).

---

*@elise — 14/09/2026. Source : `origin/main` = `6bc79e2`. Fiche : `docs/fiche-papier-challenge-21j.md`.
Détail du plan : `docs/PLAN-13-09.md`. État vérifié : `docs/VERIF-ITEMS-2026-09-14.md`.*

---

# CE QUI MANQUE — état au 14/09/2026

## ⏳ De CATHERINE *(rien ne peut avancer sans elle)* — 7 points, plus 8 ⚠️ voir note

| # | Quoi | Ce que ça débloque |
|---|---|---|
| 1 | **La carte complète** (catégories + prix) | le moteur Formules, PessoBot v2 — **le plus gros reste** |
| 2 | **Le lien Easy Ta Vie** | la livraison (le site est en Click & Collect seul) |
| 3 | **Son médiateur de la consommation** | la mention CGV + footer — **obligation légale** |
| 5 | **Confirmer que 2 visuels sont de l'ancienne carte** | s'ils le sont : **on les retire**, on ne les complète pas |
| 6 | **« Quand quelqu'un coche plusieurs cases sur ta fiche, tu fais quoi ? »** | tranche objectif unique / multiple |
| 7 | **« Le créneau de rappel : une préférence ou une contrainte ? »** | le sens du champ (voir §7) |
| 8 | **Son accord pour le crédit footer** | à acter |

## ⏳ De KEN *(deux go)*

| # | Quoi | Pourquoi |
|---|---|---|
| 1 | **Le go pour le test d'en-tête** de la newsletter | c'est le seul geste **irréversible** |
| 2 | **Le go pour la purge des créneaux legacy** | ce sont peut-être les vrais créneaux d'avril de Catherine |

## ⏳ À TRANCHER *(Ken + métier, pas le code)*

| # | Quoi | Le fait |
|---|---|---|
| 1 | **Les créneaux de bilan s'écrivent depuis DEUX pages** (`AdminChallenge21j` **et** `AdminBilans`) | deux écrans, **une seule donnée** |
| 2 | **Deux chemins pour créer un challenge** (« Événements » **et** « Challenge 21j ») | deux formulaires pour un même objet |

## 🔨 De la TEAM

### Les 6 items du plan
① Formulaire *(ce brief)* · ② Complément de revenus · ③ Rubrique noire · ④ Rouge `conseils` ·
⑤ Accroche · ⑥ Newsletter — **aucun n'est terminé, aucun n'est cassé.**

### ⑦ AMÉLIORER LA PAGE BILAN (CRUD) — *correction de Ken, 14/09*

> *« Pas besoin de Catherine pour ça, on doit améliorer la page Bilan du CRUD en plus. »*

**⚠️ La première version de ce brief classait « la recette du module Bilan » comme une attente de
Catherine. C'ÉTAIT FAUX** — c'est un **chantier de dev**. La ligne vient de `CONSIGNES-CLAUDE.md:843`,
qui la rangeait dans « EN ATTENTE DE CATHERINE (rien à coder) » : **mal classée, à corriger aussi.**

**Ce que dit le code (`origin/main` = `6bc79e2`) :**

| Page | Ce qu'elle sait faire |
|---|---|
| **`AdminBilans.tsx`** | `createSlotAtSelected()` (`l.211-217`) → **UN créneau à la fois** (`date` + `heure`), au clic (`l.607`). **Aucune création en masse.** |
| **`AdminChallenge21j.tsx`** | **LE GÉNÉRATEUR EXISTE DÉJÀ** : `generateSlots` (`l.96-100`) → plage de dates, liste d'heures, jours à exclure, **déduplication**, et **un seul `INSERT` multi-lignes** (via `useAdminChallengeSlots.ts:47-51` / `lib/challengeSlotGenerator`). |

**⚠️ Donc : ce n'est pas une fonctionnalité à écrire, c'est un DÉPLACEMENT.** La page Bilan doit
récupérer ce que Challenge21j sait déjà faire.

**Le plan du 12/09 le disait déjà** (`docs/superpowers/specs/2026-09-12-admin-challenge-21j-crud-design.md`,
§B) :
> `AdminBilans.tsx` : `createSlotAtSelected()` insère **un** créneau à la fois… **Aucun moyen de
> peupler en une fois les ~14 jours de la fenêtre J-14→J.**

**Et ça ferme le doublon ① des arbitrages** : une fois le générateur dans Bilan, **`AdminChallenge21j`
perd les créneaux** et `AdminBilans` devient **seule maison de `bilan_slots`**.

### ⚠️ LE PIÈGE À TESTER, PAS À DÉDUIRE

Le générateur insère avec **`challenge_event_id` laissé à `NULL`** et compte sur le trigger
**`fn_bilan_slot_attach_challenge`** pour rattacher le créneau au challenge (fenêtre J-14→J).
**Le trigger s'applique à l'INSERT — donc il doit se déclencher depuis Bilan aussi.**
**À vérifier par une mesure, pas par lecture** : insérer depuis Bilan, puis relire
`challenge_event_id` en base.

### ✅ CE QUI EST DÉJÀ BON — ne pas le refaire *(vérifié 14/09 sur `6bc79e2`)*

**`AdminChallenge21j.tsx` est déjà conforme au plan du 12/09.** Son formulaire ne propose **que**
ce qui pilote réellement la page :

| Champ | Ligne | Rôle |
|---|---|---|
| **Titre** | `l.159` | le libellé du challenge |
| **Date de début** | `l.168` | pilote le minuteur **et** la fenêtre de réservation J-14→J |
| **Actif (visible publiquement)** | `l.183` | ouvre/ferme le challenge |
| `registration_open` | `useAdminChallenges.ts:47,62` | ouvre/ferme les inscriptions |

**Pas d'image, pas de lieu, pas de description, pas de capacité, pas de prix** ✅
Et le hook n'écrit que ça : `{ type: 'challenge', title, date, slug, active, registration_open }`.

**Les trois briques du plan sont en place** : **A** édition (`useAdminChallenges`) · **B** créneaux
en masse (`generateSlots`, `l.100`) · **C** inscrits enrichis — avec les colonnes **Prénom · Nom ·
Téléphone · Créneau bilan · Objectif · Complément revenus · Date d'inscription** (`l.303`).

### ⚠️ DONC LE VRAI CHANTIER : LE FORMULAIRE D'ÉVÉNEMENT, PAS LE CRUD DÉDIÉ

**Le « CRUD challenge 21 » à changer, c'est celui d'`AdminEvenements` / `EventForm.tsx`** — parce que
**c'est lui qui ment** : il propose titre, lieu, point de rendez-vous, capacité, prix, pop-up…
**pour un challenge, dont la page ne lit rien de tout ça.**

**Et la correction ferme AUSSI le doublon ② des arbitrages :**

> **Retirer `'challenge'` des `TYPE_OPTIONS` du formulaire d'événement** (`eventEditorTypes.ts:34`).
> Un challenge **ne se crée plus depuis « Événements »** → **un seul chemin**, le CRUD dédié.
> **Et le mensonge disparaît en même temps que le doublon** — il n'y a plus de formulaire pour
> promettre des champs qui ne servent à rien.

**⚠️ CE QU'IL RESTE À TRAITER APRÈS** : **les challenges DÉJÀ créés** restent des `events` avec
`type='challenge'` → **si on les ouvre depuis la liste des Événements, on tombe encore sur le
formulaire générique.** Il faut **rediriger** ces lignes vers `/admin/challenge-21j`
(sinon le faux interrupteur survit sur tout l'historique).

### ⚠️ ET LE SECOND CONSTAT DU MÊME PLAN — l'admin ment à Catherine

> Le type `'challenge'` est une simple valeur de liste déroulante dans le formulaire d'événement —
> **aucun champ spécifique**. Or la page publique ne lit **aucun** de ces champs (le hero et les
> bannières sont **codés en dur** dans `ChallengeHero.tsx` / `ChallengeInclusBanners.tsx`).
> **Modifier ces champs pour un challenge ne change rien sur le site, ce qui induit Catherine en
> erreur.**

**C'est un défaut de confiance, pas d'ergonomie** : elle croit agir, et rien ne se passe. À traiter
dans le même lot — soit **on masque** ces champs pour un challenge, soit **on les branche**.

---

*Mis à jour le 14/09/2026 par @elise. Fichier : `public/data/metiers-rome.json` (ROME 4.0, Licence Ouverte).*
