# Claude Code Configuration - Karibloom — PESSORA

## État projet — 10/09/2026 (à lire avant tout chantier)

> ⚠️ **Le CR du RDV Catherine du 10/09/2026 fait autorité** — détail complet dans `docs/brief-chantier-pessora-2026-09-10.md`. Cette section ne garde que ce qu'il ne faut PAS contredire.

### Contexte
- Client : PessÓra (Catherine) — bar protéiné Herbalife, Fort-de-France. Stack : **Vite SPA** (seul projet client en Vite, pas Next.js) + **Supabase** (compte SÉPARÉ — PAT `ACCES_SUPABASE_TOKEN`, `ACCESS_TOKEN` = 401) + **Stripe en mode TEST** (zéro paiement réel possible). Vercel prod. Repo : `Kenneson972/pessora`.

### ⚠️ Óra+ — ARCHIVAGE TOTAL (décision Catherine, 10/09/2026) — NE RIEN RÉINTRODUIRE
- La **surface publique** est déjà supprimée (route `/ora-plus`, nav, footer, teasers, prix « avec Óra+ ») — commit `b59da8a`/merge `d76d6f6`, recette QA verte.
- 🔴 **La mécanique interne est à archiver AUSSI** (lot 4) : pages membre, blocs admin, `create-subscription-session` (fonction morte). **L'ancienne consigne « mécanique interne conservée » est PÉRIMÉE** — ne pas s'y référer.
- **Seule exception conservée** : la remise −50 % panier (`useIsOraPlus`), retirée au **lot 1** et **avant toute bascule live**.
- ⚠️ **Les 9 abonnements Stripe LIVE (7 actifs — 174,30 €/mois — + 2 impayés) ne sont PAS touchés** (relevé sur le compte Stripe de la cliente, 10/09/2026 : 9 au total, tous à 24,90 €/mois) — décision ferme de la cliente, elle les gère au bar. **Hors périmètre : ne rien faire.**
- Ne jamais recréer : route `/ora-plus`, lien public vers Óra+, teaser ou mention « avec Óra+ » côté public.

### Décisions actées au RDV du 10/09/2026 (remplacent le scope du 02/09)
- Catégories : **MEGA THÉ · PROTEIN SHAKE · COFFEE** — **Énergie supprimée**. ⚠️ **« Formules » n'est PAS une catégorie** → c'est un **moteur de recommandation/bundle** (thé + shake, prix validé côté serveur). Mapping des boissons NON tranché → attendre **la carte complète** de la cliente.
- Prix : **Mega Thé 600 cl = 10 €** · **Shake Grand = 14 €** · **boosters = 2 €** (au lieu de 1 €).
- **Archivage des tailles depuis l'admin**, avec garde serveur (taille archivée = refus, jamais 0 €).
- **Challenge 21 jours** = rubrique **DANS la page Événements** (pas de page ni landing séparée) ; créneaux de bilan ouverts **J-14 → jour J**, calculés **à la lecture** (décision : pas de `pg_cron`) ; **inscription au bilan obligatoire** pour participer.
- **La page Bilan disparaît** ; le choix du créneau migre dans la page Événement (retour prévu au lot A, avec la garantie serveur).
- **Click & Collect uniquement** sur le site + **lien Easy Ta Vie** pour la livraison.
- **PessoBot** : réécriture du prompt assignée à **alcyone** (phase 2) — **pas à Claude Code**.
- Le **gommage** : la cliente corrige le visuel elle-même → **ne pas y toucher**.
- Stripe live : clé `sk_live` corrompue → **roll côté client**. Ne pas utiliser de clés live tant que non validées.

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
