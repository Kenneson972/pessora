# Prompts Cursor — Pessora P1 (Quick Wins)

---

## P1.1 — Créer .env.example

```
À la racine du projet, crée un fichier .env.example qui liste TOUTES les variables d'environnement nécessaires, avec des valeurs d'exemple (jamais de vrais secrets).

Parcours :
- Tous les VITE_* dans le code source (grep VITE_)
- Toutes les variables Deno.env.get() dans supabase/functions/
- Le .env.example doit être groupé par section avec des commentaires :
  # Supabase
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbG...

  # Stripe
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...

  # Demo (DEV ONLY)
  VITE_DEMO_EMAIL=demo@pessora.mq
  VITE_DEMO_PASSWORD=...

  # Edge Functions
  CONTACT_EMAIL=contact@pessora.mq
  ADMIN_EMAIL=pessora.mq@gmail.com
  ALLOWED_ORIGIN=https://www.pessora.mq
  ORA_PLUS_PRICE_AMOUNT=2490
```

---

## P1.2 — Ajouter Bundle Analyzer

```
1. Installe rollup-plugin-visualizer :
   npm install --save-dev rollup-plugin-visualizer

2. Dans vite.config.ts, ajoute dans plugins[] :
   import { visualizer } from 'rollup-plugin-visualizer'
   
   visualizer({
     open: false,
     filename: 'dist/stats.html',
     gzipSize: true,
     brotliSize: true,
   })

3. Lance npm run build
4. Ouvre dist/stats.html et analyse les plus gros chunks
5. Checklist d'optimisation :
   - @heroui/react + @heroui-pro = ~200KB gzippé → peut-on tree-shaker ?
   - framer-motion/motion → duplication avec motion vs framer-motion ?
   - Recharts → lazy-load uniquement sur la page admin dashboard
```

---

## P1.3 — Optimiser les images

```
Objectif : ajouter srcset + WebP pour toutes les images du site.

1. Crée un hook useResponsiveImage(src: string) qui retourne :
   - src WebP (ou fallback original)
   - srcSet avec tailles responsive
   - sizes attribute

2. Solution : utiliser unpkg ou un service de redimensionnement.
   Option A — URL param sur ImageKit (si déjà utilisé comme pour IT Luxuoso) :
   - Ajoute ?tr=w-320 pour mobile, ?tr=w-768 pour tablette, etc.
   
   Option B — Composant <Picture> avec <source srcSet="...?format=webp"> + fallback <img>

3. Sur la homepage :
   - Remplace les <img> dans le carrousel par le hook useResponsiveImage
   - Ajoute loading="lazy" sur tout sauf l'image hero LCP
   - Vérifie que le logo a fetchpriority="high"
```

---

## P1.4 — Rate Limiting Edge Functions

```
Objectif : protéger les Edge Functions publiques contre les abus.

Dans supabase/functions/_shared/ crée rate-limiter.ts :

```typescript
const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 10   // par IP

const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = store.get(ip)
  
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  
  if (entry.count >= MAX_REQUESTS) return false
  
  entry.count++
  return true
}
```

Applique ce rate limiter dans :
- send-contact-email/index.ts (avant l'envoi d'email)
- create-checkout-session/index.ts (avant la création de session Stripe)
- register-for-event/index.ts (avant l'inscription)

Pour chaque fonction :
- Extrais l'IP du header x-forwarded-for ou x-real-ip
- Si checkRateLimit(ip) === false → retourne 429 Too Many Requests
- Ajoute le header Retry-After dans la réponse 429
```
