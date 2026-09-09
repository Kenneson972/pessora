# Conception — Séparation admin.pessora.com

Date : 09/09/2026 · Branche : `feat/separer-admin`

## Constat étape 1 (analyse Dal Cielo / Shiine)

Le pattern réel utilisé chez les autres clients Karibloom (Dal Cielo, Shiine) n'est **pas**
"2 apps / 2 bundles / 2 projets Vercel" : c'est **1 seule app Next.js, 1 seul projet Vercel**,
2 domaines attachés au même déploiement, avec un `middleware.ts` qui route selon le
`hostname`. L'auth admin y est un simple PIN serveur (`x-admin-pin` vs `ADMIN_PIN`), et
l'admin ne parle jamais à Supabase depuis le navigateur (tout passe par des routes API
Next.js côté serveur) — donc aucun problème de CORS Supabase chez eux.

PessÓra est une SPA Vite (pas de serveur/API routes). Transposition retenue, en gardant
l'esprit "1 déploiement, split par domaine" plutôt que "2 déploiements séparés" :

- **1 seul projet Vercel** (`pessora`, existant), **2 domaines** attachés
  (`pessora.fr` / `www.pessora.fr` + `admin.pessora.com`).
- **2 entrées Vite** (`index.html` + `admin.html` → 2 bundles JS distincts, voir
  `vite.config.ts`), au lieu d'un middleware serveur (Vite n'en a pas).
- Le split par domaine se fait via `vercel.json` (`rewrites` avec condition `has: host`) :
  requête sur `admin.pessora.com` → servie avec `admin.html` ; tout le reste → `index.html`.
  Pas besoin d'Edge Middleware custom, Vercel supporte les conditions de host nativement
  dans les rewrites.
- **Auth admin conservée telle quelle** (Supabase Auth + `profiles.role === 'admin'`,
  `ProtectedAdminRoute`) — pas de bascule vers un PIN. C'est un choix déjà en place et
  fonctionnel (testé cette session), le remplacer aurait été une régression, pas une
  transposition.
- **CORS** : contrairement aux autres clients, l'admin PessÓra appelle bien Supabase et les
  edge functions directement depuis le navigateur (pas de couche API serveur équivalente).
  Le vrai point à traiter n'est **pas** le CORS Supabase lui-même (l'API Supabase est
  permissive par défaut, la sécurité repose sur les RLS) mais le CORS **fait main** des
  edge functions PessÓra (`ALLOWED_ORIGIN` mono-origine). Corrigé : `_shared/cors.ts`
  supporte maintenant une liste d'origines séparées par virgules, et les 11 fonctions qui
  dupliquaient leur propre logique CORS inline importent désormais ce helper.
  → **Action restante (hors code)** : mettre à jour le secret `ALLOWED_ORIGIN` dans
  Supabase (Edge Functions → Secrets) pour inclure `https://admin.pessora.com`, ex :
  `https://www.pessora.fr,https://admin.pessora.com`.

## Ce qui part dans chaque bundle

**`admin.html` / `AdminApp.tsx`** (nouveau) :
- Toutes les routes `/admin/*` (AdminOverview, AdminMembers, AdminMemberDetail,
  AdminEvenements, AdminBilans, AdminCommandes, ModeBar, RetraitsGamme,
  AdminCommunications, AdminProduitsGammes, AdminContenu, AdminLayout).
- `/connexion` (Login) — nécessaire car chaque domaine a son propre `localStorage`
  Supabase (origines différentes = sessions différentes, même backend).
- `AuthProvider` + `ProtectedAdminRoute` (identiques à l'existant).
- Pas de Header/Footer/CartDrawer/CookieConsent publics (AdminLayout fournit son propre
  chrome, comme avant).

**`index.html` / `App.tsx`** (existant, allégé) :
- Tout le parcours public (Home, Menu, checkout, `/mon-espace`, etc.) — inchangé.
- Les imports lazy et routes `/admin/*` ont été retirés.
- Un filet de sécurité `RedirectToAdminApp` reste sur `/admin/*` : si quelqu'un atteint
  cette route sur le mauvais domaine (avant propagation DNS, en dev, etc.), redirection
  JS vers `admin.pessora.com` + chemin courant.

**Code partagé** (inchangé, ~60 fichiers) : `supabaseClient`, `AuthContext`, types, hooks,
`design tokens` (`index.css` importé dans les deux entrées) — pas de découpage physique,
comme chez les autres clients.

## Points de vigilance identifiés (non corrigés dans cette passe — hors périmètre immédiat)

- `Login.tsx` contient un lien "Créer un compte" → `/inscription`, route qui n'existe pas
  dans le bundle admin (404 dans l'app admin). À corriger : soit masquer ce lien en
  contexte admin, soit pointer vers `https://pessora.fr/inscription`.
- Le header CSP dans `vercel.json` est partagé entre les deux domaines (mêmes directives
  pour les deux) — suffisant pour l'instant, mais pourrait être affiné par host si besoin
  (ex. retirer `js.stripe.com` du CSP admin si l'admin n'a jamais besoin de Stripe.js
  côté client — à vérifier, `create-customer-portal-session`/`cancel-stripe-subscription`
  semblent appelés depuis l'admin membre détail).
- `index.css` (tokens + Tailwind) est importé intégralement dans les deux bundles — pas de
  purge CSS séparée par entrée. Le CSS n'est pas le poids dominant du bundle admin, mais
  une optimisation possible plus tard.
- Le test end-to-end réel du split par hostname (`vercel.json` `has: host`) n'a pu être
  fait qu'en lecture de code + build local (2 bundles distincts confirmés) : le
  comportement de rewrite conditionnel par host doit être vérifié une fois déployé sur
  Vercel (pas reproductible avec `vite dev` en local, qui n'a pas cette couche).

## DNS

Ajouter chez OVH (zone `pessora.fr`) un CNAME `admin` → `cname.vercel-dns.com.`, après
avoir ajouté le domaine `admin.pessora.com` au projet Vercel `pessora` (Settings → Domains)
— Vercel affichera la valeur exacte à ce moment-là (voir rapport de fin pour le détail).
