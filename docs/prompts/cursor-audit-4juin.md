# Cursor Prompt — Audit Pessora du 4 Juin 2026
> Contexte : Élise a lancé 3 sous-agents en parallèle (sécurité, pipeline fonctionnel, UX/UI).
> Voici les correctifs à appliquer par ordre de priorité.
> **Pour chaque problème : analyser d'abord le code existant, comprendre le flux, PUIS corriger.**

---

## P0-1 🔴 Pipeline gamme CASSÉ — `scheduled` absent du CHECK

**Fichier :** `supabase/migrations/20260602100000_add_order_type.sql`

**Analyse :**
- La contrainte CHECK `orders_status_check` contient `'confirmed'` mais PAS `'scheduled'`
- Tout le code utilise `'scheduled'` : `database.ts`, `update-order-status/index.ts`, `RetraitsGamme.tsx`, `AdminOrderCard.tsx`, `AdminOrdersFilter.tsx`, `SuiviCommande.tsx`
- Résultat : toute tentative d'écrire `status = 'scheduled'` lève une CHECK constraint violation

**Action :** Créer une nouvelle migration qui remplace `'confirmed'` par `'scheduled'` dans la contrainte CHECK. Ne pas modifier la migration existante (immutable), en créer une nouvelle.

---

## P0-2 🔴 Colonne fantôme `parent_payment_id`

**Fichiers :** `supabase/functions/create-checkout-session/index.ts` (l.164-165, 303-318), `supabase/functions/get-order-for-success/index.ts`

**Analyse :**
- `createOrder()` écrit `parent_payment_id` dans le payload d'insertion mais la colonne n'existe pas en base
- `get-order-for-success` groupe par `stripe_session_id`, pas par `parent_payment_id`
- Les 2 orders d'un panier split (bar + gamme) partagent le même `stripe_session_id` mais perdent le lien explicite

**Action :**
1. Créer une migration ajoutant `parent_payment_id UUID REFERENCES orders(id)` à la table `orders`
2. Option plus simple : retirer l'écriture de `parent_payment_id` du code si `stripe_session_id` suffit
3. Si on garde `parent_payment_id`, mettre à jour `get-order-for-success` pour grouper par ce champ

---

## P0-3 🔴 Gestion du stock — jamais vérifié

**Fichiers :** `supabase/migrations/20260531240000_stock_management.sql`, `supabase/functions/create-checkout-session/index.ts`, `src/hooks/useCheckout.ts`

**Analyse :**
- La colonne `gamme_products.stock` et la table `stock_movements` existent
- Aucun code ne vérifie `stock > 0` avant checkout, ni ne décrémente après commande
- Vente possible de produits en rupture de stock

**Action :**
1. Dans `create-checkout-session`, avant de créer la commande gamme : vérifier `stock > 0` pour chaque ligne gamme, rejeter si insuffisant
2. Après création de la commande gamme (statut `paid`), décrémenter `stock` de façon atomique (`UPDATE ... SET stock = stock - 1 WHERE stock > 0`)
3. Insérer une ligne dans `stock_movements` (type `sale`)

---

## P0-4 🔴 Secrets exposés dans l'historique git

**Fichiers :** Historique git (commit `eabf617`), `docs/n8n/*.json` (sur disque)

**Analyse :**
- Le secret PessoBot (`607dd413...`) est dans le commit initial `eabf617`
- Les fichiers `docs/n8n/*.json` sont hors tracking (`.gitignore`) mais physiquement présents sur le filesystem
- Le `.gitignore` a un conflit de merge non résolu (lignes 46-50)

**Action :**
1. Résoudre le conflit de merge dans `.gitignore`
2. Supprimer physiquement les fichiers `docs/n8n/*.json` du filesystem
3. Faire tourner le secret PessoBot côté n8n (nouveau secret)
4. Optionnel mais recommandé : purger l'historique git avec `git filter-branch`/`bfg` pour retirer le secret des anciens commits

---

## P0-5 🔴 Pas d'ErrorBoundary global

**Fichier :** `src/App.tsx`

**Analyse :**
- 0 occurrence de `ErrorBoundary` dans tout le code
- Une exception React non capturée = écran blanc pour tous les utilisateurs
- Le `Suspense` existant ne gère que le lazy loading, pas les erreurs runtime

**Action :**
1. Créer un composant `ErrorBoundary.tsx` avec fallback UI (message + bouton recharger)
2. Wrapper `App.tsx` (ou le router) dans cet ErrorBoundary

---

## P1-1 🟠 Guest — commandes `pending` jamais nettoyées

**Fichier :** `src/pages/CommandeAnnulee.tsx` (l.34-39)

**Analyse :**
- L'annulation vérifie `eq('user_id', session.user.id)`
- Un invité n'a pas de `user_id` → la commande reste `pending` à jamais
- Accumulation de commandes fantômes, stats admin faussées

**Action :**
- Permettre l'annulation par `access_token` (passé dans l'URL de retour Stripe) pour les guests
- Vérifier `eq('access_token', urlToken)` en fallback si pas de `user_id`

---

## P1-2 🟠 Idempotence webhook Stripe défaillante

**Fichier :** `supabase/functions/stripe-webhook/index.ts` (l.31-44)

**Analyse :**
- `INSERT ON CONFLICT DO NOTHING` + `.single()` échoue avec `PGRST116` sur événement déjà traité
- Le code ne capture que `code === '23505'`, pas `PGRST116`
- Les événements rejoués passent au travers et sont retraités

**Action :**
- Ajouter la détection de `PGRST116` (0 row returned) dans le catch
- OU remplacer par un pattern SELECT-before-INSERT plus robuste

---

## P1-3 🟠 Bar fermé — checkout non bloqué

**Fichiers :** `src/components/cart/CartDrawer.tsx` (l.206), `src/hooks/useCheckout.ts`

**Analyse :**
- Le message "🔴 Bar fermé" est affiché mais le bouton "Payer ma commande" reste actif
- Aucune vérification côté serveur non plus
- Commandes acceptées hors horaires

**Action :**
1. Désactiver le bouton checkout si `barStatus.isOpen === false` (produits bar uniquement)
2. Ajouter une vérification côté serveur dans `create-checkout-session` (rejeter si bar fermé + panier contient des produits bar)

---

## P1-4 🟠 Contraste WCAG AA — text-black avec faible opacité

**Fichiers concernés :** Tous les composants utilisant `text-black/45`, `text-black/40`, `text-black/35`, `text-black/30`

**Analyse :**
- `text-black/45` : ratio ~3.5:1 → échec WCAG AA (minimum 4.5:1)
- `text-black/40` : ratio ~3.0:1 → échec
- Utilisé massivement pour placeholders, métadonnées, dates

**Action :**
1. Si le texte est décoratif/non-essentiel → acceptable, documenter
2. Si le texte est informationnel → remplacer par `text-black/60` minimum (ratio 4.7:1) ou utiliser une couleur plus foncée
3. Priorité : prix, statuts, labels de formulaire

---

## Priorité d'exécution

1. **P0-1 + P0-2** (migrations SQL, 5 min) → pipeline gamme fonctionnel
2. **P0-5** (ErrorBoundary, 30 min) → plus de crash écran blanc
3. **P0-4** (secrets, 15 min) → sécurité
4. **P0-3** (stock, 1h) → fonctionnel
5. **P1-1 à P


**Rappel : ANALYSER LE CODE EXISTANT AVANT DE CORRIGER.** Ne pas coder à l'aveugle.
