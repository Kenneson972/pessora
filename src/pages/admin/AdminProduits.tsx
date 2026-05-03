// src/pages/admin/AdminProduits.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Download, Archive, ArchiveRestore } from 'lucide-react';
import { Card, Skeleton, Modal, useOverlayState } from '@heroui/react';
import { ContextMenu, EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { downloadCsv } from '../../lib/csvExport';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { usePersistentAdminState } from '../../hooks/usePersistentAdminState';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { invalidateMenuCatalogCache } from '../../lib/menuCatalog';
import type { Product } from '../../types/database';
import {
  AdminProductEditorForm,
  payloadFromForm,
  productToForm,
  CAT_LABEL,
  CATEGORIES,
} from '../../components/admin/AdminProductEditorForm';

async function fetchNextCarouselSort(excludeProductId?: string): Promise<number> {
  let q = (supabase as any).from('products').select('carousel_sort').not('carousel_sort', 'is', null);
  if (excludeProductId) q = q.neq('id', excludeProductId);
  const { data, error } = await q;
  if (error || !data?.length) return 1;

  const nums = (data as { carousel_sort: unknown }[])
    .map((r) => {
      const v = r.carousel_sort;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim()) {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    })
    .filter((n): n is number => Number.isFinite(n));

  return nums.length ? Math.max(...nums) + 1 : 1;
}

/** Aligné sur le formulaire : case décochée → hors carrousel ; sinon ordre saisi, sinon conserve ou place à la fin. */
async function resolveCarouselSortForSave(
  form: Parameters<typeof payloadFromForm>[0],
  editingProductId?: string | null,
  previousCarouselSort?: number | null,
): Promise<number | null> {
  if (!form.carousel_include) return null;

  const raw = form.carousel_sort.trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) return n;
  }

  if (previousCarouselSort != null) return previousCarouselSort;

  return fetchNextCarouselSort(editingProductId ?? undefined);
}

