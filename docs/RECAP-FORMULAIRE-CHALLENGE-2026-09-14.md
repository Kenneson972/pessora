# RÉCAP — Formulaire Challenge 21j (14/09/2026)

**Branche : `feat/formulaire-challenge-fiche-21j`** (poussée, non mergée). Base : suite de
`docs/PROMPT-CLAUDE-FORMULAIRE-CHALLENGE-2026-09-14.md` et `docs/BRIEF-FORMULAIRE-CHALLENGE-2026-09-14.md`.
4 commits, `tsc --noEmit` vert à chaque étape, tests inchangés (les 50 échecs `cartStore` sont
préexistants, sans rapport).

---

## ⚠️ Découverte qui a changé le plan initial

`ChallengeRegistrationCard.tsx` n'est **pas** challenge-only : c'est le formulaire **générique**
utilisé par `EvenementDetail.tsx` pour les **6 autres types d'événement** (popup, atelier, run_club,
event, partenariat, bilan). Appliquer le brief tel quel dessus l'aurait cassé pour eux.

**Décision prise avec Ken** : extraire un composant dédié, `Challenge21jRegistrationCard.tsx`, monté
uniquement par `ChallengeLanding.tsx`. `ChallengeRegistrationCard.tsx` reste intact, inchangé, pour
les 6 autres types.

---

## Ce qui a été fait

### 1. Formulaire d'inscription — conforme à la fiche papier de Catherine
- `nb_personnes` retiré (absurde pour un challenge individuel).
- `souhait_info` → **« Quand souhaites-tu commencer ? »** (3 timings de la fiche).
- Objectif en **choix unique** (radio), les **4 cases de la fiche**, stockées en **clé**
  (`perte_de_poids`, `prise_de_masse`, `plus_energie`, `bonnes_habitudes`) — nouvelle constante
  `CHALLENGE_OBJECTIF_OPTIONS` dans `postRegistrationSurvey.ts`. `OBJECTIF_OPTIONS` (les 6 autres
  types) **non touché**.
- Ajout : **âge** (facultatif, clé `non_renseigne` explicite — jamais une chaîne vide), **profession**
  (champ libre + autocomplétion sur les 14 619 métiers ROME 4.0 — chargée à la demande au 1er clic,
  triée `fiche`/`principale` d'abord puis `synonyme`, classée par préfixe pour que « med » remonte
  « Médecin » en premier, 8 résultats max), **créneaux de rappel** (cases à cocher, 4 créneaux de la
  fiche).
- `bilan_offert` et `objectif_principal` (exigés par le RPC) **non touchés** — c'est la panne du 10/09.
- Contraste des libellés relevé à `text-black/60` (≥60 %, 5,25:1).

### 2. Cohérence bilan bien-être (retours de recette manuelle)
- Le widget de réservation (`BilanBookingWidget.tsx`) redemandait prénom/nom/téléphone juste après
  que le formulaire les ait collectés → **pré-rempli désormais** avec les infos de l'inscription
  (prop `prefill`).
- Le questionnaire proposait « Non merci » pour le bilan, ce qui contredisait le widget (toujours
  affiché, jamais skippable) et la décision du 10/09 (« bilan obligatoire pour participer »). Les
  options ne décrivent plus que **QUAND** le rdv est pris, jamais SI (`BILAN_OFFERT_OPTIONS`).
- Le choix de créneau ne montre plus l'heure : la visiteuse choisit le **jour**, Catherine gère les
  heures depuis l'admin. Si plusieurs heures existent pour un jour, le système les essaie dans l'ordre
  et retire silencieusement celle qui vient d'être prise par quelqu'un d'autre (protégé par l'index
  unique `bilan_bookings_slot_unique_active`, déjà en base).

### 3. Garde-fou anti-doublon
- Un refresh de page ne permet plus de se réinscrire : l'inscription est mémorisée en
  `sessionStorage` (pas `localStorage` — survit à un F5, reste propre à l'onglet). Au retour sur la
  page, écran **« Tu es déjà inscrit(e) »** au lieu du formulaire vide, avec un bouton pour modifier
  âge / métier / timing / créneaux de rappel.

### 4. Admin — créneaux de bilan
- Bouton **« Tout supprimer »** au-dessus du tableau des créneaux (`AdminChallenge21j.tsx`), avec
  confirmation — il fallait supprimer un par un jusqu'ici.

---

## ⚠️ À APPLIQUER AVANT LE MERGE — 3 migrations écrites, PAS appliquées

Règle du repo : Claude Code écrit et annonce, ne s'applique jamais lui-même en base. **@alcyone
applique, quelqu'un d'autre vérifie** (`prosrc`/`pg_trigger`/`pg_policies` après coup).

1. **`20260914120000_challenge21j_formulaire_colonnes.sql`** — ✅ **déjà appliquée** (confirmé par
   Ken). Rend `nb_personnes`/`souhait_info` nullable (et retire leur défaut fabriqué), ajoute
   `age`, `profession`, `timing_demarrage`, `creneau_rappel` sur `event_registrations`.
2. **`20260914130000_fn_update_challenge21j_registration.sql`** — ⏳ **à appliquer**. Nouvelle RPC
   `SECURITY DEFINER` (même modèle que `fn_save_post_registration_survey` : vérification du
   téléphone, jamais d'accès direct à la table) pour permettre la modification post-inscription —
   il n'existe **aucune** policy RLS `UPDATE` publique sur `event_registrations` (vérifié en direct
   sur le projet Supabase `tulhiipucrnyejheuitv` : seule `event_registrations_admin_update`
   existe, réservée à `is_admin()`). **Sans cette RPC, le bouton "Modifier mes informations" échoue.**

---

## Ce qui reste ouvert (hors périmètre de ce lot)

- **Date du challenge de test** : à changer par Ken lui-même pour avoir plus de jours dans la
  fenêtre J-14→J (fait en cours de session, confirmé par lui).
- **`AdminChallenge21j.tsx`** : non touché, déjà conforme au plan du 12/09 (titre / date / actif /
  `registration_open` uniquement) — rien à refaire de ce côté.
- **Retrait du type `'challenge'` de `TYPE_OPTIONS`** (formulaire événement générique) : toujours
  prévu « dans un second temps », pas dans ce lot.
- **Recette équipe** : à faire une fois la migration #2 appliquée — tester le parcours complet
  (inscription → bilan → questionnaire objectif → refresh → modification) en conditions réelles.
