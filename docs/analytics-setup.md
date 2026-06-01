# Guide Analytics Pessora — 1er Juin 2026

## Solution retenue : Vercel Web Analytics

Pessora = Vite + React 19 + React Router. Vercel Analytics s'installe en 2 lignes.

### Étape 1 : Installer le package

```bash
cd /opt/data/repos/pessora
npm install @vercel/analytics
```

### Étape 2 : Ajouter le composant Analytics dans l'app

**Fichier** : `src/main.tsx` (ou l'équivalent App root)

```tsx
import { Analytics } from '@vercel/analytics';

// Dans le render principal, ajouter <Analytics /> avant la fermeture :
<Analytics />
```

Une seule ligne. Page views automatiques, zero config.

### Étape 3 : Custom events — tunnel de conversion

À ajouter progressivement :

```tsx
import { track } from '@vercel/analytics';

// Dans CartDrawer — ajout au panier
track('product_added_to_cart', { productName, price, gamme });

// Dans useCheckout — checkout initié
track('checkout_started', { itemsCount, totalAmount });

// Dans CommandeSucces — achat confirmé
track('purchase_completed', { orderId, totalAmount, itemsCount });

// Dans le menu — vue produit
track('product_viewed', { productName, gamme });
```

### Étape 4 : Dashboard

Les analytics apparaissent automatiquement dans le dashboard Vercel :
https://vercel.com/dashboard → sélectionner le projet Pessora → Analytics

---

## Alternative : PostHog (si besoin analytics plus poussés)

PostHog offre : funnel analysis, heatmaps, session recordings, feature flags.

```bash
npm install posthog-js
```

```tsx
// src/main.tsx
import posthog from 'posthog-js';

posthog.init('PHC-XXXXXXXXX', {
  api_host: 'https://eu.posthog.com',
  autocapture: true,
});
```

Voir skill : `posthog/ai-plugin/instrument-product-analytics`
