import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useAdminEventRegistrations, type NewRegistrantData } from '../../hooks/useAdminEventRegistrations';
import { labelBase, inputBase } from './eventEditorTypes';

const EMPTY_ADD_FORM: NewRegistrantData = { prenom: '', nom: '', telephone: '', nb_personnes: 'Je viens seul', souhait_info: 'Ajout manuel' };
const NB_OPTIONS = ['Je viens seul', 'Nous sommes 2', 'Nous sommes 3', 'Nous sommes 4', 'Nous sommes 5+'];

export const EventRegistrationsList = ({ eventId }: { eventId: string }) => {
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
    setEditingId(r.id); setEditForm({ prenom: r.prenom, nom: r.nom, telephone: r.telephone, nb_personnes: r.nb_personnes, souhait_info: r.souhait_info }); setConfirmDeleteId(null);
  };
  const handleSave = async (id: string) => { if (!editForm.prenom.trim() || !editForm.nom.trim()) return; setSaving(true); try { await updateRegistrant(id, { prenom: editForm.prenom.trim(), nom: editForm.nom.trim(), telephone: editForm.telephone, nb_personnes: editForm.nb_personnes }); setEditingId(null); } finally { setSaving(false); } };
  const handleDelete = async (id: string) => { setDeleting(true); try { await deleteRegistrant(id); } finally { setDeleting(false); setConfirmDeleteId(null); } };
  const handleAdd = async () => { if (!addForm.prenom.trim() || !addForm.nom.trim()) { setAddError('Prénom et nom sont requis.'); return; } setAdding(true); setAddError(null); try { await addRegistrant({ ...addForm, prenom: addForm.prenom.trim(), nom: addForm.nom.trim() }); setAddForm(EMPTY_ADD_FORM); setShowAddForm(false); } catch { setAddError('Erreur lors de l\u2019ajout.'); } finally { setAdding(false); } };
  const exportCSV = () => {
    const rows = [['Prénom', 'Nom', 'Téléphone', 'Nb personnes', 'Info souhaitée', 'Date inscription'], ...registrations.map((r) => [r.prenom, r.nom, r.telephone, r.nb_personnes, r.souhait_info, new Date(r.created_at).toLocaleDateString('fr-FR')])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = `inscrits-${eventId}.csv`; a.click();
  };

  if (loading) return <p className="text-[11px] text-black/30 px-5 py-4">Chargement…</p>;

  return (
    <div className="border-t border-noir/[0.05] bg-surface-muted/40">
      <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-3">
        <p className="text-[10px] font-normal text-black/50">{registrations.length} inscrit(s)</p>
        <div className="flex items-center gap-3">
          {registrations.length > 0 && (<button type="button" onClick={exportCSV} className="inline-flex min-h-[44px] items-center text-[9px] font-light uppercase tracking-[0.14em] text-black/45 hover:text-black border-b border-noir/20 pb-px transition-colors">Exporter CSV</button>)}
          <button type="button" onClick={() => { setShowAddForm((v) => !v); setAddError(null); }} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-noir/15 px-3 text-[9px] font-light uppercase tracking-[0.14em] text-black/50 hover:border-noir/30 hover:text-noir transition-colors"><UserPlus size={11} strokeWidth={1.5} />Ajouter manuellement</button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.div key="add-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="overflow-hidden">
            <div className="mx-5 mb-4 rounded-[2px] border border-noir/[0.08] bg-white p-4">
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-black/40">Nouvel inscrit</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><label className={labelBase}>Prénom *</label><input className={inputBase} value={addForm.prenom} onChange={(e) => setAddForm((f) => ({ ...f, prenom: e.target.value }))} placeholder="Marie" /></div>
                <div><label className={labelBase}>Nom *</label><input className={inputBase} value={addForm.nom} onChange={(e) => setAddForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Dupont" /></div>
                <div><label className={labelBase}>Téléphone</label><input className={inputBase} value={addForm.telephone} onChange={(e) => setAddForm((f) => ({ ...f, telephone: e.target.value }))} placeholder="0696…" /></div>
                <div><label className={labelBase}>Groupe</label><select className={inputBase} value={addForm.nb_personnes} onChange={(e) => setAddForm((f) => ({ ...f, nb_personnes: e.target.value }))}>{NB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
              </div>
              {addError && <p className="mt-2 text-[10px] text-red-500">{addError}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={handleAdd} disabled={adding} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-noir px-4 text-[10px] font-medium text-white transition-colors hover:bg-anthracite disabled:opacity-50">{adding ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={1.8} />}Confirmer</button>
                <button type="button" onClick={() => { setShowAddForm(false); setAddError(null); setAddForm(EMPTY_ADD_FORM); }} className="text-[10px] font-light text-black/45 hover:text-noir transition-colors">Annuler</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {registrations.length > 0 && (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-noir/[0.04]">{['Prénom', 'Nom', 'Téléphone', 'Groupe', 'Date', ''].map((h) => (<th key={h} className="px-5 py-2 text-left text-[8px] uppercase tracking-[0.2em] text-black/35">{h}</th>))}</tr></thead><tbody>{registrations.map((r) => { const isEditing = editingId === r.id; const isConfirmDelete = confirmDeleteId === r.id; return (<tr key={r.id} className={`border-b border-noir/[0.03] transition-colors ${isConfirmDelete ? 'bg-red-50/60' : isEditing ? 'bg-ivory-warm/60' : 'hover:bg-noir/[0.015]'}`}>{isEditing ? (<><td className="px-3 py-2"><input autoFocus className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black focus:border-noir/40 focus:outline-none" value={editForm.prenom} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} /></td><td className="px-3 py-2"><input className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black focus:border-noir/40 focus:outline-none" value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} /></td><td className="px-3 py-2"><input className="w-full rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black/70 focus:border-noir/40 focus:outline-none" value={editForm.telephone} onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))} /></td><td className="px-3 py-2"><select className="rounded-[2px] border border-noir/15 bg-white px-3 py-2.5 text-[11px] text-black/70 focus:border-noir/40 focus:outline-none" value={editForm.nb_personnes} onChange={(e) => setEditForm((f) => ({ ...f, nb_personnes: e.target.value }))}>{NB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></td><td className="px-3 py-2 text-[10px] text-black/30 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td><td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><button type="button" disabled={saving} onClick={() => handleSave(r.id)} className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-noir px-3 text-[9px] font-medium text-white hover:bg-anthracite disabled:opacity-50">{saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} strokeWidth={2} />}OK</button><button type="button" onClick={() => setEditingId(null)} className="inline-flex min-h-[44px] items-center rounded-full border border-noir/15 px-3 text-[9px] text-black/45 hover:text-noir">Annuler</button></span></td></>) : (<><td className="px-5 py-3 text-[11px] text-black">{r.prenom}</td><td className="px-5 py-3 text-[11px] text-black">{r.nom}</td><td className="px-5 py-3 text-[11px] text-black/60">{r.telephone}</td><td className="px-5 py-3 text-[11px] text-black/60">{r.nb_personnes}</td><td className="px-5 py-3 text-[10px] text-black/35 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td><td className="px-4 py-2 text-right">{isConfirmDelete ? (<span className="inline-flex items-center gap-1.5"><button type="button" disabled={deleting} onClick={() => handleDelete(r.id)} className="inline-flex min-h-[44px] items-center rounded-full bg-red-500 px-3 text-[9px] font-medium text-white hover:bg-red-600 disabled:opacity-50">{deleting ? '…' : 'Confirmer'}</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="inline-flex min-h-[44px] items-center rounded-full border border-noir/15 px-3 text-[9px] text-black/45 hover:text-noir">Non</button></span>) : (<span className="inline-flex items-center gap-2"><button type="button" onClick={() => startEdit(r)} className="inline-flex min-h-[44px] items-center rounded-full border border-noir/15 px-3 text-[9px] font-light uppercase tracking-[0.14em] text-black/45 hover:text-noir transition-colors"><Pencil size={10} strokeWidth={1.2} /></button><button type="button" onClick={() => setConfirmDeleteId(r.id)} className="inline-flex min-h-[44px] items-center rounded-full border border-red-200 px-3 text-[9px] font-light uppercase tracking-[0.14em] text-red-400 hover:text-red-600 transition-colors"><Trash2 size={10} strokeWidth={1.2} /></button></span>)}</td></>)}</tr>); })}</tbody></table></div>
      )}
    </div>
  );
};
