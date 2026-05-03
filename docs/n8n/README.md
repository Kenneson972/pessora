# PessoBot — Workflows n8n

Ce dossier contient les exports officiels du workflow n8n PessoBot.

## Versions

- `pessobot-workflow-v2.json` — **S1 (Fondations)** — historique.
- `pessobot-workflow-v2.1.json` — **S2 (Personnalisation minimale)** — remplacé par v3.
- `pessobot-workflow-v3.json` — **S3 (Rate Limit + Tool Calling)** — à activer.
  Persona courte (~400 tokens vs ~900 en v2.1), rate limit Postgres (30 req / 10 min / IP
  et 5 req / 10 s / sessionId), et 2 tools Langchain (`get_menu`, `get_upcoming_events`)
  qui évitent d'injecter la carte entière à chaque message.
- `pessobot-tool-get-menu.json` — sub-workflow appelé par le tool `get_menu(category?)`.
- `pessobot-tool-get-upcoming-events.json` — sub-workflow appelé par le tool
  `get_upcoming_events(limit?)`.

---

## Déploiement du workflow v2.1 (S2)

### 1. Pré-requis Supabase (déjà fait en prod)

- Migration `20260424140000_pessobot_s2_profile_snapshot.sql` appliquée :
  - colonne `bar_settings.subscription_info jsonb` (seed Óra+)
  - fonction `public.fn_pessobot_profile_snapshot(uuid)` SECURITY DEFINER
  - rôle Postgres `pessobot` read-only avec accès limité à la RPC + `bar_settings` + `v_pessobot_menu`
- Password du rôle `pessobot` défini via `ALTER ROLE pessobot WITH PASSWORD '...';`

### 2. Créer la credential n8n « KARIBLOOM PESSORA »

Le workflow v2.1 pointe sur une credential Postgres nommée **KARIBLOOM PESSORA**.
Deux options :

**Option A — rester sur l'utilisateur existant `postgres.tulhiipucrnyejheuitv`**
Le workflow fonctionne mais n'exploite pas le principe du moindre privilège.

**Option B (recommandée) — créer une credential `KARIBLOOM PESSORA` avec le rôle `pessobot`**

Dans n8n Cloud : **Credentials → New → Postgres** :

| Champ        | Valeur                                                  |
|--------------|---------------------------------------------------------|
| Host         | `aws-1-us-west-2.pooler.supabase.com` (Session Pooler)  |
| Port         | `5432`                                                  |
| Database     | `postgres`                                              |
| User         | `pessobot.tulhiipucrnyejheuitv`                         |
| Password     | *(valeur générée par `ALTER ROLE pessobot WITH PASSWORD '...'`)* |
| SSL          | `require`                                               |

> ⚠️ L'utilisateur Supabase poolé suit toujours le format `<role>.<project-ref>`.
> Pour le rôle `pessobot` sur le projet `tulhiipucrnyejheuitv`, c'est `pessobot.tulhiipucrnyejheuitv`.

Tester la connexion depuis n8n → doit être **verte**.

### 3. Import du workflow

1. Dans n8n Cloud : **Workflows → Import from File → `pessobot-workflow-v2.1.json`**.
2. Reconnecter les credentials :
   - **Postgres** sur tous les nodes Postgres (`Get Profile Snapshot (RPC)`, `Get Menu`, `Get Bar Settings`, `Postgres Chat Memory`) → pointer sur `KARIBLOOM PESSORA`.
   - **DeepSeek** → `KARIBLOOM DEEPSEEK`.
3. Désactiver l'ancien workflow v2 (pour éviter 2 webhooks actifs sur le même path).
4. Activer le workflow v2.1.

### 4. Tests manuels recommandés

```bash
# Visiteur (pas d'userId) — doit répondre avec persona visiteur + menu dynamique
curl -sS -X POST https://kenneson.app.n8n.cloud/webhook/pessobot \
  -H "Content-Type: application/json" \
  -H "X-Pessobot-Signature: <VITE_PESSOBOT_SIGNATURE>" \
  -d '{"message":"bonjour","sessionid":"test-visitor","page":"/","userId":null}'

# Membre free existant — doit personnaliser le prénom et pitcher Óra+ si habitué
curl -sS -X POST https://kenneson.app.n8n.cloud/webhook/pessobot \
  -H "Content-Type: application/json" \
  -H "X-Pessobot-Signature: <VITE_PESSOBOT_SIGNATURE>" \
  -d '{"message":"je cherche un boost avant le sport","sessionid":"test-member","page":"/menu","userId":"<uuid-profile>"}'

# Modifier Óra+ depuis /admin/infos (ex: bouger le prix à 19,90€), puis
# demander à PessoBot « parle-moi de l'abonnement » → la nouvelle valeur doit apparaître.
```

