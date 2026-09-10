# BRIEF CHANTIER — PessÓra (post-RDV Catherine 10/09/2026)

*À lire AVANT tout code. Complète `CLAUDE.md` (état projet) — ne pas le dupliquer.*

> ⚠️ **EN CAS DE CONTRADICTION, CE BRIEF FAIT AUTORITÉ SUR `CLAUDE.md`.** Le `CLAUDE.md` en racine (daté du 09/09) dit encore « mécanique interne Óra+ **conservée** volontairement » : c'est **périmé** → décision du 10/09 = **archivage TOTAL** (lot 4 ; seule exception : la remise −50 %, lot 1). De même, la section « Décisions actées 02/09 » de ce fichier est remplacée par le CR du 10/09 ci-dessous (catégories, prix, challenge, Óra+, Bilan).

---

## 1. RÉSUMÉ DU CR (décisions actées avec la cliente)

**Challenge 21 jours**
- Devient une **rubrique dédiée DANS la page Événements** (pas de page séparée, pas de landing isolée).
- **Vagues** (posées par nous dans l'admin) : sept./oct. · janv. · mars — pause nov.-déc. et février (carnaval).
- **Créneaux de bilan ouverts automatiquement 2 semaines avant** chaque challenge (J-14), **jusqu'au jour J inclus**.
- **Après la date**, une demande de bilan reste possible → **validation manuelle dans l'admin** + **notification par email**.
- **Inscription au bilan OBLIGATOIRE** pour participer au challenge.
- **Photos avant/après** de challengers, affichées **avant** l'étape « choisir le créneau » — c'est **la cliente qui les ajoute** (elle gère les droits).
- Places limitées, newsletter possible.

**Bilan**
- **La page Bilan disparaît** : le **choix du créneau migre dans la page Événement** (rubrique challenge).
- Plus de bilan « à l'année » : **le bilan est toujours rattaché à un challenge**.
- ⚠️ Calculs de dates **en heure Martinique (UTC-4)**, la base est en UTC et les colonnes sont naïves.

**Carte & prix**
- Catégories : **MEGA THÉ · PROTEIN SHAKE · COFFEE** — **catégorie Énergie supprimée**.
- **« Formules » n'est PAS une catégorie** : c'est un **moteur de recommandation/bundle** (thé + shake) — recommandation croisée + calcul de prix de formule.
- **Mega Thé 600 cl : 10 €** · **Shake Grand : 14 €** · **boosters : 2 €** (au lieu de 1 €), pour toutes les boissons.
- **Archivage des tailles depuis l'admin** (retirer/remettre une taille sans passer par nous).
- ⏳ **La carte complète (liste produits) arrive sous peu** → le **mapping boissons → catégories** attend cette carte.

**Vente**
- **Click & Collect uniquement** sur le site ; **livraison Easy Ta Vie** (lien dédié à venir) bien mise en avant.
- **Óra+ : archivage TOTAL de l'offre en ligne** (l'offre repart **en présentiel**). Les **7 abonnés Stripe live ne sont PAS touchés** — décision ferme de la cliente : on ne coupe rien, elle les gère au bar.

