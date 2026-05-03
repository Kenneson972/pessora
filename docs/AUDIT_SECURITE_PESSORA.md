# Audit de sécurité – PESSORA

**Date** : 9 février 2025  
**Périmètre** : Application React (Vite) + Supabase (auth/storage/DB)  
**Référence** : Règles Karibloom (validation des entrées, pas de clés en dur, rate limiting sur les API sensibles), bonnes pratiques OWASP.

---

## 1. Synthèse

| Domaine              | État global | Points à traiter |
|----------------------|-------------|------------------|
| Authentification     | ⚠️ Critique | Mock + localStorage ; ProtectedRoute désactivé |
| Admin                | ⚠️ Critique | Route `/admin` non protégée |
| Données / env        | ✅ Correct  | Pas de secrets en dur (Supabase via VITE_*) |
| Formulaires          | ⚠️ À renforcer | Pas de validation Zod, pas de limite mot de passe |
| Télémétrie / agent log | ⚠️ Risque | Appels vers 127.0.0.1:7244, fuite d’infos si URL changée |
| Chatbot / webhook    | ⚠️ Moyen   | URL n8n en dur ; pas de rate limit côté client |
| Exposition / XSS    | ✅ Raisonnable | Pas de `dangerouslySetInnerHTML` sur le chat |
| Contact              | N/A         | Formulaire sans soumission serveur |

---

## 2. Référence Karibloom (sécurité)

Extrait des règles **Karibloom Client Builder** :

- **Sécurité** : Validation des entrées, pas de clés en dur, rate limiting sur les API sensibles.
- **Forms** : react-hook-form + Zod (recommandé).

Le présent audit vérifie le respect de ces principes sur PESSORA.

---

## 3. Authentification et session

### 3.1 Contexte d’auth (AuthContext.tsx)

- **État actuel** : L’auth est entièrement **mock**. `login` et `register` ne font aucun appel Supabase ; ils enregistrent des utilisateurs factices dans le state et dans **localStorage** (`pessora_user`, `pessora_subscription`).
- **Risques** :
  - Aucune vraie vérification d’identité : n’importe qui peut “se connecter” avec n’importe quel email/mot de passe.
  - Données utilisateur (email, nom, prénom, abonnement) stockées en **clair** dans localStorage → en cas de XSS, vol de session et fuite de données personnelles.
- **Recommandations** :
  - Remplacer le mock par les méthodes Supabase Auth (`signInWithPassword`, `signUp`) et utiliser le **session/refresh token** géré par Supabase (stockage côté Supabase, pas de copie complète du profil en localStorage).
  - Si des données profil doivent rester en client, ne pas y mettre de données sensibles et limiter la surface (ex. affichage uniquement).

### 3.2 ProtectedRoute (ProtectedRoute.tsx)

- **État actuel** : La redirection des utilisateurs non authentifiés est **commentée** :
  ```tsx
  // if (!isAuthenticated) {
  //   return <Navigate to="/connexion" replace />;
  // }
  ```
  Toutes les routes “protégées” (`/mon-espace/*`) affichent donc le contenu **sans vérification** d’auth réelle.
- **Recommandation** : Réactiver la condition et rediriger vers `/connexion` lorsque `!isAuthenticated`, dès que l’auth réelle (Supabase) sera en place.

### 3.3 Formulaires Login / Register

- **Validation** : Seuls les attributs HTML `required` et `type="email"` sont utilisés. Pas de **Zod** ni **react-hook-form** (recommandés par Karibloom).
- **Mot de passe** : Aucune règle de complexité ni longueur minimale.
- **Recommandations** :
  - Ajouter un schéma Zod (email format, mot de passe min 8 caractères, etc.) et react-hook-form.
  - Limiter la longueur des champs (ex. 200 caractères pour nom/prénom, 320 pour email) pour limiter les abus.

---

## 4. Admin

### 4.1 Protection de la route

- **État actuel** : La route **`/admin`** est déclarée comme route **publique** dans `App.tsx` :
  ```tsx
  <Route path="/admin" element={<Admin />} />
  ```
  Aucun `ProtectedRoute` ni vérification de rôle. **Tout le monde peut accéder à la page Admin** et, une fois le vrai client Supabase activé, ajouter/modifier des produits et événements.
- **Recommandation** : Protéger `/admin` par une route dédiée (ex. `ProtectedAdminRoute`) qui vérifie un rôle “admin” ou une session Supabase avec claim admin. Ne pas se contenter du simple “être connecté”.

### 4.2 Client Supabase et RLS

