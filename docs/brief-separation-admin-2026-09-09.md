# BRIEF CLAUDE — Séparation Admin Pessora (admin.pessora.fr)

*Date : 09/09/2026 · Auteur : équipe Karibloom · À lire AVANT tout code.*

## Mission
Extraire le dashboard admin de la SPA Pessora actuelle vers une **application séparée** servie sur **`admin.pessora.fr`**, en suivant le pattern déjà en place chez les autres clients Karibloom (Dal Cielo → `admin.pizzadalcielo.com`, Shiine, Kayvila).

## ⚠️ ÉTAPE 1 — OBLIGATOIRE : analyser les références existantes AVANT de coder
Les repos des clients ayant déjà un admin séparé sont **en local sur cette machine** :
- `/opt/data/repos/dalcielo` — dashboard admin séparé (admin.pizzadalcielo.com)
- `/opt/data/repos/shiine-by-s` — dashboard admin séparé
- Doc interne utile : `docs/RECAP_DASHBOARDS_ADMIN_CLIENT.md` (dans CE repo pessora)

Analyser : structure de l'app admin, routing, auth (comment le rôle admin est protégé), code partagé, déploiement sous-domaine Vercel, CORS.
⚠️ Ces références sont en **Next.js** ; Pessora est une **SPA Vite** → **TRANSPOSER le pattern, ne pas copier-coller**.

## Contexte Pessora (état réel vérifié 09/09)
- Client : PessÓra (Catherine) — bar protéiné Herbalife, Fort-de-France.
- Stack : **Vite SPA** (SEUL projet client Karibloom en Vite) + **Supabase** (compte SÉPARÉ — PAT `ACCES_SUPABASE_TOKEN` ; `ACCESS_TOKEN` principal = 401) + Stripe (mode TEST). Vercel prod.
- Aujourd'hui : **16 routes `/admin/*` + espace membre `/mon-espace` dans le MÊME bundle** (`src/App.tsx`). Rien n'est séparé.
- Modules admin à extraire (~12) : AdminOverview, AdminMembers (+ MemberDetail), AdminBilans, AdminEvenements, AdminCommandes, ModeBar (plein écran, usage bar), RetraitsGamme, AdminCommunications, AdminProduitsGammes, AdminContenu (tabs infos-bar/carrousel/moments), AdminSplitGammes + AdminLayout/navigation.

## Architecture cible (décision actée — @alcyone)
**Mono-repo Vite à 2 entrées** (2 HTML → 2 bundles → 2 projets Vercel), PAS 2 repos séparés :
- **pessora.fr** (site public) : parcours client complet — bar, gamme, checkout, suivi commande — **+ `/mon-espace`** (les membres connectés restent côté public : bilans, événements, abonnement).
- **admin.pessora.fr** (admin) : les ~12 modules de gestion + ModeBar plein écran.
- ~60 fichiers partagés (supabaseClient, AuthContext, types, hooks, data, ui, design tokens) → 2 repos serait fragile ; le partage reste interne au mono-repo.

## Points techniques à traiter
- **Code partagé** : définir les entrées/builds Vite (2 `index.html` / configs) et l'arbre d'imports pour ne pas embarquer l'admin dans le bundle public (l'allègement du bundle public est un des buts).
- **Auth / RLS** : le rôle admin (Catherine) se connecte sur admin.pessora.fr ; les membres restent sur pessora.fr. Vérifier comment le rôle est déterminé (table `profiles` ? claim JWT ?) et que la séparation ne casse pas les RLS.
- **CORS Supabase** : ajouter `admin.pessora.fr` aux allowed origins (projet `tulhiipucrnyejheuitv`).
- **DNS** : sous-domaine `admin.pessora.fr` à créer (vérifier qui gère le DNS pessora.fr — Ken/OVH ?).
- **Vercel** : 2 projets (pessora + admin-pessora) — repo existant `prj_h1CYBFpNToC0Km8SgvWSsbjlrItS`.

## Règles de travail (rappel CLAUDE.md)
- Toujours en branche `feat/...`, JAMAIS pousser sur `main` directement.
- **NE PAS réintroduire ORA+** (surface publique coupée en prod — voir CLAUDE.md).
- Aucun secret dans le code, aucun `.env` commité.
- Hors périmètre : vidéo hero (Ken la refait dans CapCut — ne pas retoucher `public/hero-video.*`), refonte visuelle, catégories Shakes/Thé/Formules et Challenge 21 (en attente RDV Catherine jeudi 10/09), tests de paiement (déjà traités).
- Ne pas créer de fichiers inutiles ; préférer modifier l'existant.

## Livrables
1. Code sur une branche `feat/separer-admin` (ou sous-branches propres), build `tsc` vert.
2. Note de conception courte (`docs/admin-separe-conception.md`) : structure retenue, ce qui part dans chaque app, ce qui est partagé.
3. **Rapport de fin** (`docs/rapport-separation-admin-2026-09-09.md`) : ce qui a été fait, ce qui reste (déploiement, DNS, CORS), les points de vigilance pour la recette.
4. Le merge passe par la relecture équipe (alcyone/vela) + recette QA sur les DEUX domaines — ne pas merger seul.
