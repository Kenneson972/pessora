// Routing Middleware Vercel (framework-agnostic) — split par hostname admin.pessora.fr.
//
// Pourquoi un middleware et pas juste vercel.json "rewrites" :
// sur un déploiement statique Vercel, le check filesystem passe AVANT les
// rewrites de vercel.json. Une requête sur "/" (qui correspond à un vrai
// fichier index.html sur disque) est donc servie telle quelle, sans jamais
// atteindre la règle de rewrite conditionnelle par host. Le middleware
// tourne sur l'edge en amont de cette livraison statique et peut forcer
// admin.html même sur "/". Voir docs/directive-middleware-host-split-2026-09-09.md.
import { rewrite, next } from '@vercel/functions';

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? '';
  const isAdminHost = host.startsWith('admin.');

  // Piège assets : ne réécrire QUE le document HTML (routes SPA sans extension).
  // Tout fichier avec une extension (.js, .css, .png, .webp, .woff2, …) — en
  // particulier les chunks de /assets/* — doit être servi tel quel, sinon le
  // bundle admin casse (son propre JS serait réécrit vers admin.html).
  const hasFileExtension = /\.[^/]+$/.test(url.pathname);

  if (isAdminHost && !hasFileExtension) {
    return rewrite(new URL('/admin.html', request.url));
  }

  return next();
}
