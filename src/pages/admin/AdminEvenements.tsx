// src/pages/admin/AdminEvenements.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Download,
  ArrowLeft,
  ExternalLink,
  CalendarDays,
  MapPin,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  RefreshCw,
  UserPlus,
  Check,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ContextMenu, EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { downloadCsv } from '../../lib/csvExport';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { usePersistentAdminState } from '../../hooks/usePersistentAdminState';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { EventGalleryManager } from '../../components/admin/EventGalleryManager';
import { useAdminEventRegistrations, type NewRegistrantData } from '../../hooks/useAdminEventRegistrations';
import { fetchPopupForEventSlug, syncEventPopup } from '../../lib/eventPopup';
import type { Event } from '../../types/database';

// ─── Types ──────────────────────────────────────────────────────────────────
interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'event' as Event['type'],
  date: '',
  heure: '',
  location: '',
  meeting_point: '',
  description: '',
  places_max: '',
  image_url: '',
  gallery: [] as string[],
  price: '',
  is_free: true,
  registration_open: true,
  active: true,
  popup_id: null as string | null,
  popup_enabled: false,
  popup_active: true,
  popup_title: '',
  popup_subtitle: '',
  popup_message: '',
  popup_cta_label: "S'inscrire",
};

type FormState = typeof EMPTY_FORM;

