# Template Karibloom — Pack RISE

**Base de référence :** PessÓra · **Stack :** React 19 · Vite · TypeScript · HeroUI · Supabase · Tailwind v4

Ce template sert à démarrer un nouveau client **RISE** (marque ou lieu premium avec espace membre, abonnement, catalogue éditorial et IA de conseil) : coach, studio, marque wellness, concept-store, cabinet, etc.

---

## 1. Ce que le pack RISE illustre ici

| Promesse RISE | Implémentation PessÓra |
|---|---|
| 8-10 pages | Accueil, Concept, Menu, Nos produits, Événements, Contact, Partenariats, PessoBot, Óra+, espace membre |
| Site d'autorité | Pages Concept / valeurs / produits éditoriaux |
| IA niveau 3 — conseil & proposition | PessoBot (expert nutrition) qui qualifie et conseille |
| Espace membre / abonnement | Auth Supabase + offre Óra+ + survey post-inscription |
| Qualification de lead | Formulaire partenariat + capture |
| Dashboard | Espace membre + admin produits |

---

## 2. Sources de vérité

La donnée variable client est centralisée dans **`template/client.config.ts`**. Le repo possède déjà trois fichiers de données pivots à aligner :

- `src/data/infoData.ts` → `barInfo` (NAP, horaires, valeurs)
- `src/data/seoConfig.ts` → titres/descriptions par route
- `src/data/productsData.ts` + `menuData.ts` → catalogue

---

## 3. Procédure « nouveau client »

1. **Dupliquer** le repo Pessora → nouveau dossier client.
2. **Remplir** `template/client.config.ts`.
3. **NAP & valeurs** → `src/data/infoData.ts` (`barInfo`).
4. **SEO par page** → `src/data/seoConfig.ts` (chaque route : title, description, og*).
5. **Couleurs** → `src/index.css` `:root` (tokens `--color-*`, voir `theme`).
6. **Catalogue** → `src/data/productsData.ts`, `menuData.ts`, `homeProductCarousel.ts`, `homeDrinkShowcase.ts`, `homeSplitGammes.ts`.
7. **Abonnement** → `src/data/oraPlusData.ts` (renommer offre).
8. **Médias** → logo `.webp`, headers, favicons dans `public/`.
9. **Supabase** → nouveau projet, `.env.local`, migrations dans `supabase/migrations/`.
10. **Build & vérif** — `npm install && npm run build` + checklist §5.

---

## 4. Checklist fichiers à modifier (audit)

Strings client trouvées dans ~62 fichiers. Points chauds :

**Données pivots**
- `src/data/infoData.ts` — NAP, horaires, valeurs de marque
- `src/data/seoConfig.ts` — SEO par route (toutes les pages)
- `src/data/productsData.ts`, `menuData.ts`, `oraPlusData.ts` — catalogue + abonnement
- `src/data/homeProductCarousel.ts`, `homeDrinkShowcase.ts`, `homeSplitGammes.ts` — sections home
- `src/data/headerNav.ts` — libellés de navigation
- `src/data/googleReviews.ts` — avis (vider / remplacer)
- `src/data/authLayoutMedia.ts` — visuels écran login

**Pages / composants**
- Pages dans `src/pages/` (Concept, Événements, Contact, Óra+, PessoBot…)
- `src/lib/siteAnnouncement.ts` — bandeau d'annonce
- Composants chatbot (PessoBot) — nom + rôle de l'IA

**Thème**
- `src/index.css` — tokens `--color-*` (voir `client.config.ts` → `theme`)

> `grep -rIl -E "PessÓra|Pessora|Cluny|La Véranda|pessora.fr" src/` liste le reste.

---

## 5. Vérification avant livraison

- [ ] `npm run build` (`tsc && vite build`) passe
- [ ] `grep -rI "PessÓra\|Pessora\|Cluny" src/ public/` → vide
- [ ] Auth Supabase OK (inscription / login / espace membre)
- [ ] PessoBot répond avec le bon nom / rôle
- [ ] SEO : `npm run generate:sitemap` régénéré
- [ ] OG / favicons à jour
- [ ] Responsive mobile (375px)

---

## 6. Ne PAS toucher

- Logique auth / store Zustand / providers
- Hooks Supabase, types `database.ts`
- Structure HeroUI / composants UI génériques
