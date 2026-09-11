# Design — Enrichissement page Challenge 21 jours + route stable

**Date** : 2026-09-11
**Contexte** : Ajout de périmètre décidé par Ken le 11/09/2026 (voir `docs/CONSIGNES-CLAUDE.md`, section "PAGE CHALLENGE"). Direction artistique et spec chiffrée validées par Lyra : `DA-SPEC-challenge-21j.md` + `maquette-challenge-21j.html` (récupérés depuis le VPS, `/opt/data/clients/pessora/page-challenge/`). Contenu textuel verrouillé dans `docs/fiche-papier-challenge-21j.md`.

**Ce n'est pas une page marketing isolée** : la route `/evenements/:slug` existe déjà et affiche un événement `type='challenge'`. Ce lot enrichit son rendu quand le type est `challenge`, et ajoute une route stable pour que la page existe même sans challenge en cours (règle 7 de la spec Lyra : "la page vit 12 mois/12").

---

## 1. Routing & source de données

### Route stable : `/evenements/challenge-21-jours`
Nouvelle route statique dans `App.tsx`, déclarée **avant** `/evenements/:slug` (React Router matche les routes statiques avant les routes à paramètre — l'ordre de déclaration doit le garantir explicitement, ne pas s'y fier implicitement).

Nouveau composant `src/pages/ChallengeLandingPage.tsx` :
- Requête au montage : `events` où `type='challenge' AND active=true AND date >= aujourd'hui`, `ORDER BY date ASC LIMIT 1` (même logique de filtre que la rubrique dédiée de `Evenements.tsx:248`, à réutiliser/factoriser si trivial, sans obligation).
- **Une ligne trouvée** → rend `<ChallengeLanding event={event} />` (état "ouvert").
- **Aucune ligne** → rend `<ChallengeClosedState />` (état "fermé"), sur cette même URL, **sans redirection**. Le lien reste identique toute l'année (QR code, bio Instagram).

🔴 **RÈGLE OBLIGATOIRE (équipe, 11/09) — le fuseau.** « Aujourd'hui » dans la requête ci-dessus **ne se calcule jamais** avec `toISOString()` ni avec le fuseau du visiteur :
- **Un seul helper**, nouveau fichier `src/lib/martiniqueDate.ts` : `export const todayInMartinique = () => new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date())` → rend `2026-09-11`.
- **Jamais `toISOString().slice(0,10)`** — à 20h30 heure locale, il renvoie déjà `2026-09-12` alors que la Martinique est encore le 11 → la page se fermerait 4h trop tôt, la vague disparaîtrait le soir du dernier jour.
- **Jamais le fuseau du visiteur** (`toLocaleDateString()` sans `timeZone`) : un visiteur à Paris ouvrirait/fermerait la page avec *son* "aujourd'hui" — même bug déguisé.
- Même règle que la base, qui fait déjà `(now() AT TIME ZONE 'America/Martinique')::date` (trigger `fn_bilan_booking_before_insert` et consorts) — une seule règle, un seul endroit. `todayInMartinique()` est le seul point d'appel pour toute comparaison de date sur cette page (et à réutiliser si une autre page front a besoin de la même borne).
- **Critère** : la borne front et la borne base disent la même chose à 20h30 heure locale.

