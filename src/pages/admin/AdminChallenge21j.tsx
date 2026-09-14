import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Plus, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { labelBase, inputBase, formatLongDate } from '../../components/admin/eventEditorTypes';
import { useAdminChallenges, type ChallengeFormData } from '../../hooks/useAdminChallenges';
import { useAdminChallengeSlots } from '../../hooks/useAdminChallengeSlots';
import { useAdminChallengeRegistrants } from '../../hooks/useAdminChallengeRegistrants';
import { uploadPublicImage } from '../../lib/storageUpload';
import { formatMutationError } from '../../lib/userFacingError';

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function subtractDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY_FORM: ChallengeFormData = { title: '', date: '', active: true, registrationOpen: true, imageUrl: '', heroImageUrl: '', gallery: [] };

const GALLERY_MAX = 12;

/** Galerie avant/après — plusieurs images, pas de couverture ni de réordonnancement (inutile ici). */
function GalleryField({
  value,
  pathPrefix,
  onChange,
}: {
  value: string[];
  pathPrefix: string;
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || files.length === 0) return;
    if (value.length >= GALLERY_MAX) { setError(`Maximum ${GALLERY_MAX} photos.`); return; }
    const toUpload = Array.from(files).slice(0, GALLERY_MAX - value.length);
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    for (const file of toUpload) {
      try {
        urls.push(await uploadPublicImage('event-images', file, pathPrefix));
      } catch (err) {
        setError(err instanceof Error ? formatMutationError(err.message) : 'Envoi impossible. Réessaie.');
      }
    }
    setUploading(false);
    if (urls.length > 0) onChange([...value, ...urls]);
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className={labelBase}>Galerie avant / après <span className="ml-1 text-black/30">({value.length})</span></label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-noir/15 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={1.5} />}
          {uploading ? 'Envoi…' : 'Ajouter'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={uploading} onChange={handleFiles} />
      </div>
      <p className="mb-2 text-[9px] text-black/30">
        Photos réelles de participants uniquement — jamais de banque d'images. Section masquée sur la page tant qu'elle est vide.
      </p>
      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-noir/15 bg-white text-black/40 transition-colors hover:border-noir/30 hover:text-black/60"
        >
          <ImagePlus size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-light">Aucune photo</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-[2px] border border-noir/[0.06] bg-surface-muted">
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-red-500 opacity-0 backdrop-blur-[2px] transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100"
                aria-label="Supprimer cette photo"
              >
                <Trash2 size={11} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

/** Un seul champ image, upload direct (bucket event-images) — pas de galerie ici. */
function ImageField({
  label,
  hint,
  value,
  pathPrefix,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  pathPrefix: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicImage('event-images', file, pathPrefix);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? formatMutationError(err.message) : 'Envoi impossible. Réessaie.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className={labelBase}>{label}</label>
        <span className="text-[9px] text-black/30">{hint}</span>
      </div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] border border-dashed border-noir/15 bg-surface-muted">
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-noir/75 to-transparent px-3 py-2.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-white backdrop-blur-[2px] transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={1.5} />}
                Remplacer
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.14em] text-white backdrop-blur-[2px] transition-colors hover:bg-red-500/70"
              >
                <Trash2 size={12} strokeWidth={1.5} />
                Retirer
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black/45 transition-colors hover:bg-noir/[0.02] hover:text-black/70"
          >
            {uploading ? <Loader2 size={20} strokeWidth={1.5} className="animate-spin" /> : <ImagePlus size={20} strokeWidth={1.5} />}
            <span className="text-[11px] font-light">{uploading ? 'Envoi…' : 'Ajouter une image'}</span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-black/30">JPEG · PNG · WebP · 5 Mo max</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={handleFile} />
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

