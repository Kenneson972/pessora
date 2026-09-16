# Fiche admin inscrits Challenge 21j + fix auto-remplissage membre — design

Date : 2026-09-16

## Contexte

`AdminChallenge21j.tsx` affiche les inscrits au Challenge 21 jours dans un
tableau en lecture seule (`useAdminChallengeRegistrants`, sans mutation).
Les événements standards ont déjà un CRUD (`EventRegistrationsList.tsx` +
`useAdminEventRegistrations`, avec édition, suppression, ajout manuel) —
mais ce pattern n'a jamais été porté sur la page Challenge 21j.

Par ailleurs, `ChallengeRegistrationCard.tsx` (formulaire d'inscription pour
tous les types d'événements standards) et `Challenge21jRegistrationCard.tsx`
pré-remplissent déjà `nom`/`prenom`/`telephone` depuis `user?.lastName` /
`user?.firstName` / `user?.phone` — mais uniquement via `defaultValues` de
react-hook-form, lu une seule fois au premier rendu. `AuthContext` charge le
profil de façon asynchrone (requêtes Supabase `profiles` + `subscriptions`
après résolution de la session) ; si le formulaire est monté avant la fin de
ce chargement, les champs restent vides et ne se remplissent jamais, même
une fois `user` disponible.

## Périmètre

1. Fiche détail (modale) + suppression pour un inscrit Challenge 21j, en
   admin. Pas d'édition, pas d'ajout manuel (exclus explicitement).
2. Correction du remplissage automatique nom/prénom/téléphone pour un
   visiteur **connecté**, sur tous les formulaires d'inscription événement
   (standard + Challenge 21j).

## 1. Fiche + suppression — Challenge 21j

### Suppression

- `useAdminChallengeRegistrants` (`src/hooks/useAdminChallengeRegistrants.ts`)
  gagne une fonction `deleteRegistrant(id: string): Promise<void>` qui
  supprime la ligne `event_registrations` correspondante puis rafraîchit
  la liste (même pattern que `useAdminEventRegistrations.deleteRegistrant`).
- Aucune suppression en cascade nécessaire : `bilan_bookings` n'a pas de FK
  vers `event_registrations.id` (rapprochement fait par téléphone via
  `matchBilanBooking`), donc supprimer l'inscription ne touche pas une
  éventuelle réservation de bilan associée.

### Fiche (modale)

- Nouveau composant `src/components/admin/ChallengeRegistrantDetailModal.tsx`.
- Ouverture : clic sur une ligne du tableau `Inscrits — {selected.title}`
  dans `AdminChallenge21j.tsx` (ligne ~539).
- Contenu affiché :
  - Coordonnées : prénom, nom, téléphone, date d'inscription.
  - Réponses complètes du questionnaire post-inscription — actuellement
    seuls `objectif_principal` et `complement_revenus` sont extraits par
    `useAdminChallengeRegistrants` ; la fiche doit lire l'objet
    `post_registration_details` en entier (dont `objectif_autre`,
    `bilan_offert`) via le schéma existant
    (`src/lib/postRegistrationSurveySchema.ts`) plutôt que le sous-ensemble
    actuel.
  - Bilan réservé : date/heure/statut si un match existe, sinon
    "Pas encore réservé" (réutilise `ChallengeRegistrantRow.bilan`).
  - Bouton **Supprimer** avec confirmation (réutilise `ConfirmDialog`,
    déjà importé dans `AdminChallenge21j.tsx`) ; ferme la modale après
    suppression réussie.
- Pas de mode édition, pas de formulaire d'ajout manuel.

## 2. Auto-remplissage membre connecté

Dans `ChallengeRegistrationCard.tsx` et `Challenge21jRegistrationCard.tsx` :

- Ajouter un `useEffect` déclenché quand `user` (depuis `useAuth()`) passe
  de `null`/absent à défini (profil chargé) :
  - Ne s'exécute que si l'utilisateur est connecté (`user` non nul).
  - Pour chaque champ (`nom`, `prenom`, `telephone`), n'écrase la valeur
    du formulaire que si le champ est **encore vide** au moment où l'effet
    se déclenche (`getValues('nom') === ''`, etc.) — ne touche jamais un
    champ que le visiteur a déjà rempli/corrigé pendant le chargement.
  - Appelle `setValue(field, value, { shouldValidate: false })` par champ
    plutôt qu'un `reset()` global, pour ne pas perturber les autres champs
    du formulaire (ex. `nb_personnes`, `souhait_info`, sélections déjà
    faites) ni l'état `isDirty`/erreurs déjà affichées.
- Portée : s'applique automatiquement à tous les types d'événements
  standards (`ChallengeRegistrationCard` est utilisé par `EvenementDetail.tsx`
  pour tous les types hors `challenge`) et au Challenge 21j
  (`Challenge21jRegistrationCard`), via deux corrections symétriques.
- Comportement visiteur non connecté : inchangé (`defaultValues` vides
  comme aujourd'hui).

## Hors périmètre

- Édition ou ajout manuel d'un inscrit Challenge 21j en admin.
- CRUD identique pour les autres types d'événements (déjà couvert par
  `EventRegistrationsList.tsx`).
- Auto-remplissage d'autres champs (âge, profession, etc.) — seuls
  nom/prénom/téléphone sont dans le profil membre.

## Tests

- `deleteRegistrant` : vérifier qu'une suppression retire bien la ligne de
  la liste affichée et ne casse pas le rapprochement bilan des autres
  lignes.
- Fiche : vérifier l'affichage de tous les champs `post_registration_details`
  (y compris `objectif_autre` quand `objectif_principal === 'Autre'`).
- Auto-remplissage : simuler un montage du formulaire avant résolution de
  `user` (isLoading vrai puis faux) et vérifier que les champs se
  remplissent seulement s'ils étaient vides.
