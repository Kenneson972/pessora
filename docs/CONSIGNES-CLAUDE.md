# CONSIGNES À CLAUDE — Pessora

**Ce fichier est le point d'entrée unique.** Toute consigne destinée à Claude y est écrite par l'équipe (Nova, Alcyone, Vela, Élise), avec sa date et son état. Rien ne se transmet par chat : ce qui n'est pas ici n'est pas une consigne.

> **Pour Ken :** « pull, lis `docs/CONSIGNES-CLAUDE.md` » — il a tout.
> **Pour Claude :** lis ce fichier en entier avant de coder. Il fait autorité sur les briefs plus anciens quand les deux se contredisent.

---

## RÈGLES GÉNÉRALES (permanentes)

- **Une branche par lot** · jamais de push direct sur `main` · **aucun merge sans recette verte de @vela**.
- **Gate** : `npx tsc --noEmit` + build Vercel. (Le build local est impossible : `@heroui-pro/react` postinstall.) Les 10 échecs `cartStore.test.ts` sont **pré-existants**.
- **Une seule personne dans le repo à la fois.**
- **Une migration appliquée = le fichier mergé.** Si la base change après coup, on ajoute une **migration de suivi datée** — on ne modifie **jamais** un fichier déjà appliqué (le blob appliqué doit rester celui qui a été relu).
- **Les migrations ne sont PAS la source de vérité de la base.** Trois cas ce soir : `bilan_bookings_insert_public`, `bilan_slots_select_public`, `profiles_insert_own` existent en base et dans **aucune** migration. Tout audit RLS se fait **en live** (`pg_policies`, `information_schema`), jamais en relisant les fichiers.
- **RLS dit oui ≠ privilège dit oui.** Les deux sont nécessaires. Une policy correcte avec un `GRANT` manquant = fonctionnalité cassée (le bouton DELETE de l'admin, ce soir). On le prouve en **faisant l'action pour de vrai avec le bon rôle**.
- **Une garde dont l'entrée vient de l'appelant n'est pas une garde.** Toute règle validée côté client doit exister côté serveur.
- **Jamais de faux succès** : une écriture ne vaut que si l'on sait qu'elle a touché une ligne (et sur un `INSERT`, un `RETURNING` exige une policy SELECT — attention aux chemins invités).
- **Devis :** rien de tout ça ne touche le périmètre vendu.

---

## 2026-09-10 (soir) — LOT A : Challenge / Bilan — ✅ MERGÉ

**État : le merge du lot A est `047c294`** (17 fichiers, +1029/−12) — vérifié comme **déploiement de production servi** (Vercel, ref `main`, état READY). Les deux migrations sont en base. *(`origin/main` a avancé depuis — c'est normal, ce SHA est la trace du lot A, pas la tête de branche.)*

Contenu : garanties serveur (fenêtre J-14→J, anti double-réservation, dédup hors-date, téléphone normalisé, `origine`), widget de réservation, catégories d'erreur partagées, validation téléphone 9 chiffres, accroches Challenge.

**Réserve écrite, à ne pas oublier :** le critère **⑨** (`origine = 'questionnaire'`) **n'est PAS validé** — aucun appelant n'existe tant que la RPC n'est pas écrite. Il se recettera **avec** elle.

**À attendre, ce n'est pas un bug :** le widget ne se monte que sur un événement `type = 'challenge'` (`EvenementDetail.tsx:364`). Comme **aucun challenge n'existe en base**, **aucune page ne l'affiche aujourd'hui** — un visiteur ne voit rien de nouveau (vérifié en live : `/evenements` et `/evenements/runclub` rendent sans erreur console). Dès que Catherine crée son challenge, la page affichera **ses** créneaux — et **0** tant qu'aucun créneau ne lui est rattaché : les 7 créneaux historiques sont **orphelins** (sans `challenge_event_id`), donc invisibles par construction.

**Fichiers d'historique (ne pas modifier) :** `20260911100000_lot_a_challenge_bilan_server_guards.sql` (blob `709359a9…`, appliqué) + `20260911120000_grant_delete_bilan_bookings.sql` (`d777652`, correctif daté).

---

## 🔴 2026-09-10 (après merge) — BLOQUANT AVANT DÉMO : aucun chemin ne rattache un créneau à un challenge

**Constat vérifié dans le code de `main` (pas une hypothèse) :**

- `AdminBilans.tsx:190-199` — `createSlotAtSelected()` insère `{ date, heure, disponible: true }` : **jamais `challenge_event_id`**. Aucun écran, aucune fonction ne renseigne cette colonne (elle n'apparaît que dans `BilanBookingWidget.tsx:78` en **lecture**, et dans `types/database.ts`).
- `BilanBookingWidget.tsx:76-78` — le widget lit `.eq('challenge_event_id', challengeEventId)`.
- Conséquence : **tout créneau créé depuis son admin est orphelin** → `fn_bilan_slot_bookable()` = `false` → **invisible et non réservable**. Créer un challenge puis des créneaux **ne suffit pas** : la page affichera **0 créneau**, même avec des créneaux `disponible = true`.

**Régression induite par la v5 sur un flux existant** : avant la migration, la policy `bilan_slots_select_public (USING true)` rendait le créneau visible ; depuis, il ne l'est plus tant qu'il n'est pas rattaché. Le geste « ajouter un créneau » dans son admin est donc **sans effet visible** aujourd'hui — il faut le dire, sinon c'est un « ça ne marche pas » devant la cliente.

**Correctif recommandé (doctrine de la soirée : la règle vit côté serveur, l'UI affiche)** — trigger `BEFORE INSERT OR UPDATE` sur `bilan_slots` : si `challenge_event_id IS NULL`, le rattacher au challenge `active` dont la fenêtre couvre la date du créneau (`events.date - 14 <= NEW.date <= events.date`, `type = 'challenge'`) ; si aucun ne correspond, laisser `NULL` (orphelin assumé). Avantage : plus aucun opérateur ne peut créer un créneau invisible, et **aucune** évolution UI n'est nécessaire pour que ça marche. Un sélecteur « challenge concerné » dans l'admin reste souhaitable **plus tard** pour la lisibilité, mais ne doit pas être la seule garantie.

**Critère de recette (à faire jouer tel quel)** : créer un challenge dans l'admin → **ajouter un créneau depuis l'admin** → le créneau devient **visible et réservable** sur la page du challenge, **sans aucun SQL**. Aujourd'hui : ❌ (aucune interface ne peut le faire).

**Lien avec la migration v5** : ce n'est **pas** un oubli du lot A côté client — c'est un lien manquant entre deux lots (la colonne est arrivée avec la v5, l'écran de saisie des créneaux est antérieur et n'a pas suivi). À traiter comme un correctif **avant** la démo du Challenge.

---

## PROCHAIN LOT — dans l'ordre

### 1. RPC questionnaire post-inscription (débloque le critère ⑨)
La réponse « je veux mon bilan » du questionnaire doit créer **une demande dans la file de Catherine** — aujourd'hui elle part dans un JSON que **personne n'affiche**.

- **Une seule file** : la RPC écrit une ligne `bilan_bookings` (`slot_id = NULL`, `statut = 'en_attente'`).
- **Champ `bilan_offert` réactivé** dans `getPostRegistrationSteps` **pour le type `challenge` uniquement** (jamais pour tous les types — c'est l'erreur d'origine). Les options `BILAN_OFFERT_OPTIONS` existent déjà.
- **Elle lit `event_registrations`** pour `nom`, `prenom`, `telephone` (jamais le payload client — ça ferme le forgeage et fiabilise la clé de dédup).
- **`challenge_event_id` = l'événement de l'inscription** (pas la déduction générique : pendant le challenge, aucun challenge passé n'existe).
- `date_rdv = today`, `heure_rdv = 00:00`, `notes = 'Demande via questionnaire post-inscription'` (les 5 colonnes `NOT NULL` sont `nom`, `prenom`, `telephone`, `date_rdv`, `heure_rdv`).
- **`origine = 'questionnaire'`** via le GUC de session (`set_config`) — c'est le mécanisme prévu en v5, à utiliser ici.
- **Absorber** `23505` (dédup) et `P0001` (rate-limit) avec un message clair — jamais une erreur brute.
- **La RPC est `SECURITY DEFINER`** : elle contourne les policies. Donc **elle pose elle-même** statut/date/origine, et **le chemin questionnaire n'hérite PAS de la règle J+7** (au moment du questionnaire, le challenge est en cours → la garde le refuserait lui-même). À écrire en commentaire, sinon quelqu'un « harmonisera » un jour et cassera le questionnaire.
- **Recette ⑨** : après une demande via questionnaire → `origine = 'questionnaire'` **et** `challenge_event_id` = l'`event_id` de l'inscription, **et** la ligne apparaît dans l'**onglet « Demandes »** de `AdminBilans` avec son origine **lisible**.

### 2. Edge function « notification admin » (demandes hors-date)
Pattern `send-contact-email` / Resend. Elle **lit** les demandes en attente et **envoie l'e-mail** — elle n'écrit pas dans la table (c'est la RPC qui écrit). Contenu : nom, prénom, téléphone, origine, challenge.

### 3. `X-Robots-Tag` par chemin (`vercel.json`)
Dernier « petit » en suspens depuis plusieurs sessions (item 14 de la checklist go-live). Ordre impératif : (1) headers par chemin, (2) vérification **chemin par chemin**, (3) **ensuite seulement** lever le `noindex` global, puis régénérer le sitemap.

### 4. Lot `profils` — bug actif (migration séparée)
Un membre modifie son profil → l'interface dit « enregistré », **rien n'est écrit** (prouvé en live : `PATCH` → **204**, valeur inchangée). **5 profils sur 5** n'ont aucun numéro exploitable → c'est ce qui vide le pré-remplissage du téléphone à l'inscription.

- **Trigger `BEFORE INSERT OR UPDATE`** (pas UPDATE seul : `profiles_insert_own` existe en base et permet `role='admin'` sur une ligne absente).
- **Colonnes protégées** : `role`, `stripe_customer_id`, `email`, `created_at`/`updated_at`. Modifiables : `first_name`, `last_name`, `phone`, `avatar_url`, `preferences`, `admin_ui_prefs`.
- ⚠️ **« Policy self-update sans `role` » n'est pas exprimable en RLS** (la RLS est au niveau ligne, pas colonne) — d'où le trigger. Et **ne pas** révoquer la colonne à `authenticated` : Catherine EST `authenticated`.
- **La self-SELECT existe** (`GET profiles` en membre → 200) → le contrôle de lignes côté client est possible.
- **Règle des 9 chiffres** aussi sur le **formulaire de profil** (4ᵉ endroit) — module partagé `phone.ts`.
- **Recette** : `PATCH {"role":"admin"}` → rôle inchangé · `PATCH {"phone":"…"}` → **écrit pour de vrai** · non-régression : Catherine change un rôle depuis l'admin → ça marche toujours.

### 5. Passe conformité (après le lot A, en une fois)
- **Mentions légales** : raison sociale = *Catherine EDOUARD, entrepreneur individuel, enseigne PessÓra* · forme juridique = *Entrepreneur individuel* · **SIRET 941 411 159 00010** (absent aujourd'hui) · **directeur de la publication** = Catherine EDOUARD · **hébergeur** = *Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis* · adresse **légale** = le siège (`OSMAN NADEAU, RAVINE VILAINE, 97200 Fort-de-France`) — Cluny reste l'adresse **commerciale**.
- **⚠️ 16 occurrences de `pessora.fr@gmail.com`** à remplacer par **`pessora.mq@gmail.com`** (décision de Ken) : `src/data/infoData.ts`, `CGV.tsx` (×2), `MentionsLegales.tsx` (×2), `PolitiqueConfidentialite.tsx` (×2), `AdminInfosBar.tsx` (placeholder), `send-contact-email/index.ts:63` (fallback en dur), `.env.example`, `docs/` (×3), **`template/client.config.ts`**. La base porte déjà la bonne adresse (`bar_settings.email`) → le site et le chatbot se contredisent aujourd'hui.
- **`template/client.config.ts` contient les coordonnées réelles de Catherine** (adresse du bar, lien Maps, email) → **tout doit devenir placeholder** (`contact@exemple.fr`, `00000`, Maps vide). Sinon chaque futur client publie les coordonnées d'un autre commerce. Critère : **zéro coordonnée réelle dans `template/`**.
- **Crédit footer** « Site réalisé par Karibloom » (avec l'accord de Catherine) — ligne typo fine, intégrée à la ligne légale.
- **Franchise de TVA** : la mention « **TVA non applicable, art. 293 B du CGI** » doit remplacer tout « **TTC** » ambigu. ⚠️ Il n'y en a **pas seulement dans les mentions légales** : le relevé live en trouve aussi dans **`/cgv`** (page où le client lit ses droits). Mesuré en rendu navigateur, pas dans le HTML brut.
- **`/confidentialite` ne porte AUCUNE adresse de contact** (page de 888 caractères, zéro e-mail) — or c'est la page où l'on exerce ses droits RGPD : y mettre **la même adresse arbitrée** que les mentions légales, sinon le droit d'accès n'a pas de voie affichée.
- **Les 4 `[À compléter]` visibles en production** (relevé live de `/mentions-legales`) : *Forme juridique*, *Directeur de la publication*, *Hébergeur*, *Adresse* (celle de l'hébergeur). Les autres pages légales (`/cgv`, `/confidentialite`, `/contact`) sont propres.
- **Médiateur de la consommation** : obligatoire (L612-1 · L616-1/R616-1 · amende L641-1 jusqu'à 3 000 €). **C'est Catherine qui le désigne** → coordonnées à inscrire sur le site **et** dans les CGV dès qu'elle répond.
- **Newsletter conforme** : colonne `token uuid DEFAULT gen_random_uuid()`, **fonction de désinscription dédiée en `verify_jwt = false`** (déployée **nommément**), **`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`**, réponse **sans PII**, idempotente, rate-limitée. **DMARC absent** : `_dmarc.pessora.fr TXT "v=DMARC1; p=none"` (chez OVH). ⚠️ L'apex a un SPF **strict** (`include:mx.ovh.com -all`) → aucun envoi depuis `@pessora.fr` hors Resend.

---

## DETTE ÉCRITE (ne pas confondre avec « à faire »)

- **~25 tables** portent le `GRANT ALL` hérité Supabase (INSERT/UPDATE/DELETE pour `anon`/`authenticated`) protégées **uniquement par l'absence de policy**. Non exploitable aujourd'hui. **Priorité avant la bascule Stripe live** : `orders`, `order_items`, `subscriptions` (données d'argent) → `profiles` (avec son lot) → le reste. À traiter **avec le test de la vraie action**, jamais en relisant les `GRANT`.
- **`bilan_slots` garde son `GRANT ALL`** alors que `bilan_bookings` est resserré → asymétrie assumée, à ne pas confondre avec « les deux tables sont protégées pareil ».
- **Les 2 vues `v_pessobot_*`** portent INSERT/UPDATE/DELETE sans objet : testé en anon → **aucun contournement de RLS** (`42501` / ligne intacte). Privilèges à nettoyer, pas un trou.
- **`P0002`/`P0003` sortent en HTTP 500** (PostgREST ne connaît pas ces codes) → le front mappe sur **`error.code`**, jamais sur le statut HTTP ni sur le texte du message.
- **« Saisie manuelle au bar »** : la policy le permet (`Admins manage bilan_bookings`, `ALL`), **aucun écran ne le propose**. Manque de fonctionnalité, pas une régression. Si un jour un écran admin insère : poser `statut = 'confirme'` (hors du prédicat de l'index de dédup → aucune friction).
- **`bilan_slots` n'a pas de lien vers un événement** pour les créneaux historiques : les 7 créneaux legacy sont orphelins (dates passées).
- **Notification e-mail des demandes hors-date** : à ne câbler qu'avec la borne (rate-limit + dédup en base) — sinon un visiteur peut remplir la boîte de Catherine.

---

## EN ATTENTE DE CATHERINE (rien à coder)

1. **Sa carte complète** (catégorie + prix par produit) → débloque les 3 catégories (MEGA THÉ / PROTEIN SHAKE / COFFEE), les prix (Mega Thé 600 cl 10 €, Shake Grand 14 €), le moteur Formules, et PessoBot v2. **C'est le plus gros morceau restant.**
2. **Son médiateur de la consommation.**
3. **Son accord** pour le crédit footer.
4. **Le lien Easy Ta Vie.**
5. **La recette du module « Bilan » dans son admin** (elle est la seule à pouvoir juger).

---

## GO-LIVE — voir `docs/CHECKLIST-GO-LIVE-PESSORA.md`

Purge des données de test (8 inscriptions `TEST-VELA`, comptes QA, lignes `cs_test_…`, fixtures) · bascule **Stripe live** · `ADMIN_EMAIL` → `pessora.mq@gmail.com` · **compte admin réel** de Catherine (aujourd'hui `admin@pessora.mq` fictif + mot de passe faible) · **lever le noindex** (après les `X-Robots-Tag`) · **PAT Supabase expire le 16/11/2026**.
