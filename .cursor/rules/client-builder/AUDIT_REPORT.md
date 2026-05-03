# 🔍 Audit Karibloom Client Builder Rules — Refonte Next.js 15

> Audit réalisé le 2026-04-20 sur les règles Cursor `.mdc` de `/CLIENT BUILDER KARIBLOOM/client-builder-rules/`
> Base de référence : projets Next.js réels **DIAMANT NOIR** (conciergerie booking) et **DALCIELO** (e-commerce pizzeria).

---

## 1. Problème principal identifié

Les règles actuelles décrivent une stack **CRA + React Router 7 + PHP + Express Stripe + MySQL**, alors que les projets clients sont tous en **Next.js 15 App Router + React 19 + Supabase (Auth / DB / Storage / Realtime) + Stripe via API Routes + TypeScript**.

L'agent se retrouve donc à suivre des patterns obsolètes (CRACO, `React.lazy`, `react-helmet-async`, `.htaccess`, endpoints PHP avec CSRF manuel, Express pour Stripe) qui n'ont **aucun sens** dans un projet Next.js. Résultat : code généré incohérent, conflits de conventions, temps perdu à désapprendre.

### Autre problème : il manque des pans entiers de règles

Les projets réels contiennent **beaucoup plus** que ce que les règles couvrent :

- Dashboards admin (conciergerie, CRM, cuisine) et espaces clients (réservations, livret, messagerie)
- Authentification Supabase (magic link OTP, password, RBAC admin/proprio/tenant)
- Moteur de booking (disponibilités, iCal sync, price engine, calendrier)
- E-commerce (panier persistant Zustand, checkout Stripe, tracking commande public)
- Wishlist + barre de comparaison
- Notifications temps réel (Supabase Realtime) + emails transactionnels (Brevo)
- API Routes (patterns `route.ts`, server actions, rate limit)

Aucune règle existante ne guide l'agent sur ces sujets.

---

## 2. Décisions de refonte

| Décision | Justification |
|---|---|
| **Next.js 15 App Router = stack par défaut unique** | 100% des projets clients actifs l'utilisent |
| **Supprimer le profil React SPA** (`stack-react-spa.mdc`) | Aucun projet actuel n'en a besoin ; réintroductible si besoin futur |
| **Supprimer `kb-backend.mdc`** (PHP + Express) | Remplacé par `kb-supabase.mdc` + `kb-api-routes.mdc` + `kb-cart-checkout.mdc` |
| **Réécrire `kb-architecture.mdc`** | Structure `app/` + RSC + boundaries client au lieu de `src/pages/` CRA |
| **Réécrire `kb-forms.mdc`** | HeroUI + Server Actions + FormData multipart au lieu de react-hook-form + CSRF PHP |
| **Réécrire `kb-performance.mdc`** | Core Web Vitals en contexte RSC, `next/dynamic`, `next/image`, `optimizePackageImports` |
| **Réécrire `kb-security.mdc`** | CSP via `next.config.js` headers, Stripe signature verification dans route.ts, RLS Supabase |
| **Réécrire `kb-deployment.mdc`** | Vercel/o2switch Node, variables Supabase/Stripe, migrations SQL, domaines |
| **Réécrire `kb-seo.mdc`** | `generateMetadata`, `app/sitemap.ts`, `app/robots.ts`, OpenGraph dynamique |
| **Réécrire `karibloom-client-builder.mdc` (main)** | Nouvelle stack + table des nouvelles règles |

---

## 3. Nouvelles règles créées (8)

| Fichier | Rôle |
|---|---|
| `04-features/kb-supabase.mdc` | Clients browser/server/admin, RLS, Storage, Realtime, migrations SQL, types générés |
| `04-features/kb-auth.mdc` | Magic link OTP (clients) + password (admin), middleware, protected routes, RBAC 3 niveaux |
| `04-features/kb-dashboard.mdc` | Dashboards admin + espace client, layouts protégés, assistant-views, sidebar, NotificationBell, CRUD |
| `04-features/kb-booking.mdc` | Availability engine, iCal sync (Airbnb/Booking), price-engine (jour/weekend/semaine), calendar UI |
| `04-features/kb-cart-checkout.mdc` | Panier persistant Zustand + cookies, Stripe Checkout, webhook `route.ts`, order tracking public, PDF receipt |
| `04-features/kb-api-routes.mdc` | Patterns `route.ts`, Server Actions, zod serveur, rate limit memory, CSRF origin check, erreurs typées |
| `04-features/kb-notifications.mdc` | Bell realtime Supabase, emails Brevo/Resend, toasts, templates, anti-spam |
| `04-features/kb-wishlist-compare.mdc` | Favoris hybride localStorage + Supabase (sync on login), barre de comparaison max 3, RLS wishlist |

