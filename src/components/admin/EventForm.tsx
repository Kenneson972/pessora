import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { DashEyebrow } from '../../components/dashboard/primitives';
import { EventGalleryManager } from './EventGalleryManager';
import { fetchPopupForEventSlug } from '../../lib/eventPopup';
import { formatMutationError } from '../../lib/userFacingError';
import type { EventWithCount, FormState } from './eventEditorTypes';
import { EMPTY_FORM, TYPE_OPTIONS, TYPE_LABELS, slugify, formatLongDate, inputBase, labelBase } from './eventEditorTypes';

// ─── Éditeur pleine page ─────────────────────────────────────────────────────
export type EditorProps = {
  initial?: Partial<FormState>;
  existing?: EventWithCount | null;
  relanceFrom?: string;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  onRelance?: () => void;
};

export const EventForm = ({ initial, existing, relanceFrom, onSave, onCancel, onDelete, onRelance }: EditorProps) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupLoaded, setPopupLoaded] = useState(!existing);
  const prefersReducedMotion = useReducedMotion();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!existing?.slug) { setPopupLoaded(true); return; }
    let cancelled = false;
    fetchPopupForEventSlug(existing.slug).then((p) => {
      if (cancelled) return;
      if (p) {
        setForm((f) => ({ ...f, popup_id: p.id, popup_enabled: true, popup_active: p.active, popup_title: p.title, popup_subtitle: p.subtitle ?? '', popup_message: p.message ?? '', popup_cta_label: p.cta_label ?? "S'inscrire" }));
      }
      setPopupLoaded(true);
    });
    return () => { cancelled = true; };
  }, [existing?.slug]);

  const enablePopup = () => {
    setForm((f) => ({ ...f, popup_enabled: true, popup_title: f.popup_title || f.title, popup_subtitle: f.popup_subtitle || TYPE_LABELS[f.type], popup_message: f.popup_message || f.description || '', popup_cta_label: f.popup_cta_label || "S'inscrire" }));
  };

  const resetPopupFromEvent = () => {
    setForm((f) => ({ ...f, popup_title: f.title, popup_subtitle: TYPE_LABELS[f.type], popup_message: f.description || '', popup_cta_label: "S'inscrire" }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est requis.'); return; }
    if (!form.date) { setError('La date est requise.'); return; }
    setSaving(true); setError(null);
    try {
      await onSave({ ...form, title: form.title.trim(), slug: (form.slug || slugify(form.title)).trim() });
    } catch (e) {
      setError(e instanceof Error ? formatMutationError(e.message) : 'Une erreur est survenue.');
    } finally { setSaving(false); }
  };

  const pathSlug = form.slug || slugify(form.title) || 'event';
  const count = Number(existing?.event_registrations?.[0]?.count ?? 0);

  return (
    <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-noir/[0.06] bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-[11px] font-light text-black/55 transition-colors hover:text-noir"><ArrowLeft size={14} strokeWidth={1.5} />Retour à la liste</button>
          <div className="flex items-center gap-2">
            {existing && (<a href={`/evenements/${existing.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-noir/15 px-3 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"><ExternalLink size={12} strokeWidth={1.5} />Voir la page</a>)}
            <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir">Annuler</button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex h-11 items-center rounded-full bg-noir px-5 text-[11px] font-medium tracking-[0.04em] text-white transition-colors hover:bg-anthracite disabled:opacity-50">{saving ? 'Sauvegarde…' : existing ? 'Enregistrer' : 'Publier'}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,420px)] lg:gap-10">
        <div className="flex flex-col gap-8">
          {relanceFrom && (<div className="mb-4 flex items-center gap-2 rounded-[2px] border border-gold/20 bg-gold/[0.06] px-4 py-3"><RefreshCw size={12} strokeWidth={1.5} className="shrink-0 text-gold-dim" /><p className="text-[11px] font-light text-black/60">Relancé depuis <span className="font-normal text-black/80">«&nbsp;{relanceFrom}&nbsp;»</span> — choisissez une nouvelle date et ajustez le slug.</p></div>)}
          <header className="pb-2">
            <DashEyebrow className="mb-2">{existing ? "Modifier l'événement" : relanceFrom ? "Relancer l'événement" : 'Nouvel événement'}</DashEyebrow>
            <h2 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] leading-[1.05] tracking-[-0.02em] text-noir" style={{ fontFamily: 'var(--font-display)' }}>{form.title || (existing ? existing.title : 'Sans titre')}</h2>
            {form.slug && (<p className="mt-2 text-[11px] font-light text-black/40"><span className="text-black/30">pessora.fr/evenements/</span><span className="text-black/60">{form.slug}</span></p>)}
          </header>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Identité</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><label className={labelBase}>Titre *</label><input className={inputBase} value={form.title} placeholder="Ex. Pop-up Carbet — Fort-de-France" onChange={(e) => { set('title', e.target.value); set('slug', slugify(e.target.value)); }} /></div>
              <div className="md:col-span-2"><label className={labelBase}>URL (slug)</label><input className={inputBase} value={form.slug} placeholder={slugify(form.title) || 'pop-up-carbet'} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
              <div className="md:col-span-2"><label className={labelBase}>Type</label><div className="flex flex-wrap gap-1.5">{TYPE_OPTIONS.map((t) => (<button key={t} type="button" onClick={() => set('type', t)} className={`h-11 rounded-full px-4 text-[10px] font-light tracking-[0.08em] transition-colors ${form.type === t ? 'bg-noir text-white' : 'border border-noir/15 text-black/55 hover:border-noir/30 hover:text-noir'}`}>{TYPE_LABELS[t]}</button>))}</div></div>
            </div>
          </section>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Date & lieu</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className={labelBase}>Date *</label><input type="date" className={inputBase} value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
              <div><label className={labelBase}>Heure</label><input type="time" className={inputBase} value={form.heure} onChange={(e) => set('heure', e.target.value)} /></div>
              <div><label className={labelBase}>Lieu</label><input className={inputBase} value={form.location} placeholder="Fort-de-France" onChange={(e) => set('location', e.target.value)} /></div>
              <div><label className={labelBase}>Point de rendez-vous</label><input className={inputBase} value={form.meeting_point} placeholder="Devant l'entrée principale" onChange={(e) => set('meeting_point', e.target.value)} /></div>
            </div>
          </section>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Description</DashEyebrow>
            <textarea className={`${inputBase} min-h-[180px] resize-y leading-relaxed`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Racontez cet événement — l'intention, le déroulé, ce qui est inclus, ce qu'il faut apporter." />
            <p className="mt-2 text-[10px] text-black/35">{form.description.length} caractères · affiché sur la page publique.</p>
          </section>

          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Tarif & capacité</DashEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className={labelBase}>Accès</label><div className="flex flex-wrap gap-1.5">{[['free', 'Entrée libre'], ['paid', 'Payant']].map(([key, label]) => (<button key={key} type="button" onClick={() => set('is_free', key === 'free')} className={`h-11 rounded-full px-4 text-[10px] font-light tracking-[0.08em] transition-colors ${form.is_free === (key === 'free') ? 'bg-noir text-white' : 'border border-noir/15 text-black/55 hover:border-noir/30 hover:text-noir'}`}>{label}</button>))}</div></div>
              {!form.is_free && (<div><label className={labelBase}>Prix (€)</label><input type="number" step="0.01" className={inputBase} value={form.price} placeholder="25" onChange={(e) => set('price', e.target.value)} /></div>)}
              <div><label className={labelBase}>Capacité maximale</label><input type="number" className={inputBase} value={form.places_max} placeholder="Illimitée" onChange={(e) => set('places_max', e.target.value)} /><p className="mt-1.5 text-[10px] text-black/35">Laisser vide pour illimité.</p></div>
            </div>
          </section>

          {error && (<p className="rounded-[2px] border border-red-200 bg-red-50/60 px-4 py-3 text-[12px] text-red-600/80">{error}</p>)}

          <div className="flex flex-col-reverse items-stretch gap-2 border-t border-noir/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {existing && onRelance && (<button type="button" onClick={onRelance} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-noir/15 px-5 text-[11px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"><RefreshCw size={13} strokeWidth={1.5} />Relancer cet événement</button>)}
              {existing && onDelete ? (<button type="button" onClick={onDelete} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/50 px-5 text-[11px] font-light uppercase tracking-[0.14em] text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={13} strokeWidth={1.5} />Supprimer</button>) : (<span />)}
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir">Annuler</button>
              <button type="button" onClick={handleSave} disabled={saving} className="inline-flex h-11 items-center rounded-full bg-noir px-5 text-[11px] font-medium tracking-[0.04em] text-white transition-colors hover:bg-anthracite disabled:opacity-50">{saving ? 'Sauvegarde…' : existing ? 'Enregistrer' : 'Publier'}</button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-[4.5rem] lg:self-start">
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6"><DashEyebrow className="mb-4">Photos</DashEyebrow><EventGalleryManager cover={form.image_url} gallery={form.gallery} slug={pathSlug} onCoverChange={(url) => set('image_url', url)} onGalleryChange={(urls) => set('gallery', urls)} /></section>
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-4">Publication</DashEyebrow>
            <div className="flex flex-col gap-3">
              <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer"><span><span className="block text-[12px] font-normal text-noir">Visible en ligne</span><span className="mt-0.5 block text-[10px] text-black/45">L'événement apparaît sur la page publique /evenements.</span></span><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="mt-0.5 h-4 w-4 accent-black rounded-[2px]" /></label>
              <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer"><span><span className="block text-[12px] font-normal text-noir">Inscriptions ouvertes</span><span className="mt-0.5 block text-[10px] text-black/45">Les visiteurs peuvent réserver une place.</span></span><input type="checkbox" checked={form.registration_open} onChange={(e) => set('registration_open', e.target.checked)} className="mt-0.5 h-4 w-4 accent-black rounded-[2px]" /></label>
            </div>
          </section>
          <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
            <DashEyebrow className="mb-1">Pop-up d'accueil</DashEyebrow>
            <p className="mb-4 text-[10px] leading-relaxed text-black/45">Affiche un pop-up sur la page d'accueil et /evenements pour mettre en avant cet événement. Optionnel — les champs sont pré-remplis depuis l'événement.</p>
            <label className="flex items-start justify-between gap-4 rounded-[2px] border border-noir/[0.06] bg-surface-muted px-3.5 py-3 cursor-pointer"><span><span className="block text-[12px] font-normal text-noir">Afficher un pop-up</span><span className="mt-0.5 block text-[10px] text-black/45">{form.popup_enabled ? form.popup_id ? 'Pop-up lié à cet événement.' : 'Un pop-up sera créé au moment de l\'enregistrement.' : form.popup_id ? 'Le pop-up sera supprimé à l\'enregistrement.' : 'Aucun pop-up n\'est rattaché pour l\'instant.'}</span></span><input type="checkbox" checked={form.popup_enabled} onChange={(e) => { if (e.target.checked) enablePopup(); else set('popup_enabled', false); }} disabled={!popupLoaded} className="mt-0.5 h-4 w-4 accent-black rounded-[2px]" /></label>
            {form.popup_enabled && (
              <div className="mt-4 flex flex-col gap-3 rounded-[2px] border border-noir/[0.06] bg-surface-muted/60 p-4">
                <label className="flex items-start justify-between gap-3"><span><span className="block text-[11px] font-normal text-noir">Actif en ligne</span><span className="mt-0.5 block text-[10px] text-black/45">Décocher pour préparer le pop-up sans le publier.</span></span><input type="checkbox" checked={form.popup_active} onChange={(e) => set('popup_active', e.target.checked)} className="mt-0.5 h-4 w-4 accent-black rounded-[2px]" /></label>
                <div><label className={labelBase}>Titre</label><input className={inputBase} value={form.popup_title} placeholder={form.title || 'Titre du pop-up'} onChange={(e) => set('popup_title', e.target.value)} /></div>
                <div><label className={labelBase}>Accroche (kicker)</label><input className={inputBase} value={form.popup_subtitle} placeholder={TYPE_LABELS[form.type]} onChange={(e) => set('popup_subtitle', e.target.value)} /></div>
                <div><label className={labelBase}>Message (optionnel)</label><textarea className={`${inputBase} min-h-[72px] resize-y`} value={form.popup_message} placeholder={form.description || 'Une phrase courte — 1 à 2 lignes.'} onChange={(e) => set('popup_message', e.target.value)} /></div>
                <div><label className={labelBase}>Libellé bouton</label><input className={inputBase} value={form.popup_cta_label} placeholder="S'inscrire" onChange={(e) => set('popup_cta_label', e.target.value)} /></div>
                <div className="rounded-[2px] border border-noir/[0.05] bg-white px-3 py-2.5 text-[10px] leading-relaxed text-black/55"><p><span className="text-black/35">Lien : </span><span className="text-black/70">/evenements/{pathSlug}</span></p>{form.date && (<p className="mt-1"><span className="text-black/35">Expire après : </span><span className="text-black/70">{formatLongDate(form.date)}</span></p>)}<p className="mt-1"><span className="text-black/35">Image : </span><span className="text-black/70">{form.image_url ? 'Couverture de l\'événement' : 'Aucune (ajoutez une couverture)'}</span></p></div>
                <button type="button" onClick={resetPopupFromEvent} className="self-start text-[10px] font-light uppercase tracking-[0.14em] text-black/45 hover:text-noir border-b border-noir/20 pb-px transition-colors">Réinitialiser depuis l'événement</button>
              </div>
            )}
          </section>
          {existing && (<section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6"><DashEyebrow className="mb-3">Statistiques</DashEyebrow><div className="flex items-baseline justify-between"><div><div className="font-display leading-none" style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{count}</div><p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-black/45">Inscrit{count > 1 ? 's' : ''}</p></div>{form.places_max && (<p className="text-[10px] text-black/45">/ {form.places_max} places</p>)}</div></section>)}
        </aside>
      </div>
    </motion.div>
  );
};
