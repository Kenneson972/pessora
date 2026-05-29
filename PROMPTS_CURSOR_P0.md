# Prompts Cursor — Pessora P0 (Critique)

Tous les fichiers sont dans /opt/data/repos/pessora/supabase/functions/

---

## P0.1 — Restreindre CORS Edge Functions

Contexte : toutes les Edge Functions Supabase ont CORS `*` (trop permissif).
Objectif : restreindre à l'origine exacte du site.

```
Dans le dossier supabase/functions/, chaque Edge Function a un appel corsHeaders ou des headers Access-Control-Allow-Origin: *. 

Pour CHAQUE fonction (_shared/cors.ts ou similaire, et les fonctions individuelles) :
- Remplace Access-Control-Allow-Origin: * par Access-Control-Allow-Origin: https://www.pessora.mq
- Si l'origine vient d'une variable d'env, utilise Deno.env.get("ALLOWED_ORIGIN") avec fallback "https://www.pessora.mq"
- Vérifie que les requêtes OPTIONS (preflight) retournent aussi la bonne origine

Fonctions concernées : create-checkout-session, send-contact-email, stripe-webhook, create-customer-portal-session, activate-ora-plus, register-for-event, cancel-event-registration
```

---

## P0.2 — Sécuriser DemoAuthWrapper

Contexte : DemoAuthWrapper dans src/contexts/DemoAuthContext.tsx utilise VITE_DEMO_* pour auto-login en dev. Risque si ces variables fuient en prod.

```
Dans src/contexts/DemoAuthContext.tsx :
- Ajoute un guard au début du composant : si import.meta.env.PROD est true, return children immédiatement (bypass le wrapper demo)
- OU vérifie que le hostname n'est pas l'URL de prod avant d'activer le demo auth
- Ajoute un commentaire clair expliquant que ce composant ne doit JAMAIS être actif en production
- Optionnel : ajoute un console.warn visible si activé par erreur en prod
```

---

## P0.3 — Externaliser les strings sensibles

Contexte : plusieurs valeurs sont hardcodées dans le code.

```
1. Dans supabase/functions/send-contact-email/index.ts :
   - Remplace contact@pessora.mq et pessora.mq@gmail.com par Deno.env.get("CONTACT_EMAIL") et Deno.env.get("ADMIN_EMAIL")
   - Ajoute des fallbacks documentés

2. Dans supabase/functions/activate-ora-plus/index.ts (ou le fichier concerné) :
   - Cherche le prix hardcodé 24.90 ou 2490
   - Remplace par Deno.env.get("ORA_PLUS_PRICE_AMOUNT") avec parsing en nombre
   - Si la variable est absente, throw une erreur explicite

3. Dans supabase/functions/_shared/ :
   - Vérifie s'il y a d'autres strings en dur (domaines, emails, tokens)
   - Crée un fichier _shared/env.ts avec des helpers typed getEnvVar(name: string): string
```

---

## P0.4 — Nettoyer le code mort

Contexte : src/pages/Admin.tsx fait 404 lignes / 17KB et n'est plus routé.

```
1. Vérifie que src/pages/Admin.tsx n'est PAS importé dans App.tsx ou le router
2. Si confirmé non utilisé : supprime le fichier
3. Cherche d'autres fichiers morts :
   - grep "import.*Admin" dans tout le src/
   - Si un composant n'est importé nulle part, le supprimer
4. Fais un npm run build pour vérifier qu'aucune erreur de compilation
```
