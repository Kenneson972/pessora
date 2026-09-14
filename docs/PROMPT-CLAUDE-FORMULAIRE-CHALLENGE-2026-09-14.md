# PROMPT À COLLER DANS CLAUDE CODE — le formulaire du challenge

**Écrit le 14/09/2026 par @elise, sur demande de Ken.**
**À copier tel quel dans Claude Code, depuis la racine du repo.**

---

## Le texte à coller

> **Lis d'abord ces deux fichiers, dans cet ordre :**
> 1. **`docs/BRIEF-FORMULAIRE-CHALLENGE-2026-09-14.md`** — le brief complet, avec les `fichier:ligne`
> 2. **la section « 🔴 LE FORMULAIRE D'INSCRIPTION DU CHALLENGE »** en tête de `docs/CONSIGNES-CLAUDE.md`
>
> ---
>
> ## LA TÂCHE
>
> **Mettre le formulaire d'inscription du challenge en conformité avec la fiche papier de Catherine.**
> La source de vérité des questions est **`docs/fiche-papier-challenge-21j.md`** — le document qu'elle
> remplit au bar. **Le formulaire actuel est celui d'un événement normal : il ne la suit pas.**
>
> **Fichiers concernés** *(et rien d'autre)* :
> - `src/components/events/ChallengeRegistrationCard.tsx`
> - `src/data/postRegistrationSurvey.ts`
> - `public/data/metiers-rome.json` — **à câbler, jamais à modifier**
>
> ---
>
> ## CE QU'IL FAUT FAIRE, DANS CET ORDRE
>
> **1. Retirer `nb_personnes`** — 4 occurrences : `l.19, 59, 88, 211-217`.
> *C'est un champ d'événement normal (« Je viens seul ») : absurde pour un challenge individuel.*
>
> **2. Remplacer `souhait_info`** par **« Quand souhaites-tu commencer ? »** — les 3 timings de la fiche :
> *Ce mois-ci · Le mois prochain · Je souhaite en savoir plus.*
>
> **3. Remplacer `OBJECTIF_OPTIONS`** par les **4 objectifs de la fiche**, **en choix UNIQUE** (radio) :
> *Perte de poids · Prise de masse / tonification · Plus d'énergie · Reprendre de bonnes habitudes.*
> ⚠️ **On stocke la CLÉ, jamais le libellé** : `perte_de_poids`, `prise_de_masse`, `plus_energie`,
> `bonnes_habitudes`.
> ⚠️ **Les 5 options actuelles sont RETIRÉES** : `Decouverte`, `Remise en forme`, `Perte de poids`,
> `Bien-etre social`, `Autre`.
>
> **4. Ajouter trois choses :**
> - **Âge** — **facultatif**, avec une option explicite **« Je ne veux pas renseigner »**.
>   ⚠️ **La clé stockée est `non_renseigne`, JAMAIS une chaîne vide** — sinon « je refuse » et
>   « j'ai oublié » deviennent indiscernables.
> - **« Que fais-tu dans la vie ? »** — **champ libre + AUTOCOMPLÉTION** (voir le piège ③).
> - **Les 4 créneaux de rappel** de la fiche : *matin · midi · après-midi · soir.*
>
> **5. Poser la lisibilité au même passage** : `text-black/45` → **≥ 60 %** (5,25:1) sur les libellés.
>
> ---
>
> ## ⚠️ LES TROIS PIÈGES — à lire AVANT d'écrire une ligne
>
> **① NE PAS toucher à `bilan_offert` ni à `objectif_principal`.**
> Le RPC `fn_save_post_registration_survey` **les EXIGE** : `missing_bilan_offert` (challenge) et
> `missing_objectif_principal` (tous types) → **`P0001`, au submit, sans erreur visible.**
> *C'est la panne du 10/09. On ne recommence pas.*
> ✅ **Bonne nouvelle en revanche** : le RPC **rejette 4 clés obsolètes** (`precommande_offre`,
> `gaufre_salee`, `gaufre_salee_autre`, `gaufre_sucree_notes`) **et accepte tout le reste** →
> **les nouveaux champs ne demandent AUCUNE migration.**
>
> **② Le token `labelBase` existe EN DOUBLE.**
> ```
> src/components/admin/eventEditorTypes.ts:57   export const labelBase = '… text-black/45 …'
> src/pages/admin/AdminHomeBanner.tsx:11        const labelBase = '… text-black/45 …'   ← COPIE LOCALE
> ```
> **Corriger la seule version exportée laisserait `AdminHomeBanner` cassé.**
>
> **③ L'autocomplétion : ne JAMAIS afficher `public/data/metiers-rome.json` à plat.**
> Le fichier porte **14 619 libellés** (ROME 4.0, France Travail, Licence Ouverte) avec un champ `src` :
> **`fiche` = 1 911** · **`principale` = 322** · **`synonyme` = 12 386**.
> 🔴 **Trier par `src` — `fiche` et `principale` d'abord, `synonyme` en secours — NE PAS couper la liste,
> 8 résultats affichés au maximum.**
> *À plat, taper « maçon » renvoie trente propositions (`Maçon-limousinant`, `Maçon-boiseur`…) : ça
> décourage au lieu d'aider. Et couper la liste ferait perdre les mots rares — ce qu'une autocomplétion
> doit justement rattraper.*
> ⚠️ **À charger À LA DEMANDE** (au premier clic dans le champ), **jamais dans le bundle initial**
> *(1,24 Mo brut, 168 Ko gzippé)*.
> ⚠️ **La saisie reste LIBRE** : les suggestions ne bloquent rien. Forcer le choix ferait entrer les
> gens dans des cases qui ne leur correspondent pas — *« prof de danse » n'est dans aucune liste.*
>
> ---
>
> ## LES CONTRAINTES
>
> - **Branche dédiée, jamais `main`.** Et le merge passe par la relecture équipe + recette.
> - **`tsc --noEmit` vert avant de pousser.**
> - **Ne PAS toucher à `AdminChallenge21j`** : vérifié le 14/09, **il ne propose que titre / date / actif /
>   registration_open — il est déjà conforme.** Rien à refaire de ce côté.
> - **NE PAS unifier** le formulaire du challenge avec celui des événements. **@user a tranché : il doit
>   DIFFÉRER.** *(La consigne « pareil pour tous les événements » du 12/09 portait sur l'AUTO-REMPLISSAGE,
>   pas sur la forme du formulaire — c'est l'erreur qui a produit l'item ⒜ du `PLAN-13-09`.)*
> - **Ne pas toucher au formulaire d'événement** : il sert aux 6 autres types. Le tag `'challenge'` en sera
>   retiré de `TYPE_OPTIONS` **dans un second temps**, pas dans ce lot.
>
> ---
>
> ## LA PORTE DE SORTIE
>
> **Ce qui doit être vrai à la fin** — et vérifiable, pas déclaratif :
> 1. **`nb_personnes` n'apparaît plus** dans le composant *(grep = 0)*.
> 2. **Un seul objectif possible** à l'inscription, et la valeur stockée est **une clé** *(pas un libellé)*.
> 3. **Une inscription de bout en bout passe** : soumise, acceptée, relue en base — `objectif_principal` et
>    `bilan_offert` **présents**.
> 4. **L'autocomplétion répond** sur « med » → propose « médecin » **dans les 8 premiers résultats**.
> 5. **`text-black/45` = 0** dans les fichiers touchés.

---

*@elise — 14/09/2026. Fondé sur `main` = `52e869b`. Brief : `docs/BRIEF-FORMULAIRE-CHALLENGE-2026-09-14.md`.*
