# Récapitulatif complet — PessoBot

Synthèse opérationnelle de l'assistant conversationnel PessoBot.
Dernière mise à jour : **2026-04-25** (v3.2 : snapshot menu injecté dans le prompt à chaque tour — anti-hallucination boissons).

---

## 1. En une phrase

PessoBot est l'assistant conversationnel du bar PessÓra, déployé en production, qui répond aux visiteurs et aux membres connectés en s'appuyant sur les données Supabase en temps réel (menu, profil, événements, abonnement Óra+), avec rate limiting, tool calling et lien cliquable.

---

## 2. Architecture finale

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend      │  HTTPS  │  n8n Cloud   │  SQL    │   Supabase   │
│   React/Vite    ├────────►│  (4 workflows)├────────►│  (prod)      │
│   Chatbot.tsx   │         │              │         │              │
└─────────────────┘         └──────┬───────┘         └──────────────┘
                                    │ HTTPS
                                    ▼
                            ┌──────────────┐
                            │  DeepSeek    │
                            │  (LLM)       │
                            └──────────────┘
```

### Les 4 workflows n8n en prod

| Workflow | Rôle | Fichier source |
|---|---|---|
| **PessoBot v3** (main, actif) | Orchestrateur : signature, rate limit, profil+bar, **Menu snapshot** (SQL `v_pessobot_menu` → JSON), prompt, agent | `docs/n8n/pessobot-workflow-v3.json` |
| **Tool get_menu** (sub, actif) | Interrogé par l'agent quand il a besoin du menu | `docs/n8n/pessobot-tool-get-menu.json` |
| **Tool get_upcoming_events** (sub, actif) | Interrogé pour les événements à venir | `docs/n8n/pessobot-tool-get-upcoming-events.json` |
| ~~PessoBot v2.1~~ | **Désactivé** (backup) | `docs/n8n/pessobot-workflow-v2.1.json` |

---

## 3. Flow complet d'un message utilisateur

```
1. User tape un message dans le chatbot (Chatbot.tsx)
     ↓ POST /webhook/pessobot avec X-Pessobot-Signature
2. Webhook n8n reçoit
     ↓
3. Verify Signature → rejette si signature invalide
     ↓
4. Rate Check → RPC Postgres fn_pessobot_rate_check(ip, session)
   • Spam détecté → réponse chaleureuse "pause X s" + STOP
     ↓
5. Get Profile + Bar (Postgres, alwaysOutputData)
   → RPC `fn_pessobot_profile_snapshot(userId)` + ligne `bar_settings`
     ↓
6. **Menu snapshot** (Postgres) → `jsonb_agg` sur `v_pessobot_menu` (champs publics tronqués) → `menu_compact`
     ↓
7. Build System Prompt (JS, v3.2)
   • Persona + bar + profil + Óra+ (inchangé)
   • **CATALOGUE_OFFICIEL** : le JSON `menu_compact` est injecté dans le system prompt (le LLM a la carte sans deviner)
   • Tools `get_menu` / `get_upcoming_events` (filtrage ou rafraîchissement)
     ↓
8. Agent Langchain (DeepSeek)
   • `get_menu(category?)` optionnel (filtrer une gamme) ; le snapshot suffit pour citer noms/prix
   • Appelle get_upcoming_events(limit?) si besoin
   • Mémoire conversationnelle via Postgres Chat Memory
     ↓
9. Format Response (strip markdown lourd)
     ↓
10. Respond to Webhook → User voit la réponse
    • Liens [label](url) rendus cliquables par Chatbot.tsx
