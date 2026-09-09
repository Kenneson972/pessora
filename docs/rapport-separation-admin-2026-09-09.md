# Rapport — Séparation admin.pessora.fr

Date : 09/09/2026 · Branche : `feat/separer-admin` · Voir aussi `docs/admin-separe-conception.md`

## Ce qui a été fait

1. **Analyse des références** (étape 1 obligatoire) : Dal Cielo (`.../DALCIELO`) et Shiine
   (`.../SHIINE`) — pattern réel = 1 app Next.js, 1 projet Vercel, 2 domaines, middleware
   par hostname, auth PIN, pas de CORS (API server-side). Écart identifié avec la
   décision actée dans le brief ("2 bundles / 2 projets Vercel") — transposé en gardant
   l'esprit "1 déploiement, split par domaine" (détails dans le doc de conception).
2. **Extraction des 12 modules admin** vers un bundle dédié :
   - `src/AdminApp.tsx` (nouveau) : toutes les routes `/admin/*` + `/connexion`.
   - `src/admin-main.tsx` + `admin.html` (nouveaux) : point d'entrée Vite dédié.
   - `src/App.tsx` : routes/imports lazy `/admin/*` retirés, remplacés par un filet de
     sécurité `RedirectToAdminApp` (redirection JS si mauvais domaine).
3. **Build 2 entrées** : `vite.config.ts` (`rollupOptions.input: { main, admin }`).
   Build local vérifié : `admin.html` → bundle `admin-*.js` distinct, `index.html` →
   bundle `main-*.js` distinct, sans référence croisée aux pages de l'autre bundle.
4. **Split par domaine côté Vercel** : `vercel.json` — rewrite conditionnel
   (`has: [{ type: "host", value: "admin.pessora.fr" }]`) vers `admin.html`.
5. **CORS edge functions unifié et multi-origine** : `supabase/functions/_shared/cors.ts`
   accepte désormais une liste d'origines (`ALLOWED_ORIGIN` séparé par virgules). Les 11
   fonctions qui dupliquaient chacune leur propre logique CORS inline (
   `verify-subscription-session`, `create-checkout-session`, `create-customer-portal-session`,
   `delete-order`, `get-stripe-member`, `send-contact-email`, `cancel-stripe-subscription`,
   `admin-portal-session`, `create-subscription-session`, `update-order-status`,
   `send-newsletter`) importent maintenant ce helper partagé — comportement inchangé pour
   les origines déjà autorisées, prêtes à accepter `admin.pessora.fr` dès que le secret
   est mis à jour.
6. **Vérifications** :
   - `tsc --noEmit` : vert.
   - `vite build` : vert, 2 bundles distincts confirmés dans `dist/`.
   - Test manuel (dev + Playwright) : `AdminApp` route correctement `/admin` →
     `ProtectedAdminRoute` → redirection `/connexion` (non authentifié) → page Login
     rendue sans erreur console. Connexion réelle non testée (pas d'accès aux
     identifiants admin dans cette session).

## Ce qui reste (déploiement, hors code)

1. **DNS** (à faire par Ken, côté OVH — zone `pessora.fr`) :
   - Ajouter le domaine `admin.pessora.fr` dans Vercel → projet `pessora` → Settings →
     Domains → Add. Vercel affichera alors la valeur exacte à enregistrer.
   - Valeur attendue (à confirmer à l'écran Vercel) : **CNAME** `admin` →
     `cname.vercel-dns.com.`
2. **Secret Supabase `ALLOWED_ORIGIN`** (Edge Functions → Secrets, projet
   `tulhiipucrnyejheuitv`) : mettre à jour pour inclure `https://admin.pessora.fr`
   (ex. valeur finale : `https://www.pessora.fr,https://admin.pessora.fr`).
3. **Vérification post-déploiement du rewrite par host** (`vercel.json` `has: host`) —
   n'a pas pu être testé en conditions réelles (Vite dev n'a pas cette couche). À valider
   en recette : `https://admin.pessora.fr/admin` doit servir le bundle admin,
   `https://www.pessora.fr/admin` doit rediriger (filet `RedirectToAdminApp`) ou 404 propre.
4. **Vercel** : un seul projet existant (`pessora`, `prj_h1CYBFpNToC0Km8SgvWSsbjlrItS`) —
   pas de second projet créé (divergence assumée avec le brief, voir doc de conception).
   Rien à créer côté Vercel projets, juste le domaine à attacher (point 1).

## Points de vigilance pour la recette QA (sur les DEUX domaines)

- `pessora.fr` / `www.pessora.fr` :
  - Parcours public inchangé (menu, checkout, `/mon-espace`) — non retesté dans cette
    session (déjà validé juste avant ce chantier), à re-vérifier vu le retrait des routes
    `/admin/*` de `App.tsx`.
  - `pessora.fr/admin` (ou tout `/admin/*`) doit rediriger vers `admin.pessora.fr`.
- `admin.pessora.fr` :
  - Connexion avec un compte `role=admin` réel (ex. `admin@pessora.mq`) → doit arriver sur
    `AdminOverview`.
  - Chaque module (`AdminMembers`, `AdminCommandes`, `ModeBar`, `RetraitsGamme`,
    `AdminCommunications`, `AdminProduitsGammes`, `AdminContenu`, `AdminBilans`,
    `AdminEvenements`) à cliquer une fois pour confirmer le chargement (pas de régression
    de comportement attendue — code identique, juste déplacé).
  - Actions qui appellent une edge function (ex. portail Stripe membre, annulation
    abonnement, changement statut commande) — à tester en particulier, car ce sont ces
    appels qui dépendaient du CORS mono-origine corrigé au point 2 ci-dessus. Sans la mise
    à jour du secret `ALLOWED_ORIGIN`, ces actions échoueront en CORS depuis
    `admin.pessora.fr`.
  - Lien "Créer un compte" sur `/connexion` (admin) pointe vers `/inscription`, route
    absente du bundle admin → 404 si cliqué. Comportement mineur, non bloquant, listé
    dans le doc de conception comme point à corriger.

## Merge

Ne pas merger seul — relecture équipe (alcyone/vela) + recette QA sur les deux domaines,
comme demandé dans le brief.
