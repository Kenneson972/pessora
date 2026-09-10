# BRIEF — LOT A : Challenge 21 jours + parcours Bilan (à coder maintenant, sans dépendre de la carte)

*Complète `docs/brief-chantier-pessora-2026-09-10.md` (décisions du RDV) et `docs/BRIEF-ETAT-2026-09-10-soir.md` (avancement). Ce fichier = la **spec du lot A**.*
*⚠️ Le lot A appartient au **bloc 2** : commercialement, c'est Ken qui décide du moment. Techniquement, lancer Claude ici ne bloque rien.*

---

## 1. OBJECTIF
Faire du **Challenge 21 jours** une **rubrique dédiée DANS la page Événements** (pas de page séparée, pas de landing isolée), et **rétablir le parcours Bilan** — retiré de la surface publique au bloc 1 (branche `feat/retrait-bilan-surface-publique`, mergée) — en version **corrigée** : la réservation doit être **garantie côté serveur**.

## 2. CE QUI EXISTE DÉJÀ (vérifié en base — ne rien recréer)
- `events.type` → un `type = 'challenge'` suffit, **aucune table nouvelle**.
- `events.slug`, `events.active` (utilisés par le générateur de sitemap).
- `bilan_slots` (`date`, `heure`, `disponible`).
- `bilan_bookings` (`slot_id` **FK → `bilan_slots`**, `statut` avec `CHECK (en_attente | confirme | annule)`, `post_registration_details`).
- `event_registrations.post_registration_details` → questionnaire post-inscription.
- **Resend** opérationnel + secret `ADMIN_EMAIL` (destinataire des notifications).
- **Aucun ordonnanceur** : `pg_cron` **n'est pas installé** — voir §4.

