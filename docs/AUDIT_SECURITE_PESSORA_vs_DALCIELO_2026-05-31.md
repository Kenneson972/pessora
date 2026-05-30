# Audit de Sécurité — Pessora vs Dal Cielo

**Date** : 31 Mai 2026  
**Périmètre** : Comparaison complète des couches sécurité  
**Référence** : Dal Cielo (`/opt/data/repos/dalcielo`) — couche sécurité mature  

---

## 1. Tableau comparatif

| Mécanisme | Dal Cielo | Pessora | Écart |
|---|---|---|---|
| **Middleware CSRF** | ✅ Token aléatoire 32 octets, cookie `sameSite:strict`, validation sur toutes les requêtes mutantes `/api/` | ❌ **Aucun** middleware — pas de fichier `middleware.ts` | 🔴 Critique |
| **Auth Admin (serveur)** | ✅ PIN admin via header `x-admin-pin`, comparaison constant-time (`timingSafeEqual`), rate limiting intégré sur échecs | ❌ **Aucune** — la seule vérification admin est `user?.role === 'admin'` en React | 🔴 Critique |
| **Rate Limiting** | ✅ Limiteur générique par IP avec fenêtre glissante + auto-nettoyage | ❌ **Aucun** — zéro rate limiting nulle part | 🔴 Critique |
| **Audit Log** | ✅ Table `admin_audit_log`, actions typées, IP, silent fail | ❌ **Aucun** — aucune traçabilité | 🟠 Important |
| **Headers HTTP** | ✅ Complet : CSP, HSTS, XFO, nosniff, Permissions-Policy, Referrer-Policy, CORS | ⚠️ Partiel : vercel.json avec base headers mais **pas de CSP** | 🟡 Recommandé |
| **Supabase RLS** | N/A (PostgreSQL direct) | ⚠️ Non vérifié — sécurité critiques si RLS absent | 🔴 Critique (si absent) |
| **Validation entrées** | ✅ Zod sur toutes les routes admin | ✅ Zod sur Edge Functions (admin-portal-session) | ✅ OK |

## 2. Analyse détaillée Dal Cielo (ce qui marche bien)

### 2.1 Middleware CSRF (`src/middleware.ts`)
```
- Génération token : Uint8Array(32) + crypto.getRandomValues → 64 caractères hex
- Cookie : httpOnly:false (nécessaire pour lecture JS), sameSite:'strict', secure en prod
- Validation : toutes les méthodes mutantes (POST/PUT/DELETE/PATCH) sur /api/
- Exemptions documentées et justifiées :
  - /api/webhooks/stripe → signature Stripe propre
  - /api/auth/* → protégé par Bearer JWT
  - /api/account/* → protégé par Bearer JWT
  - /api/admin/* → protégé par x-admin-pin header
- Bonus : client helper `getCsrfToken()` dans `src/lib/csrf.ts`
```

### 2.2 Auth Admin (`src/lib/adminAuth.ts`)
```
- PIN admin stocké dans ADMIN_PIN (serveur uniquement)
- NEXT_PUBLIC_ADMIN_PIN toléré SEULEMENT en dev → sécurité
- Comparaison constant-time avec crypto.timingSafeEqual → anti-timing attack
- Fallback : comparaison standard si timingSafeEqual indisponible
- Rate limiting intégré sur échecs d'auth :
  - Max 15 échecs par IP en 1 minute
  - Blocage 15 minutes après seuil dépassé
  - IP extraite de x-forwarded-for puis x-real-ip
- API propre : requireAdminWithRateLimit(req) → null ou Response
- Utilisé dans 20+ routes admin
```

### 2.3 Rate Limiting (`src/lib/rateLimit.ts`)
```
- Limiteur générique : checkRateLimit(ip, maxRequests, windowMs) → boolean
- Fenêtre glissante simple
- Auto-nettoyage quand >1000 entrées (évite fuite mémoire)
```

### 2.4 Audit Log (`src/lib/auditLog.ts`)
```
- Types d'actions : order.validate/update/delete, product.create/update/delete,
  stock.update, client.create/update/delete
- IP enregistrée
- Insertion async sans bloquer l'opération principale (try/catch silencieux)
- Utilisé dans validate, stocks, products
```

