# Admin Dashboard Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réduire les 10 entrées de navigation admin à 7 en fusionnant Produits+Gammes et Contenu (Infos bar+Carrousel+Moments) dans deux pages à onglets.

**Architecture:** Deux nouvelles pages (`AdminProduitsGammes`, `AdminContenu`) avec HeroUI Tabs. Les composants existants sont importés sans modification, sauf la section Gammes qui est réécrite pour utiliser la même grille de cartes que Produits. Les anciennes routes redirigent vers les nouvelles avec `?tab=`.

**Tech Stack:** React Router v6 (`useSearchParams`, `Navigate`), HeroUI `Tabs`/`Tab`, Supabase

---

### Task 1: Créer la page AdminProduitsGammes avec onglets

**Files:**
- Create: `src/pages/admin/AdminProduitsGammes.tsx`
- These are kept as-is (imported by the new page)
  - `src/pages/admin/AdminProduits.tsx`
  - `src/pages/admin/AdminGammes.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/pages/admin/AdminProduitsGammes.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@heroui/react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import AdminProduits from './AdminProduits';
import AdminGammes from './AdminGammes';

const TABS = [
  { id: 'produits', label: 'Produits' },
  { id: 'gammes', label: 'Gammes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AdminProduitsGammes = () => {
  useEffect(() => { document.title = 'Produits & Gammes — Admin PessÓra'; }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabId =
    (TABS.find((t) => t.id === searchParams.get('tab'))?.id as TabId) ?? 'produits';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Produits & Gammes"
        subtitle="Catalogue du bar et produits Sport / Skin / Wellness"
      />
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setSearchParams({ tab: key as TabId })}
        aria-label="Sections produits et gammes"
        className="px-5 md:px-8"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel id="produits">
          <AdminProduits />
        </Tabs.Panel>
        <Tabs.Panel id="gammes">
          <AdminGammes />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default AdminProduitsGammes;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminProduitsGammes.tsx
git commit -m "feat: add AdminProduitsGammes page with tabs"
```

---

### Task 2: Créer la page AdminContenu avec onglets

**Files:**
- Create: `src/pages/admin/AdminContenu.tsx`
- Keep as-is: `src/pages/admin/AdminInfosBar.tsx`, `src/pages/admin/AdminCarousel.tsx`, `src/pages/admin/AdminSplitGammes.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/pages/admin/AdminContenu.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@heroui/react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import AdminInfosBar from './AdminInfosBar';
import AdminCarousel from './AdminCarousel';
import AdminSplitGammes from './AdminSplitGammes';

const TABS = [
  { id: 'infos-bar', label: 'Infos bar' },
  { id: 'carrousel', label: 'Carrousel' },
  { id: 'moments', label: 'Moments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AdminContenu = () => {
  useEffect(() => { document.title = 'Contenu — Admin PessÓra'; }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabId =
    (TABS.find((t) => t.id === searchParams.get('tab'))?.id as TabId) ?? 'infos-bar';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Contenu"
        subtitle="Infos bar, carrousel éditorial et sections moments"
      />
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setSearchParams({ tab: key as TabId })}
        aria-label="Sections contenu"
        className="px-5 md:px-8"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel id="infos-bar">
          <AdminInfosBar />
        </Tabs.Panel>
        <Tabs.Panel id="carrousel">
          <AdminCarousel />
        </Tabs.Panel>
        <Tabs.Panel id="moments">
          <AdminSplitGammes />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default AdminContenu;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminContenu.tsx
git commit -m "feat: add AdminContenu page with tabs"
```

---

### Task 3: Réécrire AdminGammes avec la grille de cartes (même UI que Produits)

**Files:**
- Rewrite: `src/pages/admin/AdminGammes.tsx` (complete rewrite, 478→~350 lines)
- Reference: `src/pages/admin/AdminProduits.tsx` (pattern à suivre)

Cette tâche réécrit AdminGammes pour utiliser la **même grille de cartes et la même modal d'édition** que AdminProduits, adaptée aux `gamme_products`.

**Changements fonctionnels :**
- Sidebar de sous-catégories remplacée par un filtre Segment (comme Produits)
- Affichage en grille de cartes au lieu de liste verticale
- Modal d'édition au lieu de formulaire inline
- Les badges affichent `sort_order` au lieu de `carousel_sort`
- Prix alternatif (`price_alt`) affiché s'il existe
- Pas de calories/protéines ni de badge "Nouveauté"/"Coup de cœur"

- [ ] **Step 1: Rewrite the component**

