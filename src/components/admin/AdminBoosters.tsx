import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Booster {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categories: string[];
  active: boolean;
  sort_order: number;
}

const ALL_CATEGORIES = [
  { key: 'wellness', label: 'Wellness' },
  { key: 'energie', label: 'Énergie' },
  { key: 'shakes', label: 'Shakes' },
];

const EMPTY: Omit<Booster, 'id'> = { name: '', price: 100, description: '', categories: [], active: true, sort_order: 0 };

export function AdminBoosters() {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Booster> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBoosters = useCallback(async () => {
    const { data } = await (supabase as any).from('boosters').select('*').order('sort_order');
    if (data) setBoosters(data as Booster[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBoosters(); }, [fetchBoosters]);

  const toggleCategory = (cat: string) => {
    if (!edit) return;
    const cats = edit.categories ?? [];
    setEdit({ ...edit, categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat] });
  };

  const save = async () => {
    if (!edit?.name?.trim()) return;
    setSaving(true);
    const payload = {
      name: edit.name.trim(),
      price: edit.price ?? 100,
      description: edit.description || null,
      categories: edit.categories ?? [],
      active: edit.active ?? true,
      sort_order: edit.sort_order ?? 0,
    };

    if (edit.id) {
      await (supabase as any).from('boosters').update(payload).eq('id', edit.id);
    } else {
      await (supabase as any).from('boosters').insert(payload);
    }
    setEdit(null);
    setSaving(false);
    fetchBoosters();
  };

  const remove = async (id: string) => {
    await (supabase as any).from('boosters').delete().eq('id', id);
    fetchBoosters();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] text-black/50">{boosters.length} booster{boosters.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setEdit({ ...EMPTY })}
          className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-noir/15 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-black/55 hover:border-noir/30"
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {edit && !edit.id ? (
        <div className="mb-4 rounded-[2px] border border-sapin/20 bg-sapin-subtle p-4">
          <BoosterForm edit={edit} setEdit={setEdit} saving={saving} onSave={save} onCancel={() => setEdit(null)} toggleCategory={toggleCategory} />
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-[12px] text-black/30">Chargement…</p>
      ) : (
        <div className="space-y-1">
          {boosters.map((b) => (
            <div key={b.id} className="rounded-[2px] border border-noir/[0.06] bg-white">
              {edit?.id === b.id ? (
                <div className="p-4">
                  <BoosterForm edit={edit} setEdit={setEdit} saving={saving} onSave={save} onCancel={() => setEdit(null)} toggleCategory={toggleCategory} />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-black">{b.name}</p>
                    <p className="text-[10px] text-black/40">{b.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {b.categories.map(c => {
                      const cat = ALL_CATEGORIES.find(x => x.key === c);
                      return <span key={c} className="inline-block rounded-[2px] bg-noir/[0.04] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-black/40">{cat?.label ?? c}</span>;
                    })}
                  </div>
                  <span className="text-[13px] tabular-nums text-black/60">{b.price}€</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${b.active ? 'bg-sapin' : 'bg-red-400'}`} />
                  <button onClick={() => setEdit({ ...b })} className="p-1 text-[9px] text-black/30 hover:text-black">✎</button>
                  <button onClick={() => remove(b.id)} className="p-1 text-black/20 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoosterForm({ edit, setEdit, saving, onSave, onCancel, toggleCategory }: {
  edit: Partial<Booster>;
  setEdit: (b: Partial<Booster>) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  toggleCategory: (cat: string) => void;
}) {
  return (
    <div className="space-y-3">
      <input value={edit.name ?? ''} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Nom" maxLength={50}
        className="w-full rounded-[2px] border border-noir/[0.12] px-3 py-2 text-[13px]" />
      <input value={edit.description ?? ''} onChange={e => setEdit({ ...edit, description: e.target.value })} placeholder="Description" maxLength={100}
        className="w-full rounded-[2px] border border-noir/[0.12] px-3 py-2 text-[13px]" />
      <div className="flex gap-4 items-center">
        <label className="text-[11px] text-black/50">Prix (€) :</label>
        <input type="number" value={edit.price ?? 100} onChange={e => setEdit({ ...edit, price: parseInt(e.target.value) || 0 })}
          className="w-20 rounded-[2px] border border-noir/[0.12] px-3 py-2 text-[13px]" />
      </div>
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-black/40">Catégories</p>
        <div className="flex gap-2">
          {ALL_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => toggleCategory(c.key)}
              className={`rounded-full border px-3 py-1 text-[10px] ${(edit.categories ?? []).includes(c.key) ? 'border-sapin bg-sapin-subtle text-sapin' : 'border-noir/[0.08] text-black/40'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || !edit.name?.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-sapin px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-white hover:bg-sapin/90 disabled:opacity-40">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Enregistrer
        </button>
        <button onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-noir/[0.08] px-4 text-[10px] text-black/50"><X size={13} /> Annuler</button>
      </div>
    </div>
  );
}
