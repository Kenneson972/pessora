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
- ~~Vagues~~ → **« Challenge 21 jours »** — ⚠️ **le rythme « sept./oct. · janv. · mars » est RETIRÉ (11/09)** : il n'a **jamais** été validé par Catherine, et le mot « vague » **n'est pas d'elle** (c'est notre jargon — c'est lui qui a produit l'« OG VAGUE DE SEPTEMBRE »). **Le calendrier est géré par Catherine et son équipe** : c'est **elle** qui crée ses challenges et pose leurs dates dans l'admin. Nous fournissons l'outil et le code — **nous ne décidons d'aucune date**, et on n'en écrit **aucune en dur**. Pour nos recettes : fixtures `TEST-` uniquement, purgées derrière.
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
0. 🔴 **TROU CONFIRMÉ — `bilan_bookings_insert_public` : `WITH CHECK (true)`, aucun contrôle** (Claude, 10/09). La policy est ouverte au rôle `public` → **n'importe quel visiteur, même non connecté, peut insérer une ligne arbitraire** (`user_id` forgé, `slot_id` forgé, voire `statut = 'confirme'`). **Preuve sans écriture** (probe 10/09) : un `INSERT` anon avec un `slot_id` inexistant renvoie **`23502` (NOT NULL `telephone`)** et **non `42501` (violation RLS)** → la policy a **laissé passer**, seul le contrainte l'a arrêté ; **aucune ligne créée**.
   - ✅ **À FAIRE** : **supprimer** cette policy (pas la faire cohabiter) et la remplacer par une policy **conditionnelle** (points 1-2).
   - ⚠️ **Sur-privilège à corriger dans la même passe** : `anon` a **DELETE, INSERT, SELECT, UPDATE, TRUNCATE, REFERENCES, TRIGGER** sur la table → restreindre au strict nécessaire (**SELECT/INSERT**). Non exploitable aujourd'hui (les autres policies filtrent), mais c'est exactement ce qui rend une future policy mal écrite exploitable.
   - 🔍 **Audit associé — BALAYAGE FAIT (10/09)** : **une seule policy d'écriture ouverte dans tout le projet** = `bilan_bookings_insert_public` (cas isolé) · **27 tables publiques, toutes avec RLS activée** · les 9 autres policies « ouvertes » sont des **SELECT publics voulus** (catalogue, événements, config du bar, carrousel) → ne pas les toucher · **patron à copier** = `event_registrations` : son INSERT exige `user_id NULL ou = auth.uid()` **ET** l'existence de l'événement avec `registration_open` → c'est **exactement** le modèle pour le bilan (à compléter avec la fenêtre J-14 et le contrôle du créneau).
   - ⚠️ Le sur-privilège de grants est **systémique** (défaut Supabase : `GRANT ALL` sur le schéma) et **non exploitable** en l'état → à resserrer globalement dans la même passe.
   - 🧰 **Process** : le script de balayage (policies permissives + grants + tables sans RLS) devient un **outil réutilisable à passer sur chaque projet** — cette faille ne se voit pas en recette, elle se voit en audit.
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
1. Réservation **dans** la fenêtre → OK ; **hors** fenêtre (avant J-14 et après J) → **refus serveur** (pas seulement masqué). ⚠️ **Tester avec ET sans en-tête `Origin`** : si le refus ne tombe que sans `Origin`, c'est du **CORS**, pas une garde — ça ne protège rien (leçon du cas C argent, 10/09).
2. **Double réservation du même créneau — en SÉQUENTIEL *et* EN PARALLÈLE** : deux réservations **simultanées** → **exactement une** doit passer. Le séquentiel se contente de prouver l'index ; le risque de retour est dans la **course** (`index UNIQUE partiel` + bascule atomique côté serveur). Même exigence d'`Origin` qu'au point 1.
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

## 10. ADDENDUM 10/09 soir — points 7/8/9 (relecture équipe)

Les 6 premiers points de relecture sont **traités en v2** (`c879e05`). Restent ces trois-ci, à coder **dans la même migration**.

