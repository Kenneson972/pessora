# Pessora — Plan d'action inspiré de Dal Cielo
# Audit Élise — 31 Mai 2026
# 6 phases — Push après chaque phase

---

## PHASE 0 — Fondations Sécurité 🔴

**Commit :** `security: CSRF middleware + admin auth serveur + rate limiting + CSP headers`

### Tâche 1 : Middleware CSRF
Copie et adapte depuis Dal Cielo :
- Fichier référence : `/opt/data/repos/dalcielo/src/middleware.ts`
- Crée `/src/middleware.ts` dans Pessora
- Token CSRF 32 octets, cookie `sameSite: strict`
- Appliquer sur toutes les routes mutantes (POST/PUT/PATCH/DELETE)
- Helper `/src/lib/csrf.ts` pour le client (récupérer/attacher le token)
- Adapter les noms de cookie : `pessora-csrf-token` (pas `dalcielo-csrf-token`)

### Tâche 2 : Auth admin côté serveur
- Fichier référence : `/opt/data/repos/dalcielo/src/lib/adminAuth.ts`
- Crée `/src/lib/adminAuth.ts` dans Pessora
- Vérification par PIN (timing-safe comparison)
- Rate limiting intégré (5 tentatives max par IP, window 15 min)
- Remplace le `ProtectedAdminRoute.tsx` actuel (React-only) par une vérification SERVEUR
- Toutes les API routes admin doivent appeler `verifyAdminAuth(request)` avant d'exécuter

### Tâche 3 : Rate limiting
- Fichier référence : `/opt/data/repos/dalcielo/src/lib/rateLimit.ts`
- Crée `/src/lib/rateLimit.ts` dans Pessora
- Appliquer sur :
  - `/api/checkout/create-session` (10 req/min/IP)
  - `/api/admin/*` (30 req/min/IP)
  - `/api/auth/*` (5 req/min/IP)
- Stockage Map en mémoire (pas de Redis nécessaire)

### Tâche 4 : Headers sécurité + CSP
- Fichier référence : `/opt/data/repos/dalcielo/next.config.js` (section headers)
- Mets à jour `vercel.json` avec :
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` — restreindre aux sources connues (Supabase, Stripe, Herbalife CDN, vercorssportsteam)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## PHASE 1 — Audit & Traçabilité 🔴

**Commit :** `security: audit logging + RLS admin verification + admin API routes`

### Tâche 1 : Audit log
- Fichier référence : `/opt/data/repos/dalcielo/src/lib/auditLog.ts`
- Crée `/src/lib/auditLog.ts` dans Pessora
- Table Supabase `admin_audit_log` :
  ```sql
  CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- Logger toutes les actions admin : modification commande, ajout produit, changement prix, suppression, validation Óra+, gestion événements
- Ajouter la migration dans `supabase/migrations/`

### Tâche 2 : API routes admin sécurisées
Actuellement Pessora appelle Supabase en DIRECT côté client. Corrige :
- Crée les routes API protégées :
  - `POST /api/admin/products` — CRUD produits (vérifier `adminAuth` + `auditLog`)
  - `PATCH /api/admin/products/[id]`
  - `DELETE /api/admin/products/[id]`
  - `GET /api/admin/orders` — liste commandes avec filtres
  - `PATCH /api/admin/orders/[id]/status` — changer statut
  - `POST /api/admin/events` — CRUD événements
  - `POST /api/admin/ora-plus/validate` — validation abonnement
  - `GET /api/admin/analytics` — données dashboard
- Chaque route : `verifyAdminAuth()` AVANT toute logique métier
- Chaque route mutante : `auditLog(action, entity, details)`
- Supprimer les appels directs à `supabase` depuis les composants admin (remplacer par `fetch(/api/admin/...)`)

