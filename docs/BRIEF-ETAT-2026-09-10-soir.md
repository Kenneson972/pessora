# BRIEF — PessÓra : état du chantier au 10/09/2026 (soir)

*Complète `docs/brief-chantier-pessora-2026-09-10.md` (décisions du RDV). Ce fichier = l'**état d'avancement**.*

---

## 1. OÙ ON EN EST

### ✅ FAIT — 1ʳᵉ passe (mergée ET déployée)
`main` = **`396730c`** (5 branches mergées dans l'ordre : partenariat → archivage-tailles → archivage-Óra+ → boosters → remise Óra+). Conflits résolus à la main (`DrinkOptionsModal.tsx`, `cartDisplayPrice.ts`), **`tsc --noEmit` exit 0**.

Recettes vertes :
- **Partenariat** : email **livré** (vérifié via l'API Resend), honeypot OK, confirmation seulement si succès.
- **Archivage des tailles** : archiver/restaurer depuis l'admin ✅, la taille disparaît de la fiche et du modal, boisson à taille unique toujours commandable, 0 erreur console.
- **Boosters** : `BOOSTER_PRICE_EUR = 2` dans `_shared/pricing.ts`, **test de mutation vérifié** (2→3 fait rougir la suite) → le test a des dents.

**Edge functions déployées nommément** : `create-checkout-session` v22 → v23 → **v24**, `create-subscription-session` v13 → **v14**. `verify_jwt` préservé ; `stripe-webhook`, `send-contact-email`, `update-order-status` **non touchés** (toujours `False`).

### ✅ PASSES 1 & 2 — MERGÉES ET DÉPLOYÉES (`main` = `161f089`)
- **Tout est en ligne** : `create-checkout-session` **v24** (embarque `_shared/pricing.ts`), `create-subscription-session` **v14**, `verify_jwt` préservé ; `stripe-webhook` / `send-contact-email` / `update-order-status` **non touchés**.
- **Recette argent : A/B/C/D VERTS** (A 16,00 € = Grand 12 € + 2 boosters · B 12,00 € même avec un `ora_plus` forgé → aucune remise · C **409 avec ET sans `Origin`**, aucune session créée · D ESPRESSO 2,50 €). **E CLOS** par non-régression : `stripe-webhook` **v15 intact**, ses imports `_shared/` inchangés, contrat `metadata[order_ids]` identique des deux côtés, chaîne déjà prouvée par 2 commandes `paid` du 09/09.
- **Hygiène** : ENVKAR nettoyé (2 artefacts tronqués marqués `# PERIME`, notes sorties de la valeur, pré-vol à **0 anomalie**) · `CLAUDE.md` à jour (plus de consigne Óra+ périmée) · ⚠️ **PAT Supabase (`ACCES_SUPABASE_TOKEN`) expire le 16/11/2026** → à renouveler avant (il couvre SQL, migrations, secrets, déploiements).

### 🚀 PRÊT À LANCER — aucune dépendance à la carte
1. **Lot A — Challenge/Bilan** : spec dédiée `docs/brief-lot-a-challenge-bilan-2026-09-10.md` (`6b8e440`). **Il n'attend PAS la carte** : la rubrique vit dans **Événements** (`events.type`, `bilan_slots`, règles serveur, créneaux J-14) et ne consomme **aucune** donnée boisson.
2. **Structure catégories** (nav 3 piliers + retrait d'Énergie) **avec le filet dans le code** — « toute catégorie non rattachée reste **visible**, jamais masquée » — et le critère d'acceptation *produits affichés sur `/menu` == produits actifs en base*. **COFFEE intouchée** (CAFÉ LONG + ESPRESSO).
3. **Les 3 petits** : `X-Robots-Tag` par chemin dans `vercel.json` · merge de `chore/gitignore-env` · réparation de la **lecture carte PessoBot** (config n8n).
4. ⏳ **Claude** : « gros bloc Partenariat / page Contact » — **pas encore poussé**, c'est à lui.

### ⏳ EN ATTENTE DE LA CLIENTE — et ça ne bloque que ces points
- La **carte des boissons** → **mapping boissons → MEGA THÉ / PROTEIN SHAKE** + **prix par produit** ; le **moteur Formule** ; le prompt **PessoBot v2**.
- Le **lien Easy Ta Vie** dédié.
- (Le lot A, la structure catégories et les 3 petits ne dépendent **pas** de la carte.)

---

## 2. CORRECTIONS DE RAPPORT (à ne pas propager)

- **Sitemap** : le fichier committé contenait **68 URLs** (périmé : 3 boissons désactivées, `/ora-plus`, `/bilan-bien-etre`), il n'était **pas** figé à 11. Le bug est réel : `generate-sitemap.ts` sélectionnait `updated_at` (colonne inexistante) → **une régénération aurait effondré le sitemap**. Formulation exacte : « régénérer aurait cassé le sitemap », pas « le sitemap était vide ».
- **Build local impossible** : `@heroui-pro/react@1.0.0-beta.1` s'installe sans `exports` map (postinstall npm bloqué) → `@heroui-pro/react/css` irrésoluble. **Le gate de merge = `npx tsc` en local + le build Vercel.** Ne pas tenter `npm run build` en local (et ne PAS copier le paquet d'un repo frère : `beta.8` casse sur `"KPI" is not exported`).
- **`cartStore.test.ts`** : 10 échecs **pré-existants** (localStorage/jsdom), reproduits à l'identique sur `main` — ce n'est pas une régression.

---

## 3. RÈGLES DE TRAVAIL (rappel)
- Branche `feat/...`, **jamais de push direct sur `main`**, **aucun merge sans recette QA**.
- **Une seule personne dans le repo à la fois** : les merges en cours bloquent tout autre accès (c'est arrivé).
- **Toutes les règles de prix vivent côté serveur** (`create-checkout-session`) — le client affiche, le serveur décide.
- Dates : calculs en **UTC-4 (Martinique)**, écriture en valeurs naïves.
- Ne pas réintroduire Óra+ côté public. Ne pas toucher au visuel du gommage (la cliente le corrige).
- **Aucun secret** dans le code ni dans un chat ; les bascules de secrets se font **avec un test juste après**.
- **Avant toute recette qui envoie un email/notification : vérifier le destinataire réel** (un test est parti chez la cliente le 10/09).

## 4. HORS PÉRIMÈTRE
- Les **7 abonnés Stripe Óra+** : **ne rien faire** (décision cliente ferme — gérés en présentiel).
- **Bascule Stripe live** : opération séparée, après recette complète en test.
- Vidéo hero (Ken/CapCut), refonte visuelle globale.
