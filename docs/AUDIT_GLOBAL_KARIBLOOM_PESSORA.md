# Audit global PessÓra — référentiel **Karibloom Client Builder**

**Date** : 2026-04-21  
**Périmètre** : frontend repo `PESSORA` (React + Vite), règles skill `KARIBLOOM/.claude/skills/karibloom-client-builder/` + `.cursor/rules/karibloom-client-builder.mdc` + `.cursor/rules/pessora-project.mdc`.  
**Méthode** : revue statique du code et de la config (pas de run Lighthouse dans ce document).

Les exemples du skill Karibloom (CRA/CRACO, Radix/shadcn, PHP, `react-helmet-async`) sont **transposés** à la stack réelle : **Vite**, **HeroUI v3**, **Supabase**, **`PageSEO`** + `index.html`.

---

## Synthèse exécutive

| Axe | Verdict | Commentaire court |
|-----|---------|-------------------|
| **Init & stack** | Conforme | React 19, Vite, Tailwind v4, deps cohérentes ; `.env.example` pour `VITE_*`. |
| **Architecture & data** | Conforme | `pages/`, `components/`, `data/`, `hooks/`, `lib/`, `contexts/` ; contenu métier majoritairement data-driven. |
| **Design system** | Conforme | Tokens `@theme` dans `index.css`, usage `noir` / surfaces éditoriales. |
| **Composants** | Partiel | Pas de dossier `components/sections/` dédié ; `ui/` + `layout/` + `home/` + `cart/` — acceptable. |
| **Routing & perf** | Conforme | Lazy routes dans `App.tsx`, `manualChunks` Vite, `ScrollToTop`, `PageLoadingFallback`. |
| **Animations** | Conforme | Framer Motion, patterns `motionReveal`, `prefers-reduced-motion` sur plusieurs écrans. |
| **Formulaires** | Partiel | Zod + RHF sur Bilan, Événement, Newsletter ; **Login / Register / Contact** sans schéma Zod côté client. |
| **SEO** | Partiel | Titres + description dynamiques (`PageSEO` + `seoConfig`) ; OG/Twitter **statiques** dans `index.html` ; pas de `sitemap.xml` dans le repo ; JSON-LD surtout en statique. |
| **Sécurité** | Partiel | Pas de clé service role front ; chat sans `dangerouslySetInnerHTML` sur le bot ; audit dédié `AUDIT_SECURITE_PESSORA.md` ; formulaire contact **sans** envoi / validation serveur. |
| **Backend / données** | Écart assumé | Karibloom cite PHP/MySQL/Express — PessÓra : **Supabase** (auth, profils, produits, commandes) : aligné avec `pessora-project.mdc`, pas avec le skill « tel quel ». |
| **Déploiement** | Partiel | Pas de `.htaccess` / `manifest.json` / `robots.txt` versionnés dans `public/` (seul `favicon.svg` listé à l’audit) ; à prévoir pour hébergement Apache (o2switch) selon `deployment.md`. |

**Priorités recommandées** (ordre suggéré) :  
1. **Contact** : Zod + RHF + endpoint sécurisé (ou intégration existante) + anti-spam basique.  
2. **Login / Register** : schémas Zod (email, mot de passe, noms) pour alignement Karibloom + meilleure UX erreurs.  
3. **SEO** : OG dynamiques par route ou meta React Helmet équivalent ; `sitemap.xml` + `robots.txt` pour prod.  
4. **Déploiement** : pack Apache (headers, HTTPS, SPA fallback) selon `rules/deployment.md` + `security.md`.

---

## 1. Init & project-setup (`project-setup.md`)

| Critère Karibloom | PessÓra | Statut |
|-------------------|---------|--------|
| `package.json` clair, scripts dev/build | `npm run dev` / `build` / `lint` / `generate:product-seed` | OK |
| Variables d’environnement documentées | `.env.example` : `VITE_SUPABASE_*`, `VITE_PESSOBOT_WEBHOOK_URL` | OK |
| Build outil | Vite (écart CRA/CRACO documenté dans le récap projet) | OK (adaptation) |

---

