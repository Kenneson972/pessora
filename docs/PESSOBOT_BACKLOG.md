# PessoBot — Backlog (stand-by)

Liste volontairement gardée **hors du périmètre MVP**. Ces évolutions seront
rouvertes après validation de S1 → S3. Rangées par priorité décroissante.

---

## ▶︎ Priorité prochaine (candidat S4)

### S4.1 — RAG base de connaissances (voir section Plus tard ↓)

### S4.2 — Multi-canaux (WhatsApp / Instagram DM)

Les tools livrés en S3 (`get_menu`, `get_upcoming_events`) sont déjà réutilisables
tels quels — le même Agent Langchain peut être appelé depuis un autre webhook Meta.

---

## ▶︎ Plus tard (phase 2)

### RAG — base de connaissances

Embeddings `pg_vector` sur :

- fiches produits (détail nutrition, usages, contre-indications)
- FAQ (abonnement Óra+, fidélité, partenariats)
- articles blog / événements passés

Table `pessobot_knowledge (id, title, body, embedding)` + 1 outil `search_kb(query)`.

### Multi-canaux

Réutiliser le workflow n8n pour WhatsApp Business et/ou Instagram DM (Meta webhook →
même node `BUILD SYSTEM PROMPT`).

### Notifications proactives

Quand un événement approche à J-2, PessoBot peut envoyer un rappel dans le chat
(persistance `notifications` Supabase + badge dans le bouton flottant).

### Logs & analytics (report volontaire — à faire plus tard)

**Objectif** : avoir des **métriques réelles PessoBot** (case study Karibloom) au lieu de
stats e-commerce génériques ; mesurer l’impact Óra+ et les clics utiles.

**Pistes techniques (à trancher au moment du dev)** :

- Table dédiée événements fins, ex. `pessobot_analytics_events` (ou agrégat +
  `pessobot_conversations` selon besoin) : `event_type`, `session_id`, `user_id` nullable,
  `payload` jsonb (ex. `url`, `path`), `created_at`. RLS : insert anonyme contrôlé ou
  écriture via RPC `SECURITY DEFINER` + rate limit léger.
- **Événements envisagés** :
  - `conversation_started` (nouveau `sessionId` côté front)
  - `message_sent` (optionnel, pour volume — attention volume / coût)
  - `link_clicked` dans une bulle bot (`href` + libellé si dispo)
  - `ora_plus_pitch_shown` / `ora_plus_cta_clicked` (si détectable côté front ou via URL
    connue dans `subscription_info.cta_url`)
- **Front** : quelques `POST` depuis `Chatbot.tsx` (ou batch léger), sans bloquer l’UX.
- **Admin** : plus tard — dashboard `/admin` : échanges / jour, top liens, funnel Óra+.

**RGPD** : finalité (mesure d’audience / amélioration du service), durée de rétention,
pas de contenu message en clair si non nécessaire ; aligner avec bannière cookies /
mentions légales quand implémenté.

**Ancienne piste conservée** : table `pessobot_conversations` (user_id, session_id, page,
msg_count, created_at) — peut fusionner avec le modèle événements ci-dessus.

### RGPD & sécurité

- Purge automatique de `pessora_chat_memory` après 30 jours (fonction `cron`
  Supabase + `pg_cron`).
- Chiffrement au repos pour les messages (extension `pgsodium` ou équivalent).
- Page `/legal/pessobot` : finalité du traitement + droit d'effacement.

### UX

- Reprise de conversation après refresh (persister `sessionId` dans `localStorage`).
- Suggestions dynamiques basées sur le dernier message du bot (plutôt que la liste
  statique actuelle).
- Transcription vocale côté mobile (Web Speech API).

---

## ✅ Déjà livré — S1

- Table `bar_settings` éditable depuis `/admin/infos`.
- Vue `v_pessobot_menu` côté Supabase.
- Header `X-Pessobot-Signature` front ↔ n8n.
- CORS prod (`pessora.mq` + `www.pessora.mq`).
- Workflow n8n v2 (menu + bar dynamiques, persona raccourcie).

## ✅ Déjà livré — S2

- RPC `public.fn_pessobot_profile_snapshot(uuid)` `SECURITY DEFINER` : retourne en 1 appel
  `first_name, role, plan, subscription_status, subscription_end_date, favorite_product,
  upcoming_event, upcoming_bilan, total_orders, last_order_at`. Gestion `NULL` (visiteur) → 0 ligne.
- Rôle Postgres `pessobot` read-only : `EXECUTE` sur la RPC + `SELECT` sur `bar_settings` +
  `v_pessobot_menu` uniquement. Aucun accès direct aux tables sensibles.
- Colonne `bar_settings.subscription_info` (jsonb) + UI admin dans `/admin/infos` pour éditer
  le pitch Óra+ (nom, tagline, prix, période, highlight, benefits, cta_url) sans redéploiement.
- Workflow n8n v2.1 : 1 seul node Postgres pour le profil (RPC), system prompt enrichi avec
  signaux perso (favori, prochain événement, prochain bilan) et pitch Óra+ conditionnel
  (free + habitué).

> Points fidélité intentionnellement **non** intégrés à S2 : le schéma n'a pas encore de règle
> métier claire. À rouvrir quand le produit fidélité sera défini (colonne dédiée + trigger, ou
> agrégat dans la RPC si la règle reste simple).

## ✅ Déjà livré — S3

- **Rate limit Postgres** : table `pessobot_rate_limit` (RLS deny-all) + RPC
  `fn_pessobot_rate_check(ip, session)` `SECURITY DEFINER` qui purge >1h, compte
  30/10m par IP et 5/10s par session, renvoie `{allowed, reason, retry_after_seconds}`.
  **Aucun service externe** — tout sur Supabase, cohérent avec la stack.
- **Tool-calling Langchain** (2 tools au lieu des 4 prévus — les 2 autres restent
  pré-fetchés car ils changent peu) :
  - `get_menu(category?)` → sub-workflow `pessobot-tool-get-menu.json`
    qui interroge `v_pessobot_menu` filtré.
  - `get_upcoming_events(limit?)` → sub-workflow
    `pessobot-tool-get-upcoming-events.json` sur la nouvelle vue
    `v_pessobot_events_upcoming`.
- **Persona v3 compacte** (~400 tokens vs ~900 en v2.1) : règles absolues + méthode
  consultant + description des tools + infos bar pré-chargées + JSON compact profil &
  Óra+. Le menu n'est plus embarqué.
- **Liens cliquables côté chatbot** : autolinker front (`Chatbot.tsx`) + règle #7
  du system prompt qui force le format `[libellé](URL)`.

> Choix assumé : on a livré **2 tools** sur les 4 prévus au backlog initial.
> `get_bar_info()` et `get_profile()` restent pré-fetchés car (a) ils changent très
> rarement dans une conversation, (b) les round-trips LLM supplémentaires coûteraient
> plus cher en latence/tokens que l'économie en prompt. Le patron « pré-fetch données
> stables, tool-call données volumineuses/variables » est documenté ici comme pattern
> Karibloom pour tout futur chatbot Langchain.

