# Claude Code Configuration - Karibloom — PESSORA

## État projet — 09/09/2026 (à lire avant tout chantier)

### Contexte
- Client : PessÓra (Catherine) — bar protéiné Herbalife, Fort-de-France. Stack : **Vite SPA** (seul projet client en Vite, pas Next.js) + **Supabase** (compte SÉPARÉ — PAT `ACCES_SUPABASE_TOKEN`, `ACCESS_TOKEN` = 401) + **Stripe en mode TEST** (zéro paiement réel possible). Vercel prod. Repo : `Kenneson972/pessora`.

### ⚠️ Coupe ORA+ EN PROD (08/09/2026) — NE PAS RÉINTRODUIRE
- Toute la **surface publique Óra+ est supprimée** (route `/ora-plus`, nav, footer, teasers, prix « avec Óra+ ») — commit `b59da8a`/merge `d76d6f6`, recette QA verte.
- La **mécanique interne est conservée volontairement** (décision jeudi 10/09 avec Catherine) : remise −50% panier via `useIsOraPlus` (membre connecté plan `ora_plus` + status `active`), pages membre, portail Stripe, admin (MRR/membres/bilans), edge functions Stripe.
- Ne jamais recréer : route `/ora-plus`, lien public vers Óra+, teaser ou mention « avec Óra+ » côté public.

### Décisions actées 02/09 (scope figé) — RDV Catherine jeudi 10/09 pour valider la suite
- Catégories cibles : **Shakes / Thé / Formules** (actuel : menu = wellness/energie/shakes/coffee ; catalogue Nos Produits = wellness/sport/skin). Mapping des 13 boissons + catalogue NON tranché → attendre validation client.
- Tailles : « shakes petit & grand » (aujourd'hui 3 tailles optionnelles `price_small/medium/large`), « thé grand » (pas encore de gamme thé en données).
- Google OAuth connexion ✅ déjà fait ; Easy Ta Vie ✅ déjà en place (lien panier + contact, pas d'API).
- Stripe live : clé `sk_live` corrompue → roll en cours côté client (jeudi). Ne pas utiliser de clés live tant que non validées.

### Règles de travail
- Toujours brancher (`feat/...`), jamais pousser sur `main` directement ; le merge passe par une relecture équipe (alcyone/vela) + recette QA.
- Le repo contient des docs internes et des snapshots de dev en racine — ne pas créer de nouveau fichier sans nécessité, préférer modifier l'existant.

## Auto-Learn — Règle Karibloom (Toujours Active)

> Règle complète : voir `docs/kb-auto-learn.mdc`

- **DÉBUT DE SESSION** : Lire `docs/auto-learn/LEARNINGS.md` silencieusement et appliquer toutes les règles. Confirmer en 1 ligne : `✓ [N] apprentissages chargés.`
- **PENDANT LA SESSION** : Dès qu'une correction, préférence ou règle est détectée → capturer immédiatement dans `docs/auto-learn/` sans attendre qu'on le demande. Confirmer : `✓ Apprentissage noté : [règle]`
- **FIN DE SESSION** : Persister tous les nouveaux apprentissages automatiquement
- Les corrections de Kenneson sont des règles dures — ne jamais les répéter

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) unless explicitly requested
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- Use `/src` for source code files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
