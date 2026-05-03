# API Backend PESSORA (o2switch)

Le frontend appelle un backend (Node/PHP sur o2switch) qui se connecte à la base MySQL créée avec `O2SWITCH_SCHEMA.sql`.

## Backend fourni (Node.js)

Un serveur Express est dans le dossier `server/`. Après avoir créé la BDD :

1. **Configurer le backend** : dans `server/`, copier `.env.example` en `.env` et renseigner les identifiants MySQL (o2switch) et `JWT_SECRET`.
2. **Lancer l’API** : `cd server && npm install && npm run dev` (ou `npm start`). L’API écoute sur le port défini dans `.env` (défaut 3001).
3. **Configurer le frontend** : à la racine du projet, créer ou modifier `.env` avec `VITE_API_URL=http://localhost:3001`, puis `npm run dev`.
4. **Premier admin** : créer un compte via l’app (Inscription), puis en base exécuter : `UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';`

Voir `docs/ETAPES_APRES_BDD.md` pour le détail.

## Variable d'environnement frontend

- `VITE_API_URL` : URL de base de l’API (ex. `https://votredomaine.com/api`)

## Endpoints attendus

### Auth

| Méthode | Chemin | Body | Réponse |
|--------|--------|------|--------|
| POST | `/auth/login` | `{ email, password }` | `{ user, subscription, token }` |
| POST | `/auth/register` | `{ email, password, first_name, last_name, phone? }` | `{ user, subscription, token }` |
| POST | `/auth/logout` | - | 204 ou 200 |
| GET | `/auth/me` | - (header `Authorization: Bearer <token>`) | `{ user, subscription }` |

- **user** : `{ id, email, first_name, last_name, phone?, avatar_url?, role, created_at }`
- **subscription** : `{ id, plan, status, start_date, end_date, auto_renew, price }` ou `null`
- À l’inscription, le backend crée l’utilisateur et une ligne `subscriptions` (plan `free`, status `active`) — ou s’appuie sur le trigger MySQL.

### Profil / Abonnement

| Méthode | Chemin | Body | Réponse |
|--------|--------|------|--------|
| PATCH | `/users/me` | `{ first_name?, last_name?, phone?, avatar_url? }` | 200 + user mis à jour si besoin |
| PATCH | `/subscriptions/me` | `{ plan }` | 200 |

### Admin (réservé aux utilisateurs avec `role === 'admin'`)

| Méthode | Chemin | Body | Réponse |
|--------|--------|------|--------|
| POST | `/admin/upload` | `FormData` avec clé `file` (fichier image) | `{ url: string }` (URL publique de l’image) |
| POST | `/admin/products` | `{ name, category, price?, calories?, protein?, description?, ingredients[], benefits[], image_url? }` | 201 |
| POST | `/admin/events` | `{ title, date?, location?, type, description?, image_url? }` | 201 |

- **products** : `ingredients` et `benefits` sont des tableaux ; en MySQL ils sont stockés en colonnes JSON.
- **products.category** : `wellness` \| `energie` \| `shakes` \| `coffee`
- **events.type** : `popup` \| `event`

## Sécurité

- Vérifier le JWT (ou la session) sur toutes les routes sauf `login` / `register`.
- Vérifier `role === 'admin'` pour les routes `/admin/*`.
- Connexion MySQL avec un utilisateur dédié (pas root), credentials en variables d’environnement côté backend.