```tsx
// src/pages/admin/AdminGammes.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { Card, Skeleton, Modal, useOverlayState } from '@heroui/react';
import { ContextMenu, EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import type { GammeProduct } from '../../types/database';

const GAMMES = [
  { key: 'sport', label: 'Sport', subcategories: [
    { key: 'sport', label: 'Sport' },
    { key: 'encas', label: 'Encas' },
  ]},
  { key: 'skin', label: 'Skin', subcategories: [
    { key: 'nettoyage', label: 'Nettoyage' },
    { key: 'korean', label: 'Korean Products' },
    { key: 'contour', label: 'Contour des Yeux' },
    { key: 'serum', label: 'Sérum / Anti-Âge' },
  ]},
  { key: 'wellness', label: 'Wellness', subcategories: [] },
] as const;

type GammeKey = (typeof GAMMES)[number]['key'];

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  price_alt: '',
  image_url: '',
  sort_order: '',
};

type FormState = typeof EMPTY_FORM;

function productToForm(p: GammeProduct): FormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    price_alt: p.price_alt != null ? String(p.price_alt) : '',
    image_url: p.image_url ?? '',
    sort_order: String(p.sort_order),
  };
}

/** Shared input style matching Produits pattern */
const inputClass =
  'w-full h-11 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-base sm:text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

function GammeVisual({ p }: { p: GammeProduct }) {
  if (p.image_url) {
    return (
      <img
        src={p.image_url}
        alt={p.name ? `Visuel — ${p.name}` : 'Visuel produit'}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-noir/[0.04] text-[10px] font-light uppercase tracking-[0.2em] text-black/25">
      Sans visuel
    </div>
  );
}

function GammeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
          <Skeleton className="aspect-[4/3] w-full rounded-none bg-noir/[0.06]" />
          <Card.Content className="space-y-3 p-4">
            <Skeleton className="h-4 w-[75%] max-w-[200px] rounded bg-noir/[0.06]" />
            <Skeleton className="h-3 w-[45%] max-w-[120px] rounded bg-noir/[0.05]" />
            <Skeleton className="h-8 rounded bg-noir/[0.04]" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function GammeCard({
  p,
  onEdit,
  onArchive,
  onDelete,
}: {
  p: GammeProduct;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const priceStr = `${p.price.toFixed(2).replace('.', ',')}\u00a0€`;
  const altPriceStr = p.price_alt != null
    ? ` / ${p.price_alt.toFixed(2).replace('.', ',')}\u00a0€`
    : '';

  return (
    <ContextMenu>
      <ContextMenu.Trigger
        className="group flex flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] hover:border-noir/15 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        role="article"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-muted">
          <GammeVisual p={p} />
          <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
            <span
              className={`rounded-[2px] px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.14em] ${
                p.active
                  ? 'bg-gold-dim/15 text-gold-dim'
                  : 'bg-noir/[0.06] text-black/40'
              }`}
            >
              {p.active ? 'Visible' : 'Masqué'}
            </span>
            <span className="rounded-[2px] bg-noir/[0.06] px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.12em] text-black/45">
              Ordre #{p.sort_order}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 font-display text-[15px] font-normal leading-snug text-black">
              {p.name}
            </p>
            {p.description && (
              <p className="line-clamp-2 text-[11px] font-light text-black/45">
                {p.description}
              </p>
            )}
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-noir/[0.06] pt-3">
            <div>
              <p className="font-display text-[18px] font-normal tabular-nums text-black">
                {priceStr}{altPriceStr}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="flex h-11 min-w-[44px] items-center justify-center rounded-[2px] border border-noir/12 bg-white text-black/55 transition-colors hover:border-noir/25 hover:text-black"
                aria-label={`Modifier ${p.name}`}
              >
                <Pencil size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={onArchive}
                className="flex h-11 min-w-[44px] items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                aria-label={p.active ? `Archiver ${p.name}` : `Restaurer ${p.name}`}
                title={p.active ? 'Archiver' : 'Restaurer'}
              >
                {p.active ? <Archive size={15} strokeWidth={1.5} /> : <ArchiveRestore size={15} strokeWidth={1.5} />}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex h-11 min-w-[44px] items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label={`Supprimer ${p.name}`}
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu
          aria-label={`Actions pour ${p.name}`}
          onAction={(key) => {
            if (key === 'edit') onEdit();
            else if (key === 'delete') onDelete();
          }}
        >
          <ContextMenu.Item id="edit" textValue="Modifier">
            <Pencil size={13} strokeWidth={1.6} aria-hidden />
            Modifier
          </ContextMenu.Item>
          <ContextMenu.Item id="delete" textValue="Supprimer" className="text-red-600">
            <Trash2 size={13} strokeWidth={1.6} aria-hidden />
            Supprimer
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

const DEFAULT_FILTERS = {
  gamme: 'all' as GammeKey | 'all',
  subcategory: 'all' as string,
  visibility: 'all' as 'all' | 'visible' | 'hidden',
};

const AdminGammes = () => {
  useEffect(() => { document.title = 'Gammes — Admin PessÓra'; }, []);
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { gamme, subcategory, visibility } = filters;
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<GammeProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const editorOpen = showForm || editProduct !== null;
  const editorOverlay = useOverlayState({
    isOpen: editorOpen,
    onOpenChange: (open) => {
      if (!open) { setShowForm(false); setEditProduct(null); }
    },
  });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    let query = (supabase as any)
      .from('gamme_products')
      .select('*');
    if (gamme !== 'all') query = query.eq('gamme', gamme);
    query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });
    query.then(({ data, error }: { data: GammeProduct[] | null; error: { message: string } | null }) => {
      setLoading(false);
      if (error) {
        setFetchError(formatSupabaseDataError(error.message, 'gamme_products'));
        setProducts([]);
        return;
      }
      setProducts(data ?? []);
    });
  }, [gamme]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSub = subcategory === 'all' || p.subcategory === subcategory;
      const matchVis =
        visibility === 'all' ||
        (visibility === 'visible' && p.active) ||
        (visibility === 'hidden' && !p.active);
      return matchSub && matchVis;
    });
  }, [products, subcategory, visibility]);

  const buildPayload = (form: FormState) => ({
    gamme: gamme === 'all' ? 'sport' as const : gamme as GammeKey,
    subcategory: subcategory === 'all' ? null : subcategory,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    price_alt: form.price_alt ? Number(form.price_alt) : null,
    image_url: form.image_url.trim() || null,
    sort_order: form.sort_order ? parseInt(form.sort_order, 10) : 0,
    active: true,
  });

  const handleCreate = async (form: FormState) => {
    const { error } = await (supabase as any).from('gamme_products').insert(buildPayload(form));
    if (error) throw new Error(formatMutationError(error.message));
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: FormState) => {
    if (!editProduct) return;
    const { active: _, ...payload } = buildPayload(form);
    const { error } = await (supabase as any).from('gamme_products').update(payload).eq('id', editProduct.id);
    if (error) throw new Error(formatMutationError(error.message));
    setEditProduct(null);
    fetchProducts();
  };

  const handleArchive = async (p: GammeProduct) => {
    const { error } = await (supabase as any)
      .from('gamme_products')
      .update({ active: !p.active })
      .eq('id', p.id);
    if (!error) fetchProducts();
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await (supabase as any).from('gamme_products').delete().eq('id', deleteId);
      fetchProducts();
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, fetchProducts]);

  const currentGamme = GAMMES.find((g) => g.key === gamme);
  const subItems = currentGamme?.subcategories ?? [];
  const subOptions = subItems.length > 0
    ? [{ key: 'all', label: `Toutes les sous-catégories` }, ...subItems.map((s) => ({ key: s.key, label: s.label }))]
    : [{ key: 'all', label: 'Tous' }];

  const editorMode = editProduct ? 'edit' : 'create';
  const editorTitle = editorMode === 'edit' ? `Modifier · ${editProduct?.name ?? ''}` : 'Nouveau produit gamme';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Gammes"
        subtitle="Produits Sport, Skin et Wellness"
        action={
          <button
            type="button"
            onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir text-white px-4 text-[13px] font-medium hover:bg-anthracite transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} /> Nouveau produit
          </button>
        }
      />
      <div className={DASH_MAIN_PAD}>
        {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchProducts} />}

        {/* Filters */}
        <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
          <div className="mb-4">
            <DashEyebrow className="mb-2">Filtres</DashEyebrow>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Gamme</span>
            <Segment
              size="sm"
              selectedKey={gamme}
              onSelectionChange={(k) => setFilters({ gamme: (k as GammeKey | 'all') ?? 'all', subcategory: 'all', visibility })}
              aria-label="Filtrer par gamme"
            >
              {([
                { key: 'all', label: 'Toutes les gammes' },
                ...GAMMES.map((g) => ({ key: g.key, label: g.label })),
              ] as const).map(({ key, label }) => (
                <Segment.Item key={key} id={key}>
                  <Segment.Separator />
                  {label}
                </Segment.Item>
              ))}
            </Segment>
          </div>
          {subItems.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Sous-catégorie</span>
              <Segment
                size="sm"
                selectedKey={subcategory}
                onSelectionChange={(k) => setFilters({ gamme, subcategory: (k as string) ?? 'all', visibility })}
                aria-label="Filtrer par sous-catégorie"
              >
                {subOptions.map(({ key, label }) => (
                  <Segment.Item key={key} id={key}>
                    <Segment.Separator />
                    {label}
                  </Segment.Item>
                ))}
              </Segment>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Affichage</span>
            <Segment
              size="sm"
              selectedKey={visibility}
              onSelectionChange={(k) =>
                setFilters({
                  gamme,
                  subcategory,
                  visibility: (k as 'all' | 'visible' | 'hidden') ?? 'all',
                })
              }
              aria-label="Filtrer par visibilité"
            >
              {([
                ['all', 'Tous'],
                ['visible', 'Visibles'],
                ['hidden', 'Masqués'],
              ] as const).map(([key, label]) => (
                <Segment.Item key={key} id={key}>
                  <Segment.Separator />
                  {label}
                </Segment.Item>
              ))}
            </Segment>
          </div>
        </div>

        {/* Editor Modal */}
        <Modal state={editorOverlay}>
          <Modal.Backdrop variant="blur" isDismissable>
            <Modal.Container scroll="inside" placement="center" size="full" className="mx-auto max-h-[92vh] w-[min(100vw-1rem,720px)] shadow-2xl">
              <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
                <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4 sm:px-6">
                  <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                    {editorTitle}
                  </Modal.Heading>
                  <Modal.CloseTrigger className="absolute right-3 top-3 shrink-0 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black">
                    Fermer
                  </Modal.CloseTrigger>
                </Modal.Header>
                <Modal.Body className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                  <GammeEditorForm
                    key={editProduct?.id ?? 'create'}
                    mode={editorMode}
                    initial={editProduct ? productToForm(editProduct) : undefined}
                    onSave={async (form) => {
                      if (editProduct) await handleUpdate(form);
                      else await handleCreate(form);
                    }}
                    onCancel={() => editorOverlay.close()}
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        {/* Product grid */}
        {loading ? (
          <GammeGridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
            <EmptyState.Header>
              <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                Aucun produit
              </EmptyState.Title>
              <EmptyState.Description className="text-[12px] font-light text-black/45">
                Aucun produit dans cette catégorie. Ajoutez-en un nouveau.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <GammeCard
                  p={p}
                  onEdit={() => { setShowForm(false); setEditProduct(p); }}
                  onArchive={() => handleArchive(p)}
                  onDelete={() => setDeleteId(p.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer ce produit ?"
        description="Cette action est définitive. Le produit disparaîtra de la gamme."
        loading={deleteLoading}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminGammes;
```

