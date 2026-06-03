# Stripe — Passage en production

## Étape 1 : Récupérer les clés live dans Stripe Dashboard

Dans [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys :

- **Clé publiable** : `pk_live_...` (pas utilisée côté frontend, tout passe par edge functions)
- **Clé secrète** : `sk_live_...`
- **Webhook secret** : créer un endpoint → `https://tulhiipucrnyejheuitv.supabase.co/functions/v1/stripe-webhook` → `whsec_...`
- **Price ID Óra+** : l'ID du prix live pour l'abonnement (dans Produits → choisir le produit live → copier `price_...`)

## Étape 2 : Mettre à jour les secrets Supabase

Dans Supabase Dashboard → Project PESSORA → Settings → Edge Functions → Secrets :

| Secret | Ancienne valeur (test) | Nouvelle valeur (live) |
|--------|----------------------|----------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_...` |
| `STRIPE_ORA_PLUS_PRICE_ID` | `price_test_...` | `price_live_...` |

À vérifier aussi :

| Secret | Valeur attendue |
|--------|-----------------|
| `ALLOWED_ORIGIN` | `https://www.pessora.fr` |
| `SITE_URL` | `https://www.pessora.fr` |
| `ORA_PLUS_PRICE_AMOUNT` | `2490` (24.90€) |

## Étape 3 : Redéployer les edge functions

Après avoir changé les secrets, redéployer les 2 fonctions critiques :
- `create-checkout-session`
- `stripe-webhook`

## Ce qui ne change PAS côté frontend/Vercel

- Aucun changement — tout Stripe passe par les edge functions
- Les `VITE_*` sur Vercel ne contiennent pas de clés Stripe

## Checklist récap

- [ ] Clé secrète live Stripe `sk_live_...`
- [ ] Webhook endpoint live + secret `whsec_...`
- [ ] Price ID Óra+ live
- [ ] Secrets Supabase mis à jour
- [ ] Edge functions redéployées
- [ ] Test paiement live (1€)

## Edge functions concernées

| Fonction | Secrets utilisés |
|----------|-----------------|
| `create-checkout-session` | `STRIPE_SECRET_KEY`, `ALLOWED_ORIGIN`, `SITE_URL` |
| `stripe-webhook` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `create-subscription-session` | `STRIPE_SECRET_KEY`, `SITE_URL`, `STRIPE_ORA_PLUS_PRICE_ID` |
| `verify-subscription-session` | `STRIPE_SECRET_KEY` |
| `cancel-stripe-subscription` | `STRIPE_SECRET_KEY` |
| `get-stripe-member` | `STRIPE_SECRET_KEY` |
| `create-customer-portal-session` | `STRIPE_SECRET_KEY`, `SITE_URL` |
| `admin-portal-session` | `STRIPE_SECRET_KEY` |