### 2.5 Headers (`next.config.js`)
```
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(self), microphone=(), camera=()
- CSP complet : default-src, script-src, style-src, img-src, font-src, connect-src,
  frame-src, frame-ancestors
- HSTS en production (max-age=31536000; includeSubDomains; preload)
- CORS configuré pour /api/* avec origines autorisées
```

---

## 3. Analyse détaillée Pessora — Vulnérabilités

### 🔴 3.1 PAS de middleware CSRF — CRITIQUE

**Constat** : Aucun fichier `middleware.ts` ni aucun mécanisme anti-CSRF.

**Impact** : Toute requête mutante initiée depuis le navigateur (ex. modification de profil,
changement de rôle, commandes, etc.) est vulnérable à du CSRF si un attaquant peut faire
naviguer un admin vers un site malveillant.

**Architecture spécifique** : Pessora est un Vite SPA (pas de routes API Next.js). Mais :
- Les appels à Supabase depuis le navigateur passent par l'API Supabase directement
- Ces appels utilisent le token JWT Supabase dans les cookies/headers
- Si un attaquant peut faire une requête cross-origin vers l'API Supabase, le token
  de session peut être utilisé → CSRF possible sur les endpoints Supabase

### 🔴 3.2 PAS d'auth admin côté serveur — CRITIQUE

**Constat** :
- `isAdmin` déterminé par `user?.role === 'admin'` dans `AuthContext.tsx:303`
- Le `role` est lu depuis la table `profiles` via `supabase` (clé **anon**) → `fetchUserData()`
- `ProtectedAdminRoute` vérifie côté React uniquement

**Impact** :
- L'admin est **purement client-side** — n'importe quel utilisateur qui peut modifier
  son profil dans Supabase peut devenir admin
- Si RLS sur `profiles` est absent ou mal configuré → escalade de privilège triviale
- Même avec RLS, un attaquant qui injecte du JS peut modifier le state React localement

**Exception** : `supabase/functions/admin-portal-session/index.ts` vérifie bien le rôle
côté serveur avec `supabaseAdmin` + vérification `profile.role === 'admin'` → c'est la
**seule** vérification admin serveur dans tout le projet.

### 🔴 3.3 PAS de rate limiting — CRITIQUE

**Constat** : Aucun mécanisme de rate limiting dans tout le projet.

**Impact** :
- Brute-force sur le formulaire de connexion (`signInWithPassword`)
- Brute-force sur l'inscription
- Abus de l'API PessoBot (webhook n8n sans rate limit)
- DDoS sur les Edge Functions
- Énumération d'utilisateurs

### 🔴 3.4 RLS Supabase — INCONNU / CRITIQUE SI ABSENT

**Constat** : Impossible de vérifier le RLS depuis le code. Mais TOUS les appels
Supabase utilisent la clé **anon**, donc si RLS est absent sur :
- `profiles` → n'importe qui peut lire/modifier les rôles
- `products`, `events` → n'importe qui peut modifier le catalogue
- `orders`, `subscriptions` → fuite de données personnelles

**Les hooks admin** (`useAdminMembers`, `useAdminOrders`, etc.) chargent des données
sensibles (emails, noms, téléphones, abonnements, commandes) via la clé anon.

### 🟠 3.5 PAS d'audit log — IMPORTANT

**Constat** : Aucune traçabilité des actions d'administration.

**Impact** : En cas d'incident (modification malveillante, suppression de données),
impossible de savoir qui a fait quoi et quand.

### 🟡 3.6 PAS de CSP — RECOMMANDÉ

**Constat** : `vercel.json` a les headers de base mais pas de Content-Security-Policy.

**Impact** : Si du contenu dynamique injecte du script (XSS via chatbot, annonces, etc.),
aucune protection CSP ne limite l'exécution.

---

## 4. Plan de sécurisation priorisé (code Dal Cielo réutilisable)

### Phase 1 — 🔴 Immédiat (avant mise en production)

#### 4.1.1 Auth admin serveur → Créer une Edge Function `admin-guard`

