# Cursor Prompt — Security Headers Pessora (31 Mai 2026)

## Contexte

Pessora n'a aucun header de sécurité HTTP. Avant le lancement public, c'est 10 lignes à ajouter. Dal Cielo (pizzeria) a une config complète — on prend ce qui est pertinent pour un bar protéiné.

---

## Action : Ajouter les headers dans `vercel.json`

**Fichier :** `vercel.json`

Remplacer le contenu actuel (juste les rewrites SPA) par :

```json
{
  "rewrites": [
    { "source": "/((?!api|_next|.*\\..*).*)", "destination": "/index.html" }
  ],
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Optionnel — Content-Security-Policy :**

Si tu veux aller plus loin, ajouter dans le bloc `headers[0].headers` :

```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com;" }
```

Mais commence sans le CSP — ça peut casser des choses si mal configuré. À tester en preview.

---

## Vérification

- `npm run build` doit passer
- Déploiement Vercel → inspecter les headers dans DevTools Network
- Vérifier que le site fonctionne toujours (images, appels API Supabase, Stripe)

---

## Checklist

- [ ] Remplacer `vercel.json`
- [ ] `npm run build` OK
- [ ] Déployer sur Vercel preview
- [ ] Vérifier les headers dans DevTools
