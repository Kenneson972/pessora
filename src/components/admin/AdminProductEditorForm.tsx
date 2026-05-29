// src/components/admin/AdminProductEditorForm.tsx
import { useState } from 'react';
import { Tabs } from '@heroui/react';
import type { Product } from '../../types/database';
import {
  AdminProductForm,
  EMPTY_FORM,
  productToForm,
} from './AdminProductForm';
import type { FormState } from './AdminProductForm';
import { AdminCarouselToggle } from './AdminCarouselToggle';
import { AdminProductGallery } from './AdminProductGallery';

// Re-export everything AdminProduits needs
export {
  CATEGORIES,
  CAT_LABEL,
  EMPTY_FORM,
  productToForm,
  payloadFromForm,
  slugify,
  normalizeTagLabel,
  uniqueTagsPreserveOrder,
} from './AdminProductForm';
export type { FormState } from './AdminProductForm';

const TABS = [
  { id: 'infos', label: 'Infos' },
  { id: 'carrousel', label: 'Carrousel' },
  { id: 'photos', label: 'Photos' },
] as const;
type TabId = (typeof TABS)[number]['id'];

interface Props {
  mode: 'create' | 'edit';
  initial?: Product;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}

export function AdminProductEditorForm({ mode, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    ...(initial ? productToForm(initial) : {}),
  });
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('infos');

  const productId = initial?.id;
  const busy = saving;

  const onChange = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Indiquez le nom de la boisson.');
      return;
    }
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
    <div className="flex flex-col pb-2">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as TabId)}
        aria-label="Sections du formulaire produit"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel id="infos">
          <div className="pt-4">
            <AdminProductForm form={form} onChange={onChange} busy={busy} isEdit={mode === 'edit'} />
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="carrousel">
          <div className="pt-4">
            <p className="mb-4 text-[11px] font-light leading-relaxed text-black/45">
              Ajouter cette boisson au carrousel de la page d&rsquo;accueil.
            </p>
            <AdminCarouselToggle
              included={form.carousel_include}
              onIncludeChange={(v) => onChange({ carousel_include: v })}
              position={form.carousel_sort}
              onPositionChange={(v) => onChange({ carousel_sort: v })}
              badge={form.carousel_badge}
              onBadgeChange={(v) => onChange({ carousel_badge: v })}
              busy={busy}
            />
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="photos">
          <div className="pt-4">
            {mode === 'edit' && productId ? (
              <>
                <p className="mb-4 text-[11px] font-light leading-relaxed text-black/45">
                  Glissez ou ajoutez jusqu&rsquo;à 3 images. L&rsquo;ordre est modifiable par drag &amp; drop.
                </p>
                <AdminProductGallery
                  productId={productId}
                  table="products"
                  images={gallery}
                  onReorder={setGallery}
                  busy={busy}
                />
              </>
            ) : (
              <p className="py-8 text-center text-[13px] text-black/40">
                Enregistrez d&rsquo;abord le produit pour ajouter des photos.
              </p>
            )}
          </div>
        </Tabs.Panel>
      </Tabs>

      {error ? (
        <p className="text-[12px] text-red-600" role="alert">{error}</p>
      ) : null}

      <div className="sticky bottom-0 z-[1] flex flex-wrap gap-3 border-t border-noir/[0.06] bg-white pt-4 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 min-h-11 rounded-[2px] bg-noir px-8 text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le produit' : 'Enregistrer les modifications'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-11 min-h-11 rounded-[2px] border border-noir/15 px-8 text-[11px] font-light uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir/30 hover:text-black disabled:opacity-40"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