## 2. Architecture (`architecture.md`)

| Critère | Observation |
|---------|-------------|
| **Pages = routes** | `src/pages/*.tsx` + lazy dans `App.tsx` | OK |
| **Composants** | `components/layout`, `common`, `ui`, `home`, `member`, `cart` | OK ; pas de `sections/` explicite — regrouper sections lourdes d’une même page pourrait aider la maintenance. |
| **Data hors composants** | `src/data/*` (menu, headerNav, seoConfig, infoData, etc.) | OK |
| **Hooks / lib** | `hooks/`, `lib/`, `store/` (panier Zustand) | OK |
| **Pas de DB secrète côté client** | Données publiques + Supabase anon | OK |

---

## 3. Styling (`styling.md`)

| Critère | Observation |
|---------|-------------|
| Variables CSS / tokens | `@theme` dans `src/index.css` (`noir`, surfaces, typo Montserrat) | OK |
| Cohérence DA | Direction éditoriale / luxe léger alignée specs internes | OK |

---

## 4. Composants (`components.md`)

| Critère | Observation |
|---------|-------------|
| Réutilisation | `SectionTitle`, `ImageCard`, `PageShell`, `ArrowBtn`, etc. | OK |
| UI library | HeroUI v3 (écart Radix/shadcn du skill de base) | Assumé par le projet |

---

## 5. Routing (`routing.md`)

| Critère | Observation |
|---------|-------------|
| React Router | Routes publiques, auth, `/mon-espace/*`, `/admin/*`, mockups | OK |
| Lazy loading pages | `React.lazy` + `Suspense` dans `App.tsx` | OK |
| Scroll | `ScrollToTop` | OK |

---

## 6. Animations (`animations.md`)

| Critère | Observation |
|---------|-------------|
| Framer Motion | Home, Contact, carrousels, `CartDrawer`, etc. | OK |
| Accessibilité mouvement | `useReducedMotion` / `isReducedMotion` sur parties du site | OK |

---

## 7. Formulaires (`forms.md`)

| Critère | Observation |
|---------|-------------|
| **Zod + react-hook-form** | `BilanBienEtre.tsx`, `EvenementDetail.tsx`, `NewsletterSignup.tsx` | OK |
| **Login / Register** | `useState` + validation minimale implicite (Supabase renvoie les erreurs) | **À améliorer** — schémas Zod + messages champs. |
| **Contact** | `Form` HeroUI, `preventDefault` seul, **pas d’envoi API**, pas de Zod | **À traiter** (lead capture + validation + CSRF côté backend quand endpoint prêt, comme le skill). |
| **CSRF** | Non applicable tant que pas de POST métier côté même origine ; à prévoir avec API PHP/Edge | À planifier |

---

## 8. SEO (`seo.md`)

| Critère | Observation |
|---------|-------------|
| Meta titre / description par route | `PageSEO` + `getSEOForPath` + `seoConfig` | OK pour title/description |
| **Canonical** | Mis à jour en JS (`origin + pathname`) | OK |
| **Open Graph / Twitter par page** | Uniques dans `index.html` (accueil) | **Partiel** — les partages de `/menu`, `/contact`, etc. gardent souvent les métas d’accueil sauf si réseaux relisent le HTML après exécution JS (comportement variable). |
| **JSON-LD** | `CafeOrCoffeeShop` dans `index.html` | OK pour entité locale ; pas de BreadcrumbList dynamique par route (option Karibloom). |
| **Sitemap** | Aucun fichier `sitemap.xml` dans le dépôt | **Manquant** pour objectif SEO Karibloom. |
| **robots.txt** | Absent du `public/` audité | **Manquant** (sauf génération côté hébergeur). |

---

## 9. Performance (`performance.md`)

| Critère | Observation |
|---------|-------------|
| Code splitting | Lazy pages + `manualChunks` (react, motion, ui, supabase) | Bon alignement esprit Lighthouse / bundles |
| Images | `loading="lazy"` injecté dans `AppLayout` ; preload LCP `logo.jpeg` dans `index.html` | OK |
| Cible Lighthouse 90+ | Non mesuré ici | **À valider** en CI ou manuellement (Lighthouse / WebPageTest). |