Then add the `GammeEditorForm` sub-component (inline, just before the `GammeVisual` component):

```tsx
function GammeEditorForm({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: FormState;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nom requis.'); return; }
    if (!form.price) { setError('Prix requis.'); return; }
    setSaving(true);
    setError(null);
    try { await onSave(form); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Nom *</span>
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Prix (€) *</span>
          <input type="number" step="0.01" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="45" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">
            Prix alternatif (€) <span className="normal-case text-black/25">— ex: grand format</span>
          </span>
          <input type="number" step="0.01" className={inputClass} value={form.price_alt} onChange={(e) => set('price_alt', e.target.value)} placeholder="Laisser vide si un seul prix" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Description</span>
        <input className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Image (URL)</span>
        <input className={inputClass} value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Ordre d'affichage</span>
        <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} placeholder="1" />
      </label>
      {error && <p className="text-[11px] text-red-500/80">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-[2px] border border-noir/15 px-6 text-[10px] font-light uppercase tracking-[0.12em] text-black/50 transition-colors hover:border-noir/30 hover:text-black"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminGammes.tsx
git commit -m "refactor: rewrite AdminGammes with Produits-like card grid and modal editor"
```

---

### Task 4: Mettre à jour AdminLayout — navigation sidebar

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

Remplacer les 5 anciennes entrées par 2 nouvelles dans la NAV.