---

## 4. Règles archivées / supprimées (3)

| Fichier | Action | Raison |
|---|---|---|
| `02-stack/stack-react-spa.mdc` | **Supprimé** | Aucun projet ne l'utilise ; réintroductible si besoin |
| `04-features/kb-backend.mdc` | **Supprimé** | Remplacé par kb-supabase + kb-api-routes + kb-cart-checkout |
| `karibloom-client-builder.mdc` (racine) | **Supprimé** | Doublon avec `01-core/karibloom-client-builder.mdc` |
| `kb-action-documentation.mdc` (racine) | **Supprimé** | Doublon avec `01-core/kb-action-documentation.mdc` |

---

## 5. Règles conservées telles quelles (neutres à la stack)

| Fichier | Pourquoi |
|---|---|
| `01-core/kb-core-workflow.mdc` | Neutre : plan / vérif / doc |
| `01-core/kb-core-ui-ux.mdc` | Neutre : accessibilité / responsive / états |
| `01-core/kb-workflow-orchestration.mdc` | Neutre : méthodologie agent |
| `01-core/kb-action-documentation.mdc` | Neutre : ACTIONS_LOG |
| `02-stack/kb-ui-routing.mdc` | Neutre : gouvernance UI lib |
| `02-stack/kb-project-stack-ui-matrix.mdc` | Mise à jour mineure : biais Next.js |
| `03-architecture/kb-styling.mdc` | Neutre : Tailwind + CSS vars |
| `03-architecture/kb-components.mdc` | Mise à jour mineure : exemples en `.tsx` |
| `03-architecture/kb-data-model.mdc` | Mise à jour mineure : TypeScript + types/index.ts |
| `03-architecture/kb-mobile-responsive.mdc` | Neutre |
| `04-features/kb-cookie-consent.mdc` | Neutre (vanilla-cookieconsent v3) |
| `04-features/kb-image-optimizer.mdc` | Mise à jour mineure : privilégier `next/image` |
| `04-features/kb-error-states.mdc` | Mise à jour mineure : `loading.tsx` / `error.tsx` / `not-found.tsx` |
| `05-ui-ux/**` (toutes) | Neutres : animations, micro-interactions, dark mode, ui-ux-pro-max |
| `06-advanced/kb-async-bundle.mdc` | Neutre (déjà Next.js friendly) |
| `06-advanced/kb-rerender.mdc` | Neutre |
| `06-advanced/kb-server-fetching.mdc` | Déjà Next.js RSC |
| `06-advanced/kb-nextjs-pitfalls.mdc` | Déjà dédié Next.js ✓ |
| `07-optional/kb-i18n.mdc` | Mise à jour : option cookie-based (DALCIELO/DIAMANT) ou `next-intl` |
| `07-optional/kb-pwa.mdc` | Neutre |

---

## 6. Structure cible `client-builder-rules/`

