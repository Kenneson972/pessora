# BRIEF CLAUDE — Tests de paiement PessÓra (Stripe TEST) — 09/09/2026

> Objectif : vérifier les parcours de paiement **en Stripe TEST uniquement**, AVANT le RDV client (Catherine, jeudi 10/09). Aucune décision produit n'est prise : on teste, on audite, on ne change RIEN au périmètre.

## Contexte (déjà dans CLAUDE.md — à respecter)
- Coupe ORA+ publique **EN PROD** : ne rien réintroduire (route `/ora-plus`, teasers, prix « avec Óra+ »).
- Stripe = 100 % serveur (edge functions Supabase) ; le client n'a pas de clé publishable.
- Le site est en mode TEST → aucune vente réelle possible. C'est le but.

## Périmètre des tests — TROIS parcours
1. **Commande BAR** (le parcours client du bar) : menu → fiche boisson (taille petit/moyen/grand, boosters, lait) → panier → checkout → **créneau de retrait** → Stripe TEST → webhook → confirmation + suivi de commande.
2. **Commande GAMME (retail)** : fiche produit catalogue (« Nos Produits ») → panier → checkout Stripe TEST → confirmation. (⚠️ Ne pas activer quoi que ce soit : le tunnel retail est en test, la décision commerciale vient jeudi.)
3. **MODE BAR (admin)** : page admin `ModeBar` — une commande bar test doit y apparaître → « préparer » → statut « prêt » (+ son/notification) → suivi temps réel côté client (page SuiviCommande).

## Règles QA (vela) — IMPÉRATIF
- **Préfixer chaque test** : nom/email/commande avec `TEST-` (ex. `TEST-Ken-1`, `TEST-paiement-bar-01`) pour identification + purge en une passe AVANT go-live (la purge sera faite par la team, PAS par toi).
- **Ne rien purger** en base. Les commandes test restent (audit utile).
- **Ne pas dupliquer** les flux déjà couverts : laisse une trace de ce que tu as testé (fichier de rapport, cf. Livrables).
- Ne pas polluer : pas de fausses données marketing, pas de comptes à la volée sans préfixe `TEST-`.

## Secrets & sécurité
- **Stripe TEST uniquement** (`sk_test_…` via les secrets Supabase du projet — ne pas les afficher ni les committer).
- **INTERDICTION de toucher aux clés live** (`sk_live_…`) : ni lecture prolongée, ni bascule, ni commit.
- Ne jamais écrire de clé dans un fichier du repo, un message, ou un commit.
- Le `.env` local a été resynchronisé (clé anon Supabase) — vérifier avec @alcyone si un doute sur la config.

## Environnement
- Repo `Kenneson972/pessora`, branche de travail : `feat/tests-paiement-stripe` (celle où ce fichier est poussé).
- Stack : Vite SPA + Supabase (edge functions) — `npm run dev` pour le local.
- ⚠️ **Test E2E = passer par le SITE HÉBERGÉ (pessora.fr, déjà en mode TEST)** : en local, le webhook Stripe ne revient pas (les edge functions locales ne reçoivent pas les callbacks du projet hébergé) → la commande resterait « payée sans confirmation » = FAUSSE anomalie. Un test local doit être marqué « partiel, webhook non vérifiable en local » dans le rapport.
- Stripe TEST : carte `4242 4242 4242 4242` (exp. future, CVC quelconque).
- Le site est noindex → zéro impact SEO.

## Hors périmètre (ne pas toucher)
- La **vidéo du hero** : Ken la refait dans CapCut (ne pas modifier les assets vidéo).
- Le **visuel/layout** : aucune refonte (le site est ~90 % — on enrichit, on ne refait pas).
- Les **catégories Shakes/Thé/Formules** : non tranchées (RDV jeudi) → ne pas les implémenter.
- Le **Challenge 21 jours / newsletter / Resend** : non validés par Catherine → ne rien coder.
- ORA+ : ne rien réintroduire (voir CLAUDE.md).

## Livrables
1. Un **rapport de test** (fichier `docs/rapport-tests-paiement-2026-09-09.md`) listant chaque cas : parcours, statut (OK / échec), preuve (statut commande en base, webhook reçu), anomalies constatées.
2. Si une **anomalie code** est trouvée : la corriger sur cette branche (commit séparé, message clair) — en respectant la gate : pas de push direct sur `main`, la recette QA (vela) passera derrière.

## Après le rapport
- Signaler la fin dans la room (Ken + team) avec le résumé : couverture, anomalies, corrections.
- Le RDV Catherine (jeudi) tranchera : retail (tunnel gamme gardé/retiré), activation live ou non, ORA+ (mécanique simplifiée ou non).