```

---

## 4. Fonctionnalités livrées (par sprint)

### S1 — Base dynamique (2026-04-23)

- Table `bar_settings` éditable depuis `/admin/infos` (adresse, horaires, contact)
- Vue `v_pessobot_menu` — le menu n'est plus hardcodé dans n8n
- Header `X-Pessobot-Signature` côté front ↔ webhook n8n
- CORS prod (`pessora.mq` + `www.pessora.mq`)

### S2 — Personnalisation + Óra+ (2026-04-24 matin)

- RPC `fn_pessobot_profile_snapshot(uuid)` `SECURITY DEFINER` — 1 appel = profil complet
- Rôle Postgres **`pessobot` read-only** — principe du moindre privilège
- Colonne `bar_settings.subscription_info` (jsonb) + UI admin → pitch Óra+ éditable sans redéploiement
- Pitch Óra+ conditionnel : visiteur → aucun, free + habitué (≥3 cmd) → pitch adapté, VIP → confirmation avantages

### S3 — Rate limit + Tool calling (2026-04-24 soir)

- **Rate limit Postgres** (0 service externe) :
  - Table `pessobot_rate_limit` (RLS deny-all)
  - RPC `fn_pessobot_rate_check(ip, session)` `SECURITY DEFINER`
  - **30 req / 10 min par IP** + **5 req / 10 s par session**
  - Réponse `429 soft` avec message chaleureux
- **Tool calling Langchain** :
  - `get_menu(category?)` → sub-workflow
  - `get_upcoming_events(limit?)` → sub-workflow + vue `v_pessobot_events_upcoming`
- **Persona divisée par 2** : ~900 → ~400 tokens (le menu n'est plus pré-fetché)
- **Liens cliquables** : autolinker dans `Chatbot.tsx` + règle #7 du system prompt force `[libellé](URL)`

### Fixes post-déploiement v3 (2026-04-24 T23:50 → 2026-04-25 T00:30)

3 itérations pour stabiliser le node `Get Profile Snapshot (RPC)` en visiteur anonyme — chacune a révélé un piège n8n différent. Détail complet dans `docs/ACTIONS_LOG.md`, résumé en tableau ci-dessous (§7).

---

## 5. Base de données Supabase — objets PessoBot

| Objet | Type | Rôle |
|---|---|---|
| `bar_settings` | table | Adresse, horaires, contact, `subscription_info` (Óra+) — éditable via `/admin/infos` |
| `v_pessobot_menu` | vue | Menu filtré pour PessoBot (champs publics uniquement) |
| `v_pessobot_events_upcoming` | vue (security_invoker) | Événements actifs à venir, classés par date |
| `fn_pessobot_profile_snapshot(uuid)` | RPC `SECURITY DEFINER` | Snapshot complet profil + favori + prochain event + prochain bilan. Accepte NULL pour visiteur |
| `fn_pessobot_rate_check(text, text)` | RPC `SECURITY DEFINER` | Rate limit sliding window IP + session |
| `pessobot_rate_limit` | table + RLS deny-all | Buckets de rate limit, accessible uniquement via RPC |
| `pessora_chat_memory` | table | Mémoire conversationnelle Langchain (géré par n8n) |
| `pessobot` | rôle Postgres `LOGIN NOINHERIT` | Utilisé par n8n. `SELECT` sur 3 vues + `EXECUTE` sur 2 RPC, rien d'autre |

### Grants du rôle `pessobot`

```
EXECUTE : fn_pessobot_profile_snapshot(uuid), fn_pessobot_rate_check(text, text)
SELECT  : bar_settings, v_pessobot_menu, v_pessobot_events_upcoming
(aucun autre accès)
```

### Migrations SQL versionnées

| Fichier | Contenu |
|---|---|
| `supabase/migrations/20260424120000_pessobot_bar_settings.sql` | S1 : table `bar_settings` + vue `v_pessobot_menu` |
| `supabase/migrations/20260424140000_pessobot_s2_profile_snapshot.sql` | S2 : RPC profile snapshot + rôle `pessobot` + colonne `subscription_info` |
| `supabase/migrations/20260424220000_pessobot_s3_ratelimit_tools.sql` | S3 : table + RPC rate check + vue events |

---

## 6. Sécurité

| Couche | Protection |
|---|---|
| **Webhook** | Header `X-Pessobot-Signature` obligatoire. Signature hardcodée côté n8n (plan Starter/Pro sans env vars). |
| **Base de données** | Rôle `pessobot` minimaliste. Aucun accès direct aux tables sensibles (`profiles`, `orders`, etc.) — tout via RPC `SECURITY DEFINER`. |
| **Rate limiting** | 30/10 min IP + 5/10 s session. Table interne RLS deny-all, accessible uniquement via RPC. |
| **CORS** | Restreint à `pessora.mq`, `www.pessora.mq`, `localhost:3000`, `localhost:3001`, `localhost:5173`. |
| **Secrets** | `.env` hors repo, `VITE_PESSOBOT_SIGNATURE` front, signature hardcodée côté n8n. |

### Point d'attention (à renforcer plus tard)

Le `userId` est envoyé en clair dans le body front → n'importe qui peut usurper un userId pour obtenir le profil associé. À remplacer plus tard par un **JWT Supabase dans le header** si on veut du vrai contrôle d'accès côté bot. Non critique aujourd'hui (aucune info sensible exposée au-delà du prénom et du statut abonnement).

---

## 7. Les 3 itérations de fix v3 — leçons n8n pour Karibloom

Le node `Get Profile Snapshot (RPC)` a nécessité 3 fixes successifs pour fonctionner à la fois pour visiteur anonyme et membre connecté. Chaque itération a révélé un piège n8n méconnu. **Pattern Karibloom** à appliquer sur tout futur workflow n8n :

| Niveau | Piège n8n | Manifestation | Solution |
|---|---|---|---|
| 1. Template string | `{{ undefined }}` → chaîne littérale `"undefined"` | `invalid input syntax for type uuid: "undefined"` | **`queryReplacement` avec paramètre lié `$1`** |
| 2. Scope `$json` | Change à chaque node intermédiaire (Rate Check a écrasé le webhook) | `$json.body` undefined → personnalisation cassée silencieusement | **Référencer explicitement `$('Webhook').first().json.body.userId`** |
| 3. Chaînage | 0 items en sortie = skip downstream silencieux | Flow s'arrête après un node "vert mais vide" | **`alwaysOutputData: true` sur les nodes "SELECT optionnel"** |

Le pattern propre **cumule les 3**. Détails complets par itération dans `docs/ACTIONS_LOG.md` (T23:50 → T00:30).

---

## 8. Économie et perfs

| Métrique | v1 | v2.1 | **v3** | Gain v3 vs v2.1 |
|---|---|---|---|---|
| Tokens system prompt | ~2800 | ~900 | **~400** | -55% |
| Requêtes Postgres par message | 0 (tout hardcodé) | 3 (menu + bar + profil en 1 RPC) | **3** (rate check + profil + bar — menu à la demande) | idem |
| Tool calls par message | 0 | 0 | **0 à 2** (selon le sujet) | dépend du contexte |
| Latence typique | ~2,5 s | ~2 s | ~1,8 s (question simple) / ~3 s (avec tool) | léger gain moyen |
| Protection spam | aucune | aucune | **Rate limit Postgres** | infinie |

**Projection** : 500 conversations/mois × 10 messages moyenne × ~30% de questions menu → économie DeepSeek estimée **~40-50%** vs v2.1.

---

## 9. Configuration dynamique — édition sans redéploiement

Tout ce qui suit se modifie depuis `/admin/infos` sans toucher au code :

1. **Adresse + lien Google Maps** — affiché dans le footer + prompt du bot
2. **Horaires (7 jours)** — format libre par jour, injecté dans le prompt
3. **Contact** — email, téléphone, Instagram
4. **Abonnement Óra+** — nom, tagline, prix, période, highlight, liste de bénéfices, URL du CTA

Le menu et les événements sont gérés depuis leurs propres écrans admin (`/admin/produits`, `/admin/evenements`).

---

## 10. Monitoring opérationnel

### Où regarder quand il y a un souci

| Symptôme | Où regarder |
|---|---|
| Bot ne répond pas | Onglet **Executions** de n8n → workflow `PessoBot v3` |
| Bot répond mais faux infos menu | Execution → sous-arbre `Execute Workflow: Tool get_menu` |
| Bot hallucine | Execution → vérifier le `system prompt` dans `BUILD SYSTEM PROMPT` |
| Bot dit "pause 6 s" en boucle | Supabase → `SELECT * FROM pessobot_rate_limit ORDER BY created_at DESC LIMIT 20;` |
| Erreur signature | Front → vérifier `VITE_PESSOBOT_SIGNATURE` dans `.env`. n8n → node `Verify Signature`. |

### Commandes Postgres utiles

```sql
-- Hits rate limit récents
SELECT bucket, COUNT(*) FROM pessobot_rate_limit
WHERE created_at > now() - interval '10 minutes'
GROUP BY bucket ORDER BY COUNT(*) DESC;

