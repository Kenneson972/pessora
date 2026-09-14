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

**⒝ ⚠️ L'auto-remplissage de « Que fais-tu dans la vie ? » ne peut pas marcher aujourd'hui.**
Le profil ne porte **que** `prenom`, `nom`, `telephone`. **La profession n'existe nulle part.**
→ **Pour la pré-remplir à la 2ᵉ inscription, il faut d'abord la STOCKER** (profil ou dernière
inscription). **Sinon « auto-remplissage » ne veut rien dire pour ce champ.**
⚠️ Et la règle de la salle tient *(RESTES, §B)* : **valider la donnée AVANT de pré-remplir** — un
numéro jamais validé amorce un numéro incomplet, que l'utilisateur ne découvre qu'au refus serveur.

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

## 8. Les deux jeux d'options — ce qui les sépare vraiment

**Ce ne sont pas deux versions de la même liste. Ce sont deux questions différentes.**

| | **Code** (`postRegistrationSurvey.ts:22-26`) | **Fiche** |
|---|---|---|
| **La question posée** | *pourquoi tu viens* | *quel est ton objectif* |
| « Découverte / curiosité » | ✅ | — |
| « Remise en forme » | ✅ *(vague)* | — |
| **« Perte de poids »** | ✅ | ✅ **la seule commune** |
| « Bien-être et lien social » | ✅ *(venir **pour les gens**)* | — |
| « Autre » | ✅ *(échappatoire)* | — |
| « Prise de masse / tonification » | — | ✅ *(venir **pour un résultat physique**)* |
| « Plus d'énergie » | — | ✅ |
| « Reprendre de bonnes habitudes » | — | ✅ |

**La différence tient en une ligne** : les options du code décrivent **un état d'esprit** (« je viens
découvrir », « je viens pour le lien social ») ; celles de la fiche décrivent **un objectif**
(« je veux de l'énergie », « je veux reprendre des habitudes »).

**⚠️ Et c'est là que ça compte pour Catherine** : la fiche est **le document qu'elle remplit au bar**
pour recruter. **Ce sont ces catégories-là qu'elle utilise pour relancer les gens.** Si le site
collecte des catégories qu'**elle n'emploie pas**, la colonne de son admin **ne lui servira à rien** —
et on retombe dans le défaut du complément de revenus : **un écran qui affiche des mots sans usage.**

**👉 La question, en une ligne** : **on garde les 4 objectifs de la fiche — et est-ce qu'on ajoute
« Autre »** (et/ou « Découverte », qui couvre le cas « je ne sais pas encore ») ?
**Le reste du code (`Remise en forme`, `Bien-être et lien social`) n'existe pas sur sa fiche.**

---

## 9. Ce que ce brief NE tranche PAS

*(les 4 questions de la première version — mises à jour du 14/09)*

- **L'âge** → ✅ **TRANCHÉ** : facultatif, avec « Je ne veux pas renseigner ».
- **« Que fais-tu dans la vie ? »** → ✅ **TRANCHÉ** : champ libre + auto-remplissage *(⚠️ voir §6 ⒝)*.
- **Le créneau de rappel** → ⏳ **à Catherine** (§7).
- **Les options d'objectif** → ⏳ **Ken a demandé la différence** (§8).

---

*@elise — 14/09/2026. Source : `origin/main` = `6bc79e2`. Fiche : `docs/fiche-papier-challenge-21j.md`.
Détail du plan : `docs/PLAN-13-09.md`. État vérifié : `docs/VERIF-ITEMS-2026-09-14.md`.*
