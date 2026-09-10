# BRIEF CHANTIER — PessÓra (post-RDV Catherine 10/09/2026)

*À lire AVANT tout code. Complète `CLAUDE.md` (état projet) — ne pas le dupliquer.*

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
4. **Archivage des tailles (admin)** : flag par taille + UI admin + front n'affichant que les actives — ⚠️ **garde serveur obligatoire** (taille archivée = refus serveur, **jamais 0 €**). Étendre le pattern existant (`product.active` + Archiver/Restaurer — `AdminProduits.tsx`).
   - ⚠️ **Piège `price_medium` (vérifié dans le code)** : le serveur ne lit que `price_small`, `price_large`, puis `price` en repli (`create-checkout-session` l.89-95/109) — **il ignore `price_medium`**, alors que le front s'en sert (`src/data/menuData.ts`). Donc : soit le client annonce un prix « medium » que le serveur ne retrouve pas → **rejet de commande**, soit `price` est `NULL` → `Number(null) = 0` → **panier à 0 €**. À traiter dans ce lot : lire `price_medium` **et** refuser explicitement tout prix absent/invalide (jamais 0 €).
   - **Commandes passées** : la taille est dénormalisée sur la ligne de commande → ne pas la casser.
   - Vérifier le **code HTTP** des refus (4xx attendu avec message clair, pas un 500 générique).
5. **Archivage Óra+ complet** : mécanique interne, pages membre, blocs admin, `create-subscription-session` (fonction morte). ⚠️ Le **secret** `STRIPE_ORA_PLUS_PRICE_ID` : **ne pas y toucher dans le code** — c'est alcyone qui le retirera du projet Supabase.

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
   - ⚠️ **La page Bilan est dans la nav publique + le footer** → elle sera **live dès l'ouverture du site**, avant ce lot : si le lot A n'est pas passé, il faut soit la **garantie serveur minimale**, soit **masquer la rubrique** (décision Ken).
9. **PessoBot v2** : réécriture du prompt + conseils produits/ingrédients + rattachements + réparation de la lecture carte.
10. **Page Partenariat** complète (si des éléments dépendent de contenus à venir).

---

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
