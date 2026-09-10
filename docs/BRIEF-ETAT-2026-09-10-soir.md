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

**Edge functions déployées nommément** : `create-checkout-session` v22 → **v23**, `create-subscription-session` v13 → **v14**. `verify_jwt` préservé ; `stripe-webhook`, `send-contact-email`, `update-order-status` **non touchés** (toujours `False`).

### 🔄 EN COURS — 2ᵉ passe (prise par l'équipe)
- `801c433` (sur `feat/boosters-2-euros`) : refactor `_shared/pricing.ts` + `checkout.test.ts` réécrit contre le vrai module.
- `81c0233` (`feat/retrait-bilan-surface-publique`) : retrait du parcours Bilan de la surface publique (les 9 accroches : nav, footer, Home, Menu, espace membre, PessoBot, recherche, questionnaire post-inscription, routes) **+ fix du générateur de sitemap**.
- Après ces 2 merges : re-`tsc`, **redéploiement nommé de `create-checkout-session`** (elle importera `_shared/pricing.ts`), puis **recette argent A→E** (mode TEST).

### ⏳ EN ATTENTE DE LA CLIENTE
- La **carte des boissons** → débloque le mapping catégories (MEGA THÉ / PROTEIN SHAKE / COFFEE) et le moteur Formule.
- Le **lien Easy Ta Vie** dédié.
→ Ensuite : **lot A (Challenge/Bilan)**, PessoBot v2 (@alcyone, phase 2), page Partenariat complète.

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