- [ ] **Step 1: Update the NAV array**

Old entries to remove:
```
{ label: 'Produits', shortLabel: 'Produits', icon: Package, path: '/admin/produits' },
{ label: 'Gammes', shortLabel: 'Gammes', icon: Layers, path: '/admin/gammes' },
{ label: 'Infos bar', shortLabel: 'Infos', icon: Store, path: '/admin/infos' },
{ label: 'Carrousel', shortLabel: 'Carousel', icon: Images, path: '/admin/carousel' },
{ label: 'Moments', shortLabel: 'Moments', icon: LayoutList, path: '/admin/moments' },
```

New entries to add:
```
{ label: 'Produits & Gammes', shortLabel: 'Prod.', icon: Package, path: '/admin/produits-gammes' },
{ label: 'Contenu', shortLabel: 'Contenu', icon: Images, path: '/admin/contenu' },
```

Updated NAV array (7 entries):
```tsx
const NAV = [
  { label: "Vue d'ensemble", shortLabel: 'Vue', icon: LayoutDashboard, path: '/admin', exact: true },
  { label: 'Membres', shortLabel: 'Membres', icon: Users, path: '/admin/membres' },
  { label: 'Événements', shortLabel: 'Évén.', icon: CalendarDays, path: '/admin/evenements' },
  { label: 'Produits & Gammes', shortLabel: 'Prod.', icon: Package, path: '/admin/produits-gammes' },
  { label: 'Bilans', shortLabel: 'Bilans', icon: Heart, path: '/admin/bilans' },
  { label: 'Communication', shortLabel: 'Comm.', icon: Megaphone, path: '/admin/communication' },
  { label: 'Contenu', shortLabel: 'Contenu', icon: Images, path: '/admin/contenu' },
];
```

