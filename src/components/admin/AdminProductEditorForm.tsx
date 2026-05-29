// src/components/admin/AdminProductEditorForm.tsx
import { useState } from 'react';
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
    <div className="flex flex-col gap-8 pb-2">
      <AdminProductForm form={form} onChange={onChange} busy={busy} isEdit={mode === 'edit'} />

      <section aria-labelledby="prod-section-carousel">
        <h3 id="prod-section-carousel" className="mb-1 font-display text-[14px] font-normal tracking-[0.02em] text-black">
          Carrousel d&rsquo;accueil
        </h3>
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
      </section>

      {mode === 'edit' && productId && (
        <section aria-labelledby="prod-section-gallery">
          <h3 id="prod-section-gallery" className="mb-1 font-display text-[14px] font-normal tracking-[0.02em] text-black">
            Photos supplémentaires (max 3)
          </h3>
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
        </section>
      )}

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
