# Pessora — Rattrapage Phase 0-2 (points critiques sautés)
# 31 Mai 2026 — Cursor a livré les phases 0-6 mais a sauté 3 points 🔴

---

## Tâche 1 : Middleware CSRF Next.js 🔴

**Pourquoi** : Actuellement aucune protection CSRF sur les routes mutantes.

Crée `/src/middleware.ts` :
- Importe depuis `/opt/data/repos/dalcielo/src/middleware.ts` (copie le pattern exact)
- Token CSRF 32 octets, cookie `sameSite: strict`, nom `pessora-csrf-token`
- Appliquer sur toutes les méthodes mutantes (POST, PUT, PATCH, DELETE)
- Ignorer les routes API Stripe webhook (`/api/webhooks/stripe` — Stripe ne peut pas envoyer de CSRF)
- Ignorer les Edge Functions Supabase (elles ont leur propre auth)

Crée `/src/lib/csrf.ts` (helper client) :
- `getCsrfToken()` — lit le cookie
- `csrfFetch(url, options)` — wrapper fetch qui attache `X-CSRF-Token`

**Ne pas oublier** : le middleware doit matcher TOUTES les routes, pas juste `/api/`.

---

## Tâche 2 : Rate Limiting 🔴

Crée `/src/lib/rateLimit.ts` :
- Pattern depuis Dal Cielo : stockage Map en mémoire, par IP
- Fenêtre glissante de 60 secondes
- Appliquer dans le middleware sur :
  - `/api/checkout/*` : 10 req/min
  - `/api/admin/*` : 30 req/min  
  - `/api/auth/*` : 5 req/min
- Retourner 429 + `Retry-After` header si dépassé

Intégrer dans `/src/middleware.ts` (même fichier que le CSRF).

---

## Tâche 3 : Validation prix serveur dans l'Edge Function 🔴

Dans `supabase/functions/create-checkout-session/index.ts` :

Actuellement les prix du panier sont pris TELS QUELS du client. C'est vulnérable.

Ajouter AVANT l'appel à Stripe :
```typescript
// CATALOGUE DE PRIX SERVEUR (source de vérité)
const CATALOG_PRICE: Record<string, number> = {
  // Gamme Sport
  'formula-1-950g': 6500,       // 65€ en centimes
  'creatine': 4500,
  'rebuild-whey': 9000,
  'gel-prolong': 3500,
  'electrolytes-cr7': 4000,
  'electrolytes-sachet': 3000,
  'omega-3': 4000,
  'hydrate': 5000,
  'protein-drink': 7500,
  'liftoff-pamplemousse': 4000,
  'liftoff-citron': 4000,
  // Gamme Wellness
  'aloe-vera': 6000,
  'collagene': 8500,
  'the-detox': 4500,
  'fibres': 4500,
  'complex-vitamine': 3500,
  'mineral-complex': 4500,
  // Gamme Skin
  'gel-nettoyant': 2900,
  'gommage': 2900,
  'lotion-tonique': 2200,
  'creme-hydratante-fps30': 5500,
  'serum-rides': 7500,
  'creme-tension': 8900,
  'creme-contour-yeux': 4900,
};

// VALIDER chaque item
for (const item of items) {
  const expectedPrice = CATALOG_PRICE[item.productId];
  if (!expectedPrice || Math.abs(item.unitPrice - expectedPrice) > 1) {
    return new Response(JSON.stringify({ 
      error: 'Prix invalide', 
      product: item.name,
      expected: expectedPrice,
      received: item.unitPrice 
    }), { status: 400 });
  }
}

// RECALCULER le total côté serveur (ignorer le total client)
const total = items.reduce((sum, item) => sum + CATALOG_PRICE[item.productId] * item.quantity, 0);
```

Adapter les `productId` selon la structure réelle des items envoyés par le frontend. Vérifier dans `CartDrawer.tsx` et `useCheckout.ts` le format exact des items.

---

## RÈGLES

- Un seul commit : `security: CSRF middleware + rate limiting + validation prix serveur`
- Tester le build : `npm run build` doit passer
- Ne pas toucher aux autres fichiers livrés par les phases 0-6