**PessoBot**
- System prompt à réécrire : il contient encore **Óra+ (≈24 occurrences)** et les **anciennes catégories/prix**.
- Ajouter : **conseil produits Herbalife + ingrédients** → puis **proposer un bilan** ; **rattacher événements / bilans / challenge**.
- Réparer la **lecture de la carte** (clé/URL Supabase du workflow n8n — l'agent ne la lit pas).

**Partenariat**
- Texte « **packs formules spéciales sur devis** » (clubs de sport, entreprises).
- **Vrai bloc Partenariat** sur la page.
- **Retirer la pill Partenariat** (doublon).
- ⚠️ Le **formulaire n'envoie rien** aujourd'hui (`onSubmit` stub) → à câbler.

**Divers**
- Le **gommage** : la cliente corrige elle-même le visuel → **on ne touche pas**.
- Accès admin : compte à créer avec **pessora.mq@gmail.com** (aujourd'hui email fictif + mot de passe faible).
- **Click & Collect only** + mention livraison Easy Ta Vie.

---

## 2. LOTS — ÉTAT

### ✅ FAIT (ne pas réintroduire / ne pas casser)
- Coupe Óra+ **surface publique** en prod.
- **Admin séparé** : `admin.pessora.fr` (1 projet Vercel, split par **Edge Middleware** — les rewrites `vercel.json` ne suffisent pas, le filesystem passe avant).
- PessoBot : **CSP** (`n8n.karibloom.net`) + **CORS n8n** réparés.
- Webhook Stripe live : endpoint propre (`we_1UED3WKgjJeTGaIL72toKUFZ`, 7 événements).

### 🔨 PRÊT À CODER (ne dépend pas de la carte)
1. **Partenariat (lot F)** : bloc + texte packs sur devis + retrait de la pill + **câblage du formulaire** via `send-contact-email` (`type: 'partenariat'`) — ⚠️ replier `organisation`/`phone`/`partnershipType` dans `message` (sinon strippés par Zod).
2. **Remise Óra+ retirée** : **les 2 endroits ensemble** — `src/lib/oraPricing.ts` (constante client) **et** `create-checkout-session` (calcul serveur). À faire **AVANT la bascule live**.
3. **Boosters 2 €** : **5 endroits** à bouger ensemble (`cartLine.ts`, `cartDisplayPrice.ts` ×2, `create-checkout-session` ×2) + **constante partagée documentée** + **test de parité**.
   - ⚠️ **Le test doit porter sur le code RÉEL, pas sur une copie** : `src/__tests__/checkout.test.ts` **réimplémente** aujourd'hui la logique de prix en local (`computeServerPrice`, l.15-19, avec l'ancienne remise Óra+ en dur) → il reste **vert** même quand le serveur change, donc il ne détecte **aucune** régression (il rejoue la règle au lieu de la tester).
   - **Fix attendu** : extraire la logique pure de prix dans **`supabase/functions/_shared/pricing.ts`** — sans API Deno, donc importable à la fois par la fonction edge **et** par Vitest — et **supprimer la copie locale**. Le test de parité boosters s'écrit alors **contre ce module partagé** (une seule source de vérité client/serveur/test). Sinon on crée un 2ᵉ jumeau qui divergera.
4. **Archivage des tailles (admin)** : flag par taille + UI admin + front n'affichant que les actives — ⚠️ **garde serveur obligatoire** (taille archivée = refus serveur, **jamais 0 €**). Étendre le pattern existant (`product.active` + Archiver/Restaurer — `AdminProduits.tsx`).
   - ⚠️ **Piège `price_medium` (vérifié dans le code)** : le serveur ne lit que `price_small`, `price_large`, puis `price` en repli (`create-checkout-session` l.89-95/109) — **il ignore `price_medium`**, alors que le front s'en sert (`src/data/menuData.ts`). Donc : soit le client annonce un prix « medium » que le serveur ne retrouve pas → **rejet de commande**, soit `price` est `NULL` → `Number(null) = 0` → **panier à 0 €**. À traiter dans ce lot : lire `price_medium` **et** refuser explicitement tout prix absent/invalide (jamais 0 €).
   - **Commandes passées** : la taille est dénormalisée sur la ligne de commande → ne pas la casser.
   - Vérifier le **code HTTP** des refus (4xx attendu avec message clair, pas un 500 générique).
5. **Archivage Óra+ complet** : mécanique interne, pages membre, blocs admin, `create-subscription-session` (fonction morte). ⚠️ Le **secret** `STRIPE_ORA_PLUS_PRICE_ID` : **ne pas y toucher dans le code** — c'est alcyone qui le retirera du projet Supabase.
6. **Retrait du parcours Bilan de la surface publique** *(décision Ken 10/09 : option (b) — le parcours revient dans le lot A, refait avec la garantie serveur)*. **Inventaire complet, vérifié dans le code — aucun lien mort, aucune promesse fantôme, aucun accès direct** :
   - **Nav / pages publiques** : `data/headerNav.ts:23` · `components/layout/Footer.tsx:21` · `components/layout/Header.tsx:21` · `pages/Home.tsx:46` · `pages/Menu.tsx:390` · `pages/ManagerSketchMockup.tsx:244`
   - **Espace membre** : `components/member/MemberLayout.tsx:27` · `components/dashboard/DashboardBottomNav.tsx:40` · `pages/member/Dashboard.tsx` (11 occurrences) · `pages/member/Subscription.tsx` · `pages/member/MesEvenements.tsx`
   - **Routes** : `src/App.tsx:178` (`/bilan-bien-etre`) et `src/App.tsx:78` (segment membre `bilans`) → **retirer les routes**, pas seulement les liens ; l'accès direct par URL doit tomber sur une **redirection/404 propre** (comme `/ora-plus`).
   - **Agent & recherche** : `components/common/Chatbot.tsx:27` (puce « Prendre un bilan » dans les suggestions par défaut) **et `:289-290`** (l'intention « bilan » route vers ces puces) · `components/layout/HeaderSearch.tsx:32` (mot-clé `bilan`) · `pages/PessobotPage.tsx:33-34` (« il vous redirige vers le Bilan Bien-Être »).
   - **Questionnaire post-inscription** : `lib/postRegistrationSurveySchema.ts:25` **et `:34`** (champ `bilan_offert` **obligatoire** — 2 schémas) · `components/events/PostRegistrationWizard.tsx:85-86`, `:151`, `:248` · `lib/postRegistrationSurvey.ts` (option « Oui, je souhaite profiter du bilan offert ») → **neutraliser en bloc 1** (on ne peut pas promettre un bilan dont la réservation n'existe plus) ; le libellé définitif se décidera au lot A.
   - 🔴 **SEO — `public/sitemap.xml`** : le fichier contient **2 URLs mortes** : `/bilan-bien-etre` (`:10`) **ET `/ora-plus`** (`:11`, résidu du retrait d'août) → **ne PAS éditer le XML à la main** : il est **généré** par `scripts/generate-sitemap.ts` (les 2 pages sont en dur **l.41-42**). Le fix se fait **dans le script** puis régénération.
     - Poser la **règle durable** : le générateur ne liste que des **pages de contenu** (les pages techniques ne doivent plus y entrer par oubli) → retirer aussi **`/connexion` et `/inscription`** (**l.44-45**) : faire indexer des pages d'authentification gaspille le budget de crawl.
     - **Le fichier actuel est périmé** : 68 URLs dont 3 boissons **désactivées** en base (`/menu/spicy-mango`, `/menu/caramel-glace`, `/menu/immune-paradise`) — le générateur filtre déjà `.eq('active', true)` (l.22-24) → **une régénération les retire** (comme les futurs produits/tailles que Catherine archivera). `/menu` passera de 13 à 11 URLs.
     - ⚠️ **Le glob `noindex` n'est PAS réglable par route en HTML** : le site est une **SPA Vite, un seul `index.html`** (`index.html:17` = verrou global). Le jour où on lève ce verrou, **toutes** les routes deviennent indexables → poser les **headers `X-Robots-Tag: noindex` par chemin dans `vercel.json`** (côté serveur, sans JS) pour `/connexion`, `/inscription` et les pages techniques. `robots.txt` seul ne suffit pas (`Disallow` ≠ désindexation).
   - ✅ **À CONSERVER** : l'**admin** (`AdminApp.tsx:62`, `admin/AdminLayout.tsx:21`, `admin/AdminOverview.tsx`) — Catherine continue de gérer créneaux et bilans depuis son back-office. Et le **type d'événement `bilan`** (`pages/Evenements.tsx:22`+`:25` `TYPE_ORDER`, `pages/EvenementDetail.tsx:45`) : utile au lot A, où le type `challenge` s'ajoutera à cette liste.
   - **Critère de recette (vela)** : plus aucune occurrence **visible** de « bilan » côté public/agent, et accès direct par URL = redirection/404 propre.

**Pièges déjà identifiés (ne pas les redécouvrir)**
- Un **panier forgé** peut envoyer un `productId + size` incohérent : la vérification serveur doit porter sur **la paire**, pas seulement sur le produit.
- `useIsOraPlus` s'appuie sur une table **live** : après archivage Óra+, vérifier qu'**aucun écran membre** ne casse (compte `ora_plus` existant en base de test).
- Le **n8n** est utilisé par d'autres clients : ne jamais modifier le workflow partagé (PessoBot = workflow dédié).

### ⏳ APRÈS LA CARTE
6. **Catégories** (mapping boissons → MEGA THÉ / PROTEIN SHAKE / COFFEE) + tailles actives.
7. **Moteur Formule** (bundle intelligent + recommandation thé ↔ shake + prix validé **côté serveur**).
8. **Challenge/Bilan (lot A — le plus gros)** : rubrique dans Événements, créneaux J-14 auto (UTC-4), validation admin + email, suppression page Bilan, migration du choix de créneau, photos avant/après.
   - ✅ **Fondations déjà en place (vérifié)** : `events.type` (→ `type='challenge'`), `bilan_slots` (`date`/`heure`/`disponible`), `event_registrations.post_registration_details`, Resend opérationnel → **aucune table neuve**.
   - ⚠️ **Décision d'archi à trancher AVANT de coder** : ne **pas** installer `pg_cron` (absent du projet). Retenu : **la fenêtre J-14 → J se calcule à la lecture** ; la cliente pose la date, les créneaux existent en base, la visibilité s'ouvre d'elle-même. Supprime le risque de dérive de fuseau.
   - ⚠️ **9 points d'accroche** à mettre à jour le jour où la page Bilan disparaît (nav, footer, Home, Menu, recherche, puces PessoBot, questionnaire post-inscription, mockup…) — **aucun lien mort**. Inventaire tenu par Vela.
   - ⚠️ **RLS à durcir** : aujourd'hui un membre peut s'inscrire hors fenêtre.
   - 🐛 **Bug connue à corriger ICI (ne pas corriger le composant actuel)** : le créneau ne se marque jamais pris — `BilanBienEtre.tsx:238` (erreur avalée) et `member/MesBilans.tsx:257` (erreur non contrôlée) font `bilan_slots.update({disponible:false})` **côté client**, or l'UPDATE est réservé aux **admins** (`is_admin()`) → refusé par la RLS → un créneau réservé **reste affiché libre** (sur-réservations). Fix attendu, **en base** : **(1) index UNIQUE partiel** sur `bilan_bookings(slot_id)` hors `statut='annule'` ; **(2) bascule `disponible=false` côté serveur** (trigger sur INSERT ou edge function), atomique. `bilan_bookings` est **vide** → aucune migration de données.
   - ⚠️ **La rubrique Bilan revient dans ce lot** (retirée de la surface publique au bloc 1, décision (b) du 10/09) : la réintroduire en nav+footer **avec** la garantie serveur ci-dessus, et restaurer les accroches (Home, Menu, espace membre) — toujours sans lien mort.
9. **PessoBot v2** ⚠️ **NON confié à Claude — assigné à @alcyone, en phase 2 (après les correctifs du bloc 1)**. Réécriture du system prompt (il contient encore Óra+ ≈24 occurrences + les anciennes catégories/prix), conseils produits/ingrédients, rattachements événements/challenge/bilan, et **réparation de la lecture de la carte** (clé/URL Supabase du workflow n8n — ticket séparé, même famille que l'allowlist `.mq`).
   - **Prérequis avant de réécrire** (sinon le prompt est périmé à la première modif) : **catalogue figé** (Mega Thé 600 cl 10 €, Shake Grand 14 €, boosters 2 €, catégories finales du bloc 1) + **infos challenge/événements** (lot A) + **lecture carte réparée**.
   - ⚠️ Le **n8n est en production** pour d'autres clients (facturation + workflows) : **ne toucher qu'au workflow PessoBot**, jamais aux workflows partagés.
10. **Page Partenariat** complète (si des éléments dépendent de contenus à venir).

---

### ORDRE DE MERGE — bloc 1 (5 branches, testé le 10/09 sur copies jetables du repo, 4 ordres essayés)
- **Ordre recommandé** : `feat/partenariat-formulaire` → **`feat/archivage-tailles-admin`** → `feat/archivage-ora-plus-complet` → puis les **2 branches prix** (`feat/boosters-2-euros` / `feat/retrait-remise-ora-plus`), l'une puis l'autre.
- **Pourquoi les tailles d'abord** : c'est la branche la plus large (11 fichiers, elle réécrit la résolution de prix côté serveur) et elle recoupe **5 fichiers** avec la branche boosters. En la mergant **avant** les branches prix, la surface de conflit tombe à **1 seul fichier** ; en la mettant après, c'est **2 fichiers**.
- **Conflits mesurés** :
  - ordre `partenariat → tailles → ora+ → boosters → remise` → **1 fichier** : `supabase/functions/create-checkout-session/index.ts` (au moment de boosters) ;
  - ordre `partenariat → tailles → ora+ → remise → boosters` → **1 fichier** : `src/components/cart/DrinkOptionsModal.tsx` (au moment de remise) ;
  - **un rebase ne l'évite pas** (mêmes 1 fichier par branche).
  - ⚠️ **Chaîne testée jusqu'au 1ᵉʳ conflit seulement** : après l'avoir résolu, **vérifier le 2ᵉ branchement** (non testé).
- **Règle de résolution** : garder **les deux intentions** — `BOOSTER_PRICE_EUR` **et** aucune condition `isOraPlus` (supprimer l'import `oraMemberUnitPrice`/`oraPricing`, conserver l'import `BOOSTER_PRICE_EUR`, garder `previewUnitPrice = basePrice + boosterAdd`).
- 🔴 **MIGRATION À APPLIQUER EN BASE AVANT LE DÉPLOIEMENT DU CODE** : `supabase/migrations/20260910120000_add_size_archive_flags_products.sql` — ajoute `price_small_active`, `price_medium_active`, `price_large_active` (`boolean NOT NULL DEFAULT true`, `IF NOT EXISTS`, idempotente). Sans elle, `create-checkout-session` échoue (il `select` ces colonnes). ✅ **Appliquée en prod le 10/09** (alcyone) : 16/16 produits avec les 3 flags à `true`, aucune ligne modifiée.
- 🔴 **LES EDGE FUNCTIONS NE SONT PAS DÉPLOYÉES PAR VERCEL** (déploiement manuel via CLI — aucun workflow GitHub dans le repo). Au 10/09, `create-checkout-session` en prod = **v22 du 09/09 17:09** → **toutes les modifs serveur du bloc 1 restent hors ligne** tant qu'on ne déploie pas.
  - ⚠️ **Recette** : tester la garde « taille archivée = refus » sur l'alias testerait **l'ancienne fonction** → faux négatif. Déployer d'abord (écriture prod = go nommé).
  - ⚠️ **Fenêtre d'incohérence front/serveur (mécanisme vérifié)** : le panier n'est **pas rejeté** (le client envoie `barBasePublic`, donc le contrôle compare la base au prix DB et passe) → l'effet réel est un **écart affiché/facturé** : le serveur facture **1 €/booster** au lieu de 2 € (**sous-facturation**) et appliquerait encore **−50 %** aux membres Óra+ → le client paierait **moins** que le prix affiché. ➡️ **Merge des branches prix + déploiement des fonctions = une seule opération**, suivie de la recette (sans danger tant que le site n'est pas ouvert).
  - ⚠️ **Déployer NOMMÉMENT les 2 fonctions** (`create-checkout-session`, `create-subscription-session`) : `stripe-webhook`, `send-contact-email` et `update-order-status` sont en **`verify_jwt = False` exprès** → un déploiement en masse les repasserait en `True` et **couperait les webhooks Stripe**. Versions en prod avant opération : `create-checkout-session` **v22**, `create-subscription-session` **v13**, `send-contact-email` **v11**.
  - ✅ **Périmètre vérifié** : seules ces 2 fonctions sont touchées ; `send-contact-email` n'a pas besoin d'être redéployée (secret `ADMIN_EMAIL` lu à l'exécution) ; aucune branche ne touche `_shared/`.
  - 🔒 Noter les **numéros de version** des fonctions déployées (retour arrière possible).
  - ℹ️ CORS : `ALLOWED_ORIGIN` = `www.pessora.fr + admin.pessora.fr` → depuis l'alias, les appels **REST** passent, les appels **edge** sont bloqués par le navigateur ; un **POST direct** (sans `Origin`) n'est pas concerné.
- ✅ **Vérifié dans `feat/archivage-tailles-admin`** : `price_medium` est désormais **lu** (`sizeFromKey === 'medium' ? 'price_medium'` + colonne ajoutée au `select`) — le piège « panier à 0 € » est traité ; et les refus passent par une `CartValidationError` avec **statuts 4xx explicites** (400/404/409) au lieu de 500.

**Séquence exacte (copiable)**
```
git checkout main && git pull
git merge --no-ff origin/feat/partenariat-formulaire
git merge --no-ff origin/feat/archivage-tailles-admin
git merge --no-ff origin/feat/archivage-ora-plus-complet
git merge --no-ff origin/feat/boosters-2-euros      # 1 conflit : create-checkout-session (ou DrinkOptionsModal selon l'ordre des 2 prix)
git merge --no-ff origin/feat/retrait-remise-ora-plus
# résolution : garder BOOSTER_PRICE_EUR ET supprimer toute condition isOraPlus
npx tsc            # PORTE DE TYPES LOCALE — exit 0 attendu
npx vitest run     # 10 échecs dans cartStore.test.ts = PRÉ-EXISTANTS (jsdom/localStorage), identiques sur main
```
- ⚠️ **Ne pas compter sur `npm run build` en local** : il échoue pour une raison **d'environnement**, pas de code — `@heroui-pro/react@1.0.0-beta.1` s'installe sans map `exports` (npm bloque son `postinstall`), donc `@heroui-pro/react/css` reste irrésoluble. Fix : `export HEROUI_AUTH_TOKEN=…` (ENVKAR, 36 car.) → `node node_modules/@heroui-pro/react/dist/postinstall/index.js` → `rm -rf node_modules/.vite dist` (**pessora = Vite**, pas de `.next`) → rebuild, et **`git checkout -- package-lock.json`** après (le re-install le modifie : ne pas le commiter).
- ❌ **Le fallback « copier le paquet depuis un repo frère » n'est PAS viable** : les voisins sont en `beta.8`, le code cible la `beta.1` → `"KPI" is not exported … Dashboard.tsx`.
- ✅ **Gate de merge retenu** : **`npx tsc` local + build Vercel** (seul endroit où l'install HeroUI est complète) + la **preuve par le contenu** de la preview (voir skill `frontend-build-verification`).
- ⚠️ **Aucun merge avant recette vela verte**, et `src/__tests__/checkout.test.ts` doit être remis d'aplomb **dans la même passe** (il affirme encore « boosters × 1 € » et la remise −50 % : (a) supprimer l'assertion Óra+ et la copie locale `computeServerPrice`, (b) porter le test de parité boosters sur le **module partagé** `supabase/functions/_shared/pricing.ts`, avec **test de mutation** — passer `BOOSTER_PRICE_EUR` de 2 à 3 doit faire rougir la suite).

## 3. RÈGLES DE TRAVAIL (impératives)
- Branche `feat/...`, **jamais de push direct sur `main`** ; **aucun merge sans recette QA** (Vela) — gate obligatoire.
- **Toutes les règles de prix vivent côté serveur** (`create-checkout-session`) : le client affiche, le serveur décide. Jamais un prix calculé côté client seul.
- **Fuseau** : calculs de dates en **UTC-4 (Martinique)**, écriture en valeurs naïves.
- Ne pas réintroduire Óra+ côté public. Ne pas toucher au visuel du gommage (la cliente le fait).
- Pas de secret dans le code ; jamais de clé dans un chat.
- `tsc` + build verts avant push.

## 4. HORS PÉRIMÈTRE
- Vidéo hero (Ken/CapCut), refonte visuelle globale, tableau de bord admin (déjà séparé).
- Les **7 abonnés Stripe live** : **ne rien faire** (décision cliente ferme).
- Bascule Stripe live : **opération séparée**, après validation de la recette complète en mode test.