### 5. CORS

Le webhook accepte : `http://localhost:5173`, `https://pessora.mq`, `https://www.pessora.mq`.
Adapter la liste (node `Webhook PessoBot` → options → allowedOrigins) si le domaine de production évolue.

---

## Déploiement du workflow v3 (S3)

### 1. Pré-requis Supabase (déjà appliqués en prod)

Migration `20260424220000_pessobot_s3_ratelimit_tools.sql` :

- Table `pessobot_rate_limit` append-only + RLS deny-all (accès **uniquement** via la RPC).
- RPC `public.fn_pessobot_rate_check(ip text, session text)` `SECURITY DEFINER` qui :
  - purge les entrées > 1 h (housekeeping borné à 200 lignes / appel) ;
  - compte la fenêtre IP (30 / 10 min) puis session (5 / 10 s) ;
  - insère un hit pour chaque bucket si autorisé ;
  - renvoie `{ allowed boolean, reason text, retry_after_seconds int }`.
- Vue `public.v_pessobot_events_upcoming` (security_invoker) : prochains événements actifs.
- Grants `pessobot` : `EXECUTE` sur `fn_pessobot_rate_check`, `SELECT` sur
  `v_pessobot_events_upcoming`. Rien d'autre.

### 2. Importer les 3 workflows (ORDRE IMPORTANT)

Les sub-workflows doivent exister **avant** le workflow principal qui y référence leurs IDs.

```
1.  pessobot-tool-get-menu.json            → noter le workflowId généré par n8n
2.  pessobot-tool-get-upcoming-events.json → noter le workflowId généré
3.  pessobot-workflow-v3.json              → puis éditer les 2 nodes "Tool: …"
```

Pour chaque sub-workflow : Workflows → Import from File → reconnecter la credential
Postgres `KARIBLOOM PESSORA` sur le node `Query …` → **sauvegarder sans l'activer**
(un sub-workflow n'a pas besoin d'être "active", il est exécuté à la demande).

> Si les tools étaient déjà importés : réimporter `pessobot-tool-get-menu.json` et
> `pessobot-tool-get-upcoming-events.json` (nodes **Normalize tool args** + Postgres
> `alwaysOutputData`) — voir §7 Dépannage.

### 3. Renseigner les `workflowId` des 2 tools

Dans le workflow principal v3, ouvrir :

- **Tool: get_menu** → paramètre `Workflow ID` → coller l'ID du sub-workflow
  `PessoBot Tool — get_menu(category?)`.
- **Tool: get_upcoming_events** → pareil avec le sub-workflow events.

Le JSON contient les placeholders `REPLACE_WITH_GET_MENU_WORKFLOW_ID` et
`REPLACE_WITH_GET_EVENTS_WORKFLOW_ID` pour rappel.

### 4. Reconnecter les credentials du workflow principal

- 3 nodes Postgres (`Rate Check`, `Get Profile Snapshot (RPC)`, `Get Bar Settings`)
  + `Postgres Chat Memory` → credential `KARIBLOOM PESSORA`.
- `DeepSeek Chat Model` → credential `KARIBLOOM DEEPSEEK`.

### 5. Bascule v2.1 → v3

1. **Désactiver** le workflow v2.1 (pour éviter 2 webhooks actifs sur le même path).
2. **Activer** le workflow v3.
3. Smoke tests :

```bash
# Visiteur normal — doit répondre (tools appelés si besoin)
curl -sS -X POST https://kenneson.app.n8n.cloud/webhook/pessobot \
  -H "Content-Type: application/json" \
  -H "X-Pessobot-Signature: <VITE_PESSOBOT_SIGNATURE>" \
  -d '{"message":"je veux un shake protéiné post-muscu","sessionid":"test-v3-01","page":"/menu","userId":null}'

# Rafale 6 req rapides sur même sessionid → la 6e doit renvoyer un message "rafale détectée"
for i in {1..6}; do
  curl -sS -X POST https://kenneson.app.n8n.cloud/webhook/pessobot \
    -H "Content-Type: application/json" \
    -H "X-Pessobot-Signature: <VITE_PESSOBOT_SIGNATURE>" \
    -d '{"message":"ping '$i'","sessionid":"burst-test","page":"/","userId":null}' & 
done; wait

# Question événements → l'agent doit invoquer get_upcoming_events
curl -sS -X POST https://kenneson.app.n8n.cloud/webhook/pessobot \
  -H "Content-Type: application/json" \
  -H "X-Pessobot-Signature: <VITE_PESSOBOT_SIGNATURE>" \
  -d '{"message":"tu as quoi comme prochains événements ?","sessionid":"test-v3-02","page":"/","userId":null}'
```