```typescript
// supabase/functions/admin-guard/index.ts
// Vérification de rôle admin côté serveur
// RÉUTILISABLE depuis Dal Cielo : logique similaire à adminAuth.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return new Response(JSON.stringify({error:'Non autorisé'}), {status:401})
  
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return new Response(JSON.stringify({error:'Non autorisé'}), {status:401})
  
  const { data: profile } = await supabaseAdmin.from('profiles')
    .select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin')
    return new Response(JSON.stringify({error:'Accès refusé'}), {status:403})
  
  return new Response(JSON.stringify({admin:true}))
})
```

**Actions** :
- [ ] Déployer `admin-guard` Edge Function
- [ ] Tous les hooks admin (`useAdminMembers`, `useAdminOrders`, etc.) doivent d'abord
  vérifier le rôle via cette Edge Function avant de charger les données
- [ ] Le `role` dans `profiles` ne doit être modifiable QUE par une Edge Function admin
  (pas via le client anon)

#### 4.1.2 Rate limiting → Ajouter rate limiting global

**Option A** : Rate limiting via Vercel WAF/KV (si déployé sur Vercel)  
**Option B** : Edge Function `rate-limit` avec stockage Supabase ou Deno KV

```typescript
// Approche simplifiée inspirée de Dal Cielo rateLimit.ts
// Stockage: Map en mémoire (OK pour Edge Function avec faible trafic)
// ou Deno KV pour persistance
```

**Actions** :
- [ ] Rate limiting sur le formulaire login (max 10 tentatives/IP/5min)
- [ ] Rate limiting sur le webhook PessoBot (max 30 requêtes/IP/min)
- [ ] Rate limiting global sur les Edge Functions

#### 4.1.3 Vérifier et activer RLS Supabase

**Actions** :
- [ ] Auditer chaque table : `profiles`, `orders`, `order_items`, `products`,
  `events`, `event_registrations`, `subscriptions`, `bilan_bookings`,
  `bar_settings`, `storage.objects`
- [ ] Politique RLS : seuls les admins peuvent `INSERT/UPDATE/DELETE`
- [ ] Politique RLS : les membres voient leurs propres données
- [ ] `profiles.role` : seul le service_role peut modifier

#### 4.1.4 Protéger le `role` admin dans `profiles`

**Problème actuel** : `AuthContext.fetchUserData()` lit `profiles.role` via la clé anon.
Si RLS permet la lecture, OK. Mais il faut aussi empêcher la modification.

**Solution** :
```sql
-- RLS policy pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut lire son propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Écriture : seul le service_role peut modifier (via Edge Functions)
-- ou policies spécifiques par champ
CREATE POLICY "Only service_role can update role" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
```

### Phase 2 — 🟠 Important

#### 4.2.1 Audit Log → Créer table + Edge Function

```sql
CREATE TABLE admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  admin_id UUID REFERENCES auth.users(id),
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Actions** :
- [ ] Créer la table `admin_audit_log`
- [ ] Créer Edge Function `admin-audit` pour logger les actions
- [ ] Logger toutes les actions admin critiques : modification produits,
  modification événements, changement de rôle, suppression de données

#### 4.2.2 CSRF → Middleware spécifique pour appels API

Comme Pessora est un SPA Vite (pas Next.js), on ne peut pas utiliser le middleware Next.js.
**Alternatives** :
- Token CSRF dans un cookie + header personnalisé sur les appels `fetch()` vers Edge Functions
- Double-submit cookie pattern

**Actions** :
- [ ] Générer un token CSRF au login, le stocker dans un cookie `httpOnly: false`
- [ ] L'envoyer en header `x-csrf-token` sur tous les appels aux Edge Functions
- [ ] Les Edge Functions vérifient le token CSRF (comparaison cookie vs header)

### Phase 3 — 🟡 Recommandé

#### 4.3.1 CSP → Ajouter Content-Security-Policy dans `vercel.json`

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com;"
}
```

**Action** :
- [ ] Ajouter CSP dans `vercel.json`
- [ ] Tester en preview Vercel avant de déployer en production

#### 4.3.2 Validation des formulaires

- [ ] Ajouter Zod sur Login et Register (min 8 caractères mot de passe)
- [ ] Limiter la longueur des champs (email 320, nom/prénom 200)

---

## 5. Code réutilisable de Dal Cielo

### Fichiers copiables/adaptables :