```
client-builder-rules/
├── _INDEX.mdc                           # ✍️ RÉÉCRIT
├── AUDIT_REPORT.md                      # 🆕 ce fichier
├── 01-core/
│   ├── karibloom-client-builder.mdc    # ✍️ RÉÉCRIT (stack Next.js + Supabase)
│   ├── kb-core-workflow.mdc            # conservé
│   ├── kb-core-ui-ux.mdc               # conservé
│   ├── kb-workflow-orchestration.mdc   # conservé
│   └── kb-action-documentation.mdc     # conservé
├── 02-stack/
│   ├── kb-stack-selection.mdc          # ✍️ SIMPLIFIÉ (Next.js par défaut)
│   ├── kb-project-stack-ui-matrix.mdc  # MAJ légère
│   ├── kb-ui-routing.mdc               # conservé
│   └── stack-nextjs-app-router.mdc     # conservé (profil unique)
│   # stack-react-spa.mdc SUPPRIMÉ
├── 03-architecture/
│   ├── kb-architecture.mdc             # ✍️ RÉÉCRIT (app/ Next.js)
│   ├── kb-components.mdc               # MAJ légère (TSX)
│   ├── kb-styling.mdc                  # conservé
│   ├── kb-data-model.mdc               # MAJ légère (TS types)
│   └── kb-mobile-responsive.mdc        # conservé
├── 04-features/
│   ├── kb-supabase.mdc                 # 🆕 nouveau (remplace kb-backend)
│   ├── kb-auth.mdc                     # 🆕 nouveau
│   ├── kb-api-routes.mdc               # 🆕 nouveau
│   ├── kb-dashboard.mdc                # 🆕 nouveau
│   ├── kb-booking.mdc                  # 🆕 nouveau
│   ├── kb-cart-checkout.mdc            # 🆕 nouveau
│   ├── kb-notifications.mdc            # 🆕 nouveau
│   ├── kb-wishlist-compare.mdc         # 🆕 nouveau
│   ├── kb-seo.mdc                      # ✍️ RÉÉCRIT (generateMetadata)
│   ├── kb-forms.mdc                    # ✍️ RÉÉCRIT (HeroUI + Server Actions)
│   ├── kb-security.mdc                 # ✍️ RÉÉCRIT (Next.js headers + RLS)
│   ├── kb-performance.mdc              # ✍️ RÉÉCRIT (RSC, next/image, next/dynamic)
│   ├── kb-error-states.mdc             # MAJ légère
│   ├── kb-image-optimizer.mdc          # MAJ légère (next/image)
│   └── kb-cookie-consent.mdc           # conservé
│   # kb-backend.mdc SUPPRIMÉ
├── 05-ui-ux/                           # tous conservés
├── 06-advanced/                        # tous conservés
├── 07-optional/
│   ├── kb-deployment.mdc               # ✍️ RÉÉCRIT (Vercel + o2switch Node)
│   ├── kb-i18n.mdc                     # MAJ légère
│   └── kb-pwa.mdc                      # conservé
└── skills/                             # conservé
```

---

## 7. Résumé chiffré

| Métrique | Valeur |
|---|---|
| Règles avant audit | 36 |
| Règles supprimées | 4 |
| Nouvelles règles créées | 8 |
| Règles réécrites | 10 |
| Règles mises à jour légèrement | 6 |
| Règles conservées telles quelles | 12 |
| **Règles après refonte** | **40** |

---

## 8. Comment synchroniser vers les projets

Après refonte, pour aligner un projet client (ex. DIAMANTNOIR) avec les nouvelles règles :

```bash
# Supprimer les anciennes règles du projet
rm -rf "/Users/.../DIAMANTNOIR/.cursor/rules/client-builder"
rm -f  "/Users/.../DIAMANTNOIR/.cursor/rules/kb-"*.mdc

# Copier les nouvelles règles
cp -r "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/"*.mdc \
      "/Users/.../DIAMANTNOIR/.cursor/rules/client-builder/"

cp -r "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/01-core" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/02-stack" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/03-architecture" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/04-features" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/05-ui-ux" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/06-advanced" \
      "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules/07-optional" \
      "/Users/.../DIAMANTNOIR/.cursor/rules/client-builder/"
```

Ou utilise un lien symbolique pour garder la source unique :

```bash
ln -s "/Users/.../CLIENT BUILDER KARIBLOOM/client-builder-rules" \
      "/Users/.../DIAMANTNOIR/.cursor/rules/client-builder"
```

---

## 9. Bilan d'exécution (livré le 2026-04-20)

### 9.1 Nouvelles règles créées (8)