> Dans la console n8n (tab Executions), vérifier que les nodes `Tool: get_menu` et
> `Tool: get_upcoming_events` apparaissent **uniquement** dans les exécutions où c'est
> pertinent — le gain tokens vient de là.

### 6. Réglage des limites

Pour ajuster les quotas, modifier les constantes dans la RPC (`v_ip_limit`, `v_ip_window`,
`v_sess_limit`, `v_sess_window`) via une nouvelle migration. Pas de config côté n8n.

### 7. Dépannage — sous-workflows tools

#### `get_menu`

Symptômes : l’agent ne reçoit pas la carte, erreur dans l’exécution du sous-workflow, ou réponse
`items: []` alors que le menu existe dans Supabase.

| Cause | Vérification / correctif |
|--------|---------------------------|
| **`workflowId` non renseigné** | Dans le workflow principal v3, node **Tool: get_menu** → le champ workflow ne doit **pas** rester sur `REPLACE_WITH_GET_MENU_WORKFLOW_ID`. Choisir le workflow importé **PessoBot Tool — get_menu(category?)** dans la liste (ou coller son ID). |
| **Credential Postgres** | Sur le node **Query v_pessobot_menu** du sous-workflow : credential **KARIBLOOM PESSORA** (rôle `pessobot` ou pooler équivalent). Tester la connexion. |
| **Forme des arguments (n8n / LangChain)** | L’agent peut envoyer `{ category }` **ou** une chaîne JSON dans `query`. L’export `pessobot-tool-get-menu.json` inclut **Normalize tool args** → `{ category }` whitelistée avant `queryReplacement`. **Réimporter** si besoin. |
| **0 ligne côté Postgres** | `SELECT count(*) FROM public.v_pessobot_menu;` — si 0 : `products.active`, migrations S1. Si count > 0 côté Supabase mais pas dans n8n : **même projet** que la credential. |
| **Chaîne coupée sans résultat** | **Query v_pessobot_menu** : `alwaysOutputData: true` → **Format for LLM** renvoie toujours un JSON avec `note` si vide. |

Test : sous-workflow **get_menu** — après le trigger, le 2ᵉ node affiche `category` normalisé ; le suivant des lignes avec `slug` / `name`.

#### `get_upcoming_events`

Symptômes : pas de liste d’événements alors qu’il y en a sur le site, erreur SQL, ou `limit` incohérent.

| Cause | Vérification / correctif |
|--------|---------------------------|
| **`workflowId` non renseigné** | Node **Tool: get_upcoming_events** du workflow v3 : ne pas laisser `REPLACE_WITH_GET_EVENTS_WORKFLOW_ID`. Lier **PessoBot Tool — get_upcoming_events(limit?)**. |
| **Credential** | Node **Query v_pessobot_events_upcoming** → **KARIBLOOM PESSORA**. |
| **Argument `limit`** | Même problème que `category` : valeurs dans `limit`, ou JSON / nombre dans `query`. Le fichier `pessobot-tool-get-upcoming-events.json` ajoute **Normalize tool args** : entier **1–20**, défaut **5**, puis `queryReplacement` = `={{ $json.limit }}` (plus d’expression inline fragile sur `$json.limit` seul). |
| **Vue vide (souvent normal)** | `v_pessobot_events_upcoming` = `events` avec `active = true` et `date >= CURRENT_DATE`. Si tous les événements sont passés ou inactifs → `items: []` et `note` explicite. Vérifier : `SELECT * FROM public.v_pessobot_events_upcoming LIMIT 5;` |
| **Chaîne coupée** | **alwaysOutputData: true** sur le node Postgres ; **Format for LLM** filtre les lignes avec `id` non vide. |

Test : même principe — 2ᵉ node = `{ limit: number }` borné, 3ᵉ = lignes événements avec `id` / `title` / `date`.