| Fichier Dal Cielo | Cible Pessora | Adaptation |
|---|---|---|
| `src/lib/adminAuth.ts` (rate limiting intégré) | Edge Function `admin-guard` | Remplacer `x-admin-pin` par JWT Supabase + vérification `profiles.role` |
| `src/lib/rateLimit.ts` | Edge Function `rate-limit` | Adapter pour Deno/KV au lieu de Map en mémoire |
| `src/lib/auditLog.ts` | Edge Function `admin-audit` | Adapter pour Supabase JS au lieu de `supabase.from()` |
| `src/lib/csrf.ts` | Utilitaire front | Adapter pour SPA (cookie → header pattern) |
| `next.config.js` (headers) | `vercel.json` | ✅ Déjà fait (base headers), ajouter CSP |
| `src/middleware.ts` (CSRF) | Pas directement réutilisable | Recréer en pattern double-submit cookie |

### Patterns de code à reproduire :

1. **Pattern `requireAdminWithRateLimit(req)`** → chaque Edge Function admin commence par :
```typescript
const authError = await verifyAdmin(req)  // vérifie JWT + rôle
if (authError) return authError
const rateLimitError = await checkRateLimit(req) // vérifie quota
if (rateLimitError) return rateLimitError
```

2. **Pattern `logAdminAction()`** → après chaque mutation admin :
```typescript
await logAdminAction({
  action: 'product.update',
  entity_type: 'product',
  entity_id: productId,
  details: { changes },
  admin_id: user.id,
  ip: req.headers.get('x-forwarded-for'),
})
```

3. **Pattern CSRF double-submit cookie** → côté front :
```typescript
// Au login, stocker le token CSRF
const csrfToken = crypto.randomUUID()
document.cookie = `csrf_token=${csrfToken}; SameSite=Strict; Secure; Path=/`

// Sur chaque appel fetch
fetch(url, {
  headers: { 'x-csrf-token': csrfToken },
  credentials: 'include',
})
```

---

## 6. Checklist de déploiement sécurité

### Avant mise en production

- [ ] 🔴 RLS activé et audité sur toutes les tables
- [ ] 🔴 `profiles.role` protégé en écriture (service_role uniquement)
- [ ] 🔴 Edge Function `admin-guard` déployée
- [ ] 🔴 Tous les hooks admin passent par `admin-guard` avant de charger des données
- [ ] 🔴 Rate limiting sur login (Edge Function ou Vercel WAF)
- [ ] 🟠 Table `admin_audit_log` créée
- [ ] 🟠 Edge Function `admin-audit` déployée
- [ ] 🟠 Audit log sur toutes les mutations admin
- [ ] 🟡 CSP ajouté dans `vercel.json`
- [ ] 🟡 Validation Zod sur formulaires Login/Register

### Vérifications

- [ ] Test : utilisateur non-admin ne peut PAS accéder à `/admin`
- [ ] Test : utilisateur non-admin ne peut PAS appeler les Edge Functions admin
- [ ] Test : brute-force login → rate limit se déclenche
- [ ] Test : modification d'un produit → audit log enregistré
- [ ] Test : headers HTTP présents (CSP, HSTS, XFO, nosniff)
- [ ] Test : `profiles.role` non modifiable via l'API anon

---

## 7. Résumé exécutif

**Dal Cielo** a une couche sécurité complète et mature avec 6 piliers :
1. Middleware CSRF global
2. Auth admin serveur avec timing-safe comparison
3. Rate limiting par IP avec blocage progressif
4. Audit log typé
5. Headers HTTP complets (CSP, HSTS, etc.)
6. Validation Zod sur toutes les entrées

**Pessora** a **0 des 6 piliers** en place :
- CSRF : ❌
- Auth admin serveur : ❌ (client-side uniquement, sauf 1 Edge Function)
- Rate limiting : ❌
- Audit log : ❌
- Headers HTTP : ⚠️ (base OK, CSP manquant)
- La sécurité repose **uniquement** sur RLS Supabase (non vérifié)

**Estimation d'effort** : 3-5 jours pour les 🔴, 2-3 jours pour les 🟠, 1 jour pour les 🟡.
Total : ~1-2 semaines pour atteindre le niveau de Dal Cielo.

---

*Audit réalisé le 31 Mai 2026 — Référence : Dal Cielo `/opt/data/repos/dalcielo` vs Pessora `/opt/data/repos/pessora`*
