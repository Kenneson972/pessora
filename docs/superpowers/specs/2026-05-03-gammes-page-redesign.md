# Refonte page Gammes (NosProduits)

## Contexte

La page actuelle `/nos-produits` liste les gammes avec leurs produits visibles sous chaque gamme (grille 2 colonnes). L'utilisateur la trouve "pas belle" et "pas uniforme" avec les autres pages du site (Concept, Événements, OraPlus). La demande explicite est de **retirer les produits de la page principale** et d'adopter un style éditorial cohérent.

## Design retenu

**Approche éditoriale** — alternance image/texte inspirée de la page Événements et de la page Concept.

### Hero

- `PageHero` standard avec `eyebrow="Catalogue"`, titre "Les gammes PessÓra", subtitle éditorial
- Fond blanc (pas d'image)

### Sections gammes — 3 blocs

Chaque gamme (Wellness, Sport, Skin) est présentée sur une section pleine largeur. Le pattern est calqué sur `EventRow` de la page Événements :

- **Desktop** : grille 12 colonnes → image 4/3 (col-span-7) | texte (col-span-5)
- **Mobile** : stack vertical (image → texte)
- **Sens fixe** : image à gauche, texte à droite (pas d'alternance)
- **Image** : `range.heroImage` (images hero existantes dans `productsData.ts`)
- **Badge sur image** : thème de la gamme (`COMPLÉMENTS NUTRITION · SPORT · SOINS VISAGE`)
- **Titre** : numéro de collection + nom de gamme (ex: "Collection 01 · Wellness")
- **Sous-titre** : `range.subtitle` en italique
- **Description** : `range.description`
- **CTA** : lien éditorial sobre "Découvrir la collection →" → navigate vers `/nos-produits/[rangeId]`
- **Séparation** : bordure subtile `border-b border-black/[0.06]` entre chaque section

### Section finale "En boutique"

Identique à l'actuelle — citation + lien vers le menu — conservée.

## Données

Les données des gammes proviennent de `src/data/productsData.ts`. Aucun changement nécessaire : les `ranges` et leurs `heroImage` sont déjà présents. Les produits ne sont pas affichés sur cette page.

`productsData.ts` a déjà un `products` array par gamme — il est simplement ignoré dans `NosProduits.tsx`. Les compteurs de produits (ex: "6 produits") seront calculés via `range.products.length`.

## Composants réutilisés

- `PageHero` — déjà importé
- `PageShell` — déjà utilisé
- `useStaggerReveal` / `useFadeUpWhenVisible` — animations fade-in
- Pas de nouveau composant nécessaire : la logique tient dans `NosProduits.tsx`

## Fichiers impactés

| Fichier | Changement |
|---|---|
| `src/pages/NosProduits.tsx` | Réécriture complète — suppression grille produits, ajout sections éditoriales |
| `gammes-mockup.html` | Supprimé (mockup de brainstorming) |

Aucun changement sur :
- `RangeDetail.tsx` — conserve sa grille de produits actuelle
- `productsData.ts` — données inchangées
- Route `/nos-produits/:rangeId` — inchangée

## Spécifications techniques

### Layout section gamme

```tsx
<section className="border-b border-black/[0.06] py-16 md:py-24">
  <PageShell>
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-20">
      {/* Image — col-span-7 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 md:col-span-7">
        <img src={range.heroImage} alt={range.title} className="object-cover w-full h-full" loading="lazy" />
        {/* badge thème bas-gauche */}
        <span className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[0.22em] text-white/70">
          {badgeLabel}
        </span>
      </div>
      {/* Texte — col-span-5 */}
      <div className="md:col-span-5">
        <p className="text-editorial-tagline mb-3">Collection {num}</p>
        <h2 className="font-display text-[clamp(26px,3vw,34px)] font-normal tracking-[-0.02em] text-black mb-4">
          {range.title}
        </h2>
        <p className="text-[13px] italic font-light text-black/55 mb-2">{range.subtitle}</p>
        <p className="text-[13px] font-light leading-relaxed text-black/50 mb-6">{range.description}</p>
        <Link to={`/nos-produits/${range.id}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-black border-b border-black/20 pb-0.5 hover:border-black/50 transition-colors">
          Découvrir la collection <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  </PageShell>
</section>
```

### Badge par gamme

| Gamme | Badge |
|---|---|
| Wellness | `COMPLÉMENTS NUTRITION` |
| Sport | `SPORT & PERFORMANCE` |
| Skin | `SOINS VISAGE` |

### États

- **Loading** : pas de chargement asynchrone sur cette page (données statiques)
- **Empty** : pas applicable (3 gammes en dur)
- **Error** : pas applicable
- **Mobile** : stack vertical, image pleine largeur, texte en dessous