## 3. RÈGLES MÉTIER
- **Vagues** : sept./oct. · janv. · mars — pause nov.-déc. et février (carnaval). Les **dates sont posées par l'équipe dans l'admin**, rien n'attend la cliente.
- **Créneaux de bilan ouverts de J-14 jusqu'au jour J inclus** (J = date du challenge), calculs en **heure Martinique (UTC-4)**, colonnes naïves en base.
- **Après la date** : une demande de bilan reste possible → **file de validation dans l'admin** (`statut = en_attente`) + **notification e-mail** (`ADMIN_EMAIL`).
- **Inscription au bilan OBLIGATOIRE** pour participer au challenge.
- **Photos avant/après** : affichées **avant** l'étape « choisir le créneau » ; c'est **la cliente qui les ajoute** (elle gère les autorisations).
- Places limitées possibles ; option newsletter.
- **Le bilan est toujours rattaché à un challenge** (pas de bilan « à l'année »).

## 4. DÉCISION D'ARCHI (actée)
- ❌ **Ne pas installer `pg_cron`.** Les créneaux **existent en base** dès que l'équipe pose la date, et **la fenêtre de visibilité (J-14 → J) se calcule à la lecture**.
- ➡️ **Mais le calcul ne doit PAS vivre seulement à l'affichage** : c'est **le serveur qui décide** (policy RLS / edge function), sinon un membre connecté peut réserver hors fenêtre par un appel API et la règle devient décorative. Même doctrine que les prix.

## 5. GARANTIES SERVEUR À POSER (indispensables)
1. **`WITH CHECK` sur l'INSERT** dans `bilan_bookings` : le créneau doit **exister**, être `disponible`, et être **dans la fenêtre J-14 → J inclus**. Aujourd'hui **un membre peut s'inscrire hors fenêtre**.
2. **Index UNIQUE partiel sur `bilan_bookings(slot_id)`** en excluant `statut = 'annule'` → **1 créneau = 1 personne**, garanti par la base (pas par l'interface).
3. **Bascule `bilan_slots.disponible = false` côté serveur**, atomique avec la réservation (**trigger sur INSERT** ou edge function).
   - 🐛 **Bug à ne pas reproduire** : les 2 chemins actuels (`BilanBienEtre.tsx:238` erreur avalée, `member/MesBilans.tsx:257` erreur non contrôlée) font l'`UPDATE` **côté client**, or `UPDATE` sur `bilan_slots` est réservé aux **admins** (`is_admin()`) → **refusé par la RLS** → le créneau **restait affiché libre** et pouvait être réservé plusieurs fois. **Ne pas corriger le composant actuel** (il est refondu ici) : on pose la garantie **en base**.
   - `bilan_bookings` est **vide** (0 réservation) → aucune migration de données.
4. **Créneaux orphelins** : si la date du challenge change après ouverture, que deviennent les créneaux ouverts et les bilans déjà réservés ? → **à trancher** (fermeture/réouverture, information des réservants). Le code doit au minimum **ne pas casser** sur un créneau dont le challenge a bougé.

## 6. SURFACE PUBLIQUE (réintroduction, sans lien mort)
Le parcours Bilan a été **retiré** au bloc 1. Ici on le **rétablit** avec la garantie serveur, en reposant les accroches :
- nav (`src/data/headerNav.ts`) + footer (`src/components/layout/Footer.tsx`) + `Header.tsx` (liste de chemins) ;
- `src/pages/Home.tsx` (vignette) + `src/pages/Menu.tsx` (lien) ;
- **espace membre** : `components/member/MemberLayout.tsx`, `components/dashboard/DashboardBottomNav.tsx`, `pages/member/Dashboard.tsx`, `Subscription.tsx`, `MesEvenements.tsx` ;
- **routes** : `/bilan-bien-etre` et le segment membre `bilans` ;
- **agent & recherche** : puce « Prendre un bilan » (`components/common/Chatbot.tsx` — suggestions par défaut **et** routage de l'intention), `components/layout/HeaderSearch.tsx`, mention sur `pages/PessobotPage.tsx` ;
- **questionnaire post-inscription** : `bilan_offert` (`lib/postRegistrationSurveySchema.ts`, `components/events/PostRegistrationWizard.tsx`) — neutralisé au bloc 1, à réactiver **avec** un parcours qui fonctionne ;
- **référencement** : le sitemap est **généré** (`scripts/generate-sitemap.ts`) — ajouter les pages du challenge s'il y en a, ne jamais éditer `public/sitemap.xml` à la main.

## 7. CE QUI N'EST PAS DANS CE LOT
- **Mapping des boissons → catégories** et **tailles actives** → attend **la carte de la cliente**.
- **Moteur Formule** (bundle + recommandation) → attend la carte (les prix en viennent).
- **PessoBot v2** (réécriture du prompt) → attend le catalogue figé ; @alcyone, phase 2.
- **`X-Robots-Tag` / levée du `noindex`**, purge go-live, bascule Stripe live → **checklist go-live**, pas ici.

## 8. RECETTE ATTENDUE (vela) — cas limites obligatoires
1. Réservation **dans** la fenêtre → OK ; **hors** fenêtre (avant J-14 et après J) → **refus serveur** (pas seulement masqué).
2. **Double réservation du même créneau** → la 2ᵉ est **rejetée par la base** (index unique), message clair.
3. **Créneau déjà pris** (`disponible = false`) → refus, jamais de réservation fantôme.
4. **Demande de bilan hors date** → `en_attente` + **e-mail reçu** (`ADMIN_EMAIL`) + validation dans l'admin.
5. **Changement de date du challenge** après ouverture → comportement documenté, **aucune donnée orpheline**.
6. **Parcours complet** : inscription au challenge → bilan obligatoire → choix du créneau → photos avant/après visibles avant le choix.
7. **Aucune régression** sur Événements (`type='bilan'` et le futur `type='challenge'` cohabitent) ni sur les pages publiques.

## 9. RÈGLES DE TRAVAIL (rappel)
- **Branche dédiée** `feat/lot-a-challenge-bilan` — jamais de push direct sur `main`, **aucun merge sans recette verte**.
- **Gate** : `npx tsc --noEmit` local + **build Vercel** (le build local est impossible ici : `@heroui-pro/react` postinstall). Les échecs `cartStore.test.ts` sont **pré-existants**.
- **Dates en UTC-4**, jamais de génération planifiée.
- **Une seule personne dans le repo à la fois** ; les fonctions edge se déploient **nommément** (jamais « toutes » : `stripe-webhook`/`send-contact-email`/`update-order-status` sont en `verify_jwt = False` **exprès**).
- **Aucun secret** dans le code ni dans un chat.