#### `Received tool input did not match expected schema ✖ Required → at category` (ou `limit`)

Symptôme : l'agent refuse d'appeler `get_menu` / `get_upcoming_events` parce que le modèle
n'a pas fourni la clé `category` (ou `limit`). Cas typique : « c'est quoi les boissons ? »
→ le modèle veut tout le menu et ne met pas de `category`.

Cause : dans les sous-workflows, le node **Execute Workflow Trigger** (« When called by Agent »)
est configuré avec `inputSource: jsonExample` et un exemple contenant `{"category":"wellness"}`
(resp. `{"limit":5}`). n8n en déduit un Zod schema `z.object({ category: z.string() })` et
**n'appelle pas `.optional()`** — donc le champ devient strictement requis côté LangChain,
même si côté main workflow le tool node expose « Defined automatically by the model » (`$fromAI`).
Quand le modèle omet l'argument (cas carte complète / défaut), la validation Zod échoue avant
que le sous-workflow ne s'exécute.

Correctif (déjà appliqué dans les JSON versionnés) : passer le trigger des sous-workflows en
**`inputSource: passthrough`**. Le schéma vide au niveau du trigger laisse le LangChain Agent
accepter n'importe quel objet d'entrée ; le node Code *Normalize tool args* placé juste après
fait lui-même la validation / le clamp / la whitelist.

Si tu édites les sous-workflows à la main dans l'UI n8n (sans réimport) :

1. Ouvre **PessoBot Tool — get_menu(category?)** → node **When called by Agent**.
2. Paramètre **Input Source** → bascule sur **« Passthrough »** (ou « Accept any input »,
   selon la version).
3. Supprime l'exemple JSON.
4. **Save** + **Active toggle OFF → ON** du workflow principal `PessoBot v3` pour que
   l'agent recharge la définition des tools.
5. Idem sur **PessoBot Tool — get_upcoming_events(limit?)**.

Le node Code *Normalize tool args* dans chaque sous-workflow est déjà blindé pour accepter :
`{ category }` / `{ query: "wellness" }` / `{ query: "{\"category\":\"wellness\"}" }` /
absence totale de clé → défaut propre (`""` pour category, `5` pour limit).

---

## Changelog v1 → v2 → v2.1 → v3

| Domaine                | v1                                              | v2                                            | v2.1                                                 | v3                                                                   |
| ---------------------- | ----------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| Menu                   | Hardcodé dans le node Code                      | `SELECT … FROM v_pessobot_menu`               | idem v2                                              | **Tool** `get_menu(category?)` (appelé à la demande)                 |
| Infos bar              | Hardcodé dans le node Code                      | `SELECT … FROM bar_settings`                  | + `subscription_info` (Óra+)                         | idem v2.1 (pré-chargé, change rarement)                              |
| Profil utilisateur     | `first_name, loyalty_points, subscription_tier` | 2 requêtes séparées (profile + subscription)  | 1 seul appel RPC `fn_pessobot_profile_snapshot`      | idem v2.1                                                            |
| Événements             | —                                               | —                                             | —                                                    | **Tool** `get_upcoming_events(limit?)` via `v_pessobot_events_upcoming` |
| Signaux perso          | —                                               | —                                             | Produit favori, prochain événement, prochain bilan   | idem v2.1 (injectés en JSON compact)                                 |
| Pitch Óra+             | Figé dans persona                               | Figé dans persona                             | Configurable depuis `/admin/infos`                   | idem v2.1 + lien CTA en markdown                                     |
| Rate limit             | —                                               | —                                             | —                                                    | **Postgres** `fn_pessobot_rate_check` — 30/10m IP, 5/10s session     |
| Auth webhook           | Aucune                                          | Header `X-Pessobot-Signature`                 | idem v2                                              | idem v2                                                              |
| CORS                   | `localhost:3000`                                | dev + prod                                    | idem v2                                              | + `localhost:3001`                                                   |
| Credential Postgres    | `KARIBLOOM` (service user)                      | idem v1                                       | `KARIBLOOM PESSORA` (role `pessobot` read-only)      | idem v2.1                                                            |
| Persona                | ~2800 tokens                                    | ~1000 tokens                                  | ~900 tokens + signaux injectés                       | **~400 tokens** + délégation aux tools                               |
| Format réponse         | Markdown lourd                                  | Strip `**`, bullets `•`                        | idem v2                                              | idem + liens markdown `[label](url)` préservés (cliquables côté app) |