---

## 10. Sécurité (`security.md` + `AUDIT_SECURITE_PESSORA.md`)

| Critère | Observation |
|---------|-------------|
| Secrets client | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` uniquement ; pas de service role dans le code audité | OK |
| XSS | Pas de `dangerouslySetInnerHTML` sur le flux chat repéré dans le grep ciblé `src/` | OK (maintenir) |
| Télémétrie dev | Pas de `127.0.0.1:7244` dans `src/` (contrairement à anciennes notes d’audit doc) | OK côté sources actuelles |
| **Headers HTTP** (.htaccess / CSP) | Non versionnés dans `public/` | Recommandation Karibloom : ajouter au déploiement o2switch / CF |
| **RLS Supabase** | Documenté dans migrations + récap admin | Hors front mais critique — suivre `AUDIT_SECURITE_PESSORA.md` |

---

## 11. Data model (`data-model.md`)

| Critère | Observation |
|---------|-------------|
| Produits / menu | `menuData`, catalogue Supabase + fallback, scripts seed | OK |
| Panier | `CartLine` local, persistance `zustand` | OK pour v1 (hors synchro serveur) |

---

## 12. Backend (`backend.md`)

| Critère | Observation |
|---------|-------------|
| API Karibloom type PHP/Express | Remplacé par **Supabase** (auth, tables, éventuellement Edge Functions) | Écart de stack documenté ; sécurité = RLS + policies. |
| Stripe | Specs admin/dashboard ; pas d’audit complet du flux paiement client dans ce document | Voir specs `2026-04-19-*` |

---

## 13. Déploiement (`deployment.md`)

| Critère | Observation |
|---------|-------------|
| Build production | `vite build` → `dist/` | OK |
| **Apache** `.htaccess`, HTTPS, SPA fallback | Non présents dans `public/` au moment de l’audit | **À ajouter** pour prod o2switch |
| PWA `manifest.json` | Non repéré | Optionnel selon besoin client |

---

## 14. Écarts volontaires vs template Karibloom « strict »

| Sujet | Karibloom (skill) | PessÓra |
|-------|-------------------|---------|
| Build | CRA + CRACO | Vite |
| UI | Radix / shadcn | HeroUI v3 |
| SEO head | react-helmet-async | `PageSEO` + mutation `document` + `index.html` |
| Auth / données | Souvent API custom | Supabase Auth + client anon |
| Panier | Souvent serveur | Client-only v1 (spec 2026-04-21) |

Ces écarts sont **cohérents** avec les règles projet PessÓra tant que sécurité (RLS, pas de secrets) et SEO sont complétés là où le skill est plus exigeant (OG par page, sitemap, formulaires).

---

## 15. Checklist d’actions (copier pour suivi)

- [ ] Contact : validation Zod + RHF + soumission vers backend / n8n / Supabase avec rate limit côté serveur.  
- [ ] Login / Register : schémas Zod + affichage erreurs champs.  
- [ ] SEO : meta OG/Twitter par route (ou Helmet équivalent) ; `sitemap.xml` ; `robots.txt`.  
- [ ] Prod : `.htaccess` (HTTPS, headers sécurité, fallback SPA), vérifier `canonical` / domaine prod.  
- [ ] Lighthouse : mesure sur `/`, `/menu`, `/menu/:id` après changements.  
- [ ] Maintenir `AUDIT_SECURITE_PESSORA.md` à jour après nouvelles intégrations (webhooks, formulaires).

---

## Sources utilisées pour cet audit

- `KARIBLOOM/.claude/skills/karibloom-client-builder/SKILL.md`  
- Règles : `project-setup`, `architecture`, `styling`, `animations`, `components`, `routing`, `forms`, `seo`, `performance`, `security`, `data-model`, `backend`, `deployment`  
- Projet : `PESSORA/.cursor/rules/pessora-project.mdc`, `docs/AUDIT_SECURITE_PESSORA.md`, `docs/RECAP_TRAVAIL_PESSORA.md`
