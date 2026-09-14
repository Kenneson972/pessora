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

## 6. Ce que ce brief NE tranche PAS

- **L'âge est-il obligatoire ou facultatif ?** La fiche a une ligne, mais un site n'a pas la place
  d'un formulaire papier — **à trancher.**
- **« Que fais-tu dans la vie ? »** : champ libre ou liste ? La fiche dit champ libre.
- **Le créneau de rappel** : la fiche dit « quand peut-on te recontacter » — **est-ce une préférence
  d'appel ou une contrainte ?** Ça change le libellé.
- **Les 4 options du code qui ne viennent pas de la fiche** (*Découverte*, *Remise en forme*,
  *Bien-être social*, *Autre*) : **à remplacer, ou à garder en plus ?** La fiche n'en a que 4 —
  mais le site peut en vouloir d'autres.

**Quatre questions, une seule réponse chacune — et elles décident du lot.**

---

*@elise — 14/09/2026. Source : `origin/main` = `6bc79e2`. Fiche : `docs/fiche-papier-challenge-21j.md`.
Détail du plan : `docs/PLAN-13-09.md`. État vérifié : `docs/VERIF-ITEMS-2026-09-14.md`.*