Also remove unused imports: `Store, Layers, LayoutList` from `lucide-react` imports.

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx
git commit -m "refactor: update admin nav — Produits&Gammes and Contenu replace 5 entries"
```

---

### Task 5: Mettre à jour App.tsx — routing et redirections

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports for the two new pages**

Add with the other admin imports:
```tsx
const AdminProduitsGammes = lazy(() => import('./pages/admin/AdminProduitsGammes'));
const AdminContenu = lazy(() => import('./pages/admin/AdminContenu'));
```

- [ ] **Step 2: Add 2 new routes + 5 redirect routes**

Replace the 5 old admin route blocks:
```tsx
{/* Old routes to remove */}
<Route path="/admin/produits" element={...} />
<Route path="/admin/gammes" element={...} />
<Route path="/admin/infos" element={...} />
<Route path="/admin/carousel" element={...} />
<Route path="/admin/moments" element={...} />
```

With 2 new routes + 5 redirects:
```tsx
import { Navigate } from 'react-router-dom'; // already imported via BrowserRouter useLocation

// New consolidated pages
<Route path="/admin/produits-gammes" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminProduitsGammes /></AdminLayout>
  </ProtectedAdminRoute>
} />
<Route path="/admin/contenu" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminContenu /></AdminLayout>
  </ProtectedAdminRoute>
} />

// Redirects from old routes
<Route path="/admin/produits" element={<Navigate to="/admin/produits-gammes?tab=produits" replace />} />
<Route path="/admin/gammes" element={<Navigate to="/admin/produits-gammes?tab=gammes" replace />} />
<Route path="/admin/infos" element={<Navigate to="/admin/contenu?tab=infos-bar" replace />} />
<Route path="/admin/carousel" element={<Navigate to="/admin/contenu?tab=carrousel" replace />} />
<Route path="/admin/moments" element={<Navigate to="/admin/contenu?tab=moments" replace />} />
```

Import `Navigate` from `react-router-dom`. Check the existing import — the file already imports `useLocation` from `react-router-dom`. Update to also import `Navigate`:
```tsx
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
```

- [ ] **Step 3: Remove old lazy imports (optional cleanup)**

The old imports for AdminProduits, AdminGammes, AdminInfosBar, AdminCarousel, AdminSplitGammes can be kept (they're still used by the new pages) or removed if the compiler can tree-shake them. Actually, they ARE still used — by AdminProduitsGammes and AdminContenu — so keep them.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /admin/produits-gammes and /admin/contenu routes with redirects"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Navigation sidebar: 7 entries ✅ (Task 4)
   - `/admin/produits-gammes` route: ✅ (Task 5)
   - `/admin/contenu` route: ✅ (Task 5)
   - 5 redirects: ✅ (Task 5)
   - AdminGammes rewrite with card grid: ✅ (Task 3)
   - AdminProduits unchanged: ✅ (imported directly)
   - AdminInfosBar, AdminCarousel, AdminSplitGammes unchanged: ✅ (imported directly)

2. **No placeholders:** Complete code in every task.
3. **Type consistency:** `GammeProduct` from `src/types/database`, `FormState` consistent across create/update. Tab IDs (`produits`, `gammes`, `infos-bar`, `carrousel`, `moments`) consistent between tasks.
4. **Scope check:** Within a single implementation plan. No scope creep.