const TYPE_OPTIONS: Event['type'][] = ['event', 'popup', 'atelier', 'partenariat', 'bilan', 'run_club'];
const TYPE_LABELS: Record<Event['type'], string> = {
  event: 'Événement',
  popup: 'Pop-up',
  atelier: 'Atelier',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
  run_club: 'Course',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatLongDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Éditeur pleine page ─────────────────────────────────────────────────────
type EditorProps = {
  initial?: Partial<FormState>;
  existing?: EventWithCount | null;
  relanceFrom?: string;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  onRelance?: () => void;
};

const inputBase =
  'w-full bg-white border border-noir/[0.09] rounded-[2px] px-3.5 py-3 text-base sm:text-[13px] text-noir placeholder:text-black/30 focus-visible:outline-none focus-visible:border-noir/35 focus-visible:ring-2 focus-visible:ring-noir/10 transition-colors';
const labelBase = 'block text-[9px] font-medium uppercase tracking-[0.22em] text-black/45 mb-1.5';

const EventEditor = ({ initial, existing, relanceFrom, onSave, onCancel, onDelete, onRelance }: EditorProps) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupLoaded, setPopupLoaded] = useState(!existing);
  const prefersReducedMotion = useReducedMotion();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!existing?.slug) {
      setPopupLoaded(true);
      return;
    }
    let cancelled = false;
    fetchPopupForEventSlug(existing.slug).then((p) => {
      if (cancelled) return;
      if (p) {
        setForm((f) => ({
          ...f,
          popup_id: p.id,
          popup_enabled: true,
          popup_active: p.active,
          popup_title: p.title,
          popup_subtitle: p.subtitle ?? '',
          popup_message: p.message ?? '',
          popup_cta_label: p.cta_label ?? "S'inscrire",
        }));
      }
      setPopupLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [existing?.slug]);

  /** Pré-remplit les champs popup à partir de l'événement quand on active le toggle. */
  const enablePopup = () => {
    setForm((f) => ({
      ...f,
      popup_enabled: true,
      popup_title: f.popup_title || f.title,
      popup_subtitle: f.popup_subtitle || TYPE_LABELS[f.type],
      popup_message: f.popup_message || f.description || '',
      popup_cta_label: f.popup_cta_label || "S'inscrire",
    }));
  };

  const resetPopupFromEvent = () => {
    setForm((f) => ({
      ...f,
      popup_title: f.title,
      popup_subtitle: TYPE_LABELS[f.type],
      popup_message: f.description || '',
      popup_cta_label: "S'inscrire",
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    if (!form.date) {
      setError('La date est requise.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        slug: (form.slug || slugify(form.title)).trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? formatMutationError(e.message) : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const pathSlug = form.slug || slugify(form.title) || 'event';
  const count = Number(existing?.event_registrations?.[0]?.count ?? 0);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Barre supérieure */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-noir/[0.06] bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-[11px] font-light text-black/55 transition-colors hover:text-noir"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Retour à la liste
          </button>
          <div className="flex items-center gap-2">
            {existing && (
              <a
                href={`/evenements/${existing.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-noir/15 px-3 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
              >
                <ExternalLink size={12} strokeWidth={1.5} />
                Voir la page
              </a>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-11 items-center rounded-full bg-noir px-5 text-[11px] font-medium tracking-[0.04em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
            >
              {saving ? 'Sauvegarde…' : existing ? 'Enregistrer' : 'Publier'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,420px)] lg:gap-10">
        {/* Colonne principale — formulaire */}
        <div className="flex flex-col gap-8">
          {relanceFrom && (
            <div className="mb-4 flex items-center gap-2 rounded-[2px] border border-gold/20 bg-gold/[0.06] px-4 py-3">
              <RefreshCw size={12} strokeWidth={1.5} className="shrink-0 text-gold-dim" />
              <p className="text-[11px] font-light text-black/60">
                Relancé depuis <span className="font-normal text-black/80">«&nbsp;{relanceFrom}&nbsp;»</span> — choisissez une nouvelle date et ajustez le slug.
              </p>
            </div>
          )}

          <header className="pb-2">
            <DashEyebrow className="mb-2">
              {existing ? "Modifier l’événement" : relanceFrom ? "Relancer l’événement" : 'Nouvel événement'}
            </DashEyebrow>
            <h2
              className="font-display text-[clamp(1.5rem,4vw,2.2rem)] leading-[1.05] tracking-[-0.02em] text-noir"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {form.title || (existing ? existing.title : 'Sans titre')}
            </h2>
            {form.slug && (
              <p className="mt-2 text-[11px] font-light text-black/40">
                <span className="text-black/30">pessora.fr/evenements/</span>
                <span className="text-black/60">{form.slug}</span>
              </p>
            )}
          </header>

          {/* Section Identité */}
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Identité</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelBase}>Titre *</label>
                <input
                  className={inputBase}
                  value={form.title}
                  placeholder="Ex. Pop-up Carbet — Fort-de-France"
                  onChange={(e) => {
                    set('title', e.target.value);
                    set('slug', slugify(e.target.value));
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelBase}>URL (slug)</label>
                <input
                  className={inputBase}
                  value={form.slug}
                  placeholder={slugify(form.title) || 'pop-up-carbet'}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelBase}>Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('type', t)}
                      className={`h-11 rounded-full px-4 text-[10px] font-light tracking-[0.08em] transition-colors ${
                        form.type === t
                          ? 'bg-noir text-white'
                          : 'border border-noir/15 text-black/55 hover:border-noir/30 hover:text-noir'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section Date & Lieu */}
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Date & lieu</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelBase}>Date *</label>
                <input
                  type="date"
                  className={inputBase}
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
              <div>
                <label className={labelBase}>Heure</label>
                <input
                  type="time"
                  className={inputBase}
                  value={form.heure}
                  onChange={(e) => set('heure', e.target.value)}
                />
              </div>
              <div>
                <label className={labelBase}>Lieu</label>
                <input
                  className={inputBase}
                  value={form.location}
                  placeholder="Fort-de-France"
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>
              <div>
                <label className={labelBase}>Point de rendez-vous</label>
                <input
                  className={inputBase}
                  value={form.meeting_point}
                  placeholder="Devant l’entrée principale"
                  onChange={(e) => set('meeting_point', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section Description */}
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Description</DashEyebrow>
            <textarea
              className={`${inputBase} min-h-[180px] resize-y leading-relaxed`}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Racontez cet événement — l’intention, le déroulé, ce qui est inclus, ce qu’il faut apporter."
            />
            <p className="mt-2 text-[10px] text-black/35">
              {form.description.length} caractères · affiché sur la page publique.
            </p>
          </section>

          {/* Section Tarif & Capacité */}
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Tarif & capacité</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelBase}>Accès</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['free', 'Entrée libre'],
                    ['paid', 'Payant'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('is_free', key === 'free')}
                      className={`h-11 rounded-full px-4 text-[10px] font-light tracking-[0.08em] transition-colors ${
                        form.is_free === (key === 'free')
                          ? 'bg-noir text-white'
                          : 'border border-noir/15 text-black/55 hover:border-noir/30 hover:text-noir'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {!form.is_free && (
                <div>
                  <label className={labelBase}>Prix (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputBase}
                    value={form.price}
                    placeholder="25"
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className={labelBase}>Capacité maximale</label>
                <input
                  type="number"
                  className={inputBase}
                  value={form.places_max}
                  placeholder="Illimitée"
                  onChange={(e) => set('places_max', e.target.value)}
                />
                <p className="mt-1.5 text-[10px] text-black/35">
                  Laisser vide pour illimité.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-[2px] border border-red-200 bg-red-50/60 px-4 py-3 text-[12px] text-red-600/80">
              {error}
            </p>
          )}

          {/* Actions duplicate bas de page */}
          <div className="flex flex-col-reverse items-stretch gap-2 border-t border-noir/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {existing && onRelance && (
                <button
                  type="button"
                  onClick={onRelance}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-noir/15 px-5 text-[11px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  <RefreshCw size={13} strokeWidth={1.5} />
                  Relancer cet événement
                </button>
              )}
              {existing && onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/50 px-5 text-[11px] font-light uppercase tracking-[0.14em] text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                  Supprimer
                </button>
              ) : (
                <span />
              )}
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-11 items-center rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-11 items-center rounded-full bg-noir px-5 text-[11px] font-medium tracking-[0.04em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
              >
                {saving ? 'Sauvegarde…' : existing ? 'Enregistrer' : 'Publier'}
              </button>
            </div>
          </div>
        </div>

        {/* Colonne latérale — médias & publication */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-[4.5rem] lg:self-start">
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Photos</DashEyebrow>
            <EventGalleryManager
              cover={form.image_url}
              gallery={form.gallery}
              slug={pathSlug}
              onCoverChange={(url) => set('image_url', url)}
              onGalleryChange={(urls) => set('gallery', urls)}
            />
          </section>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Publication</DashEyebrow>
            <div className="flex flex-col gap-3">
              <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer">
                <span>
                  <span className="block text-[12px] font-normal text-noir">Visible en ligne</span>
                  <span className="mt-0.5 block text-[10px] text-black/45">
                    L’événement apparaît sur la page publique /evenements.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-black rounded-[2px]"
                />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer">
                <span>
                  <span className="block text-[12px] font-normal text-noir">Inscriptions ouvertes</span>
                  <span className="mt-0.5 block text-[10px] text-black/45">
                    Les visiteurs peuvent réserver une place.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.registration_open}
                  onChange={(e) => set('registration_open', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-black rounded-[2px]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-1">Pop-up d’accueil</DashEyebrow>
            <p className="mb-4 text-[10px] leading-relaxed text-black/45">
              Affiche un pop-up sur la page d’accueil et /evenements pour mettre en avant cet événement.
              {' '}Optionnel — les champs sont pré-remplis depuis l’événement.
            </p>

            <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer">
              <span>
                <span className="block text-[12px] font-normal text-noir">Afficher un pop-up</span>
                <span className="mt-0.5 block text-[10px] text-black/45">
                  {form.popup_enabled
                    ? form.popup_id
                      ? 'Pop-up lié à cet événement.'
                      : 'Un pop-up sera créé au moment de l’enregistrement.'
                    : form.popup_id
                      ? 'Le pop-up sera supprimé à l’enregistrement.'
                      : 'Aucun pop-up n’est rattaché pour l’instant.'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.popup_enabled}
                onChange={(e) => {
                  if (e.target.checked) enablePopup();
                  else set('popup_enabled', false);
                }}
                disabled={!popupLoaded}
                className="mt-0.5 h-4 w-4 accent-black rounded-[2px]"
              />
            </label>

            {form.popup_enabled && (
              <div className="mt-4 flex flex-col gap-3 rounded-[2px] border border-noir/[0.06] bg-surface-muted/60 p-4">
                <label className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-[11px] font-normal text-noir">Actif en ligne</span>
                    <span className="mt-0.5 block text-[10px] text-black/45">
                      Décocher pour préparer le pop-up sans le publier.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.popup_active}
                    onChange={(e) => set('popup_active', e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-black rounded-[2px]"
                  />
                </label>

                <div>
                  <label className={labelBase}>Titre</label>
                  <input
                    className={inputBase}
                    value={form.popup_title}
                    placeholder={form.title || 'Titre du pop-up'}
                    onChange={(e) => set('popup_title', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelBase}>Accroche (kicker)</label>
                  <input
                    className={inputBase}
                    value={form.popup_subtitle}
                    placeholder={TYPE_LABELS[form.type]}
                    onChange={(e) => set('popup_subtitle', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelBase}>Message (optionnel)</label>
                  <textarea
                    className={`${inputBase} min-h-[72px] resize-y`}
                    value={form.popup_message}
                    placeholder={form.description || 'Une phrase courte — 1 à 2 lignes.'}
                    onChange={(e) => set('popup_message', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelBase}>Libellé bouton</label>
                  <input
                    className={inputBase}
                    value={form.popup_cta_label}
                    placeholder="S’inscrire"
                    onChange={(e) => set('popup_cta_label', e.target.value)}
                  />
                </div>

                <div className="rounded-[2px] border border-noir/[0.05] bg-white px-3 py-2.5 text-[10px] leading-relaxed text-black/55">
                  <p>
                    <span className="text-black/35">Lien : </span>
                    <span className="text-black/70">/evenements/{pathSlug}</span>
                  </p>
                  {form.date && (
                    <p className="mt-1">
                      <span className="text-black/35">Expire après : </span>
                      <span className="text-black/70">{formatLongDate(form.date)}</span>
                    </p>
                  )}
                  <p className="mt-1">
                    <span className="text-black/35">Image : </span>
                    <span className="text-black/70">
                      {form.image_url ? 'Couverture de l’événement' : 'Aucune (ajoutez une couverture)'}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetPopupFromEvent}
                  className="self-start text-[10px] font-light uppercase tracking-[0.14em] text-black/45 hover:text-noir border-b border-noir/20 pb-px transition-colors"
                >
                  Réinitialiser depuis l’événement
                </button>
              </div>
            )}
          </section>

          {existing && (
            <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
              <DashEyebrow className="mb-3">Statistiques</DashEyebrow>
              <div className="flex items-baseline justify-between">
                <div>
                  <div
                    className="font-display leading-none"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}
                  >
                    {count}
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-black/45">
                    Inscrit{count > 1 ? 's' : ''}
                  </p>
                </div>
                {form.places_max && (
                  <p className="text-[10px] text-black/45">
                    / {form.places_max} places
                  </p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </motion.div>
  );
};

// ─── Liste des inscrits ─────────────────────────────────────────────────────
const EMPTY_ADD_FORM: NewRegistrantData = {
  prenom: '',
  nom: '',
  telephone: '',
  nb_personnes: 'Je viens seul',
  souhait_info: 'Ajout manuel',
};

const NB_OPTIONS = ['Je viens seul', 'Nous sommes 2', 'Nous sommes 3', 'Nous sommes 4', 'Nous sommes 5+'];

const RegistrantsList = ({ eventId }: { eventId: string }) => {
  const { registrations, loading, updateRegistrant, deleteRegistrant, addRegistrant } = useAdminEventRegistrations(eventId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NewRegistrantData>(EMPTY_ADD_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<NewRegistrantData>(EMPTY_ADD_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const startEdit = (r: typeof registrations[number]) => {
    setEditingId(r.id);
    setEditForm({ prenom: r.prenom, nom: r.nom, telephone: r.telephone, nb_personnes: r.nb_personnes, souhait_info: r.souhait_info });
    setConfirmDeleteId(null);
  };

  const handleSave = async (id: string) => {
    if (!editForm.prenom.trim() || !editForm.nom.trim()) return;
    setSaving(true);
    try {
      await updateRegistrant(id, { prenom: editForm.prenom.trim(), nom: editForm.nom.trim(), telephone: editForm.telephone, nb_personnes: editForm.nb_personnes });
      setEditingId(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try { await deleteRegistrant(id); } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleAdd = async () => {
    if (!addForm.prenom.trim() || !addForm.nom.trim()) {
      setAddError('Prénom et nom sont requis.');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await addRegistrant({ ...addForm, prenom: addForm.prenom.trim(), nom: addForm.nom.trim() });
      setAddForm(EMPTY_ADD_FORM);
      setShowAddForm(false);
    } catch {
      setAddError('Erreur lors de l\u2019ajout.');
    } finally {
      setAdding(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Prénom', 'Nom', 'Téléphone', 'Nb personnes', 'Info souhaitée', 'Date inscription'],
      ...registrations.map((r) => [
        r.prenom,
        r.nom,
        r.telephone,
        r.nb_personnes,
        r.souhait_info,
        new Date(r.created_at).toLocaleDateString('fr-FR'),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `inscrits-${eventId}.csv`;
    a.click();
  };

  if (loading) return <p className="text-[11px] text-black/30 px-5 py-4">Chargement…</p>;

  return (
    <div className="border-t border-noir/[0.05] bg-surface-muted/40">
      <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-3">
        <p className="text-[10px] font-normal text-black/50">{registrations.length} inscrit(s)</p>
        <div className="flex items-center gap-3">
          {registrations.length > 0 && (
            <button type="button" onClick={exportCSV}
              className="inline-flex min-h-[44px] items-center text-[9px] font-light uppercase tracking-[0.14em] text-black/45 hover:text-black border-b border-noir/20 pb-px transition-colors"
            >
              Exporter CSV
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowAddForm((v) => !v); setAddError(null); }}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-noir/15 px-3 text-[9px] font-light uppercase tracking-[0.14em] text-black/50 hover:border-noir/30 hover:text-noir transition-colors"
          >
            <UserPlus size={11} strokeWidth={1.5} />
            Ajouter manuellement
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout manuel */}
      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.div
            key="add-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-4 rounded-[2px] border border-noir/[0.08] bg-white p-4">
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-black/40">Nouvel inscrit</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelBase}>Prénom *</label>
                  <input className={inputBase} value={addForm.prenom}
                    onChange={(e) => setAddForm((f) => ({ ...f, prenom: e.target.value }))}
                    placeholder="Marie" />
                </div>
                <div>
                  <label className={labelBase}>Nom *</label>
                  <input className={inputBase} value={addForm.nom}
                    onChange={(e) => setAddForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Dupont" />
                </div>
                <div>
                  <label className={labelBase}>Téléphone</label>
                  <input className={inputBase} value={addForm.telephone}
                    onChange={(e) => setAddForm((f) => ({ ...f, telephone: e.target.value }))}
                    placeholder="0696…" />
                </div>
                <div>
                  <label className={labelBase}>Groupe</label>
                  <select className={inputBase} value={addForm.nb_personnes}
                    onChange={(e) => setAddForm((f) => ({ ...f, nb_personnes: e.target.value }))}
                  >
                    {NB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {addError && <p className="mt-2 text-[10px] text-red-500">{addError}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={handleAdd} disabled={adding}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-noir px-4 text-[10px] font-medium text-white transition-colors hover:bg-anthracite disabled:opacity-50"
                >
                  {adding ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={1.8} />}
                  Confirmer
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setAddError(null); setAddForm(EMPTY_ADD_FORM); }}
                  className="text-[10px] font-light text-black/45 hover:text-noir transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {registrations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-noir/[0.04]">
                {['Prénom', 'Nom', 'Téléphone', 'Groupe', 'Date', ''].map((h) => (
                  <th key={h} className="px-5 py-2 text-left text-[8px] uppercase tracking-[0.2em] text-black/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const isEditing = editingId === r.id;
                const isConfirmDelete = confirmDeleteId === r.id;
                return (
                  <tr key={r.id} className={`border-b border-noir/[0.03] transition-colors ${isConfirmDelete ? 'bg-red-50/60' : isEditing ? 'bg-ivory-warm/60' : 'hover:bg-noir/[0.015]'}`}>
                    {isEditing ? (
                      <>
                        <td className="px-3 py-2">
                          <input autoFocus className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black focus:border-noir/40 focus:outline-none"
                            value={editForm.prenom} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black focus:border-noir/40 focus:outline-none"
                            value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black/70 focus:border-noir/40 focus:outline-none"
                            value={editForm.telephone} onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <select className="rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black/70 focus:border-noir/40 focus:outline-none"
                            value={editForm.nb_personnes} onChange={(e) => setEditForm((f) => ({ ...f, nb_personnes: e.target.value }))}
                          >
                            {NB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-black/30 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <button type="button" disabled={saving} onClick={() => handleSave(r.id)}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-noir px-3 text-[9px] font-medium text-white hover:bg-anthracite disabled:opacity-50"
                            >
                              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} strokeWidth={2} />}
                              OK
                            </button>
                            <button type="button" onClick={() => setEditingId(null)}
                              className="inline-flex min-h-[44px] items-center rounded-full border border-noir/15 px-3 text-[9px] text-black/45 hover:text-noir"
                            >
                              Annuler
                            </button>
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 text-[11px] text-black">{r.prenom}</td>
                        <td className="px-5 py-3 text-[11px] text-black">{r.nom}</td>
                        <td className="px-5 py-3 text-[11px] text-black/60">{r.telephone}</td>
                        <td className="px-5 py-3 text-[11px] text-black/60">{r.nb_personnes}</td>
                        <td className="px-5 py-3 text-[10px] text-black/35 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isConfirmDelete ? (
                            <span className="inline-flex items-center gap-1.5">
                              <button type="button" disabled={deleting} onClick={() => handleDelete(r.id)}
                                className="inline-flex min-h-[44px] items-center rounded-full bg-red-500 px-3 text-[9px] font-medium text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {deleting ? '…' : 'Confirmer'}
                              </button>
                              <button type="button" onClick={() => setConfirmDeleteId(null)}
                                className="inline-flex min-h-[44px] items-center rounded-full border border-noir/15 px-3 text-[9px] text-black/45 hover:text-noir"
                              >
                                Non
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <button type="button" onClick={() => startEdit(r)}
                                className="flex h-11 w-11 items-center justify-center text-black/25 hover:text-noir transition-colors"
                                aria-label="Modifier cet inscrit"
                              >
                                <Pencil size={12} strokeWidth={1.5} />
                              </button>
                              <button type="button" onClick={() => setConfirmDeleteId(r.id)}
                                className="flex h-11 w-11 items-center justify-center text-black/20 hover:text-red-400 transition-colors"
                                aria-label="Supprimer cet inscrit"
                              >
                                <Trash2 size={12} strokeWidth={1.5} />
                              </button>
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Carte événement (listing) ──────────────────────────────────────────────
type EventCardProps = {
  ev: EventWithCount;
  expanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRegistrations: () => void;
  onRelance: () => void;
};

const EventCard = ({
  ev,
  expanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleRegistrations,
  onRelance,
}: EventCardProps) => {
  const count = Number(ev.event_registrations?.[0]?.count ?? 0);
  const spots = ev.places_max ? ev.places_max - count : null;
  const cover = ev.image_url;
  const galleryCount = Array.isArray(ev.gallery) ? ev.gallery.length : 0;
  const totalPhotos = (cover ? 1 : 0) + galleryCount;

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="block overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white transition-colors hover:border-noir/20">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5">
        {/* Vignette cover */}
        <button
          type="button"
          onClick={onEdit}
          className="group relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[2px] bg-surface-muted sm:aspect-[4/3] sm:w-[180px] md:w-[220px]"
          aria-label={`Modifier ${ev.title}`}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-anthracite/60 to-noir text-white/40">
              <CalendarDays size={28} strokeWidth={1} />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-noir/70 px-2 py-0.5 text-[8px] font-light uppercase tracking-[0.22em] text-white backdrop-blur-[2px]">
            {TYPE_LABELS[ev.type]}
          </span>
          {totalPhotos > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-light text-black/70 backdrop-blur-[2px]">
              +{totalPhotos - 1} photos
            </span>
          )}
        </button>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="text-left text-[15px] font-normal leading-tight text-noir transition-colors hover:text-anthracite"
              >
                {ev.title}
              </button>
              {!ev.active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-noir/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-black/45">
                  <EyeOff size={10} strokeWidth={1.6} />
                  Masqué
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-light text-black/50">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={11} strokeWidth={1.6} />
                {formatLongDate(ev.date)}
                {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
              </span>
              {ev.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} strokeWidth={1.6} />
                  {ev.location}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleRegistrations}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-[10px] font-light uppercase tracking-[0.12em] transition-colors ${
                ev.registration_open
                  ? 'bg-gold-dim/10 text-gold-dim hover:bg-gold-dim/15'
                  : 'bg-noir/5 text-black/45 hover:bg-noir/10'
              }`}
            >
              {ev.registration_open ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
            </button>
            {spots !== null && (
              <span className="text-[10px] font-light text-black/45">
                {spots > 0 ? `${spots} places restantes` : 'Complet'}
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-[11px]">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-noir/15 px-4 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
            >
              <Users size={12} strokeWidth={1.5} /> {count} inscrit{count > 1 ? 's' : ''}
              {expanded ? <ChevronUp size={12} strokeWidth={1.5} /> : <ChevronDown size={12} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-light text-black/55 transition-colors hover:text-noir border-b border-noir/20 pb-px"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={onRelance}
              className="inline-flex items-center gap-1 text-[11px] font-light text-black/40 transition-colors hover:text-noir"
              title="Relancer cet événement avec une nouvelle date"
            >
              <RefreshCw size={11} strokeWidth={1.5} />
              Relancer
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-light text-red-400 transition-colors hover:text-red-600"
              aria-label="Supprimer"
            >
              <X size={13} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="registrants"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <RegistrantsList eventId={ev.id} />
          </motion.div>
        )}
      </AnimatePresence>
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu
          aria-label={`Actions pour ${ev.title}`}
          onAction={(key) => {
            if (key === 'edit') onEdit();
            else if (key === 'relance') onRelance();
            else if (key === 'delete') onDelete();
          }}
        >
          <ContextMenu.Item id="edit" textValue="Modifier">
            <Pencil size={13} strokeWidth={1.6} aria-hidden />
            Modifier
          </ContextMenu.Item>
          <ContextMenu.Item id="relance" textValue="Relancer">
            <RefreshCw size={13} strokeWidth={1.6} aria-hidden />
            Relancer
          </ContextMenu.Item>
          <ContextMenu.Item id="delete" textValue="Supprimer" className="text-red-600">
            <Trash2 size={13} strokeWidth={1.6} aria-hidden />
            Supprimer
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
};

// ─── Page admin ─────────────────────────────────────────────────────────────
const DEFAULT_EV_FILTERS = {
  search: '',
  type: 'all' as 'all' | Event['type'],
  visibility: 'all' as 'all' | 'active' | 'inactive',
};

type ViewMode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string };

const AdminEvenements = () => {
  useEffect(() => { document.title = 'Événements — Admin PessÓra'; }, []);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>({ kind: 'list' });
  const [relanceInitial, setRelanceInitial] = useState<Partial<FormState> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = usePersistentAdminState('admin_events_filters_v1', DEFAULT_EV_FILTERS);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);

  const closeDeleteDialog = useCallback(() => setDeleteEventId(null), []);

  const goToList = useCallback(() => {
    setRelanceInitial(null);
    setView({ kind: 'list' });
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    setFetchError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*, event_registrations(count)')
      .order('date', { ascending: true })
      .then(({ data, error }: { data: EventWithCount[] | null; error: { message: string } | null }) => {
        setLoading(false);
        if (error) {
          setFetchError(formatSupabaseDataError(error.message, 'events'));
          setEvents([]);
          return;
        }
        // Normalize: ensure `gallery` is always a string[]
        const normalized = (data ?? []).map((ev) => ({
          ...ev,
          gallery: Array.isArray(ev.gallery) ? ev.gallery : [],
        })) as EventWithCount[];
        setEvents(normalized);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        (ev.slug?.toLowerCase().includes(q) ?? false) ||
        (ev.location?.toLowerCase().includes(q) ?? false);
      const matchType = filters.type === 'all' || ev.type === filters.type;
      const matchVis =
        filters.visibility === 'all' ||
        (filters.visibility === 'active' && ev.active) ||
        (filters.visibility === 'inactive' && !ev.active);
      return matchSearch && matchType && matchVis;
    });
  }, [events, filters]);

  const stats = useMemo(() => {
    const totalRegistrations = events.reduce(
      (acc, ev) => acc + Number(ev.event_registrations?.[0]?.count ?? 0),
      0,
    );
    const publishedCount = events.filter((e) => e.active).length;
    const upcoming = events.filter((e) => new Date(e.date + 'T00:00:00') >= new Date()).length;
    return { totalRegistrations, publishedCount, upcoming };
  }, [events]);

  const editingEvent = useMemo(() => {
    if (view.kind !== 'edit') return null;
    return events.find((e) => e.id === view.id) ?? null;
  }, [view, events]);

  const exportEventsCsv = () => {
    downloadCsv(
      `pessora-evenements-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Titre', 'Type', 'Date', 'Heure', 'Lieu', 'Actif', 'Inscriptions ouvertes', 'Slug', 'Nb inscrits', 'Nb photos'],
      filteredEvents.map((ev) => {
        const c = Number(ev.event_registrations?.[0]?.count ?? 0);
        const photos = (ev.image_url ? 1 : 0) + (Array.isArray(ev.gallery) ? ev.gallery.length : 0);
        return [
          ev.title,
          TYPE_LABELS[ev.type] ?? ev.type,
          ev.date,
          ev.heure ?? '',
          ev.location ?? '',
          ev.active ? 'oui' : 'non',
          ev.registration_open ? 'oui' : 'non',
          ev.slug,
          c,
          photos,
        ];
      }),
    );
  };

  const persistEvent = async (form: FormState, id?: string) => {
    const payload = {
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      gallery: form.gallery ?? [],
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    if (id) {
      const { error } = await db.from('events').update(payload).eq('id', id);
      if (error) throw new Error(formatMutationError(error.message));
    } else {
      const { error } = await db.from('events').insert(payload);
      if (error) throw new Error(formatMutationError(error.message));
    }

    try {
      await syncEventPopup({
        popupId: form.popup_id,
        enabled: form.popup_enabled,
        active: form.popup_active,
        slug: form.slug,
        eventDate: form.date,
        imageUrl: form.image_url || null,
        title: (form.popup_title || form.title).trim(),
        subtitle: (form.popup_subtitle || '').trim() || null,
        message: (form.popup_message || '').trim() || null,
        ctaLabel: (form.popup_cta_label || "S'inscrire").trim(),
      });
    } catch (e) {
      throw new Error(
        e instanceof Error
          ? `Événement sauvegardé, mais erreur pop-up : ${formatMutationError(e.message)}`
          : 'Événement sauvegardé, mais erreur pop-up.',
      );
    }
  };

  const handleCreate = async (form: FormState) => {
    await persistEvent(form);
    goToList();
    fetchEvents();
  };

  const handleUpdate = async (form: FormState) => {
    if (view.kind !== 'edit') return;
    await persistEvent(form, view.id);
    goToList();
    fetchEvents();
  };

  const handleRelance = useCallback((ev: EventWithCount) => {
    setRelanceInitial({
      title: ev.title,
      slug: '',
      type: ev.type,
      date: '',
      heure: ev.heure ?? '',
      location: ev.location ?? '',
      meeting_point: ev.meeting_point ?? '',
      description: ev.description ?? '',
      places_max: ev.places_max ? String(ev.places_max) : '',
      image_url: ev.image_url ?? '',
      gallery: Array.isArray(ev.gallery) ? ev.gallery : [],
      price: ev.price ? String(ev.price) : '',
      is_free: ev.is_free,
      registration_open: true,
      active: false,
      popup_enabled: false,
      popup_id: null,
    });
    setView({ kind: 'create' });
  }, []);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteEventId) return;
    setDeleteEventLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('events').delete().eq('id', deleteEventId);
      setExpandedId((prev) => (prev === deleteEventId ? null : prev));
      if (view.kind === 'edit' && view.id === deleteEventId) {
        goToList();
      }
      fetchEvents();
      setDeleteEventId(null);
    } finally {
      setDeleteEventLoading(false);
    }
  }, [deleteEventId, view]);

  const toggleRegistrationOpen = async (ev: EventWithCount) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('events')
      .update({ registration_open: !ev.registration_open })
      .eq('id', ev.id);
    fetchEvents();
  };

  // ─── Mode Édition ──────────────────────────────────────────────────────────
  if (view.kind !== 'list') {
    const initial: Partial<FormState> | undefined = editingEvent
      ? {
          title: editingEvent.title,
          slug: editingEvent.slug,
          type: editingEvent.type,
          date: editingEvent.date,
          heure: editingEvent.heure ?? '',
          location: editingEvent.location ?? '',
          meeting_point: editingEvent.meeting_point ?? '',
          description: editingEvent.description ?? '',
          places_max: editingEvent.places_max ? String(editingEvent.places_max) : '',
          image_url: editingEvent.image_url ?? '',
          gallery: Array.isArray(editingEvent.gallery) ? editingEvent.gallery : [],
          price: editingEvent.price ? String(editingEvent.price) : '',
          is_free: editingEvent.is_free,
          registration_open: editingEvent.registration_open,
          active: editingEvent.active,
        }
      : (relanceInitial ?? undefined);

    return (
      <div>
        <div className={DASH_MAIN_PAD}>
          <AnimatePresence mode="wait">
            <EventEditor
              key={view.kind === 'edit' ? view.id : 'new'}
              initial={initial}
              existing={editingEvent}
              relanceFrom={relanceInitial ? (relanceInitial.title ?? undefined) : undefined}
              onSave={view.kind === 'edit' ? handleUpdate : handleCreate}
              onCancel={goToList}
              onDelete={editingEvent ? () => setDeleteEventId(editingEvent.id) : undefined}
              onRelance={editingEvent ? () => handleRelance(editingEvent) : undefined}
            />
          </AnimatePresence>
        </div>

        <ConfirmDialog
          open={deleteEventId !== null}
          title="Supprimer cet événement ?"
          description="Les inscriptions associées peuvent être impactées selon la base. Cette action est définitive."
          loading={deleteEventLoading}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteEvent}
        />
      </div>
    );
  }

  // ─── Mode Liste ────────────────────────────────────────────────────────────
  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Événements"
        subtitle="Pop-ups, ateliers, partenariats — créer, éditer, gérer les inscriptions et les photos."
        action={
          <button type="button"
            onClick={() => setView({ kind: 'create' })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir text-white px-4 text-[13px] font-medium hover:bg-anthracite transition-colors"
          >
            <Plus size={14} /> Nouvel événement
          </button>
        }
      />

      <div className={DASH_MAIN_PAD}>
        {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchEvents} />}

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Événements publiés', value: stats.publishedCount },
            { label: 'À venir', value: stats.upcoming },
            { label: 'Inscrits au total', value: stats.totalRegistrations },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[2px] border border-noir/[0.06] bg-white p-4 sm:p-5"
            >
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/40">
                {kpi.label}
              </p>
              <p
                className="mt-2 font-display leading-none text-noir"
                style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="mb-6 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <DashEyebrow className="mb-2">Recherche & filtres</DashEyebrow>
              <p className="text-[11px] text-black/40">
                Vos filtres sont mémorisés sur cet appareil et votre compte.
              </p>
            </div>
            {!loading && filteredEvents.length > 0 && (
              <button
                type="button"
                onClick={exportEventsCsv}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
              >
                <Download size={14} strokeWidth={1.5} aria-hidden />
                Exporter CSV ({filteredEvents.length})
              </button>
            )}
          </div>
          <input
            type="search"
            placeholder="Rechercher (titre, lieu, slug)…"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-11 w-full max-w-md rounded-[2px] border border-noir/[0.09] bg-white px-4 text-[12px] focus-visible:outline-none focus-visible:border-noir/35 focus-visible:ring-2 focus-visible:ring-noir/10"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
              Type
            </span>
            <Segment
              size="sm"
              selectedKey={filters.type}
              onSelectionChange={(k) =>
                setFilters({ type: ((k as (typeof DEFAULT_EV_FILTERS)['type']) ?? 'all') })
              }
              aria-label="Filtrer par type d'événement"
            >
              {(['all', ...TYPE_OPTIONS] as const).map((t) => (
                <Segment.Item key={t} id={t}>
                  <Segment.Separator />
                  {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
                </Segment.Item>
              ))}
            </Segment>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
              Statut
            </span>
            <Segment
              size="sm"
              selectedKey={filters.visibility}
              onSelectionChange={(k) =>
                setFilters({
                  visibility: ((k as (typeof DEFAULT_EV_FILTERS)['visibility']) ?? 'all'),
                })
              }
              aria-label="Filtrer par statut de publication"
            >
              {(
                [
                  ['all', 'Tous', null],
                  ['active', 'Publiés', Eye],
                  ['inactive', 'Masqués', EyeOff],
                ] as const
              ).map(([key, label, Icon]) => (
                <Segment.Item key={key} id={key}>
                  <Segment.Separator />
                  <span className="inline-flex items-center gap-1.5">
                    {Icon && <Icon size={12} strokeWidth={1.6} />}
                    {label}
                  </span>
                </Segment.Item>
              ))}
            </Segment>
          </div>
        </div>

        {loading ? (
          <p className="text-[11px] text-black/30">Chargement…</p>
        ) : filteredEvents.length === 0 ? (
          <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
            <EmptyState.Header>
              <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                {events.length === 0
                  ? 'Aucun événement pour le moment'
                  : 'Aucun événement ne correspond'}
              </EmptyState.Title>
              <EmptyState.Description className="text-[12px] font-light text-black/45">
                {events.length === 0
                  ? 'Crée ton premier événement pour l’afficher sur la page publique.'
                  : 'Ajuste la recherche ou réinitialise les filtres.'}
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              {events.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setView({ kind: 'create' })}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-noir px-4 text-[13px] font-medium text-white transition-colors hover:bg-anthracite"
                >
                  <Plus size={14} /> Créer le premier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_EV_FILTERS)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEvents.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                expanded={expandedId === ev.id}
                onToggleExpanded={() => setExpandedId((prev) => (prev === ev.id ? null : ev.id))}
                onEdit={() => setView({ kind: 'edit', id: ev.id })}
                onDelete={() => setDeleteEventId(ev.id)}
                onToggleRegistrations={() => toggleRegistrationOpen(ev)}
                onRelance={() => handleRelance(ev)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteEventId !== null}
        title="Supprimer cet événement ?"
        description="Les inscriptions associées peuvent être impactées selon la base. Cette action est définitive."
        loading={deleteEventLoading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
};

export default AdminEvenements;
