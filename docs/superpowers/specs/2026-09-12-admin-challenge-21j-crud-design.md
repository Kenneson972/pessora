# Admin — CRUD Challenge 21 jours

**Date** : 2026-09-12
**Demandé par** : Ken
**Contexte** : la page publique `/evenements/challenge-21-jours` est terminée (hero plein cadre, minuteur en bloc dédié, 6 bannières inclus, CTA qui suit la disponibilité réelle des créneaux via `useChallengeAvailability` + `fn_bilan_slots_count`). Côté admin, rien n'a suivi : un challenge s'édite aujourd'hui exactement comme un événement classique, et aucun outil ne permet de peupler la fenêtre J-14→J avec plusieurs créneaux de bilan en une fois.

## Constat (code vérifié le 12/09)

- **`AdminEvenements.tsx`** : formulaire générique pour tous les `Event['type']` (titre, date, description, image, lieu, places max, etc.). Le type `'challenge'` est une simple valeur de liste déroulante parmi d'autres — aucun champ spécifique, aucun champ masqué. Or la page publique ne lit **aucun** de ces champs pour son hero/ses bannières (image, description, lieu sont codés en dur dans `ChallengeHero.tsx` / `ChallengeInclusBanners.tsx`) : modifier ces champs dans l'admin pour un challenge ne change rien sur le site, ce qui induit Catherine en erreur.
- **`AdminBilans.tsx`** : `createSlotAtSelected()` insère **un** créneau (`date` + `heure`) à la fois, sur un calendrier où l'admin doit cliquer jour par jour. Aucun moyen de peupler en une opération les ~14 jours de la fenêtre J-14→J.
- **`EventRegistrationsList.tsx`** : générique à tous les types d'événements — prénom / nom / téléphone / groupe / date. Ne montre ni le créneau de bilan choisi, ni les réponses du questionnaire post-inscription (`post_registration_details` jsonb : `objectif_principal`, `complement_revenus`, etc.).
- **`bilan_bookings` n'a pas de clé étrangère vers `event_registrations`** — seuls `challenge_event_id` et `telephone_normalized` permettent de relier une réservation de bilan à un inscrit. La jointure doit se faire côté requête, sur ces deux colonnes.

## Décision de structure

Un **nouvel espace admin dédié**, séparé d'`AdminEvenements` et `AdminBilans` (qui restent inchangés pour les événements classiques) :

- Route `/admin/challenge-21j`, nouvelle entrée de nav (`AdminLayout.tsx` — icône `Trophy`, label "Challenge 21j"), même schéma que les entrées existantes (`{ label, shortLabel, icon, path }`).
- Un seul fichier `src/pages/admin/AdminChallenge21j.tsx`, suivant les conventions déjà en place (`DashPageHeader`, `DASH_MAIN_PAD`, `AdminErrorAlert`, `ConfirmDialog`).

## A — Édition du challenge

- Liste de tous les événements `type='challenge'` (passés et futurs) avec un sélecteur pour basculer entre eux — utile pour retrouver l'historique, pas seulement le challenge courant.
- Formulaire réduit à ce qui pilote réellement la page publique :
  - **Titre** (`events.title`)
  - **Date** (`events.date`) — pilote le minuteur (`ChallengeCountdown`) et la fenêtre de réservation (J-14→J)
  - **Actif** (`events.active`) — un challenge désactivé tombe sur l'état fermé (`ChallengeClosedState`), comme aujourd'hui
- Pas de champ image, lieu, places max, description : ils n'existent pas côté front pour ce type. Si un jour la page doit lire un champ dynamique (ex. remplacer l'image hero statique), ce sera un ajout de périmètre à traiter séparément — pas anticipé ici (YAGNI).
- Création = `INSERT events (type='challenge', title, date, slug, active)` ; le `slug` se génère automatiquement (réutilise la logique d'auto-slug déjà en place ailleurs dans l'admin — voir `feedback` mémoire "auto-slug admin").