### Route dynamique existante : `/evenements/:slug`
Inchangée dans son fonctionnement (fetch par slug, inscriptions, etc.). Quand `event.type === 'challenge'`, elle rend elle aussi `<ChallengeLanding event={event} />` au lieu de l'affichage générique actuel — pour qu'un lien direct vers un événement précis (partagé avant ce lot, ou ouvert depuis l'admin) affiche la même expérience enrichie.

Pour tout autre `type`, `EvenementDetail.tsx` garde son rendu actuel, inchangé.

---

## 2. Composants

### `<ChallengeLanding event={Event} />` — nouveau, partagé
Rend, dans l'ordre imposé par la spec Lyra :
1. Hero sombre (eyebrow "Challenge 21 jours · Vague de {mois de `event.date`}", H1 "Quel est ton prochain objectif ?", lead, 1 seul CTA visible)
2. 3 puces de réassurance (bilan obligatoire · 21 jours accompagnés · communauté 24FIT)
3. `<StatsBlock />` (conditionnel, cf. §4)
4. Encadré "Challenge 21 jours" (dispositif signature unique, 6 inclus + 3 timings, contenu figé)
5. `<BeforeAfterBlock />` (conditionnel, cf. §4)
6. `<TestimonialsBlock />` (conditionnel, cf. §4)
7. **Le parcours d'inscription existant** : formulaire d'inscription + `PostRegistrationWizard` + `BilanBookingWidget` — logique extraite de `EvenementDetail.tsx` (aujourd'hui inline dans son JSX, lignes ~150-380) vers ce composant partagé. Un seul écrivain de cette logique, réutilisé par les deux routes — pas de duplication de la mutation d'inscription ni de l'état `postRegistration`.

Aucun nouveau champ, aucune nouvelle table : le composant consomme l'`Event` déjà chargé par l'appelant (route dynamique ou `ChallengeLandingPage`).

### `<ChallengeClosedState />` — nouveau
Utilisé uniquement par `ChallengeLandingPage` quand aucune vague n'est à venir :
- Titre "Le prochain Challenge 21 jours ouvre bientôt"
- `<NewsletterSignup theme="light" source="challenge-closed" />`

🔴 **RÈGLE OBLIGATOIRE (équipe, 11/09) — aucune date sur la page qui ne soit une ligne en base.** La maquette de Lyra affichait un rythme en dur ("Septembre — Octobre · Janvier · Mars") : **ce bloc ne s'implémente pas**. Catherine n'a pas validé ce calendrier, et le calendrier des vagues est chez elle, pas dans le code. `<ChallengeClosedState />` se limite au titre + à la newsletter. Conséquence voulue : le jour où Catherine crée son prochain challenge dans l'admin, il apparaît automatiquement, sans qu'on touche au code — aucun rythme à mettre à jour, aucun décalage possible entre ce qui est affiché et ce qui existe réellement.

### `NewsletterSignup` (existant, `src/components/layout/NewsletterSignup.tsx`) — modifié
Ajout d'un prop `theme?: 'dark' | 'light'` (défaut `'dark'`, comportement actuel inchangé) pour s'adapter à un fond clair. Réutilise `newsletter_subscribers` (zéro nouvelle table), avec `source='challenge-closed'` pour tracer l'origine.

### Blocs "preuve" — nouveaux, minimaux
`<StatsBlock />`, `<BeforeAfterBlock />`, `<TestimonialsBlock />` : chacun **retourne `null`** dans ce lot (aucune source de contenu réel n'existe encore côté Catherine, et il est hors de question d'inventer un modèle de données pour un contenu qui n'existe pas). Un bloc de preuve vide ne se publie jamais (règle Lyra) — la structure existe pour qu'un futur lot les remplisse sans redériver l'emplacement dans `<ChallengeLanding>`.

---

## 3. Contenu — verrouillé, source unique

Tout le texte des blocs 1, 2 et 4 vient mot pour mot de `docs/fiche-papier-challenge-21j.md` :
- Hero : lead et H1 = l'accroche de la fiche ("Quel est ton prochain objectif ?").
- Encadré : les 6 inclus (Application GetFitNow · Communauté 24FIT PESSORA · Séances de sport · Idées recettes · Conseils & accompagnement · Suivi des objectifs) et les 3 timings (Ce mois-ci · Le mois prochain · Je souhaite en savoir plus).
- **Aucune mention de résultat ou de promesse** dans les puces de réassurance ou ailleurs (règle @vela du 11/09) : pas de poids, pas de délai, pas de "perds X kg". "21 jours accompagnés" passe, un résultat chiffré jamais.
- La section "Complément de revenus" (opportunité Herbalife) n'apparaît **nulle part** dans le code — ni page, ni formulaire.

### Visuels
Emplacements avec le traitement pointillé de la maquette (`.hero__slot`, cadres en pointillés) tant que les assets ne sont pas livrés — génération des visuels (fond hero, icônes, OG image) traitée séparément par l'utilisateur (Higgsfield), hors périmètre de ce lot de code. Le badge de vague est du texte dynamique (mois calculé depuis `event.date`), jamais une image.

---

## 4. Correctifs annexes inclus dans ce lot

### `Evenements.tsx` — lecture de l'ancre au chargement
`location.hash` n'est lu nulle part aujourd'hui. Un lien `/evenements#challenge-21-jours` collé directement ouvre la page en haut. Ajout : au montage, si `location.hash` correspond à une section connue (`HeaderSubNav`), scroller vers elle — même mécanisme que le clic existant, déclenché une fois au chargement.

### `AdminBilans.tsx` — libellé `slotChallengeLabel`
Aujourd'hui, un créneau rattaché affiche toujours `→ {titre du challenge}`, même si le challenge est désactivé ou hors de sa fenêtre J-14→J (donc invisible côté public). Correctif : distinguer trois cas dans le libellé —
1. Rattaché, actif, dans la fenêtre → `→ {titre}` (inchangé, réservable).
2. Rattaché, mais `active=false` → `→ {titre} (désactivé — invisible publiquement)`.
3. Rattaché, actif, mais hors fenêtre J-14→J → `→ {titre} (hors fenêtre — pas encore réservable)`.

Aucune requête supplémentaire : `challenges` (déjà chargé par `AdminBilans.tsx`) porte déjà `active` et `date`.

---

## 5. Hors périmètre (rappel explicite)

- Aucune nouvelle table, aucun nouveau champ `events`/`bilan_bookings`.
- Aucun nouvel écran d'administration — le challenge continue de se créer/modifier exactement comme aujourd'hui via `/admin/evenements` (titre, date, `active`, inscriptions ouvertes).
- Aucune génération de visuels dans ce lot (traité séparément par l'utilisateur).
- Les 3 blocs de preuve (chiffres, avant/après, témoignages) restent vides — pas de contenu à saisir, pas d'admin pour les piloter, dans ce lot.

---

## 6. Critères de recette

1. `/evenements/challenge-21-jours` sans challenge à venir en base → état fermé (titre + newsletter, **aucun rythme de vagues en dur**), **aucune erreur console**, **aucun bloc de preuve visible** (chiffres/avant-après/témoignages absents du DOM, pas juste masqués en CSS).
2. Créer un challenge à venir (`active=true`, date future) → recharger `/evenements/challenge-21-jours` (même URL) → état ouvert, hero + encadré + parcours d'inscription réel, aucune redirection dans la barre d'adresse.
3. Le parcours d'inscription sur cette route stable produit exactement les mêmes effets que sur `/evenements/:slug` aujourd'hui (inscription, étape bilan, réservation créneau, message "demande envoyée") — non-régression du test e2e du 11/09.
4. Naviguer directement vers `/evenements/{slug-du-challenge}` affiche la même expérience enrichie que la route stable.
5. `/evenements#challenge-21-jours` collé en navigation privée scrolle vers la rubrique challenge, sans recharger en haut de page.
6. Dans `AdminBilans.tsx`, un créneau rattaché à un challenge désactivé affiche le libellé "désactivé" ; un créneau rattaché mais hors fenêtre J-14→J affiche "hors fenêtre" ; un créneau normalement réservable garde son libellé actuel.
7. `npx tsc --noEmit` et build Vercel verts.
8. Aucune mention "Complément de revenus"/Herbalife trouvée par `grep -ri "herbalife\|complément de revenus" src/`.
9. Aucune promesse de résultat chiffré trouvée dans le texte de la page (relecture manuelle des puces de réassurance et du hero).
10. Aucun appel à `toISOString()` ni `toLocaleDateString()` sans `timeZone` explicite pour la comparaison de date de cette page (`grep -n "toISOString\|toLocaleDateString" src/pages/ChallengeLandingPage.tsx` ne doit rien trouver) — seul `todayInMartinique()` calcule la borne.
