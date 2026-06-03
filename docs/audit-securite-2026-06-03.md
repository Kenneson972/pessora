# 🔐 Audit de Sécurité — Pessora
**Date :** 3 juin 2026
**Méthodologie :** OWASP-based, skill `security-best-practices` (OpenAI)
**Périmètre :** Frontend React/Vite + Edge Functions Supabase (Deno) + Infra Vercel

---

## 📋 Executive Summary

Pessora est globalement bien sécurisé pour une app e-commerce de cette taille. Les headers de sécurité sont en place via Vercel, un mécanisme CSRF existe, les secrets ne sont pas commités, et aucune injection XSS utilisateur n'a été trouvée.

**2 findings CRITICAL, 2 HIGH, 3 MEDIUM.**

---

## 🔴 CRITICAL

### SEC-001 — Secret PessoBot hardcodé dans le code source
- **Fichier :** `docs/n8n/pessobot-workflow-v2.1.json`
- **Impact :** La clé de signature `607dd41...` est en clair dans un fichier commité. N'importe qui avec accès au repo peut forger des requêtes valides vers le webhook PessoBot.
- **Fix :** 
  1. Faire tourner la clé immédiatement (nouvelle valeur dans .env + n8n)
  2. Supprimer la clé du fichier JSON
  3. Utiliser `git filter-branch` ou `bfg` pour purger l'historique git
  4. Mettre `docs/n8n/*.json` dans `.gitignore` ou utiliser des variables d'env n8n

### SEC-002 — .env potentiellement accessible via build
- **Fichier :** `.env`
- **Évidence :** Toutes les variables sont préfixées `VITE_`, donc elles sont incluses dans le build JS et visibles dans les devtools par n'importe quel visiteur.
- **Variables exposées :** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_BUCKET`
- **Note :** La Supabase **anon key** est conçue pour être publique (RLS côté serveur). La **service role key** n'est PAS dans ce fichier. **Risque acceptable** si RLS correctement configuré.
- **Vérification nécessaire :** S'assurer que les policies RLS Supabase sont strictes (authenticated only pour les données sensibles).

---

## 🟠 HIGH

### SEC-003 — CSP trop permissive (`unsafe-inline` + `unsafe-eval`)
- **Fichier :** `vercel.json`, ligne 15
- **Règle :** REACT-CSP-001
- **Directive actuelle :** `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`
- **Impact :** `unsafe-eval` permet l'exécution de `eval()` et `new Function()`, annulant une partie de la protection CSP contre XSS. `unsafe-inline` autorise les scripts inline.
- **Fix :** 
  1. Retirer `unsafe-eval` (Vite ne l'utilise pas en prod)
  2. Si `unsafe-inline` est nécessaire pour Stripe, utiliser un nonce ou hash CSP
  3. Tester en mode `Content-Security-Policy-Report-Only` d'abord

### SEC-004 — CSRF token non vérifié côté serveur pour tous les endpoints
- **Fichier :** `src/lib/csrf.ts` (frontend) + Supabase functions
- **Règle :** REACT-CSRF-001
- **Statut :** Le frontend envoie `X-CSRF-Token` via `csrfFetch()`, mais :
  - Les edge functions (create-checkout-session, update-order-status, etc.) ne vérifient PAS ce header
  - Stripe/Supabase gère l'auth session, mais les appels API directs ne sont pas protégés
- **Fix :** Vérifier le header `X-CSRF-Token` dans les edge functions qui modifient des données, ou documenter pourquoi ce n'est pas nécessaire (auth JWT vs cookie)

---

## 🟡 MEDIUM

### SEC-005 — `dangerouslySetInnerHTML` dans les composants JSON-LD
- **Fichiers :** `src/components/seo/ProductJsonLd.tsx`, `BreadcrumbJsonLd.tsx`, `EventJsonLd.tsx`
- **Règle :** REACT-XSS-001
- **Statut :** **Pas exploitable** — les données viennent de constantes/props du code source, pas d'input utilisateur. Le contenu injecté est `JSON.stringify(payload)` avec des données structurées.
- **Recommandation :** Pour la défense en profondeur, wrapper dans un `DOMPurify.sanitize()` ou utiliser `document.createElement('script')` + `textContent`

### SEC-006 — `window.location.origin` utilisé pour construire des URLs
- **Fichiers :** `AuthContext.tsx:298`, `PageSEO.tsx`, `BreadcrumbJsonLd.tsx`
- **Règle :** NEXT-HOST-001 (principe applicable)
- **Statut :** Utilisé pour construire des chemins relatifs (`${origin}/reinitialisation-mot-de-passe`). Pas de risque d'open redirect car l'origin vient du navigateur.
- **Recommandation :** RAS pour le moment. Si des callbacks OAuth sont ajoutés, utiliser une variable d'env `SITE_URL` plutôt que `window.location.origin`.

### SEC-007 — Données non-sensibles dans localStorage/sessionStorage
- **Fichiers :** `auditLog.ts`, `cartStore.ts`, `cookieConsent.ts`, `Chatbot.tsx`, `AnnouncementPopup.tsx`, `AdminProduits.tsx`
- **Règle :** REACT-AUTH-001
- **Statut :** Aucun token JWT, session ID, ou donnée sensible trouvé dans localStorage. Uniquement : panier, préférences UI, consentement cookies, cache admin.
- **Recommandation :** ✅ Aucune action. Bonne pratique respectée.

---

## 🟢 LOW / CONFORME

| Check | Status |
|---|---|
| Pas de `eval()` ou `new Function()` dans le code source | ✅ |
| Pas d'`innerHTML` dynamique avec input utilisateur | ✅ |
| `.env` non commité (git ls-files vide) | ✅ |
| `package-lock.json` présent | ✅ |
| Headers sécurité Vercel (STS, nosniff, XFO, Referrer, CSP) | ✅ |
| Pas d'upload fichier côté frontend | ✅ |
| Pas de `postMessage` non sécurisé | ✅ |
| Redirections via React Router (pas d'open redirect) | ✅ |
| Mode production (`npm run build`) pour Vercel | ✅ |
| Auth via Supabase (JWT + RLS) | ✅ |

---

## 🎯 Actions prioritaires

1. **IMMÉDIAT** → Corriger SEC-001 (secret PessoBot) — faire tourner la clé
2. **COURT TERME** → Corriger SEC-003 (CSP `unsafe-eval`)
3. **COURT TERME** → Vérifier SEC-002 (RLS Supabase)
4. **PLANIFIÉ** → Implémenter SEC-004 (vérification CSRF serveur) ou documenter l'exception