### Point 7 — le chemin hors-créneau (`slot_id IS NULL`) est non borné
Un visiteur non connecté peut insérer autant de demandes qu'il veut — et le brief prévoit **un e-mail par demande** → risque de remplir la boîte de `ADMIN_EMAIL` dès l'ouverture.
- **Dédup en base** : index **UNIQUE partiel**, `WHERE statut = 'en_attente' AND slot_id IS NULL`, clé `COALESCE(user_id::text, normalize_phone(telephone))`. **Pas** de `IF NOT EXISTS` dans un trigger (laisse une course sous insertions simultanées — cf. critère ③).
- **Volume** : `public.check_rate_limit(p_key, p_max, p_window_seconds)` **existe déjà en base** (table `rate_limits`, 0 ligne, jamais appelée) — la réutiliser. Mais l'insertion est un **REST direct** : elle ne traverse **aucune** edge function, donc le rate-limiter en mémoire (celui des 3 fonctions qui limitent) **ne peut pas la couvrir** → **tout doit tenir en base**.

### Point 8 — normaliser AVANT de dédupliquer
Le canon existant en base (`lower(regexp_replace(..., '\s+', '', 'g'))`) **ne retire que les espaces** → `0696000000` et `+596 696 000 000` restent **deux clés** : l'index donnerait une **fausse sécurité**. Ordre imposé :
1. `public.normalize_phone(text) IMMUTABLE` — chiffres seuls, préfixe pays retiré, **9 derniers** conservés (→ `696000000` pour les 4 formats).
2. Trigger **`BEFORE INSERT OR UPDATE`** qui stocke la valeur normalisée.
3. Index unique partiel sur la **valeur normalisée** (ou index sur expression — équivalent si la fonction est `IMMUTABLE`).
`bilan_bookings` est **vide** → **zéro backfill**.

### Point 9 — règle du chemin hors-créneau (arbitrage client du 10/09)
**Créneaux ouverts `J-14 → J` ; passé J, on accepte encore les demandes pendant 7 jours (jusqu'à J+7) ; au-delà le bilan est fermé.** Le RDV demandé tombe **entre le jour de la demande et `J+7`**.

- **Le serveur DÉDUIT le challenge — il ne le demande plus au client** : `SELECT id FROM events WHERE type='challenge' AND active AND date < today ORDER BY date DESC LIMIT 1`. Un garde en moins, un champ à forger en moins.
- `challenge_event_id` **reste en colonne**, remplie par le **trigger** (l'admin doit voir à quel challenge se rattache la demande) — **jamais lue depuis le client**.
- La vérification passe par un **helper `SECURITY DEFINER`** (ex. `fn_challenge_window_ok(p_date_rdv date) → boolean`, `search_path` fixé) appelé depuis le `WITH CHECK` — **pas** un `EXISTS` inline : il s'exécuterait avec les droits de l'appelant et **dépendrait de la policy SELECT d'`events`** (couplage = panne silencieuse, même piège que `fn_bilan_slot_bookable`).
- **Bornes en `America/Martinique`**, jamais en UTC.
- **Corrections SQL** : `today > e.date` (le chemin hors-créneau ne s'ouvre **qu'après J** — sans cette borne il s'ouvre avant, ce qui annule la règle) et **`date_rdv`** (pas `NEW.date_rdv`, qui n'existe pas dans une policy).
- **`statut = 'en_attente'`** forcé (la colonne a déjà ce `DEFAULT`).

### ⚠️ Deux prérequis base, sinon la fonctionnalité est inutilisable
1. `events_type_check` n'autorise **pas** `'challenge'` (`run_club, popup, atelier, event, partenariat, bilan`) → **la migration doit l'ajouter**.
2. L'**admin doit permettre de créer un challenge avec sa date** — sans ça, le chemin « demande après la date » n'est jamais ouvrable, même code livré.
3. Pour la recette : **poser un challenge en base** (il n'y en a **aucun** aujourd'hui) — sinon on ne teste que les refus et on conclura à tort que la voie nominale est cassée.

### Recette ajoutée (⑥⑦), en REST direct, **avec ET sans `Origin`**
- **⑥** 4 insertions anon du **même numéro sous 4 formats** → **1 seule ligne** (et jamais N e-mails).
- **⑦** `aujourd'hui = J+7` → accepté · `J+8` → refusé · **challenge futur** → refusé (le chemin ne s'ouvre qu'après J) · date passée → refusé · dans les bornes → `en_attente` + e-mail.
- **Couverture des deux chemins** : `[J-14 → J]` ∪ `[J+1 → J+7]` → contigus, **aucun trou** où un client légitime n'a de chemin.