function ProductVisual({ p }: { p: Product }) {
  if (p.image_url) {
    return (
      <img
        src={p.image_url}
        alt={p.name ? `Visuel produit — ${p.name}` : 'Visuel produit'}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  if (p.icon_emoji) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-noir/[0.03] to-noir/[0.06] text-[52px] leading-none">
        <span aria-hidden>{p.icon_emoji}</span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-noir/[0.04] text-[10px] font-light uppercase tracking-[0.2em] text-black/25">
      Sans visuel
    </div>
  );
}

function ProductCard({
  p,
  onEdit,
  onArchive,
  onDelete,
}: {
  p: Product;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const priceStr = p.price != null ? `${p.price.toFixed(2).replace('.', ',')}\u00a0€` : '—';
  const macros =
    [p.calories != null ? `${p.calories}\u00a0kcal` : null, p.protein != null ? `${p.protein}g\u00a0prot.` : null]
      .filter(Boolean)
      .join(' · ') || null;

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="group flex flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] hover:border-noir/15 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        role="article"
      >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-muted">
        <ProductVisual p={p} />
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
          <span
            className={`rounded-[2px] px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.14em] ${
              p.active ? 'bg-gold-dim/15 text-gold-dim' : 'bg-noir/[0.06] text-black/40'
            }`}
          >
            {p.active ? 'Visible' : 'Masqué'}
          </span>
          {p.carousel_sort != null && (
            <span className="rounded-[2px] bg-noir/[0.06] px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.12em] text-black/45">
              Carrousel #{p.carousel_sort}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 font-display text-[15px] font-normal leading-snug text-black" style={{ fontFamily: 'var(--font-display)' }}>
            {p.name}
          </p>
          {p.slug && (
            <p className="truncate font-mono text-[10px] tracking-tight text-black/38" title={p.slug}>
              {p.slug}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-noir/[0.08] bg-noir/[0.02] px-2.5 py-0.5 text-[9px] font-normal uppercase tracking-[0.12em] text-black/50">
            {CAT_LABEL[p.category] ?? p.category}
          </span>
          {p.carousel_badge === 'nouveaute' && (
            <span className="rounded-full border border-[color-mix(in_oklch,var(--color-gold)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-gold)_10%,transparent)] px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.1em] text-gold-dim">
              Nouveauté
            </span>
          )}
          {p.carousel_badge === 'coup-de-coeur' && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[8px] font-normal uppercase tracking-[0.1em] text-amber-900/85">
              Coup de cœur
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-noir/[0.06] pt-3">
          <div>
            <p className="font-display text-[18px] font-normal tabular-nums text-black" style={{ fontFamily: 'var(--font-display)' }}>
              {priceStr}
            </p>
            {macros && <p className="mt-0.5 text-[10px] font-light tracking-wide text-black/38">{macros}</p>}
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

function ProductGridSkeleton() {
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

const DEFAULT_PROD_FILTERS = {
  filterCat: 'all' as 'all' | (typeof CATEGORIES)[number],
  search: '',
  visibility: 'all' as 'all' | 'visible' | 'hidden',
};

const AdminProduits = () => {
  useEffect(() => { document.title = 'Produits — Admin PessÓra'; }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [filters, setFilters] = usePersistentAdminState('admin_products_filters_v1', DEFAULT_PROD_FILTERS);
  const { filterCat, search, visibility } = filters;
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);

  const editorOpen = showForm || editProduct !== null;
  const editorOverlay = useOverlayState({
    isOpen: editorOpen,
    onOpenChange: (open) => {
      if (!open) {
        setShowForm(false);
        setEditProduct(null);
      }
    },
  });

  const closeDeleteProductDialog = useCallback(() => setDeleteProductId(null), []);

  const fetchProducts = () => {
    setLoading(true);
    setFetchError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }: { data: Product[] | null; error: { message: string } | null }) => {
        setLoading(false);
        if (error) {
          setFetchError(formatSupabaseDataError(error.message, 'products'));
          setProducts([]);
          return;
        }
        setProducts(data ?? []);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (form: Parameters<typeof payloadFromForm>[0]) => {
    const carousel_sort = await resolveCarouselSortForSave(form, null, null);
    const p = { ...payloadFromForm(form), carousel_sort };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').insert(p);
    if (error) throw new Error(formatMutationError(error.message));
    invalidateMenuCatalogCache();
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: Parameters<typeof payloadFromForm>[0]) => {
    if (!editProduct) return;
    const carousel_sort = await resolveCarouselSortForSave(
      form,
      editProduct.id,
      editProduct.carousel_sort ?? null,
    );
    const p = { ...payloadFromForm(form), carousel_sort };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').update(p).eq('id', editProduct.id);
    if (error) throw new Error(formatMutationError(error.message));
    invalidateMenuCatalogCache();
    setEditProduct(null);
    fetchProducts();
  };

  const confirmDeleteProduct = useCallback(async () => {
    if (!deleteProductId) return;
    setDeleteProductLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('products').delete().eq('id', deleteProductId);
      invalidateMenuCatalogCache();
      fetchProducts();
      setDeleteProductId(null);
    } finally {
      setDeleteProductLoading(false);
    }
  }, [deleteProductId]);

  const handleArchive = useCallback(async (p: Product) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .update({ active: !p.active })
      .eq('id', p.id);
    if (error) return;
    invalidateMenuCatalogCache();
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.slug?.toLowerCase().includes(q) ?? false);
      const matchCat = filterCat === 'all' || p.category === filterCat;
      const matchVis =
        visibility === 'all' ||
        (visibility === 'visible' && p.active) ||
        (visibility === 'hidden' && !p.active);
      return matchSearch && matchCat && matchVis;
    });
  }, [products, search, filterCat, visibility]);

  const exportProductsCsv = () => {
    downloadCsv(
      `pessora-produits-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nom', 'Slug', 'Gamme', 'Prix €', 'kcal', 'Prot. g', 'Visible', 'Tri carrousel'],
      filtered.map((p) => [
        p.name,
        p.slug ?? '',
        CAT_LABEL[p.category] ?? p.category,
        p.price != null ? String(p.price) : '',
        p.calories != null ? String(p.calories) : '',
        p.protein != null ? String(p.protein) : '',
        p.active ? 'oui' : 'non',
        p.carousel_sort != null ? String(p.carousel_sort) : '',
      ]),
    );
  };

  const editorMode = editProduct ? 'edit' : 'create';
  const editorTitle =
    editorMode === 'edit' ? `Modifier · ${editProduct?.name ?? ''}` : 'Nouveau produit';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Produits"
        subtitle="Carte du bar : modifier sans quitter la liste — tout se passe dans une fenêtre avec aide à la lecture."
        action={
          <button
            type="button"
            onClick={() => {
              setEditProduct(null);
              setShowForm(true);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir text-white px-4 text-[13px] font-medium hover:bg-anthracite transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} /> Nouveau produit
          </button>
        }
      />
      <div className={DASH_MAIN_PAD}>
      {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchProducts} />}

      <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <DashEyebrow className="mb-2">Recherche & filtres</DashEyebrow>
            <p className="text-[11px] text-black/40">Mémorisés sur cet appareil.</p>
          </div>
          {!loading && filtered.length > 0 && (
            <button
              type="button"
              onClick={exportProductsCsv}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
            >
              <Download size={14} strokeWidth={1.5} aria-hidden />
              Exporter CSV ({filtered.length})
            </button>
          )}
        </div>
        <input
          type="search"
          placeholder="Rechercher (nom, slug)…"
          value={search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="mb-4 h-11 w-full max-w-md rounded-[2px] border border-noir/[0.08] bg-white px-4 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20"
        />
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Gamme</span>
          <Segment
            size="sm"
            selectedKey={filterCat}
            onSelectionChange={(k) =>
              setFilters({
                filterCat: ((k as (typeof DEFAULT_PROD_FILTERS)['filterCat']) ?? 'all'),
              })
            }
            aria-label="Filtrer par gamme"
          >
            {(['all', ...CATEGORIES] as const).map((cat) => (
              <Segment.Item key={cat} id={cat}>
                <Segment.Separator />
                {cat === 'all' ? 'Toutes les gammes' : CAT_LABEL[cat] ?? cat}
              </Segment.Item>
            ))}
          </Segment>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Affichage</span>
          <Segment
            size="sm"
            selectedKey={visibility}
            onSelectionChange={(k) =>
              setFilters({
                visibility: ((k as (typeof DEFAULT_PROD_FILTERS)['visibility']) ?? 'all'),
              })
            }
            aria-label="Filtrer par visibilité"
          >
            {(
              [
                ['all', 'Tous'],
                ['visible', 'Visibles'],
                ['hidden', 'Masqués'],
              ] as const
            ).map(([key, label]) => (
              <Segment.Item key={key} id={key}>
                <Segment.Separator />
                {label}
              </Segment.Item>
            ))}
          </Segment>
        </div>
      </div>

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
                <AdminProductEditorForm
                  key={editProduct?.id ?? 'create'}
                  mode={editorMode}
                  initial={editProduct ? productToForm(editProduct) : undefined}
                  onSave={async (formState) => {
                    if (editProduct) await handleUpdate(formState);
                    else await handleCreate(formState);
                  }}
                  onCancel={() => editorOverlay.close()}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {loading ? (
        <ProductGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
          <EmptyState.Header>
            <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
              Aucun produit
            </EmptyState.Title>
            <EmptyState.Description className="text-[12px] font-light text-black/45">
              Ajuste la recherche ou réinitialise les filtres pour voir tous les produits.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_PROD_FILTERS)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
            >
              Réinitialiser les filtres
            </button>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <ProductCard
                p={p}
                onEdit={() => {
                  setShowForm(false);
                  setEditProduct(p);
                }}
                onArchive={() => handleArchive(p)}
                onDelete={() => setDeleteProductId(p.id)}
              />
            </li>
          ))}
        </ul>
      )}
      </div>

      <ConfirmDialog
        open={deleteProductId !== null}
        title="Supprimer ce produit ?"
        description="Cette action est définitive. Le produit disparaîtra du catalogue et du menu."
        loading={deleteProductLoading}
        onClose={closeDeleteProductDialog}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
};

export default AdminProduits;