- **État actuel** : `supabaseClient.ts` exporte un **mock** qui ne fait pas d’appels réels. En production, le vrai client (avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`) devra être utilisé.
- **Recommandation** : En Supabase, activer des **Row Level Security (RLS)** sur les tables `products` et `events` (et storage) pour n’autoriser les insert/update/delete qu’aux utilisateurs ayant le rôle admin (ou un service role utilisé côté backend). Ne jamais compter uniquement sur le fait de “cacher” la route admin côté front.

---

## 5. Variables d’environnement et secrets

- **Secrets** : Aucune clé secrète (service role, API key privée) n’est utilisée côté client. Seuls `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_SUPABASE_BUCKET` sont utilisés → conformes à l’usage “public” des préfixes Vite. **OK**.
- **.env** : Présent dans `.gitignore` ; `.env.example` documente les variables sans valeurs. **OK**.
- **Recommandation** : Ne jamais introduire de variable du type `VITE_SUPABASE_SERVICE_ROLE` ou toute clé secrète dans le front.

---

## 6. Télémétrie / agent log

- **État actuel** : Plusieurs composants envoient des requêtes **POST** vers `http://127.0.0.1:7244/ingest/cfd70c1e-ef2e-4024-806c-398b99ba3652` avec un body JSON contenant :
  - `location`, `message`, `data` (pathname, isAuthenticated, hasUser, hasSubscription, firstName, etc.), `timestamp`, `hypothesisId`.
- **Fichiers concernés** : `App.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx`, `MemberLayout.tsx`, `Dashboard.tsx`.
- **Risques** :
  - En production, l’URL pointe vers localhost → les appels échouent (souvent en `.catch(()=>{})`), mais le code reste présent.
  - Si l’URL était un jour changée vers un serveur externe, **données utilisateur et navigation** seraient envoyées en clair (fuite de vie privée et surface d’attaque).
- **Recommandations** :
  - Retirer ces appels en production, ou les conditionner à une variable d’environnement (ex. `VITE_ENABLE_AGENT_LOG` uniquement en dev).
  - Ne pas exposer en production de données comme `firstName`, `pathname` ou états d’auth vers un tiers sans consentement et sans sécurisation (HTTPS, auth, politique de rétention).

---

## 7. Formulaire Contact

- **État actuel** : Le formulaire n’a pas de `action` ni de handler qui envoie les données à une API. Aucune soumission serveur. **Rien à auditer côté backend pour l’instant.**
- **Recommandation** : Si une future API (ex. envoi d’email type Resend) est ajoutée, appliquer les règles Karibloom : validation (Zod), sanitization, rate limiting par IP, et ne pas exposer de détails d’erreur aux utilisateurs.

---

## 8. Chatbot (PessoBot)

### 8.1 Webhook n8n

- **URL** : `https://kenneson.app.n8n.cloud/webhook/pessobot` est **en dur** dans `Chatbot.tsx`. Pas de secret partagé dans les headers pour authentifier le client.
- **Données envoyées** : `message`, `sessionid`, `page` (pathname), `userId` (si connecté). Données métier acceptables pour un bot, mais l’endpoint est public.
- **Recommandations** :
  - Mettre l’URL en variable d’environnement (ex. `VITE_PESSOBOT_WEBHOOK_URL`) pour ne pas la figer et pouvoir changer d’environnement.
  - Côté n8n : activer un rate limiting et, si besoin, une vérification (token en header ou signature) pour limiter les abus.

### 8.2 Affichage des messages (XSS)

- **État actuel** : Les réponses du bot sont affichées via `renderMessageContent(content)` qui fait `content.split('\n').map((line, index) => <p key={index}>{line}</p>)`. Pas de `dangerouslySetInnerHTML`. **Risque XSS faible** tant que le backend ne renvoie pas de HTML non échappé.
- **Recommandation** : Ne pas passer à l’affichage HTML brut pour les réponses du bot sans sanitization (ex. lib dédiée type DOMPurify). Si le bot renvoie du Markdown, utiliser un rendu Markdown sécurisé.

---

## 9. Données métier (infoData, menuData)

- **Source** : Données en dur dans `src/data/` (ex. `infoData.ts`). Pas de saisie utilisateur directe. **Pas de risque d’injection** pour ces données.
- **Contact** : `barInfo.contact`, `address.mapsUrl` sont maîtrisés. Vérifier que `mapsUrl` et `instagramUrl` ne proviennent pas un jour d’une source non fiable sans validation.

---

## 10. Build et déploiement

- **Vite** : `vite.config.ts` ne définit pas de headers de sécurité (CSP, X-Frame-Options, etc.). Ces en-têtes sont en général à configurer au niveau du **serveur** (Vercel, nginx, etc.) en production.
- **Recommandation** : Sur l’hébergeur final, configurer au minimum :
  - `X-Frame-Options: DENY` (ou SAMEORIGIN si besoin d’iframe contrôlée)
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy` adaptée (sources des scripts, images, connexions Supabase/n8n)

---

## 11. Checklist déploiement (sécurité)

- [ ] Auth réelle avec Supabase (plus de mock) ; session gérée par Supabase, pas de profil complet en localStorage.
- [ ] ProtectedRoute réactivé pour `/mon-espace/*`.
- [ ] Route `/admin` protégée (auth + rôle admin) ; RLS Supabase sur `products`, `events` et storage.
- [ ] Validation des formulaires (Zod + react-hook-form) sur Login, Register et tout formulaire métier.
- [ ] Suppression ou conditionnement (dev only) des appels agent log vers 127.0.0.1:7244.
- [ ] URL webhook PessoBot en variable d’environnement ; rate limiting côté n8n.
- [ ] Variables sensibles jamais commitées ; `.env` absent du dépôt.
- [ ] Headers de sécurité (CSP, X-Frame-Options, etc.) configurés en production sur l’hébergeur.

---

## 12. Résumé des actions recommandées

| Priorité | Action |
|----------|--------|
| Haute    | Protéger la route `/admin` (auth + rôle) et activer RLS sur les tables Supabase concernées. |
| Haute    | Remplacer l’auth mock par Supabase Auth et réactiver la redirection dans `ProtectedRoute`. |
| Moyenne  | Ajouter validation Zod (et si possible react-hook-form) sur Login / Register ; politique de mot de passe. |
| Moyenne  | Retirer ou conditionner (dev only) les appels de télémétrie agent log. |
| Moyenne  | Mettre l’URL du webhook PessoBot en `VITE_*` et sécuriser/limiter côté n8n. |
| Basse    | Headers de sécurité (CSP, X-Frame-Options, etc.) au niveau hébergeur. |

---

*Audit PESSORA – Référence : règles Karibloom (DALCIELO/.cursor/rules/karibloom-client-builder.mdc) et bonnes pratiques OWASP.*
