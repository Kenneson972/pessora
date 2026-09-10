# CHECKLIST GO-LIVE — PessÓra (à exécuter le jour de la décision « live »)

> ⚠️ **Ce fichier est la version de référence** (repo, versionné). Il remplace la section « GO-LIVE » qui vivait dans la fiche gbrain `clients/pessora.md` — celle-ci a été **écrasée le 10/09 à 17:31** par un ingest gbrain (la fiche est re-synchronisée, donc **ne rien y écrire de durable** : le durable va dans le repo).
> Rien de tout ceci ne se fait avant la **recette complète en mode TEST** (item 9).

## A. Stripe / paiement
1. **Récupérer** du compte Stripe de Catherine (mode Live) : `sk_live` + `whsec_` de l'endpoint — **bouton copier → fichier ENVKAR direct, jamais par chat**. Aucun produit/prix Stripe à créer (checkout en `price_data` dynamique).
2. **Endpoint webhook live** : `https://tulhiipucrnyejheuitv.supabase.co/functions/v1/stripe-webhook` + **les 7 événements** exacts (vérifiés = les `case` du code). *(Fait le 10/09 : endpoint recréé, `enabled`, 7 events.)*
3. ⚠️ **Poser `STRIPE_SECRET_KEY` ET `STRIPE_WEBHOOK_SECRET` dans la MÊME opération** (une demi-bascule = tous les webhooks rejetés). Normaliser `SITE_URL` = `https://www.pessora.fr` (3 fonctions retombent sur `localhost:5173` sinon).
4. **Test du secret** : `Send test webhook` → **`checkout.session.async_payment_failed`** (notre handler ne fait qu'un `console.error` → 200 prouve la signature sans rien écrire). ⚠️ **Ne PAS** tester avec `checkout.session.completed` en `mode: subscription` (déclencherait `activateOraPlus`).
5. ⚠️ **PURGE des données de test AVANT ouverture des ventes** — **filtre par date** (`created_at < go-live`), jamais une liste figée : chaque tentative de checkout crée une ligne. Inventaire au 10/09 : **15 commandes / 19 `order_items`** (3 bar 09/09 · 6 gamme 09-10/09 dont `TEST-VELA` · 5 `pending` · 6 de juin dont Mode Bar « KERAN » `60f8b600`) · comptes `admin@pessora.mq`, `demo@pessora.mq` · lignes `stripe_events_processed` synthétiques · **8 inscriptions de test** sur `RUN CLUB - MARIN` (noms `TEST-VELA` / `TEST-VELA-NEG`, tél. `0696000000` → `0696000007`, dont 2 essais de diagnostic) · les **nouvelles lignes `cs_test_…`** créées par les recettes du 10/09. Requête à écrire par alcyone, validée par vela, exécutée au bon moment.
6. **Avant la bascule** : les chantiers prix / catégories / remise Óra+ doivent être passés — sinon le site encaisse en réel avec l'ancien catalogue (et −50 %).
7. **Preuve finale** : **micro-paiement réel + remboursement** (accord de Catherine) **ET** `Stripe → Developers → Webhooks → Recent deliveries` en **200** (un paiement qui passe ne prouve pas que NOTRE webhook traite).
8. **Abonnés Óra+** : `subscriptions` ne contient que des lignes de TEST. Les **7 abonnés live de Catherine** vivent **hors du site** → **ne rien faire** (décision ferme), ils sont gérés en présentiel.

## B. Fenêtre de test / bascule
9. ⚠️ **PRÉREQUIS BLOQUANT avant la pose des secrets** : **recette complète verte en mode TEST** (bar, gamme, retraits/ModeBar, suivi de commande, e-mails, admin). C'est la **dernière fenêtre** pour tester sans argent réel.
10. **Après bascule, seul outil de vérif** = micro-paiement réel + remboursement.
11. **ROLLBACK documenté** : reposer les **3 secrets de TEST** depuis l'ENVKAR (`STRIPE_SECRET_KEY_TEST` 107 car. · `STRIPE_WEBHOOK_SECRET_TEST` 38 car.) → corriger → repasser en live. ⚠️ **Après retour en live : vérifier que l'endpoint est toujours `enabled`** (des échecs de signature prolongés peuvent le faire désactiver). Contrôle **automatisé** par le script d'audit de vela.
12. **Pas de double-secret** (live + test en parallèle) : le rollback suffit, le handler reste simple.
13. **Format `whsec_` = 38 caractères** (24 octets) — mesuré contre un secret qui **fonctionne**.

## C. SEO / indexation — **une seule opération, en 3 temps, dans cet ordre**
14. **(1)** Poser les **`X-Robots-Tag: noindex` par chemin** dans `vercel.json` (auth, espace membre, admin, mockups, suivi de commande) · **(2)** vérifier **en live**, path par path, que les chemins techniques ont le header **et** que les pages de contenu ne l'ont pas · **(3)** **seulement ensuite** lever le `noindex, nofollow` d'`index.html` (SPA : ce seul verrou rend aujourd'hui *toutes* les routes noindex). `admin.html` reste en `noindex`.
15. **Régénérer le sitemap en dernier** (`scripts/generate-sitemap.ts` — **jamais** éditer `public/sitemap.xml` à la main). Vérif : aucune URL morte (`/ora-plus`, `/bilan-bien-etre`, boissons archivées), aucune page d'auth, chaque URL rend avec du contenu réel.

## D. E-mails / comptes / accès
16. **`ADMIN_EMAIL`** : rebasculer de `ken972@yopmail.com` (test) vers **`pessora.mq@gmail.com`**, puis vérifier un envoi réel. 🔴 **Secret qu'on oublie** — sinon les demandes de contact/partenariat des vrais clients partent dans une boîte yopmail publique. *(Corriger aussi le défaut en dur dans `send-contact-email/index.ts:63` : `pessora.fr@gmail.com` n'est PAS l'adresse de la cliente.)*
17. **Compte admin de Catherine** : créer avec **`pessora.mq@gmail.com`** (aujourd'hui un compte `admin@pessora.mq` fictif + mot de passe faible, **seul** compte admin).
18. ⚠️ **PAT Supabase (`ACCES_SUPABASE_TOKEN`) : expire le 16/11/2026** → à renouveler avant (il couvre SQL, migrations, secrets, déploiements).
19. **Compte Stripe de test** utilisé par la fonction : **non identifié** au 10/09 (la clé test de l'ENVKAR = KARIBLOOM `acct_1S6tbUB5fgzfgwh0` ne voit pas ses sessions). À identifier (sélecteur de compte en haut à gauche) pour nettoyer ses artefacts de test — ce n'est **pas** le compte dont on posera les clés live (Catherine = `acct_1RBSJGKgjJeTGaIL`).

## E. Déploiements
20. **Edge functions** : déployer **nommément** les fonctions modifiées (`create-checkout-session`, `create-subscription-session`) — **jamais « toutes »** : `stripe-webhook`, `send-contact-email`, `update-order-status` sont en **`verify_jwt = False` exprès**. **Noter les numéros de version** (rollback : au 10/09, `create-checkout-session` v24 · `create-subscription-session` v14).