### Tâche 3 : Vérification RLS admin
- Dans chaque Edge Function Supabase, vérifier `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`
- PAS `auth.jwt() ->> 'role'` (c'est toujours `authenticated`)
- Référence : skill karibloom → piège JWT documenté

---

## PHASE 2 — Checkout Sécurisé & Mode Invité 🔴

**Commit :** `checkout: validation prix serveur + mode invité nom/tel + token suivi`

### Tâche 1 : Validation prix dans l'Edge Function
- Actuellement `create-checkout-session` prend les prix du client SANS VÉRIFICATION
- Ajouter dans l'Edge Function :
  - Un catalogue de prix SERVEUR (map `product_id → price_ht`)
  - Valider chaque item du panier contre ce catalogue
  - Recalculer le total côté serveur (IGNORER le total client)
  - Si écart détecté → rejeter la commande (400 + log)
- Fichier référence : `/opt/data/repos/dalcielo/src/app/api/orders/route.ts` (lignes validation prix)

### Tâche 2 : Mode invité — Formulaire identité
- Ajouter dans `CartDrawer.tsx` :
  - Champ `Prénom` (required)
  - Champ `Téléphone` (required, format FR)
  - Sauvegarde localStorage pour pré-remplir la prochaine visite
- Ajouter dans la table `orders` (migration SQL) :
  - `client_name TEXT`
  - `client_phone TEXT`
- Transmettre `client_name` + `client_phone` à l'Edge Function `create-checkout-session`
- L'Edge Function les enregistre dans la commande Supabase
- Le checkout fonctionne AVEC ou SANS `user_id` (invité OK)

### Tâche 3 : Token d'accès suivi commande
- Actuellement : `/suivi-commande?order=<UUID>` → n'importe qui peut deviner des UUIDs
- Remplacer par `/suivi-commande/<token>` où `token` = 32 caractères aléatoires
- Ajouter colonne `access_token TEXT UNIQUE` dans `orders`
- Générer le token dans l'Edge Function `create-checkout-session`
- Rediriger Stripe `success_url` vers `/commande-succes?token=<token>`
- Migration : générer des tokens pour les commandes existantes

### Tâche 4 : Redirection auto post-paiement
- Configurer l'URL `success_url` de Stripe pour pointer vers `/commande-succes`
- La page `/commande-succes` affiche le N° commande + lien suivi + bouton continuer

---

## PHASE 3 — Admin Dashboard Analytics 🔴

**Commit :** `admin: Recharts analytics + KPIs dashboard + admin toast system`

### Tâche 1 : Dashboard analytics Recharts
- Fichier référence : `/opt/data/repos/dalcielo/src/components/admin/RevenueChart.tsx`
- Installer `recharts` (déjà dans Dal Cielo)
- Créer `/src/components/admin/AnalyticsDashboard.tsx` :
  - **CA 7 jours** : `AreaChart` avec overlay objectif
  - **Commandes 7 jours** : `BarChart` par heure
  - **Top produits** : `PieChart` 5 meilleures ventes
  - **Répartition gamme** : `PieChart` Sport/Skin/Wellness
  - **Fidélité** : Óra+ vs one-shot
- Données depuis `/api/admin/analytics` (créée en Phase 1)
- Intégrer dans la page admin principale

### Tâche 2 : Widgets KPIs
- Créer 4 cartes KPI dans le dashboard :
  - CA du jour (avec % vs hier)
  - Commandes en cours (avec pastilles de statut)
  - Temps moyen d'attente
  - Taux de conversion Óra+
- Animation Framer Motion au montage
- Rechargement toutes les 60s

### Tâche 3 : Admin Toast System
- Fichier référence : `/opt/data/repos/dalcielo/src/components/admin/AdminToast.tsx`
- Créer un système de toast contextuel :
  - Succès (vert), Erreur (rouge), Info (bleu)
  - Auto-dismiss 4s
  - Stackable (max 3 visibles)
  - Accessible (role="alert")
- Brancher sur toutes les actions admin (création, modification, suppression, erreur)
- Son distinct pour succès vs erreur (fichiers audio dans `/public/sounds/`)

---

## PHASE 4 — File d'attente & Expérience bar 🟠

**Commit :** `experience: bar status provider + file attente + polling fallback + annulation`

### Tâche 1 : BarStatusProvider (adapté de QueueEstimateProvider)
- Fichier référence : `/opt/data/repos/dalcielo/src/providers/QueueEstimateProvider.tsx`
- Créer `/src/providers/BarStatusProvider.tsx` :
  - **Supabase Realtime** : écouter une table `bar_status` (ouverte/fermée, capacité)
  - **Estimation temps** : basée sur `commandes_en_cours × temps_moyen_préparation`
  - **Cache localStorage** : `pessora-bar-cache` (TTL 5 min)
  - **Polling adaptatif** : 15s normal, 5s panier ouvert, 3s si Realtime KO
  - **Stale timeout** : 30s sans update → badge "données obsolètes"
- Créer table `bar_status` (migration) :
  ```sql
  CREATE TABLE bar_status (
    id INT PRIMARY KEY DEFAULT 1,
    is_open BOOLEAN DEFAULT true,
    estimated_wait_minutes INT DEFAULT 5,
    max_capacity INT DEFAULT 20,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### Tâche 2 : Affichage file d'attente
- Intégrer `useBarStatus()` dans :
  - `CartDrawer` : afficher "⏱ ~X min d'attente estimée"
  - `SuiviCommande` : afficher temps restant estimé
  - Page d'accueil : badge statut bar (🟢 Ouvert / 🔴 Fermé)

### Tâche 3 : Polling fallback dans SuiviCommande
- Actuellement : Supabase Realtime UNIQUEMENT
- Ajouter polling de secours toutes les 5s si Realtime ne répond pas
- Indicateur visuel : petite pastille verte quand live, grise quand polling

### Tâche 4 : Annulation commande côté client
- Ajouter bouton "Annuler" dans `SuiviCommande`
- Visible uniquement si statut = `pending` ou `paid`
- Modal confirmation → `POST /api/orders/[token]/cancel`
- L'API vérifie : le token est valide, la commande est annulable
- Mise à jour statut → `cancelled`, notification admin

---

## PHASE 5 — Expérience Client Améliorée 🟡

**Commit :** `ux: upselling panier + notes client + RGPD + fallback hors-ligne`

### Tâche 1 : Upselling dans le panier
- Fichier référence : `/opt/data/repos/dalcielo/src/components/layout/CartDrawer.tsx` (section suggestions)
- Ajouter section "Les clients prennent aussi" dans `CartDrawer` :
  - Si boisson protéinée → suggérer un snack
  - Si produit Skin → suggérer un complément Wellness
  - Max 2 suggestions, pas plus
  - Bouton "+ Ajouter" qui appelle `addLine`

### Tâche 2 : Notes client
- Ajouter champ `notes` (optionnel) dans `CartDrawer`
- Ajouter colonne `notes TEXT` dans `orders` (migration)
- Transmettre à l'Edge Function checkout
- Afficher dans la vue admin commande

### Tâche 3 : Consentement RGPD panier
- Ajouter checkbox "J'accepte les conditions générales" dans `CartDrawer`
- Bouton "Payer" désactivé tant que pas coché
- Sauvegarder l'acceptation dans `orders.rgpd_consent = true`

### Tâche 4 : Fallback hors-ligne
- Si `fetch()` échoue (réseau KO) → sauvegarder la commande en localStorage
- Afficher message "Vous êtes hors-ligne. Votre commande sera envoyée dès que vous serez reconnecté."
- Au retour en ligne (`online` event) → retenter l'envoi
- Si échec persistant → proposer WhatsApp (lien `wa.me/` pré-rempli)

---

## PHASE 6 — Gestion Stocks & Alertes 🟠

**Commit :** `admin: gestion stocks + alertes niveau bas + mode rupture`

### Tâche 1 : Suivi des stocks
- Ajouter colonne `stock INT DEFAULT 0` dans `gamme_products` (migration)
- Interface admin : champ stock éditable par produit
- Décrémenter automatiquement à chaque commande complétée
- Référence : `/opt/data/repos/dalcielo/src/components/admin/StockAlerts.tsx`

### Tâche 2 : Alertes stock bas
- Afficher dans le dashboard admin :
  - 🔴 Stock épuisé (stock = 0) — badge "Rupture"
  - 🟠 Stock bas (stock ≤ 5) — badge "Bientôt épuisé"
- Notification toast admin à l'ouverture du dashboard
- Option : masquer automatiquement les produits en rupture du menu public

### Tâche 3 : Historique des mouvements
- Table `stock_movements` :
  ```sql
  CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES gamme_products(id),
    quantity INT NOT NULL,
    reason TEXT NOT NULL, -- 'order', 'restock', 'adjustment', 'waste'
    order_id UUID REFERENCES orders(id),
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- Logger chaque changement de stock

---

## RÈGLES GLOBALES (toutes phases)

- **NE PAS toucher au flux Stripe** (checkout, webhook) — adapter UNIQUEMENT l'Edge Function de validation
- **NE PAS modifier les migrations Supabase existantes** — créer de NOUVELLES migrations
- **Réutiliser les composants admin existants** — étendre, pas remplacer
- **TypeScript strict** — pas de `any`
- **Code adapté de Dal Cielo** : changer les noms, URLs, et constantes pour Pessora
- **Un commit par phase**, pousser entre chaque phase
- **Tester le build après chaque phase** : `npm run build` doit passer

---

## Ordre des phases

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
 Sécurité   Audit    Checkout  Dashboard  File      Confort   Stocks
 Fondations Traçab.  Sécurisé  Analytics  d'attente  Client    Alertes
```

**Priorité absolue : Phases 0-1-2** (sécurité + checkout). Sans ça, le site n'est pas prêt pour la production.
