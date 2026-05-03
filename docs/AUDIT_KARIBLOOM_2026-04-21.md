# Audit Karibloom — PessÓra

**Date** : 2026-04-21  
**Référentiels** : `.cursor/rules/karibloom-client-builder.mdc` (pack Client Builder), `.cursor/rules/pessora-project.mdc` (stack réelle du dépôt), `kb-core-workflow`, `kb-core-ui-ux`, `kb-security` (principes), skill projet `audit` (dimensions mesurables).  
**Méthode** : revue statique du code `src/`, config Vite, `supabase/migrations/`, comparaison avec `docs/AUDIT_SECURITE_PESSORA.md` (2025-02) et `docs/AUDIT_GLOBAL_KARIBLOOM_PESSORA.md`.

> **Écart stack assumé** : le pack Karibloom cible Next.js 15 App Router ; PessÓra est **Vite + React Router + HeroUI v3** — l’audit juge la **conformité aux intentions** (sécurité, forms, SEO, qualité, doc) **transposées** à cette stack, pas une non-conformité « Next obligatoire ».

---

## 1. Synthèse exécutive

| Domaine | Verdict | Commentaire |
|--------|---------|-------------|
| **Auth & session** | **Bon** | `AuthContext` branché sur **Supabase Auth** + profils / abonnements ; plus de mock décrit dans l’audit sécurité 2025. |
| **Routes protégées** | **Bon** | `ProtectedRoute` redirige vers `/connexion` ; `ProtectedAdminRoute` exige `isAdmin` ; routes `/admin/*` enveloppées dans `App.tsx`. |
| **Secrets front** | **Bon** | `supabaseClient.ts` : uniquement `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ; pas de `service_role` dans le repo analysé. |
| **Télémétrie locale** | **Bon** | Aucune occurrence de `127.0.0.1:7244` dans `src/` (point critique de l’ancien audit — résolu). |
| **Formulaires Karibloom** | **Partiel** | Zod + RHF sur flux sensibles (ex. bilan, événements) ; **Login / Register** : validation HTML seulement ; **Contact** : `preventDefault` sans envoi ni Zod. |
| **SEO / déploiement** | **Partiel** | `PageSEO` + `seoConfig` ; pas de `robots.txt` / `sitemap.xml` versionnés dans `public/` ; OG dans `index.html` surtout statique (cf. audit global). |
| **Qualité TypeScript** | **Partiel** | Nombreux `as any` / `eslint-disable` sur accès Supabase typés — dette technique, pas bloquant immédiat. |
| **Démo espace membre** | **À surveiller** | Routes `/demo-espace/*` : accès sans auth réelle — acceptable si **réservé dev / démo** et désactivé ou protégé en prod. |

**Priorités** (ordre recommandé) :  
1. **Contact** : schéma Zod + envoi (Edge Function, Resend, ou backend) + honeypot / rate limit côté serveur.  
2. **Login / Register** : Zod + messages d’erreur alignés `kb-forms`.  
3. **SEO prod** : `robots.txt`, `sitemap.xml`, OG par route si besoin partage social.  
4. **Typage Supabase** : réduire `any` (types générés / helpers `TablesInsert`).

---

## 2. Score qualité technique (skill `audit`)

| # | Dimension | Score /4 | Synthèse |
|---|-----------|----------|----------|
| 1 | Accessibilité | **3** | Skip link + `#main-content` dans `App.tsx` ; labels `sr-only` sur Login ; quelques patterns perfectibles (loading avec emoji décoratif, formulaire Contact sans états d’erreur serveur). |
| 2 | Performance | **3** | Lazy routes, `manualChunks` Vite, lazy `img` post-hydratation ; médias lourds dans `public/` (vidéos) — à surveiller LCP selon pages. |
| 3 | Responsive | **3** | Breakpoints Tailwind, composants admin / marketing adaptés ; vérifier touch targets sur écrans rares. |
| 4 | Theming | **3** | Tokens `@theme` / `noir` dans `index.css` ; usage cohérent sur les parcours récents. |
| 5 | Anti-patterns « slop » | **3** | Direction éditoriale assumée ; pas de `dangerouslySetInnerHTML` sur le bot ; petits écarts règle « emoji comme icône structurelle » sur loaders. |

**Total : 15 / 20** — **Bon** (aligné « 14–17 Good » du skill audit), avec marge sur forms + SEO + polish a11y.

---

## 3. Findings par sévérité (Karibloom + UX core)

### P1 — Majeur (avant prod idéale)

| ID | Sujet | Détail | Référence |
|----|--------|--------|------------|
| P1-1 | **Contact sans backend** | `Contact.tsx` : `onSubmit` → `preventDefault()` uniquement, aucun appel API, pas de Zod. Non conforme `kb-forms` / risque spam si branché sans garde-fous. | `src/pages/Contact.tsx` |
| P1-2 | **Auth forms sans Zod** | Login / Register : `required` + `type=email` mais pas de schéma client (longueur MDP, messages unifiés). | `src/pages/auth/Login.tsx`, `Register.tsx` |
| P1-3 | **RLS = ligne de défense** | Le front admin s’appuie sur `isAdmin` + Supabase ; la **sécurité réelle** reste les **policies RLS** sur `events`, `products`, `profiles`, etc. À valider systématiquement à chaque migration (non vérifiable uniquement par lecture TS). | `supabase/migrations/*.sql` |

### P2 — Mineur

| ID | Sujet | Détail |
|----|--------|--------|
| P2-1 | **Webhook PessoBot** | Fallback URL n8n en dur si `VITE_PESSOBOT_WEBHOOK_URL` absent — préférer **échec explicite en build** ou env obligatoire en prod. | `src/components/common/Chatbot.tsx` |
| P2-2 | **`as any` Supabase** | Friction typage ; maintenance et régressions possibles. | Multiples fichiers admin / hooks |
| P2-3 | **SEO statique** | Pas de `robots.txt` / `sitemap` dans `public/` ; OG dynamiques limités. | `public/`, `PageSEO` |
| P2-4 | **Routes démo** | `/demo-espace` contourne l’auth — documenter « dev only » ou feature-flag prod. | `src/App.tsx` |

### P3 — Polish

| ID | Sujet | Détail |
|----|--------|--------|
| P3-1 | **Loaders emoji** | `ProtectedRoute` / `ProtectedAdminRoute` : animation avec caractère 🌿 — remplaçable par skeleton neutre (règle UI core « emoji pas comme icône structurelle »). | `ProtectedRoute.tsx`, `ProtectedAdminRoute.tsx` |
| P3-2 | **Cookie consent / analytics** | Non audité en profondeur ici ; si GTM/PostHog ajoutés, aligner `kb-cookie-consent`. | — |

### P0 — Bloquant

**Aucun P0 identifié** sur la base de la revue statique actuelle (auth réelle, admin protégé, pas d’ingest localhost, pas de service role client).

---

## 4. Écarts résolus vs `AUDIT_SECURITE_PESSORA.md` (2025-02)

| Ancien point | État 2026-04-21 |
|--------------|-----------------|
| Auth mock + localStorage | **Corrigé** : Supabase session + chargement profil. |
| `ProtectedRoute` commenté | **Corrigé** : redirection active si `!isAuthenticated`. |
| `/admin` public | **Corrigé** : `ProtectedAdminRoute` sur toutes les routes admin. |
| POST `127.0.0.1:7244` | **Absent** du `src/` actuel. |
| `window.confirm` | **OK** : usages remplacés / commentaires `ConfirmDialog` (grep ciblé). |

---

## 5. Points positifs à conserver

- **Architecture** : pages, lazy loading, `lib/`, `hooks/`, données dans `src/data/`.  
- **Sécurité surface** : pas de `dangerouslySetInnerHTML` sur le flux chatbot analysé ; variables `VITE_*` pour config publique.  
- **UX système** : `ConfirmDialog` pour confirmations destructives admin ; `AnnouncementPopup` rationalisé (chemins, thème clair).  
- **Migrations** : historique SQL versionné sous `supabase/migrations/` — aligné esprit « migrations versionnées » Karibloom (même si le runtime n’est pas Next).  
- **Accessibilité** : lien « Aller au contenu », `main` focalisable, patterns focus sur plusieurs écrans.

---

## 6. Actions suggérées (checklist)

- [ ] Contact : Zod + RHF + endpoint + anti-spam (minimum honeypot + validation serveur).  
- [ ] Login / Register : schémas Zod + limites de longueur champs.  
- [ ] `VITE_PESSOBOT_WEBHOOK_URL` obligatoire en CI / prod ; retirer fallback URL en dur ou le garder **uniquement** en `import.meta.env.DEV`.  
- [ ] `public/robots.txt` + `sitemap.xml` (ou génération build) pour prod.  
- [ ] Réduire `any` : régénérer types Supabase ou wrappers typés par table.  
- [ ] Revalider RLS sur toutes les tables touchées par le front admin (checklist release).  
- [ ] Décision produit : `/demo-espace` en production (désactiver / protéger / basic auth).

---

## 7. Référence documents projet

- `docs/AUDIT_SECURITE_PESSORA.md` — historique ; sections auth/admin à mettre à jour si besoin de traçabilité client.  
- `docs/AUDIT_GLOBAL_KARIBLOOM_PESSORA.md` — grille Karibloom transposée Vite.  
- `docs/ACTIONS_LOG.md` — journal des changements majeurs.

*Fin du rapport — revue statique, pas de Lighthouse ni pentest réseau.*

---

## 8. Inventaire MCP (suite alerte OX Security / avril 2026)

**Objectif** : vérifier si le **runtime** du projet (dépendances npm + code) embarque le SDK ou des serveurs **Model Context Protocol**.

| Vérification | Résultat |
|--------------|----------|
| `package.json` — dépendances / devDependencies | Aucun paquet `@modelcontextprotocol/*`, `modelcontextprotocol`, ni nom contenant `mcp-server`. |
| `package-lock.json` — recherche transitive | Aucune occurrence de `modelcontextprotocol` / chaîne équivalente. |
| Code `src/`, `scripts/` — import ou chaîne « MCP » protocole | Aucune correspondance pour `modelcontextprotocol`, `@modelcontextprotocol`, `StdioServerParameters`, `mcp/types`. |

**Conclusion** : le dépôt **PESSORA** n’intègre **pas** le stack MCP côté application (navigateur / build Vite). L’exposition liée aux recherches OX Security concerne d’autres produits (IDE, frameworks agents, plateformes qui **lancent** des processus MCP avec config non sanitisée) — **pas ce frontend**.

Les dossiers `.cursor/` / MCP côté **Cursor** (hors bundle prod) ne sont pas livrés au visiteur du site ; ils relèvent uniquement de l’environnement de développement.

*Analyse effectuée le 2026-04-21 (grep + lecture `package.json`).*
