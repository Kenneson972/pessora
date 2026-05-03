import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import { Skeleton, cn } from '@heroui/react';
import { EmptyState } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import type { GammeProduct } from '../../types/database';

const SIDEBAR_NAV = [
  {
    gamme: 'sport' as const,
    label: 'Gamme Sport',
    subcategories: [
      { key: 'sport', label: 'Sport' },
      { key: 'encas', label: 'Encas' },
    ],
  },
  {
    gamme: 'skin' as const,
    label: 'Gamme Skin',
    subcategories: [
      { key: 'nettoyage', label: 'Nettoyage' },
      { key: 'korean', label: 'Korean Products' },
      { key: 'contour', label: 'Contour des Yeux' },
      { key: 'serum', label: 'Sérum / Anti-Âge' },
    ],
  },
  {
    gamme: 'wellness' as const,
    label: 'Gamme Wellness',
    subcategories: [],
  },
] as const;

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  price_alt: '',
  image_url: '',
  sort_order: '',
};
type GammeFormState = typeof EMPTY_FORM;

function productToGammeForm(p: GammeProduct): GammeFormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    price_alt: p.price_alt != null ? String(p.price_alt) : '',
    image_url: p.image_url ?? '',
    sort_order: String(p.sort_order),
  };
}

const inputClass =
  'w-full h-11 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-base sm:text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

const GammeProductForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<GammeFormState>;
  onSave: (data: GammeFormState) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<GammeFormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof GammeFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nom requis.'); return; }
    if (!form.price) { setError('Prix requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-[2px] border border-noir/[0.06] bg-white p-6">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Nom *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Prix (€) *</label>
          <input type="number" step="0.01" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="45" />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">
            Prix alternatif (€) <span className="normal-case text-black/25">— ex: grand format</span>
          </label>
          <input type="number" step="0.01" className={inputClass} value={form.price_alt} onChange={(e) => set('price_alt', e.target.value)} placeholder="Laisser vide si un seul prix" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Description</label>
          <input className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Image (URL)</label>
          <input className={inputClass} value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Ordre d'affichage</label>
          <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} placeholder="1" />
        </div>
      </div>
      {error && <p className="mb-3 text-[11px] text-red-500/80">{error}</p>}
      <div className="flex gap-3">
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
};

