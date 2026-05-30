// src/components/admin/AdminProductForm.tsx
import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@heroui/react';
import type { Product } from '../../types/database';
import { uploadPublicImage } from '../../lib/storageUpload';
import { ProductImageDropzone } from './ProductImageDropzone';
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
  /** Produit affiché sur le carrousel d'accueil (`carousel_sort` non null en base). */
  carousel_include: false,
  /** Ordre d'affichage (1 = premier). Vide = auto ou conserve la position à l'édition. */
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

interface AdminProductFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  busy: boolean;
  isEdit: boolean;
}

export function AdminProductForm({ form, onChange, busy, isEdit }: AdminProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(isEdit);

  const uploadFolder = form.slug.trim() || slugify(form.name) || 'nouveau';

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadPublicImage('product-images', file, uploadFolder);
      onChange({ image_url: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
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
              onChange={(e) => {
                onChange({ name: e.target.value, slug: slugify(e.target.value) });
              }}
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
              onChange={(e) => onChange({ category: e.target.value })}
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
              onChange={(e) => onChange({ price: e.target.value })}
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
                  onChange={(e) => onChange({ price_small: e.target.value })}
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
                  onChange={(e) => onChange({ price_medium: e.target.value })}
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
                  onChange={(e) => onChange({ price_large: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => onChange({ active: e.target.checked })}
                className="h-4 w-4 accent-black"
              />
              <span className="text-[13px] text-black/75">Visible sur le menu du site</span>
            </label>
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
          disabled={busy}
          onFile={uploadImageFile}
        />
        <div className={cn('-mt-2 pt-2')}>
          <label htmlFor="prod-image-url" className="sr-only">
            URL de l'image
          </label>
          <input
            id="prod-image-url"
            type="url"
            className={cn(inputClass, 'mt-2')}
            value={form.image_url}
            onChange={(e) => onChange({ image_url: e.target.value })}
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
              onChange={(e) => onChange({ pitch: e.target.value })}
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
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
          <TagChipPicker
            id="prod-ing"
            label="Ingrédients"
            hint="Compose la liste comme sur la carte : saveurs, boosters, etc. Cliquez une suggestion ou ajoutez du texte libre."
            presets={DRINK_INGREDIENT_PRESETS}
            values={form.ingredients_tags}
            onChange={(ingredients_tags) => onChange({ ingredients_tags })}
          />
          <TagChipPicker
            id="prod-ben"
            label="Bénéfices"
            hint="Courtes phrases ou mentions type carte (énergie, récupération, protéines…)."
            presets={DRINK_BENEFIT_PRESETS}
            values={form.benefits_tags}
            onChange={(benefits_tags) => onChange({ benefits_tags })}
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
                    onChange={(e) => onChange({ [key]: e.target.checked })}
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
                onChange={(e) => onChange({ calories: e.target.value })}
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
                onChange={(e) => onChange({ protein: e.target.value })}
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
                Adresse dans l'URL (slug)
              </label>
              <input
                id="prod-slug"
                className={inputClass}
                value={form.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                placeholder="pink-dragon"
              />
            </div>
            <div>
              <label htmlFor="prod-emoji" className={labelClass}>
                Petit picto décoratif (emoji)
              </label>
              <input
                id="prod-emoji"
                className={inputClass}
                value={form.icon_emoji}
                onChange={(e) => onChange({ icon_emoji: e.target.value })}
                placeholder="facultatif"
              />
            </div>
          </div>
        ) : null}
      </section>

      {uploadError && (
        <p className="text-[12px] text-red-600" role="alert">{uploadError}</p>
      )}
    </div>
  );
}
