// src/components/admin/AdminProductEditorForm.tsx
import { useState, useCallback, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@heroui/react';
import type { Product } from '../../types/database';
import { uploadPublicImage } from '../../lib/storageUpload';
import { DRINK_BENEFIT_PRESETS, DRINK_INGREDIENT_PRESETS } from '../../data/drinkTagPresets';

export const CATEGORIES = ['wellness', 'energie', 'shakes', 'coffee'] as const;

export const CAT_LABEL: Record<string, string> = {
  wellness: 'Wellness',
  energie: 'Énergie',
  shakes: 'Shakes',
  coffee: 'Coffee',
};

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normalise une étiquette (trim, espaces internes). */
export function normalizeTagLabel(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** Liste sans doublons (insensible à la casse), ordre conservé. */
export function uniqueTagsPreserveOrder(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTagLabel(t);
    if (!n) continue;
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

function badgesFromProduct(badges: string[] | null): { vegan: boolean; glutenfree: boolean; vitamins: boolean } {
  const b = new Set(badges ?? []);
  return {
    vegan: b.has('vegan'),
    glutenfree: b.has('glutenfree'),
    vitamins: b.has('vitamins'),
  };
}

function badgesToPayload(v: { vegan: boolean; glutenfree: boolean; vitamins: boolean }): string[] {
  const out: string[] = [];
  if (v.vegan) out.push('vegan');
  if (v.glutenfree) out.push('glutenfree');
  if (v.vitamins) out.push('vitamins');
  return out;
}

export const EMPTY_FORM = {
  slug: '',
  name: '',
  category: 'shakes',
  price: '',
  price_small: '',
  price_medium: '',
  price_large: '',
  calories: '',
  protein: '',
  description: '',
  pitch: '',
  icon_emoji: '',
  ingredients_tags: [] as string[],
  benefits_tags: [] as string[],
  badge_vegan: false,
  badge_glutenfree: false,
  badge_vitamins: false,
  image_url: '',
  /** Produit affiché sur le carrousel d’accueil (`carousel_sort` non null en base). */
  carousel_include: false,
  /** Ordre d’affichage (1 = premier). Vide = auto ou conserve la position à l’édition. */
  carousel_sort: '',
  carousel_badge: '',
  active: true,
};

export type FormState = typeof EMPTY_FORM;

export function productToForm(p: Product): FormState {
  const bd = badgesFromProduct(p.badges);
  return {
    slug: p.slug ?? '',
    name: p.name,
    category: p.category,
    price: p.price != null ? String(p.price) : '',
    price_small: p.price_small != null ? String(p.price_small) : '',
    price_medium: p.price_medium != null ? String(p.price_medium) : '',
    price_large: p.price_large != null ? String(p.price_large) : '',
    calories: p.calories != null ? String(p.calories) : '',
    protein: p.protein != null ? String(p.protein) : '',
    description: p.description ?? '',
    pitch: p.pitch ?? '',
    icon_emoji: p.icon_emoji ?? '',
    ingredients_tags: [...(p.ingredients ?? [])],
    benefits_tags: [...(p.benefits ?? [])],
    badge_vegan: bd.vegan,
    badge_glutenfree: bd.glutenfree,
    badge_vitamins: bd.vitamins,
    image_url: p.image_url ?? '',
    carousel_include: p.carousel_sort != null,
    carousel_sort: p.carousel_sort != null ? String(p.carousel_sort) : '',
    carousel_badge: p.carousel_badge === 'nouveaute' || p.carousel_badge === 'coup-de-coeur' ? p.carousel_badge : '',
    active: p.active,
  };
}

export function payloadFromForm(form: FormState) {
  const slug = form.slug.trim() || slugify(form.name);
  return {
    slug,
    name: form.name.trim(),
    category: form.category,
    price: form.price ? Number(form.price) : null,
    price_small: form.price_small ? Number(form.price_small) : null,
    price_medium: form.price_medium ? Number(form.price_medium) : null,
    price_large: form.price_large ? Number(form.price_large) : null,
    calories: form.calories ? Number(form.calories) : null,
    protein: form.protein ? Number(form.protein) : null,
    description: form.description.trim() || null,
    pitch: form.pitch.trim() || null,
    icon_emoji: form.icon_emoji.trim() || null,
    ingredients: uniqueTagsPreserveOrder(form.ingredients_tags),
    benefits: uniqueTagsPreserveOrder(form.benefits_tags),
    badges: badgesToPayload({
      vegan: form.badge_vegan,
      glutenfree: form.badge_glutenfree,
      vitamins: form.badge_vitamins,
    }),
    image_url: form.image_url.trim() || null,
    carousel_badge:
      form.carousel_include &&
      (form.carousel_badge === 'nouveaute' || form.carousel_badge === 'coup-de-coeur')
        ? form.carousel_badge
        : null,
    active: form.active,
  };
}

const sectionTitleClass =
  'mb-1 font-display text-[14px] font-normal tracking-[0.02em] text-black';
const sectionHintClass = 'mb-4 text-[11px] font-light leading-relaxed text-black/45';
const labelClass = 'mb-1.5 block text-[10px] font-normal uppercase tracking-[0.14em] text-black/45';
const inputClass =
  'w-full min-h-11 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-3 py-2 text-base sm:text-[13px] text-black placeholder:text-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

const chipRemoveBtnClass =
  'ml-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2px] text-black/40 transition-colors hover:bg-noir/[0.08] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25';

function TagChipPicker({
  id,
  label,
  hint,
  presets,
  values,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  presets: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const inputId = `${id}-custom`;

  const selectedLower = new Set(values.map((v) => v.toLowerCase()));
  const presetChoices = presets.filter((p) => !selectedLower.has(p.toLowerCase()));

  const pushTags = useCallback(
    (extra: string[]) => {
      const merged = uniqueTagsPreserveOrder([...values, ...extra]);
      if (merged.length !== values.length || merged.some((v, i) => v !== values[i])) {
        onChange(merged);
      }
    },
    [values, onChange],
  );

  const addDraft = useCallback(() => {
    const n = normalizeTagLabel(draft);
    if (!n) return;
    pushTags([n]);
    setDraft('');
  }, [draft, pushTags]);

  const removeAt = useCallback(
    (tag: string) => {
      onChange(values.filter((v) => v.toLowerCase() !== tag.toLowerCase()));
    },
    [values, onChange],
  );

  return (
    <div>
      <p id={`${id}-label`} className={labelClass}>
        {label}
      </p>
      <p className="mb-2 text-[10px] font-light text-black/38">{hint}</p>

      <div
        className="min-h-[44px] rounded-[2px] border border-noir/[0.08] bg-white px-3 py-2"
        aria-labelledby={`${id}-label`}
      >
        {values.length === 0 ? (
          <p className="py-1 text-[11px] font-light italic text-black/35">Aucune étiquette — ajoutez depuis les suggestions ou en dessous.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {values.map((tag) => (
              <li
                key={tag.toLowerCase()}
                className="inline-flex max-w-full items-center gap-0.5 rounded-[2px] border border-noir/[0.12] bg-noir/[0.04] px-2 py-1 text-[11px] font-normal text-black/85"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  className={chipRemoveBtnClass}
                  aria-label={`Retirer ${tag}`}
                  onClick={() => removeAt(tag)}
                >
                  <X size={14} strokeWidth={1.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/38">Suggestions (menus)</p>
        <div className="max-h-[140px] overflow-y-auto rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] px-2 py-2">
          {presetChoices.length === 0 ? (
            <p className="py-2 text-center text-[10px] font-light text-black/35">Toutes les suggestions sont déjà ajoutées.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {presetChoices.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="min-h-[44px] rounded-[2px] border border-noir/[0.1] bg-white px-3 py-1 text-[10px] font-normal uppercase tracking-[0.06em] text-black/65 transition-colors hover:border-noir/25 hover:bg-noir/[0.03] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20"
                  onClick={() => pushTags([p])}
                >
                  + {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={inputId} className="sr-only">
          Ajouter une étiquette personnalisée
        </label>
        <input
          id={inputId}
          className={cn(inputClass, 'sm:flex-1')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Ex. Curcuma, rose…"
          autoComplete="off"
        />
        <button
          type="button"
          className="h-11 shrink-0 rounded-[2px] border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/65 transition-colors hover:border-noir/30 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20"
          onClick={addDraft}
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

function ProductImageDropzone({
  imageUrl,
  uploading,
  disabled,
  onFile,
}: {
  imageUrl: string;
  uploading: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptTypes = 'image/jpeg,image/png,image/webp,image/gif';

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f || disabled || uploading) return;
      if (!f.type.startsWith('image/')) return;
      onFile(f);
    },
    [disabled, uploading, onFile],
  );

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Glissez une image ou cliquez pour choisir un fichier"
        aria-disabled={disabled || uploading}
        onClick={() => !(disabled || uploading) && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-dashed px-4 py-10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-noir/25',
          dragOver ? 'border-noir/35 bg-noir/[0.04]' : 'border-noir/[0.12] bg-white hover:border-noir/25 hover:bg-noir/[0.02]',
          (disabled || uploading) && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-noir/[0.06] text-black/45">
          {uploading ? (
            <span className="text-[11px] font-normal text-black/40">…</span>
          ) : (
            <ImagePlus size={26} strokeWidth={1.35} aria-hidden />
          )}
        </div>
        <div className="text-center">
          <p className="text-[12px] font-normal text-black">
            {uploading ? 'Envoi de l’image…' : 'Glissez une image ici ou cliquez'}
          </p>
          <p className="mt-1 text-[10px] font-light text-black/38">JPG, PNG, WebP ou GIF · recommandé carré ou portrait</p>
        </div>
      </div>

      {imageUrl ? (
        <div className="overflow-hidden rounded-[2px] border border-noir/[0.08] bg-noir/[0.03]">
              <img src={imageUrl} alt="" className="mx-auto aspect-[4/3] max-h-48 w-auto max-w-full object-contain" loading="lazy" />
        </div>
      ) : null}
    </div>
  );
}

/** Formulaire éditorial admin — prévu pour être affiché dans une modal pleine largeur. */
export function AdminProductEditorForm({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(mode === 'edit');

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const uploadFolder = form.slug.trim() || slugify(form.name) || 'nouveau';

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicImage('product-images', file, uploadFolder);
      set('image_url', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

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

  const slugPreview = (form.slug.trim() || slugify(form.name) || 'nom-du-produit').replace(/^-+|-+$/g, '');
  const detailUrl = `/menu/${slugPreview}`;

  return (
    <div className="flex flex-col gap-8 pb-2">
      {/* Bloc 1 — Carte menu */}
      <section aria-labelledby="prod-section-menu">
        <h3 id="prod-section-menu" className={sectionTitleClass}>
          Sur la carte et au panier
        </h3>
        <p className={sectionHintClass}>
          Ces informations apparaissent dans la liste du menu et dans le tunnel de commande.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="prod-name" className={labelClass}>
              Nom de la boisson *
            </label>
            <input
              id="prod-name"
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex. Pink Dragon"
            />
          </div>
          <div>
            <label htmlFor="prod-cat" className={labelClass}>
              Gamme
            </label>
            <select
              id="prod-cat"
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAT_LABEL[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prod-price" className={labelClass}>
              Prix affiché (€)
            </label>
            <input
              id="prod-price"
              type="number"
              step="0.01"
              inputMode="decimal"
              className={inputClass}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="ex. 8,50"
            />
            <p className="mt-1 text-[10px] font-light text-black/38">
              Prix principal. Ci-dessous : autres tailles si vous les utilisez sur la carte.
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={labelClass}>Autres tailles (€) — facultatif</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="prod-ps" className="mb-1 block text-[10px] text-black/40">
                  Petit
                </label>
                <input
                  id="prod-ps"
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.price_small}
                  onChange={(e) => set('price_small', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="prod-pm" className="mb-1 block text-[10px] text-black/40">
                  Moyen
                </label>
                <input
                  id="prod-pm"
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.price_medium}
                  onChange={(e) => set('price_medium', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="prod-pl" className="mb-1 block text-[10px] text-black/40">
                  Grand
                </label>
                <input
                  id="prod-pl"
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.price_large}
                  onChange={(e) => set('price_large', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              <span className="text-[13px] text-black/75">Visible sur le menu du site</span>
            </label>
          </div>

          <div className="md:col-span-2 space-y-4 rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] px-4 py-4">
            <div>
              <p className={labelClass}>Carrousel d’accueil</p>
              <label className="mt-2 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.carousel_include}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      carousel_include: on,
                      carousel_sort: on ? prev.carousel_sort : '',
                      carousel_badge: on ? prev.carousel_badge : '',
                    }));
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-black"
                />
                <span>
                  <span className="block text-[13px] font-normal text-black/85">
                    Ajouter cette boisson au carrousel d’accueil
                  </span>
                  <span className="mt-0.5 block text-[11px] font-light leading-relaxed text-black/42">
                    Rien à taper : laissez « Position » vide pour placer automatiquement en dernier (nouveau produit) ou
                    conserver la position actuelle à l’édition.
                  </span>
                </span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-sort" className={labelClass}>
                  Position dans le carrousel
                </label>
                <input
                  id="prod-sort"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  disabled={!form.carousel_include}
                  className={cn(inputClass, !form.carousel_include && 'cursor-not-allowed opacity-45')}
                  value={form.carousel_sort}
                  onChange={(e) => set('carousel_sort', e.target.value)}
                  placeholder="Automatique si vide"
                />
                <p className="mt-1.5 text-[10px] font-light leading-relaxed text-black/38">
                  Optionnel : 1 = première slide. Vide = ordre auto ou inchangé selon le cas.
                </p>
              </div>
              <div>
                <label htmlFor="prod-cbadge" className={labelClass}>
                  Pastille sur l’accueil
                </label>
                <select
                  id="prod-cbadge"
                  disabled={!form.carousel_include}
                  className={cn(inputClass, !form.carousel_include && 'cursor-not-allowed opacity-45')}
                  value={form.carousel_badge}
                  onChange={(e) => set('carousel_badge', e.target.value)}
                >
                  <option value="">—</option>
                  <option value="nouveaute">Nouveauté</option>
                  <option value="coup-de-coeur">Coup de cœur</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc 2 — Photo */}
      <section aria-labelledby="prod-section-photo">
        <h3 id="prod-section-photo" className={sectionTitleClass}>
          Photo du produit
        </h3>
        <p className={sectionHintClass}>Choisissez une belle photo : elle apparaît sur la carte et la fiche détail.</p>
        <ProductImageDropzone
          imageUrl={form.image_url}
          uploading={uploading}
          disabled={saving}
          onFile={uploadImageFile}
        />
        <div className={cn('-mt-2 pt-2')}>
          <label htmlFor="prod-image-url" className="sr-only">
            URL de l’image
          </label>
          <input
            id="prod-image-url"
            type="url"
            className={cn(inputClass, 'mt-2')}
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://…"
          />
        </div>
      </section>

      {/* Bloc 3 — Page détail */}
      <section aria-labelledby="prod-section-detail">
        <h3 id="prod-section-detail" className={sectionTitleClass}>
          Page détail (après clic sur la boisson)
        </h3>
        <p className={sectionHintClass}>
          Textes des onglets Ingrédients, Nutritionnel et Bénéfices sur le site.
        </p>
        <div className="mb-4 rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] px-4 py-3">
          <p className="text-[10px] font-normal uppercase tracking-[0.12em] text-black/35">Aperçu lien</p>
          <a
            href={detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[12px] font-normal text-black underline decoration-black/25 underline-offset-2 hover:text-black/80"
          >
            Ouvrir la fiche · {detailUrl}
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="prod-pitch" className={labelClass}>
              Accroche courte (sous le titre)
            </label>
            <input
              id="prod-pitch"
              className={inputClass}
              value={form.pitch}
              onChange={(e) => set('pitch', e.target.value)}
              placeholder="Une ligne qui donne envie"
            />
          </div>
          <div>
            <label htmlFor="prod-desc" className={labelClass}>
              Description plus longue
            </label>
            <textarea
              id="prod-desc"
              rows={4}
              className={cn(inputClass, 'resize-y min-h-[96px]')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <TagChipPicker
            id="prod-ing"
            label="Ingrédients"
            hint="Compose la liste comme sur la carte : saveurs, boosters, etc. Cliquez une suggestion ou ajoutez du texte libre."
            presets={DRINK_INGREDIENT_PRESETS}
            values={form.ingredients_tags}
            onChange={(ingredients_tags) => setForm((prev) => ({ ...prev, ingredients_tags }))}
          />
          <TagChipPicker
            id="prod-ben"
            label="Bénéfices"
            hint="Courtes phrases ou mentions type carte (énergie, récupération, protéines…)."
            presets={DRINK_BENEFIT_PRESETS}
            values={form.benefits_tags}
            onChange={(benefits_tags) => setForm((prev) => ({ ...prev, benefits_tags }))}
          />
          <div>
            <p className={labelClass}>Étiquettes sur la fiche</p>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'badge_vegan' as const, label: 'Vegan' },
                { key: 'badge_glutenfree' as const, label: 'Sans gluten' },
                { key: 'badge_vitamins' as const, label: 'Vitamines' },
              ].map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-[13px] text-black/75">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-cal" className={labelClass}>
                Calories (kcal)
              </label>
              <input
                id="prod-cal"
                type="number"
                inputMode="numeric"
                className={inputClass}
                value={form.calories}
                onChange={(e) => set('calories', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="prod-prot" className={labelClass}>
                Protéines (g)
              </label>
              <input
                id="prod-prot"
                type="number"
                inputMode="decimal"
                className={inputClass}
                value={form.protein}
                onChange={(e) => set('protein', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Réglages avancés */}
      <section>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between rounded-[2px] border border-noir/[0.08] bg-noir/[0.03] px-4 py-3 text-left text-[12px] font-normal text-black/70 transition-colors hover:bg-noir/[0.05]"
          aria-expanded={showAdvanced}
        >
          Réglages avancés (adresse web…)
          <span className="text-black/40">{showAdvanced ? '−' : '+'}</span>
        </button>
        {showAdvanced ? (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-noir/[0.06] pt-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="prod-slug" className={labelClass}>
                Adresse dans l’URL (slug)
              </label>
              <input
                id="prod-slug"
                className={inputClass}
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="pink-dragon"
              />
              <button
                type="button"
                className="mt-2 text-[11px] font-normal text-black/45 underline underline-offset-2 hover:text-black"
                onClick={() => set('slug', slugify(form.name))}
              >
                Générer automatiquement depuis le nom
              </button>
            </div>
            <div>
              <label htmlFor="prod-emoji" className={labelClass}>
                Petit picto décoratif (emoji)
              </label>
              <input
                id="prod-emoji"
                className={inputClass}
                value={form.icon_emoji}
                onChange={(e) => set('icon_emoji', e.target.value)}
                placeholder="facultatif"
              />
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <p className="text-[12px] text-red-600" role="alert">
          {error}
        </p>
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