const AdminChallenge21j = () => {
  useEffect(() => { document.title = 'Challenge 21j — Admin PessÓra'; }, []);

  const { challenges, loading: loadingChallenges, error: challengesError, createChallenge, updateChallenge } = useAdminChallenges();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ChallengeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = useMemo(() => challenges.find((c) => c.id === selectedId) ?? null, [challenges, selectedId]);

  useEffect(() => {
    if (selected) {
      setForm({
        title: selected.title,
        date: selected.date,
        active: selected.active ?? true,
        registrationOpen: selected.registration_open ?? true,
        imageUrl: selected.image_url ?? '',
        heroImageUrl: selected.hero_image_url ?? '',
        gallery: Array.isArray(selected.gallery) ? selected.gallery : [],
      });
      setIsCreating(false);
    } else if (!isCreating && challenges.length > 0) {
      setSelectedId(challenges[0].id);
    }
  }, [selected, challenges, isCreating]);

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSaveChallenge = async () => {
    if (!form.title.trim() || !form.date) { setFormError('Titre et date sont requis.'); return; }
    setSaving(true);
    setFormError(null);
    if (isCreating) {
      const result = await createChallenge(form);
      setSaving(false);
      if (result.error) { setFormError(result.error); return; }
      if (result.data) {
        setSelectedId(result.data.id);
        setIsCreating(false);
      }
      return;
    }
    if (!selected) { setSaving(false); setFormError('Aucun challenge sélectionné.'); return; }
    const result = await updateChallenge(selected.id, form);
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
  };

  const slotsHook = useAdminChallengeSlots(selected?.id ?? null);
  const registrantsHook = useAdminChallengeRegistrants(selected?.id ?? null);

  const [genStart, setGenStart] = useState('');
  const [genEnd, setGenEnd] = useState('');
  const [genHeures, setGenHeures] = useState('09:00, 10:30, 14:00, 16:00');
  const [excludedWeekdays, setExcludedWeekdays] = useState<number[]>([0]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<string | null>(null);
  const [confirmDeleteAllSlots, setConfirmDeleteAllSlots] = useState(false);
  const [deletingAllSlots, setDeletingAllSlots] = useState(false);

  useEffect(() => {
    if (selected) {
      setGenStart(subtractDays(selected.date, 14));
      setGenEnd(selected.date);
    }
  }, [selected]);

  const toggleWeekday = (day: number) => {
    setExcludedWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleGenerate = async () => {
    const heures = genHeures.split(',').map((h) => h.trim()).filter(Boolean);
    if (heures.length === 0 || !genStart || !genEnd) return;
    setGenerating(true);
    setGenResult(null);
    const result = await slotsHook.generateSlots({ startDate: genStart, endDate: genEnd, heures, excludedWeekdays });
    setGenerating(false);
    if (result.error) { setGenResult(`Erreur : ${result.error}`); return; }
    if (result.orphaned > 0) {
      setGenResult(`${result.inserted} créneau(x) créé(s) et rattaché(s). ⚠️ ${result.orphaned} créé(s) mais non rattaché(s) à ce challenge (challenge inactif, dates hors fenêtre J-14→J, ou rattaché à un autre challenge) — invisibles publiquement.`);
    } else {
      setGenResult(result.inserted === 0 ? 'Aucun nouveau créneau (déjà tous créés sur cette plage).' : `${result.inserted} créneau(x) créé(s).`);
    }
  };

  return (
    <div>
      <DashPageHeader
        breadcrumb="Admin"
        title="Challenge 21 jours"
        subtitle="Édition, créneaux de bilan et inscrits — séparé des événements classiques."
        action={
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-noir px-4 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
          >
            <Plus size={12} strokeWidth={1.8} />
            Nouveau challenge
          </button>
        }
      />
      <div className={DASH_MAIN_PAD}>
        {challengesError && <AdminErrorAlert message={challengesError} />}

        {!isCreating && challenges.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {challenges.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] transition-colors ${
                  c.id === selectedId ? 'border-noir bg-noir text-white' : 'border-noir/15 text-black/60 hover:border-noir/30'
                }`}
              >
                <Trophy size={11} strokeWidth={1.5} />
                {c.title} — {formatLongDate(c.date)}
                {!c.active && <span className="text-[9px] uppercase text-black/35">(inactif)</span>}
              </button>
            ))}
          </div>
        )}

        {loadingChallenges && <p className="text-[11px] text-black/30">Chargement…</p>}

        {/* Brique A — édition */}
        <div className="mb-10 rounded-[2px] border border-noir/[0.08] bg-white p-6">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black/45">
            {isCreating ? 'Nouveau challenge' : 'Édition du challenge'}
          </p>
          {formError && <p className="mb-3 text-[11px] text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelBase}>Titre</label>
              <input
                className={inputBase}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Challenge 21 jours — Septembre"
              />
            </div>
            <div>
              <label className={labelBase}>Date de début</label>
              <input
                type="date"
                className={inputBase}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-[12px] text-black/70">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Actif (visible publiquement)
              </label>
              <label className="flex items-center gap-2 text-[12px] text-black/70">
                <input
                  type="checkbox"
                  checked={form.registrationOpen}
                  onChange={(e) => setForm((f) => ({ ...f, registrationOpen: e.target.checked }))}
                />
                Inscriptions ouvertes
              </label>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageField
              label="Vignette"
              hint="page du Challenge — la bannière de la page Événements est fixe"
              value={form.imageUrl}
              pathPrefix="challenge-21j/vignette"
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />
            <ImageField
              label="Photo du hero"
              hint="page du challenge"
              value={form.heroImageUrl}
              pathPrefix="challenge-21j/hero"
              onChange={(url) => setForm((f) => ({ ...f, heroImageUrl: url }))}
            />
          </div>

          <div className="mt-5">
            <GalleryField
              value={form.gallery}
              pathPrefix="challenge-21j/galerie"
              onChange={(gallery) => setForm((f) => ({ ...f, gallery }))}
            />
            {/* 14/09 — la règle des droits à l'image vivait dans un commentaire de
                code (ChallengeBeforeAfterBlock), c'est-à-dire là où personne ne la
                lit. Elle est DÉPLACÉE ici, là où Catherine téléverse.
                Le bloc reste masqué tant que la galerie est vide : une galerie
                vide ne publie rien, et une légende manquante ne bloque pas. */}
            <p className="mt-4 text-[11px] font-light text-black/60">
              Ces photos sont publiées sur la page du challenge, visible par tout le monde.
              Demande l'accord des personnes avant de les envoyer, et n'affiche jamais de
              résultat chiffré (poids, centimètres, durée).
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveChallenge}
            disabled={saving}
            className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-sapin px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-sapin/90 disabled:opacity-50"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isCreating ? 'Créer' : 'Enregistrer'}
          </button>
        </div>

        {selected && (
          <>
            {/* Brique B — créneaux */}
            <div className="mb-10 rounded-[2px] border border-noir/[0.08] bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/45">
                  Créneaux de bilan — {selected.title}
                </p>
                {slotsHook.slots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAllSlots(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[9px] font-normal uppercase tracking-[0.14em] text-red-500 hover:border-red-300 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={11} strokeWidth={1.4} />
                    Tout supprimer ({slotsHook.slots.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={labelBase}>Du</label>
                  <input type="date" className={inputBase} value={genStart} onChange={(e) => setGenStart(e.target.value)} />
                </div>
                <div>
                  <label className={labelBase}>Au</label>
                  <input type="date" className={inputBase} value={genEnd} onChange={(e) => setGenEnd(e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className={labelBase}>Heures (séparées par des virgules)</label>
                  <input className={inputBase} value={genHeures} onChange={(e) => setGenHeures(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] transition-colors ${
                      excludedWeekdays.includes(day) ? 'border-red-200 bg-red-50 text-red-600' : 'border-noir/15 text-black/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-noir px-5 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
              >
                {generating && <Loader2 size={12} className="animate-spin" />}
                Générer
              </button>
              {genResult && <p className="mt-2 text-[11px] text-black/60">{genResult}</p>}

              {slotsHook.error && <AdminErrorAlert message={slotsHook.error} />}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-noir/[0.06]">
                      {['Date', 'Heure', 'Disponible', ''].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] uppercase tracking-[0.18em] text-black/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slotsHook.slots.map((s) => (
                      <tr key={s.id} className="border-b border-noir/[0.03]">
                        <td className="px-3 py-2 text-[12px]">{s.date}</td>
                        <td className="px-3 py-2 text-[12px]">{s.heure.slice(0, 5)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => slotsHook.toggleDisponible(s)}
                            className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.14em] ${
                              s.disponible ? 'bg-sapin-subtle text-sapin' : 'bg-noir/5 text-black/40'
                            }`}
                          >
                            {s.disponible ? 'Oui' : 'Non'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => setConfirmDeleteSlot(s.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={13} strokeWidth={1.4} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {slotsHook.slots.length === 0 && !slotsHook.loading && (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-[11px] text-black/30">Aucun créneau pour ce challenge.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Brique C — inscrits */}
            <div className="rounded-[2px] border border-noir/[0.08] bg-white p-6">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black/45">
                Inscrits — {selected.title} ({registrantsHook.rows.length})
              </p>
              {registrantsHook.error && <AdminErrorAlert message={registrantsHook.error} />}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-noir/[0.06]">
                      {['Prénom', 'Nom', 'Téléphone', 'Créneau bilan', 'Objectif', 'Complément revenus', "Date d'inscription"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] uppercase tracking-[0.18em] text-black/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrantsHook.rows.map((r) => (
                      <tr key={r.id} className="border-b border-noir/[0.03]">
                        <td className="px-3 py-2 text-[12px]">{r.prenom}</td>
                        <td className="px-3 py-2 text-[12px]">{r.nom}</td>
                        <td className="px-3 py-2 text-[12px] text-black/60">{r.telephone}</td>
                        <td className="px-3 py-2 text-[12px]">
                          {r.bilan ? `${r.bilan.date} à ${r.bilan.heure.slice(0, 5)}` : <span className="text-black/30">Pas encore réservé</span>}
                        </td>
                        <td className="px-3 py-2 text-[12px]">{r.objectif ?? <span className="text-black/30">—</span>}</td>
                        <td className="px-3 py-2 text-[12px]">
                          {r.complementRevenus === 'decouvrir_opportunite_herbalife' ? (
                            <span className="rounded-full bg-sapin-subtle px-3 py-1 text-[10px] text-sapin">Intéressé(e) — à recontacter</span>
                          ) : r.complementRevenus === 'pas_pour_le_moment' ? (
                            <span className="rounded-full bg-noir/5 px-3 py-1 text-[10px] text-black/50">Pas pour le moment</span>
                          ) : (
                            <span className="text-black/30">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[12px] text-black/60">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                    {registrantsHook.rows.length === 0 && !registrantsHook.loading && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-[11px] text-black/30">Aucun inscrit pour ce challenge.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteSlot !== null}
        title="Supprimer ce créneau ?"
        description="Le créneau sera retiré définitivement."
        confirmLabel="Supprimer"
        onClose={() => setConfirmDeleteSlot(null)}
        onConfirm={async () => {
          if (confirmDeleteSlot) await slotsHook.deleteSlot(confirmDeleteSlot);
          setConfirmDeleteSlot(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteAllSlots}
        title={`Supprimer les ${slotsHook.slots.length} créneaux ?`}
        description="Tous les créneaux de bilan de ce challenge seront retirés définitivement — y compris ceux déjà réservés (la réservation reste, seul le créneau disparaît). Cette action ne peut pas être annulée."
        confirmLabel={deletingAllSlots ? 'Suppression…' : 'Tout supprimer'}
        onClose={() => setConfirmDeleteAllSlots(false)}
        onConfirm={async () => {
          setDeletingAllSlots(true);
          await slotsHook.deleteAllSlots();
          setDeletingAllSlots(false);
          setConfirmDeleteAllSlots(false);
        }}
      />
    </div>
  );
};

export default AdminChallenge21j;
