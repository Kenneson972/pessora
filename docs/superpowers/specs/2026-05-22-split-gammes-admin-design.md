# Split Gammes Admin — Design Spec

> **For agentic workers:** Use superpowers:writing-plans to implement this spec task-by-task.

**Goal:** Rendre la section "Choisis ton moment" (HomeSplitGammes) entièrement gérable depuis l'admin sans toucher au code — textes et 3 photos par onglet.

**Architecture:** Table Supabase `home_split_gammes` (1 ligne par onglet) + bucket Storage `split-gammes-images` + page admin `/admin/moments` + hook `useSplitGammes` qui remplace le fichier TS statique.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL + Storage), HeroUI, Framer Motion, Tailwind CSS v4, `storageUpload.ts` existant.

---

## Contexte

La section "Choisis ton moment" (`src/components/home/HomeSplitGammes.tsx`) affiche 4 onglets (Wellness, Énergie, Shakes, Coffee), chacun avec :
- Une grande photo gauche (`mainImage`)
- 2 photos droite (`sideImages[0]`, `sideImages[1]`)
- Un eyebrow, un titre, un lien CTA

Actuellement toutes les images sont `null` (placeholder "Photo à venir") et les données sont hardcodées dans `src/data/homeSplitGammes.ts`. Aucune gestion admin.

Le carrousel "À la une" (`home_carousel_cards`) est déjà entièrement géré en admin — ce design s'en inspire directement.

---

## 1. Base de données

### Table `home_split_gammes`

```sql
CREATE TABLE home_split_gammes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key              TEXT UNIQUE NOT NULL,  -- 'wellness' | 'energie' | 'shakes' | 'coffee'
  position         INTEGER NOT NULL,
  label            TEXT NOT NULL,         -- texte du bouton onglet
  eyebrow          TEXT NOT NULL,         -- petit texte au-dessus du titre
  title            TEXT NOT NULL,         -- titre principal
  link_to          TEXT NOT NULL,         -- lien bouton CTA
  main_image_url   TEXT,                  -- grande photo gauche (null = placeholder)
  side_image_1_url TEXT,                  -- photo droite haut (null = placeholder)
  side_image_2_url TEXT,                  -- photo droite bas (null = placeholder)
  updated_at       TIMESTAMPTZ DEFAULT now()
);
```

**RLS :**
- SELECT : public
- UPDATE : `profiles.role = 'admin'` uniquement
- INSERT/DELETE : bloqués (les 4 onglets sont fixes)

**Données initiales :** migration pré-charge les 4 onglets avec les textes actuels de `homeSplitGammes.ts` (labels, eyebrows, titres, liens) et images null.

### Bucket Storage `split-gammes-images`

- Public (lecture sans auth)
- Upload/delete : admin uniquement
- Types acceptés : JPEG, PNG, WebP — 5 Mo max
- Chemin de fichier : `{key}/{timestamp}-{filename}` (ex: `wellness/1716400000-modele.jpg`)

`src/lib/storageUpload.ts` : ajouter `'split-gammes-images'` à l'union de buckets.

---

## 2. Hook `useSplitGammes`

**Fichier :** `src/hooks/useSplitGammes.ts`

```ts
interface SplitGamme {
  id: string;
  key: string;
  position: number;
  label: string;
  eyebrow: string;
  title: string;
  link_to: string;
  main_image_url: string | null;
  side_image_1_url: string | null;
  side_image_2_url: string | null;
}

// Retourne { gammes: SplitGamme[], loading: boolean }
// Fetch depuis home_split_gammes ORDER BY position ASC
// Fallback : si DB vide ou erreur, retourne splitGammesData converti (compatibilité)
```

---

## 3. Mise à jour `HomeSplitGammes.tsx`

- Remplacer `import { splitGammesData }` par `const { gammes, loading } = useSplitGammes()`
- Adapter les champs : `mainImage` → `main_image_url`, `sideImages[0]` → `side_image_1_url`, `sideImages[1]` → `side_image_2_url`, `linkTo` → `link_to`
- Afficher skeletons pendant `loading` (même pattern que HomeFeaturedCarousel)
- Comportement placeholder inchangé : si `image_url = null`, affiche "Photo à venir"

---

## 4. Page admin `/admin/moments`

**Fichier :** `src/pages/admin/AdminSplitGammes.tsx`

### Liste (vue principale)

- 4 lignes, une par onglet (drag & drop pour réordonner via position)
- Chaque ligne : grip icon + miniatures des 3 photos (ou icône placeholder) + label + eyebrow truncated + bouton Modifier
- Pas de bouton Créer/Supprimer (4 onglets fixes)

### Modal d'édition

Déclenché par bouton Modifier. Même pattern HeroUI compound Modal que `AdminCarousel.tsx`.

Champs dans le modal :
1. **Label** (texte input) — ex: "Wellness"
2. **Eyebrow** (texte input) — ex: "Wellness · PessÓra"
3. **Titre** (texte input) — ex: "Un concentré de bien-être au naturel"
4. **Lien CTA** (texte input) — ex: "/menu?gamme=wellness"
5. **Photo principale** (upload zone — aspect 3/2, grande)
6. **Photo côté haut** (upload zone — aspect carré)
7. **Photo côté bas** (upload zone — aspect carré)

Chaque zone upload : si image présente → aperçu avec croix "supprimer" ; si vide → bouton "Choisir une photo" → `<input type="file" hidden>` → `uploadPublicImage('split-gammes-images', file, key)`.

### Navigation admin

`src/pages/admin/AdminLayout.tsx` : ajouter `{ label: 'Moments', icon: Layers, path: '/admin/moments' }` au tableau NAV.

### Route app

`src/App.tsx` : `lazy(() => import('./pages/admin/AdminSplitGammes'))` sur `/admin/moments`, protégée par `ProtectedAdminRoute > AdminLayout`.

---

## 5. Fichiers touchés

| Action | Fichier |
|--------|---------|
| Créer | `supabase/migrations/20260522100000_home_split_gammes.sql` |
| Créer | `src/hooks/useSplitGammes.ts` |
| Créer | `src/pages/admin/AdminSplitGammes.tsx` |
| Modifier | `src/components/home/HomeSplitGammes.tsx` |
| Modifier | `src/lib/storageUpload.ts` (ajouter bucket) |
| Modifier | `src/pages/admin/AdminLayout.tsx` (nav) |
| Modifier | `src/App.tsx` (route) |

`src/data/homeSplitGammes.ts` : conservé comme fallback, pas supprimé.

---

## 6. Ce qui n'est PAS dans ce scope

- Gestion du hero vidéo
- Gestion de "Nos univers"
- Gestion des gammes produits (Wellness/Sport/Skin tiles)
- Óra+ Strip
- Avis Google
