# Search Drawer — Design Spec

**Goal:** Remplacer le `HeaderSearch` basique par un panneau de recherche pleine largeur style Le Tanneur — slide down, résultats en temps réel groupés par catégorie, interface luxe éditoriale.

---

## Comportement

- Clic sur l'icône loupe dans le header → panneau slide vers le bas (translateY, 250ms ease-out)
- Fermeture : croix, Escape, clic sur le backdrop
- Input auto-focus à l'ouverture
- Backdrop semi-transparent derrière le panneau (z-index inférieur au drawer)

## État vide (query < 2 chars)

- Section **BOISSONS** : toutes les boissons de `menuData.ts` en grille compacte (nom + catégorie + prix) → `/menu/:id`
- Section **ÉVÉNEMENTS** : 4 prochains events Supabase (date bloc + titre + type) → `/evenements/:slug`

## État recherche (query ≥ 2 chars, debounce 200ms)

- **BOISSONS · N** : filtre local `menuData` sur nom + description (case-insensitive)
- **ÉVÉNEMENTS · N** : `supabase.from('events').select().ilike('title', '%q%').gte('date', today).limit(5)`
- **PRODUITS · N** : `supabase.from('products').select().ilike('name', '%q%').limit(5)`
- Zéro résultat global → "Aucun résultat pour « query »"

## Design (PESSORA luxe éditorial)

- Panneau blanc, pleine largeur, collé sous le header sticky
- Input : grand (text-[22px]), border-bottom uniquement, placeholder "Rechercher…" en italique
- Section headers : petites caps, tracking très large, séparateur fin
- Boissons vide : grille de pills (nom + catégorie + prix)
- Événements vide : blocs date (jour/mois en noir) + titre + badge type
- Résultats search : lignes horizontales propres avec nom en gras + détail à droite
- Hover : fond `black/[0.03]` sur toute la ligne, transition 150ms
- Gold dot `oklch(57%_0.065_68)` comme accent sur les résultats

## Architecture fichiers

- `src/components/layout/HeaderSearch.tsx` — remplacé entièrement
- `src/hooks/useSearch.ts` — hook (local filter + Supabase debounced)
- `src/components/layout/Header.tsx` — aucun changement
