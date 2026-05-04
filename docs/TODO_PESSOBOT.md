# TODO — PessoBot (n8n webhook + front)

Améliorations identifiées lors de l'audit du 2026-05-03.
Source : export JSON `PessoBot - Assistant Bar & Membres (v3 — Rate Limit + Tool Calling).json`

---

## P1 — Nouveaux tools (impact utilisateur fort)

- [ ] **Tool `get_products_gamme(category?)`** — Répondre sur les gaufres, produits gamme (pas seulement les boissons). Source : table `products` / `gamme_products`.
- [ ] **Tool `get_upcoming_bilans(limit?)`** — Créneaux bilans bien-être disponibles. Source : `bilan_slots WHERE disponible = true AND date >= NOW()`.
- [ ] **Tool `register_event(eventId, userId?, email?, nom?, prenom?)`** — Inscrire directement un utilisateur à un événement depuis le chat.

## P2 — Conformité et UX

- [ ] **Supprimer les émojis du message 429** (`🙏`, `👉`) — remplacer par du texte neutre.
- [ ] **Convertir `###` en `**bold**`** dans `FORMAT RESPONSE` plutôt que les supprimer — garde la structure sans bruit markdown.
- [ ] **Ajouter les liens site dans le prompt** : `/menu`, `/nos-produits`, `/bilan-bien-etre`.

## P3 — Monitoring et qualité de vie

- [ ] **Métriques d'usage** — table `pessobot_analytics` avec compteur d'appels par session, échecs rate limit, latence DeepSeek.
- [ ] **Secret signature en `$env`** (si migration vers plan n8n qui supporte les env vars).
- [ ] **Simplifier la section CLOSING du prompt** — le comportement VIP/FREE/VISITOR est clair pour le modèle, un texte plus court suffirait.