---

## Optimisations perf (v3.1 — 22 avr. 2026)

Le temps de réponse perçu par l'utilisateur est dominé par les 2 appels LLM successifs (agent
+ synthèse après tool call) : typiquement **3–6 s sans tool**, **6–14 s avec tool**. Quelques
optimisations faciles appliquées dans cette révision :

### 1. Requête Postgres combinée (gain 150–250 ms)

Avant : 2 nodes séquentiels `Get Profile Snapshot` → `Get Bar Settings`.

Après : 1 seul node **`Get Profile + Bar`** qui exécute une requête CTE unique :

```sql
SELECT
  (SELECT row_to_json(p.*)
     FROM public.fn_pessobot_profile_snapshot(NULLIF($1,'')::uuid) p
     LIMIT 1) AS profile,
  (SELECT row_to_json(b.*)
     FROM public.bar_settings b
     WHERE b.id = 1
     LIMIT 1) AS bar;
```

Résultat : 1 aller-retour réseau Supabase au lieu de 2. Le node `BUILD SYSTEM PROMPT` lit
désormais `$('Get Profile + Bar').first().json.profile` et `…json.bar`.

### 2 bis. Membre connecté traité comme « VISITOR » (fix v3.2 — 22 avr. 2026)

Si le node **BUILD SYSTEM PROMPT** utilisait `isConnected = !!userId && !!snap.first_name`, tout
compte avec **prénom vide en BDD** restait classé **VISITOR** (closing « Crée ton compte… »).  
**Correction** : `isConnected = Boolean(userId)` ; prénom = snapshot **ou** `body.first_name`
(front) ; plan = snapshot **ou** `body.subscription_tier`. Ré-importer `pessobot-workflow-v3.json`
après mise à jour du repo. Côté app, `Chatbot.tsx` envoie aussi un repli `getSession()` + champ
`email` si le contexte React n’a pas encore l’utilisateur.

### 3. Snapshot menu anti-hallucination (v3.2 — 25 avr. 2026)

Le node **Menu snapshot** (Postgres) tourne juste après **Get Profile + Bar** : une requête
agrège `public.v_pessobot_menu` en JSON (`menu_compact`). **BUILD SYSTEM PROMPT** lit
`$('Menu snapshot')` et injecte le bloc **CATALOGUE_OFFICIEL** dans le system message. Le modèle
dispose ainsi de la carte réelle à chaque tour (sans dépendre uniquement d’un appel tool
facultatif). L’outil **get_menu** reste disponible pour filtrer par catégorie.

Ré-importer `pessobot-workflow-v3.json` depuis le repo après mise à jour.

### 2. Préchauffage n8n (gain 1–3 s sur le 1ᵉʳ message de la journée)

n8n Cloud (tier Starter/Pro) peut avoir un petit cold start après ~30 min d'inactivité. Pour
garder le workflow « chaud », créer un **second workflow minimaliste** dans le même instance :

1. **Schedule Trigger** — toutes les 10 minutes (heures ouvrables 7h–22h suffisent).
2. **Code** (no-op) — `return [{ json: { ping: new Date().toISOString() } }];`

Ce workflow ne touche pas le webhook PessoBot ; il garde juste le container n8n actif. Coût :
~0 exécutions payantes utiles, **aucun impact Supabase / DeepSeek**. Optionnel mais utile si
le bot est peu sollicité en début de journée.

### 4. Hint typing évolutif côté front (perception)

Au-delà de 3 s d'attente, le chat affiche un sous-texte rassurant sous les 3 points :

- 3–7 s : « Je consulte la carte… »
- 7–13 s : « Je prépare une réponse détaillée… »
- 13 s+ : « Un instant, encore quelques secondes… »

Implémenté dans `src/components/common/Chatbot.tsx` (+ `Chatbot.css`).

### Leviers restants (non appliqués)

- **Swap modèle** (DeepSeek → Groq Llama 3.3 70B ou GPT-4o-mini) — gain potentiel **×3 à ×5**
  sur la latence LLM. Nécessite une clé API dédiée et un test qualité FR.
- **Streaming tokens** (SSE côté n8n + front) — perception « instantané », ~2-3 h de refacto.

---

## Notes dette & backlog

Voir `docs/PESSOBOT_BACKLOG.md` pour les évolutions prévues (S3 tool-calling light, RAG, multicanal, …).
