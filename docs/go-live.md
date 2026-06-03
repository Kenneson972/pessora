# Mise en ligne — pessora.fr

## Remettre le site en prod

```bash
cd PESSORA
vercel --prod --yes
```

Cette commande :
- Build le projet (`tsc && vite build`)
- Déploie en production
- Recrée les alias `pessora.fr` et `www.pessora.fr`

## Avant de lancer

- [ ] **Stripe live** — suivre `docs/stripe-live-deployment.md`
- [ ] **Templates email** — coller les 5 HTML dans Supabase → Authentication → Email Templates
- [ ] **Resend** — `RESEND_API_KEY` live dans secrets Supabase
- [ ] **n8n PessoBot** — `pessora.fr` dans allowedOrigins du workflow
- [ ] **Tester un paiement** — 1 commande complète
- [ ] **Build local** — `npm run build` doit passer sans erreur

## Si besoin de cacher à nouveau

```bash
vercel alias rm pessora.fr --yes
vercel alias rm www.pessora.fr --yes
```