| Fichier | Lignes | Extrait des patterns capturés |
|---|---|---|
| `04-features/kb-supabase.mdc` | ~290 | 3 clients (browser singleton / server no-store / admin service_role), env vars, RLS, migrations, Storage buckets, Realtime typé, types générés |
| `04-features/kb-auth.mdc` | ~420 | Dual workflow password (admin/proprio) + magic link OTP (tenant), middleware, RBAC 3 niveaux, layouts protégés |
| `04-features/kb-api-routes.mdc` | ~360 | Route Handlers vs Server Actions, Zod serveur, rate limit memory + Upstash, CSRF via Origin, webhook Stripe idempotent |
| `04-features/kb-dashboard.mdc` | ~530 | Admin/proprio vs espace client, sidebar, assistant-views, CRUD Server Actions, NotificationBell Realtime, empty states |
| `04-features/kb-booking.mdc` | ~540 | Price engine pur serveur, sync iCal multi-OTA, `EXCLUDE USING GIST` contre double-booking, access_token guest, cron Vercel |
| `04-features/kb-cart-checkout.mdc` | ~620 | Zustand `persist` kb-cart-v1, recompute prix serveur, webhook signé + idempotence `stripe_events_processed`, order pré-Stripe |
| `04-features/kb-notifications.mdc` | ~470 | Realtime bell `user_id=eq.X`, `supabaseAdmin()` pour insert, Resend + templates React Email, email_log idempotent, prefs |
| `04-features/kb-wishlist-compare.mdc` | ~440 | localStorage `kb_wishlist_v1` guest → merge Supabase au login, Zustand persist + partialize, limite compare, `useHydrated` anti-mismatch |

### 9.2 Règles réécrites (10)

| Fichier | Lignes | Transformation |
|---|---|---|
| `01-core/karibloom-client-builder.mdc` | ~320 | Vision agence, 5 types de projets, table des 22 features, workflow 11 étapes, standards qualité |
| `02-stack/kb-stack-selection.mdc` | ~165 | Stack imposée Next.js 15, fin de l'arbitrage SPA, interdictions explicites (CRA, PHP, Gatsby) |
| `03-architecture/kb-architecture.mdc` | ~260 | Structure `app/` + route groups, root layout server + providers client, aliases `@/*` |
| `03-architecture/kb-components.mdc` | ~320 | Arbre de décision Server vs Client, Hero/Section/Card, Server Actions en props |
| `03-architecture/kb-data-model.mdc` | ~290 | Supabase dynamique + `content/*.ts` statique (remplace `servicesData.js`), types générés, ISR |
| `04-features/kb-forms.mdc` | ~490 | react-hook-form + Zod + Server Actions, honeypot, UTM, upload via Route Handler, RGPD |
| `04-features/kb-error-states.mdc` | ~440 | `loading.tsx`/`error.tsx`/`not-found.tsx`, Suspense local, skeletons, EmptyState, WidgetErrorBoundary |
| `04-features/kb-seo.mdc` | ~460 | `metadata`/`generateMetadata`, `next/og` dynamique, helper `lib/seo/schemas.ts` (8 builders JSON-LD) |
| `04-features/kb-image-optimizer.mdc` | ~400 | `next/image` obligatoire, Supabase Storage + signed URLs, `plaiceholder` blur, `OptimizedImage` wrapper |
| `04-features/kb-performance.mdc` | ~420 | RSC-first, streaming, `next/dynamic`, cache/revalidate, `next/font`, React Compiler, PPR, CWV cibles |
| `04-features/kb-security.mdc` | ~480 | Env vars zod-validés, CSP nonce dynamique, RLS, CSRF Origin, webhooks signés, rotation secrets |
| `07-optional/kb-deployment.mdc` | ~380 | Vercel env scopés, preview deploys, Supabase prod séparé + migrations CI, cron, Sentry, rollback |

### 9.3 Règles supprimées (4)

- `02-stack/stack-react-spa.mdc` — SPA CRA obsolète
- `04-features/kb-backend.mdc` — PHP + Express + MySQL obsolète
- `karibloom-client-builder.mdc` (racine) — doublon
- `kb-action-documentation.mdc` (racine) — doublon

### 9.4 Métriques finales

| Métrique | Valeur |
|---|---|
| Règles avant | 36 |
| Règles supprimées | 4 |
| Nouvelles règles créées | 8 |
| Règles réécrites | 12 |
| Règles conservées | 20 |
| **Règles après refonte** | **40** |
| Lignes totales ajoutées (nouvelles + réécrites) | ~7 800 |

### 9.5 Prochaines actions recommandées

1. Sync les règles vers les projets actifs (DIAMANTNOIR, DALCIELO, PESSORA, KARIBLOOM) via `cp` ou `ln -s`
2. Exécuter une passe de validation sur un nouveau projet : vérifier que l'agent Cursor suit les nouveaux patterns
3. Documenter les leçons apprises en cours de build dans `ACTIONS_LOG.md`
4. Prévoir une consolidation trimestrielle des règles (merge si nouveaux patterns récurrents)