## B — Créneaux de bilan en masse

Panneau sous le formulaire, pour le challenge sélectionné :

- **Générateur** :
  - Plage de dates, pré-remplie sur J-14→J (calculée depuis `events.date` du challenge sélectionné), modifiable
  - Liste d'heures type, éditable (ex. `09:00, 10:30, 14:00, 16:00`), une ligne de champs simples
  - Jours de semaine à exclure (checkboxes lun-dim, dimanche coché par défaut)
  - Bouton "Générer" → construit la liste des créneaux (date × heure, jours exclus filtrés) et fait **un seul** `INSERT bilan_slots` multi-lignes (`disponible: true`, `challenge_event_id` laissé `NULL` — le trigger `fn_bilan_slot_attach_challenge` déjà en place le rattache automatiquement)
  - Avant insertion : dédup contre les créneaux déjà existants sur ces couples date/heure pour ce challenge (évite les doublons si on relance le générateur)
- **Liste des créneaux existants** pour ce challenge : réutilise l'affichage/actions déjà présents dans `AdminBilans.tsx` (toggle disponible, suppression, filtré par `challenge_event_id` du challenge sélectionné) — pas une réécriture, une extraction du composant existant si c'est propre, sinon une copie ciblée.

## C — Inscrits du challenge, vue enrichie

Remplace `EventRegistrationsList` pour ce challenge (nouveau composant, ex. `ChallengeRegistrantsList.tsx`, ou variante conditionnelle — à trancher en plan) :

- Colonnes de base inchangées : prénom, nom, téléphone, date d'inscription
- **+ Créneau de bilan** : jointure `bilan_bookings` par `challenge_event_id` + `telephone_normalized` (normaliser le téléphone de l'inscrit avec le même module `phone.ts` utilisé ailleurs) → affiche date/heure du créneau si réservé, "Pas encore réservé" sinon
- **+ Complément de revenus** (`post_registration_details->>'complement_revenus'`) avec la pastille "à recontacter" déjà actée dans les consignes équipe pour ce champ
- Le JSON brut n'est jamais affiché tel quel — toujours des colonnes nommées, avec fallback "—" si la clé est absente (questionnaire pas rempli)
- ⚠️ **Pas de colonne "Objectif"** : l'étape objectif (perte de poids/tonification/etc.) a été retirée du questionnaire pour le type `challenge` le 12/09 (retour utilisateur) — `getPostRegistrationSteps('challenge')` ne rend plus que `['bilan']`. `post_registration_details.objectif_principal` n'existera plus pour aucune nouvelle inscription au challenge.

## Hors périmètre (explicitement)

- Rien ne touche à la page publique ni aux composants déjà livrés (`ChallengeHero`, `ChallengeCountdownSection`, `ChallengeInclusBanners`, etc.)
- Pas de nouvelle table, pas de nouvelle colonne — uniquement des requêtes/écrans admin sur le schéma existant
- Pas de notification/email lié à cette admin (l'edge function de balayage des demandes hors-date reste un chantier séparé, déjà documenté ailleurs)
- Pas de gestion des bannières "inclus" depuis l'admin (elles restent codées en dur, alimentées par Ken via fichiers, comme actuellement)

## Risques / points d'attention pour le plan d'implémentation

- **Écriture en base (génération de créneaux)** : passe par le protocole habituel (annonce + empreinte avant/après) si testée en direct — mais la génération en masse elle-même est un `INSERT` normal via le client Supabase authentifié admin, pas une migration.
- **Dédup à la génération** : doit être fiable même si l'admin relance le générateur sur une plage qui chevauche des créneaux déjà créés (ne doit jamais créer de doublons date+heure pour le même challenge).
- **Jointure téléphone** : le format du téléphone stocké dans `event_registrations.telephone` (saisie libre) doit être normalisé de la même façon que `bilan_bookings.telephone_normalized` avant comparaison, sinon la jointure rate silencieusement (faux "pas encore réservé").
