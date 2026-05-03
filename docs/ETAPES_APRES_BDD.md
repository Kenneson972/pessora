# Que faire après avoir créé la BDD (o2switch)

Tu as exécuté le script `docs/O2SWITCH_SCHEMA.sql` et la base MySQL est prête. Voici les étapes suivantes.

---

## Option : dev local sans MySQL (plus de "connection refused")

Si tu développes sur ton Mac et que la connexion MySQL distante est refusée (erreur **ECONNREFUSED 109.62.104.45:3306**), tu peux utiliser **SQLite** en local (aucune installation) :

- Dans **`server/.env`** mets **`DB_HOST=sqlite`** (sans rien d’autre pour MySQL).
- Lance `cd server && npm run dev` : une base locale `server/pessora.db` est créée automatiquement.
- Inscription / connexion / Mon espace fonctionnent en local. Les données sont dans `pessora.db`, **pas** dans la BDD o2switch.

---

## Enregistrer dans la BDD o2switch

Depuis ton Mac, le port MySQL (3306) d’o2switch est en général **fermé** → "connection refused". Pour que les inscriptions soient bien enregistrées dans la **base MySQL o2switch** :

1. **Déploie l’API** (dossier `server/`) sur o2switch (FTP + Node, ou hébergement Node proposé par o2switch).
2. Sur le **serveur**, dans le `.env` de l’API, mets :
   - `DB_HOST=localhost`
   - `DB_PORT=3306`
   - `DB_USER=fawo6188_Pesso`
   - `DB_PASSWORD=ton_mot_de_passe_mysql`
   - `DB_NAME=fawo6188_PESSORA`
3. L’API et MySQL sont sur la même machine → la connexion fonctionne, les inscriptions partent dans la BDD o2switch.

---

## 1. Configurer le backend (dossier `server/`)

1. Va dans le dossier du serveur :
   ```bash
   cd server
   ```

2. Copie le fichier d’exemple d’environnement :
   ```bash
   cp .env.example .env
   ```

3. Ouvre `.env` et remplis avec **les identifiants MySQL fournis par o2switch** :
   - **DB_HOST** : souvent `localhost` si l’API tourne sur le même hébergeur que la BDD, ou l’adresse MySQL indiquée par o2switch
   - **DB_USER** : ton utilisateur MySQL
   - **DB_PASSWORD** : le mot de passe MySQL
   - **DB_NAME** : `pessora` (ou le nom de la base que tu as créée)
   - **JWT_SECRET** : une longue chaîne aléatoire (ex. générée avec `openssl rand -hex 32`)
   - **PORT** : par exemple `3001` en local
   - **UPLOAD_URL_PREFIX** : en local `http://localhost:3001/uploads` ; en production l’URL publique de ton API + `/uploads` (ex. `https://votredomaine.com/api/uploads`)

4. Installe les dépendances et lance l’API :
   ```bash
   npm install
   npm run dev
   ```
   Tu dois voir : `API PESSORA écoute sur http://localhost:3001`

---

## 2. Configurer le frontend

À la **racine du projet** (pas dans `server/`) :

1. Crée un fichier `.env` (s’il n’existe pas) avec :
   ```
   VITE_API_URL=http://localhost:3001
   ```

2. Lance le frontend :
   ```bash
   npm run dev
   ```

3. Ouvre l’app (ex. `http://localhost:5173`), va sur **Inscription**, crée un compte. Tu dois pouvoir te connecter et accéder à « Mon espace ».

---

## 3. Créer un compte administrateur

Par défaut les nouveaux comptes ont le rôle `member`. Pour accéder à `/admin` (produits, événements, upload d’images), il faut un compte `admin`.

Dans phpMyAdmin (ou en SQL sur ta base o2switch) :

```sql
UPDATE users SET role = 'admin' WHERE email = 'ton@email.com';
```

Remplace `ton@email.com` par l’email du compte que tu viens de créer. Reconnecte-toi si besoin : tu devrais voir le lien Admin et pouvoir ajouter des produits / événements.

---

## 4. Mettre l’API en production (optionnel)

- **Sur o2switch** : si ton hébergeur permet Node.js, déploie le dossier `server/` (avec `.env` rempli pour la prod) et configure un reverse proxy ou le gestionnaire Node pour pointer vers ton app.
- **Ailleurs** : tu peux héberger l’API sur un VPS, Render, Railway, etc. ; configure alors `DB_HOST` avec l’adresse MySQL distante fournie par o2switch (accès MySQL à distance si activé).
- En production, mets `VITE_API_URL` sur l’URL réelle de ton API (ex. `https://api.votredomaine.com`).

---

## Récap

| Étape | Où | Action |
|-------|-----|--------|
| 1 | `server/` | Copier `.env.example` → `.env`, remplir MySQL + JWT_SECRET |
| 2 | `server/` | `npm install && npm run dev` |
| 3 | Racine projet | `.env` avec `VITE_API_URL=http://localhost:3001` |
| 4 | Racine projet | `npm run dev` |
| 5 | Base MySQL | `UPDATE users SET role = 'admin' WHERE email = 'ton@email.com';` |

En cas d’erreur de connexion à la BDD, vérifie que les variables `DB_*` dans `server/.env` correspondent bien à celles de ton panel o2switch (nom de la base, utilisateur, mot de passe, hôte).