const AdminGammes = () => {
  useEffect(() => { document.title = 'Gammes — Admin PessÓra'; }, []);
  const [selectedGamme, setSelectedGamme] = useState<'sport' | 'skin' | 'wellness'>('sport');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>('sport');
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<GammeProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', selectedGamme)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }: { data: GammeProduct[] | null; error: { message: string } | null }) => {
        setLoading(false);
        if (error) {
          setFetchError(formatSupabaseDataError(error.message, 'products'));
          setProducts([]);
          return;
        }
        setProducts(data ?? []);
      });
  }, [selectedGamme]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSelectNav = (gamme: 'sport' | 'skin' | 'wellness', subcategory: string | null) => {
    setSelectedGamme(gamme);
    setSelectedSubcategory(subcategory);
    setShowForm(false);
    setEditProduct(null);
  };

  const visibleProducts = products.filter((p) => {
    const matchSubcat = selectedSubcategory === null
      ? p.subcategory === null
      : p.subcategory === selectedSubcategory;
    return matchSubcat && p.active;
  });

  const archivedProducts = products.filter((p) => {
    const matchSubcat = selectedSubcategory === null
      ? p.subcategory === null
      : p.subcategory === selectedSubcategory;
    return matchSubcat && !p.active;
  });

  const buildPayload = (form: GammeFormState) => ({
    gamme: selectedGamme,
    subcategory: selectedSubcategory,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    price_alt: form.price_alt ? Number(form.price_alt) : null,
    image_url: form.image_url.trim() || null,
    sort_order: form.sort_order ? parseInt(form.sort_order, 10) : 0,
    active: true,
  });

  const handleCreate = async (form: GammeFormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('gamme_products').insert(buildPayload(form));
    if (error) throw new Error(formatMutationError(error.message));
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: GammeFormState) => {
    if (!editProduct) return;
    const { active: _active, ...rest } = buildPayload(form);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('gamme_products').update(rest).eq('id', editProduct.id);
    if (error) throw new Error(formatMutationError(error.message));
    setEditProduct(null);
    fetchProducts();
  };

  const handleArchive = async (p: GammeProduct) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('gamme_products').delete().eq('id', deleteId);
      fetchProducts();
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, fetchProducts]);

  const currentNavItem = SIDEBAR_NAV.find((n) => n.gamme === selectedGamme);
  const currentSubLabel = selectedSubcategory
    ? currentNavItem?.subcategories.find((s) => s.key === selectedSubcategory)?.label
    : 'Wellness';
  const sectionTitle = currentSubLabel
    ? `${currentNavItem?.label} — ${currentSubLabel}`
    : (currentNavItem?.label ?? '');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-52 shrink-0 border-r border-noir/[0.06] bg-white py-6 md:block">
        <p className="mb-3 px-4 text-[9px] font-normal uppercase tracking-[0.2em] text-black/30">
          Gammes produits
        </p>
        {SIDEBAR_NAV.map(({ gamme, label, subcategories }) => (
          <div key={gamme} className="mb-1">
            {subcategories.length === 0 ? (
              <button
                type="button"
                onClick={() => handleSelectNav(gamme, null)}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] transition-colors',
                  selectedGamme === gamme && selectedSubcategory === null
                    ? 'border-l-2 border-noir bg-noir/[0.04] text-noir'
                    : 'text-black/50 hover:bg-noir/[0.02] hover:text-noir',
                )}
              >
                {label}
              </button>
            ) : (
              <>
                <p className="px-4 pb-1 pt-2 text-[9px] font-normal uppercase tracking-[0.18em] text-black/35">
                  {label}
                </p>
                {subcategories.map(({ key, label: subLabel }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectNav(gamme, key)}
                    className={cn(
                      'w-full px-6 py-2 text-left text-[10px] transition-colors',
                      selectedGamme === gamme && selectedSubcategory === key
                        ? 'border-l-2 border-noir bg-noir/[0.04] font-medium text-noir'
                        : 'text-black/45 hover:bg-noir/[0.02] hover:text-noir',
                    )}
                  >
                    ↳ {subLabel}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <DashPageHeader
          breadcrumb="Administration"
          title="Gammes"
          subtitle={sectionTitle}
          action={
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditProduct(null); }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir px-4 text-[13px] font-medium text-white transition-colors hover:bg-anthracite"
            >
              <Plus size={14} strokeWidth={1.5} /> Ajouter produit
            </button>
          }
        />

        <div className={DASH_MAIN_PAD}>
          {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchProducts} />}

          {showForm && !editProduct && (
            <div className="mb-10">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Nouveau produit</p>
              <GammeProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {editProduct && (
            <div className="mb-10">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">
                Modifier — {editProduct.name}
              </p>
              <GammeProductForm
                initial={productToGammeForm(editProduct)}
                onSave={handleUpdate}
                onCancel={() => setEditProduct(null)}
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-[2px] bg-noir/[0.05]" />
              ))}
            </div>
          ) : visibleProducts.length === 0 && !showForm ? (
            <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
              <EmptyState.Header>
                <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                  Aucun produit
                </EmptyState.Title>
                <EmptyState.Description className="text-[12px] font-light text-black/45">
                  Aucun produit dans cette sous-catégorie.
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              {visibleProducts.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between gap-4 px-5 py-3.5',
                    i < visibleProducts.length - 1 && 'border-b border-noir/[0.05]',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-normal text-black">{p.name}</p>
                    {p.description && (
                      <p className="mt-0.5 truncate text-[11px] font-light text-black/40">{p.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-normal text-black">
                      {p.price}€{p.price_alt ? ` / ${p.price_alt}€` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditProduct(p); setShowForm(false); }}
                      className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-noir/12 text-black/55 transition-colors hover:border-noir/25 hover:text-black"
                      aria-label={`Modifier ${p.name}`}
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(p)}
                      className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                      aria-label={`Archiver ${p.name}`}
                      title="Archiver"
                    >
                      <Archive size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Supprimer ${p.name}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archives */}
          {archivedProducts.length > 0 && (
            <div className="mt-10">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40 transition-colors hover:text-black"
              >
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className={cn('transition-transform', showArchived && 'rotate-180')}
                />
                {archivedProducts.length} produit{archivedProducts.length > 1 ? 's' : ''} archivé{archivedProducts.length > 1 ? 's' : ''}
              </button>
              {showArchived && (
                <div className="mt-4 overflow-hidden rounded-[2px] border border-noir/[0.06] bg-noir/[0.01]">
                  {archivedProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center justify-between gap-4 px-5 py-3.5 opacity-50',
                        i < archivedProducts.length - 1 && 'border-b border-noir/[0.05]',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-normal text-black">{p.name}</p>
                      </div>
                      <p className="shrink-0 text-[13px] text-black/60">{p.price}€</p>
                      <button
                        type="button"
                        onClick={() => handleArchive(p)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                        aria-label={`Restaurer ${p.name}`}
                        title="Restaurer"
                      >
                        <ArchiveRestore size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
