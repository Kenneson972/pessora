# Prompt Cursor — Onglets modale admin + fix navigation menu détail

**Date :** 2026-05-29
**Contexte :** Le wrapper `AdminProductEditorForm` compose bien `AdminProductForm` + `AdminCarouselToggle` + `AdminProductGallery`, mais visuellement c'est toujours un gros bloc dans la modale. Et un bug est apparu : impossible d'accéder à la fiche détail d'une boisson depuis le menu public (ex: Hydra Boost Litchi après upload photo galerie).

---

## Partie A — Ajouter des onglets dans la modale d'édition

### Fichier à modifier : `src/components/admin/AdminProductEditorForm.tsx`

Le wrapper actuel affiche tout d'un coup. Objectif : splitter visuellement avec des onglets.

```tsx
// Onglets dans la modale
const TABS = [
  { id: 'infos', label: 'Infos' },
  { id: 'carrousel', label: 'Carrousel' },
  { id: 'photos', label: 'Photos' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const [activeTab, setActiveTab] = useState<TabId>('infos');
```

**Structure de la modale après changement :**

```
┌─────────────────────────────────┐
│  ✏️ Modifier / Nouveau produit  │
│  [Infos] [Carrousel] [Photos]   │  ← Tabs HeroUI
├─────────────────────────────────┤
│  <AdminProductForm />           │  ← si activeTab === 'infos'
│  <AdminCarouselToggle />        │  ← si activeTab === 'carrousel'
│  <AdminProductGallery />        │  ← si activeTab === 'photos'
├─────────────────────────────────┤
│  [💾 Enregistrer]  [Annuler]    │
└─────────────────────────────────┘
```

- Utiliser les composants `Tabs` de HeroUI (comme dans `AdminProduitsGammes.tsx`)
- Les boutons Enregistrer/Annuler restent en bas, en dehors des onglets
- Le state de chaque onglet est préservé au changement d'onglet (pas de reset)
- `AdminProductGallery` n'est affiché que si `productId` existe (mode édition), sinon message "Enregistrez d'abord le produit"

---

## Partie B — Debug navigation menu → fiche détail

### Symptôme
Quand on clique sur une boisson dans le menu public, la page reste sur `/menu` au lieu d'afficher `/menu/{slug}`.

### Cause probable
Le `loadMenuCatalog` fait `supabase.from('products').select('*')`. Si la migration SQL `ALTER TABLE products ADD COLUMN gallery text[]` n'a pas été exécutée, la colonne `gallery` n'existe pas en base. Problème : `.select('*')` avec Supabase JS devrait fonctionner même avec une colonne manquante (PostgreSQL renvoie juste les colonnes existantes). **Mais** si le type TypeScript `Product` attend `gallery: string[]` (required) et que la valeur runtime est `undefined`, ça peut causer des erreurs silencieuses.

### À vérifier et corriger

1. **Dans `src/lib/menuCatalog.ts`** — `productRowToMenuItem` :
```ts
// Actuel
gallery: p.gallery ?? [],

// Sécurisé — gérer le cas où la colonne n'existe pas encore en DB
gallery: (p as any).gallery ?? [],
```

2. **Dans `src/pages/DrinkDetail.tsx`** — la section galerie publique :
```tsx
// Sécuriser l'affichage — wrapper try/catch implicite via optional chaining
{drink?.gallery && drink.gallery.length > 0 && (
  // ... rendu galerie
)}
```
Ajouter un check `Array.isArray(drink.gallery)` avant le `.map()`.

3. **Vérifier que la migration SQL est documentée** :
Créer un fichier `supabase/migrations/20260529_add_gallery.sql` :
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE gamme_products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
```

4. **Dans `src/components/admin/AdminProductGallery.tsx`** — `handleFileChange` :
Ajouter un check que `productId` est bien un UUID valide (le composant le fait déjà via `UUID_RE`), mais ajouter un `console.error` explicite si l'update échoue, pour faciliter le debug.

---

## Règles

- Onglets HeroUI : pattern existant dans `AdminProduitsGammes.tsx` — s'en inspirer
- Ne pas modifier les composants individuels (`AdminProductForm`, `AdminCarouselToggle`, `AdminProductGallery`) — ils sont déjà propres
- Ne pas modifier `AdminProduits.tsx` — le wrapper fait tout le boulot
- Le fix navigation doit être défensif : le menu public doit fonctionner MÊME si la colonne gallery n'existe pas encore