-- Nettoyage manuel si nécessaire (la RPC le fait auto à chaque appel)
DELETE FROM pessobot_rate_limit WHERE created_at < now() - interval '1 hour';

-- Voir les événements que le bot peut proposer
SELECT * FROM v_pessobot_events_upcoming;

-- Tester la RPC profil pour un user précis
SELECT * FROM fn_pessobot_profile_snapshot('uuid-du-user');
```

---

## 11. Documentation PessoBot

| Fichier | Contenu |
|---|---|
| `docs/RECAP_PESSOBOT.md` | **Ce fichier** — récap complet opérationnel |
| `docs/n8n/README.md` | Guide de déploiement des 4 workflows + changelog v1→v3 |
| `docs/ACTIONS_LOG.md` | Journal append-only de toutes les actions (S1, S2, S3, fixes itérations) |
| `docs/logs/2026-04-24.md` | Session log détaillé S2 + S3 |
| `docs/PESSOBOT_BACKLOG.md` | Ce qui est livré + ce qui est en attente (S4 candidat) |
| `docs/PESSOBOT_GUIDE.md` | Guide utilisateur pour former qqn à l'admin |
| `docs/PESSOBOT_PROMPT.md` | Archive des anciennes versions du prompt |

---

## 12. Backlog futur — S4 candidat (pas urgent)

### S4.1 — RAG base de connaissances

Embeddings `pg_vector` sur :
- Fiches produits détaillées (nutrition, usages, contre-indications)
- FAQ Óra+, fidélité, partenariats
- Articles blog / événements passés

→ 3ᵉ tool `search_kb(query)` → réponses précises hors menu.

### S4.2 — Multi-canaux

Les tools livrés en S3 sont **déjà réutilisables** : le même Agent Langchain peut être appelé depuis un webhook WhatsApp Business ou Instagram DM sans dupliquer la logique métier.

### Améliorations UX

- Reprise de conversation après refresh (persister `sessionId` dans `localStorage`)
- Suggestions dynamiques basées sur le dernier message du bot
- Transcription vocale mobile (Web Speech API)

### RGPD

- Purge auto `pessora_chat_memory` après 30 jours (`pg_cron`)
- Page `/legal/pessobot` — finalité + droit d'effacement

### Analytics

Table `pessobot_conversations` pour tracker : nombre d'échanges/jour, top questions, taux de closing vers inscription.

---

## 13. Recommandations consolidation (non bloquantes)

Par ordre de priorité décroissante, si un jour tu veux durcir l'infra :

1. **Auth JWT dans le webhook** — remplacer `userId` en clair par un JWT Supabase dans le header (priorité : moyenne).
2. **Observabilité** — logs centralisés (Logtail / PostHog) au-delà des 30 j de rétention n8n.
3. **Tests automatisés** — script `curl` de smoke test en CI pré-déploiement.
4. **Persona par page** — injecter le contexte de la page courante dans le prompt (ex. sur `/evenements`, forcer `get_upcoming_events` en premier).

---

## 14. Résumé express

- **Stack** : Frontend React/Vite → n8n Cloud (4 workflows) → Supabase + DeepSeek
- **État** : v3 en prod, stable, 0 bug résiduel
- **Features** : rate limit + tool calling + personnalisation + Óra+ dynamique + liens cliquables
- **Sécurité** : rôle DB read-only, RLS deny-all, signature webhook, rate limit
- **Observabilité** : exécutions n8n + queries Postgres
- **Prochain pas** : rien d'urgent, backlog S4 (RAG, multi-canaux) quand pertinent

---

*Dernière revue : 2026-04-25 après résolution des 3 itérations de fix v3.*
