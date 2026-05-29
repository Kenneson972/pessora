# Prompt Cursor — Reprise : Intégration galerie (Phase 3 uniquement)

**Date :** 2026-05-29
**Contexte :** Les composants de base sont créés et pushés :
- `AdminProductForm.tsx` ✅
- `AdminCarouselToggle.tsx` ✅
- `AdminProductGallery.tsx` ✅
- `database.ts` (colonne `gallery`) ✅

Ce qui manque : brancher tout ça ensemble.

---

## À faire — dans l'ordre

### 1. Modifier `AdminProductEditorForm.tsx` → wrapper

Ce fichier devient un wrapper qui compose les 3 nouveaux composants. Il continue d'exporter `EMPTY_FORM`, `productToForm`, `payloadFromForm` pour `AdminProduits.tsx`.

```tsx
// Remplacer le contenu du render par :
<AdminProductForm form={form} onChange={onChange} busy={busy} isEdit={mode === 'edit'} />
<AdminCarouselToggle
  included={form.carousel_include}
  onIncludeChange={(v) => onChange({ carousel_include: v })}
  position={form.carousel_sort}
  onPositionChange={(v) => onChange({ carousel_sort: v })}
  badge={form.carousel_badge}
  onBadgeChange={(v) => onChange({ carousel_badge: v })}
  busy={busy}
  existingPositions={existingPositions}
/>
<AdminProductGallery
  productId={initial?.id}
  table="products"
  images={gallery}
  onReorder={setGallery}
  busy={busy}
/>
```

- `gallery` state initialisé depuis `initial?.gallery ?? []`
- `onChange` préserve la signature actuelle (ne pas la changer)
- `mode` et `initial` sont déjà dans le composant

### 2. Modifier `DrinkDetailAdminEdit.tsx` → ajouter galerie

Dans la modal existante, après la section image principale (`image_url`), ajouter :

```tsx
{/* State local */}
const [gallery, setGallery] = useState<string[]>(drink.gallery ?? []);

{/* Dans Modal.Body, après la section Image */}
<div>
  <p className="mb-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
    Photos supplémentaires (max 3)
  </p>
  <AdminProductGallery
    productId={drinkId}
    table="products"
    images={gallery}
    onReorder={setGallery}
    busy={busy}
  />
</div>
```

- `drink.gallery` vient du type `MenuItem` → vérifier que `gallery?: string[]` est dans le type ou l'ajouter
- Ne pas toucher au champ `image_url` existant
- Import : `import { AdminProductGallery } from './AdminProductGallery'`

### 3. Modifier `GammeProductDetailAdminEdit.tsx` → ajouter galerie

Même pattern, avec `table="gamme_products"` et `productId={product.id}`.

- `product.gallery` vient du type `GammeProduct`
- Import `AdminProductGallery`

### 4. Modifier `DrinkDetail.tsx` → section publique "Photos"

Après la section hero, avant le footer, ajouter :

```tsx
{drink.gallery && drink.gallery.length > 0 && (
  <section className="border-t border-noir/[0.05]">
    <PageShell className="py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="mb-6 font-display text-[22px] font-normal text-black">Photos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {drink.gallery.map((url) => (
            <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
              <img src={url} alt={drink.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  </section>
)}
```

- `drink` est le `MenuItem` actuel → vérifier que `gallery` est dans le type
- `PageShell` est déjà importé

### 5. Modifier `GammeProductDetail.tsx` → section publique "Photos"

Même pattern que `DrinkDetail.tsx`, avec `product.gallery`.

---

## Notes

- `AdminProductGallery` props : `productId`, `table`, `images`, `onReorder`, `busy`
- Upload se fait dans le composant galerie (déjà géré)
- Ne pas modifier `AdminProduits.tsx` — le wrapper `AdminProductEditorForm` fait le lien
- `existingPositions` existe déjà dans `AdminProductEditorForm`
- Types : `MenuItem` dans `menuData.ts` et `GammeProduct` dans `database.ts` doivent avoir `gallery?: string[]`
