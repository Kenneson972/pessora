import { useEffect, useMemo, useState } from 'react';
import { Trophy, Plus, Trash2, Loader2 } from 'lucide-react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { labelBase, inputBase, formatLongDate } from '../../components/admin/eventEditorTypes';
import { useAdminChallenges, type ChallengeFormData } from '../../hooks/useAdminChallenges';
import { useAdminChallengeSlots } from '../../hooks/useAdminChallengeSlots';
import { useAdminChallengeRegistrants } from '../../hooks/useAdminChallengeRegistrants';

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function subtractDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY_FORM: ChallengeFormData = { title: '', date: '', active: true };

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
      setForm({ title: selected.title, date: selected.date, active: selected.active ?? true });
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
    setGenResult(result.inserted === 0 ? 'Aucun nouveau créneau (déjà tous créés sur cette plage).' : `${result.inserted} créneau(x) créé(s).`);
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[12px] text-black/70">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Actif (visible publiquement)
              </label>
            </div>
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
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black/45">
                Créneaux de bilan — {selected.title}
              </p>
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
                      {['Prénom', 'Nom', 'Téléphone', 'Créneau bilan', 'Objectif', 'Complément revenus'].map((h) => (
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
                        <td className="px-3 py-2 text-[12px]">{r.complementRevenus ?? <span className="text-black/30">—</span>}</td>
                      </tr>
                    ))}
                    {registrantsHook.rows.length === 0 && !registrantsHook.loading && (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-[11px] text-black/30">Aucun inscrit pour ce challenge.</td></tr>
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
    </div>
  );
};

export default AdminChallenge21j;
