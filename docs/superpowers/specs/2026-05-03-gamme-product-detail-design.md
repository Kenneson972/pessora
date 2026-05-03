# Spec — Page détail produit gamme

## Contexte

Les pages `/nos-produits/:rangeId` (`RangeDetail.tsx`) listent les produits d'une gamme en grille de cards. Chaque card a un bouton "Renseignements" qui n'a actuellement **pas de destination**. Il faut créer une page dédiée par produit pour afficher les détails, permettre l'ajout au panier et le paiement Stripe.

## Design

La page détail produit gamme suit le **même pattern visuel que `DrinkDetail.tsx`** (split image/infos, breadcrumb, sélecteur quantité, CTA panier, cross-sell), mais **simplifié** — pas de choix de lait, pas de boosters, pas de tabs multi-panneaux.

### Sections

#### 1. Breadcrumb

```
Gammes → Wellness → Aloe Vera
```

Même style que DrinkDetail : `text-[10px] uppercase tracking-[0.08em] text-black/40`, slashs séparateurs.

#### 2. Hero split (image + infos)

Layout `grid lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16` aligné sur DrinkDetail.

**Colonne gauche — Image** :

- Image produit en `aspect-[3/4]`, centrée, `object-cover`
- Si pas d'image : initiale du nom en lettrine (`text-9xl opacity-[0.06]`) sur fond `bg-surface-product-well`
- Badge gamme superposé en haut-gauche (picto + nom, `bg-white/95`)
- Sur desktop : sticky (`lg:sticky lg:top-36`)

**Colonne droite — Infos** :

- Badges produit (si activés : Vegan, Sans Gluten, etc.) en `rounded-[2px] border border-noir/[0.08]`
- Titre : `clamp(36px, 4vw, 52px)` comme DrinkDetail
- Pitch en italique display : `clamp(17px, 1.9vw, 21px)` si présent
- Description en `text-[13px] font-light text-black/50`
- Prix : en `clamp(36px, 4vw, 48px)` pour le prix simple, ou `prix / prix_alt` pour les formats doubles
- Sélecteur quantité `−/+` (min 1 max 10) — même rendu que DrinkDetail (rond, border, boutons h-12 w-12)
- CTA "Ajouter au panier" — même style : `bg-noir text-white rounded-full h-12`
  - Feedback "Ajouté ✓" pendant 2s
  - Prix dynamique qui s'affiche dans le CTA
- Mention "Paiement sécurisé en ligne. Retrait en boutique."

#### 3. Section Caractéristiques (remplace les tabs de DrinkDetail)

Titre "Caractéristiques" en `text-[9px] uppercase tracking-[0.2em] text-black/30`.

Deux sous-sections si données disponibles :

- **Bénéfices** : liste numérotée (comme dans DrinkDetail)
- **Ingrédients / conseils** : texte libre

Si données absentes : afficher un bloc sobre "Informations disponibles en boutique. Contactez-nous pour en savoir plus."

#### 4. Vous aimerez aussi

Même pattern que DrinkDetail :

- Titre `clamp(28px, 3vw, 40px)` + sous-titre
- 3 mini-cards en grille `md:grid-cols-3` avec image/picto + nom + prix
- Liens vers les pages détail des autres produits de la même gamme
- Mobile : lien "Voir toute la gamme" centré

#### 5. CTA final

Section fond noir (comme DrinkDetail) avec :

- Titre "Envie d'en savoir plus ?"
- Adresse du bar
- Bouton "Nous trouver" → `/contact`
- Bouton `Retour à la gamme →` → `/nos-produits/:rangeId`

### Source des données

Les données produits viennent de `productsData.ts` (`rangesData[rangeId].products`) :

```ts
type GammeProductStatic = {
  name: string;
  description: string;
  price: string; // ex: "35€" ou "29€ / 39€"
};
```

Pour la page détail, on a besoin de :

- `name`, `description`, `price`
- `image` : string optionnelle (admin pourra uploader plus tard)
- `ingredients` : string[] optionnel
- `benefits` : string[] optionnel

### Routing

Route déjà définie dans `App.tsx` : `/nos-produits/:rangeId/:slug`

Slug généré via `toSlug(name)` (utilitaire existant dans `src/lib/toSlug.ts`).

Pour l'instant, le slug n'existe pas dans `productsData.ts` — il faut soit :
- Option A : ajouter un champ `slug` dans `productsData.ts`
- Option B : le générer à la volée avec `toSlug(name)` et faire la recherche par index/nom

**Choix** : option B pour minimiser la modification des données. La page cherchera le produit par `rangeId + slug` généré depuis `toSlug(product.name)`.

### Navigation RangeDetail → page détail

Dans `RangeDetail.tsx`, le bouton "Renseignements" dans chaque card devient un `<Link to="/nos-produits/:rangeId/:slug">`.

### Évolution future

Quand l'admin pourra uploader des images via le dashboard (AdminGammes), la page détail les affichera automatiquement. Les `ingredients` et `benefits` pourront aussi être édités via l'admin et la BDD. Pour l'instant, tout reste statique depuis `productsData.ts`.

## États

- **Loading** : skeleton split (placeholder image aspect 3/4 + blocs texte animés) pendant le lookup du produit
- **Not found** : `Navigate to="/nos-produits"` si le `rangeId` ou le `slug` ne correspondent à rien
- **Empty** : pas d'état empty (si le produit existe, on l'affiche)

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/GammeProductDetail.tsx` | Créer | Nouvelle page détail produit gamme |
| `src/pages/RangeDetail.tsx` | Modifier | Lier "Renseignements" → `/nos-produits/:rangeId/:slug` |
| `src/App.tsx` | Vérifier | Route `/nos-produits/:rangeId/:slug` existe déjà (vérifier conflit avec `:rangeId`) |

## Vérification

- `npm run build` OK
- Navigation : `/nos-produits` → clic gamme → RangeDetail → clic produit → GammeProductDetail
- Prix dynamique dans le CTA (quantité × prix unitaire)
- Ajout au panier → badge panier se met à jour
- Cross-sell : 3 produits de la même gamme, liens valides
- Retour breadcrumb + CTA final OK
