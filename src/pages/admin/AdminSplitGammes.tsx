import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, Upload, X, GripVertical } from 'lucide-react';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import type { SplitGammeRow } from '../../hooks/useSplitGammes';

type UploadField = 'main_image_url' | 'side_image_1_url' | 'side_image_2_url';

type FormState = {
  label: string;
  eyebrow: string;
  title: string;
  link_to: string;
  main_image_url: string;
  side_image_1_url: string;
  side_image_2_url: string;
};

const EMPTY_FORM: FormState = {
  label: '', eyebrow: '', title: '', link_to: '',
  main_image_url: '', side_image_1_url: '', side_image_2_url: '',
};

export default function AdminSplitGammes() {
  const [gammes, setGammes] = useState<SplitGammeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SplitGammeRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const mainRef = useRef<HTMLInputElement>(null);
  const side1Ref = useRef<HTMLInputElement>(null);
  const side2Ref = useRef<HTMLInputElement>(null);
  const fileRefs: Record<UploadField, React.RefObject<HTMLInputElement | null>> = {
    main_image_url: mainRef,
    side_image_1_url: side1Ref,
    side_image_2_url: side2Ref,
  };

  const modalOverlay = useOverlayState({
    isOpen: modalOpen,
    onOpenChange: (open) => { if (!open) setModalOpen(false); },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await (supabase as any)
      .from('home_split_gammes')
      .select('*')
      .order('position', { ascending: true });
    if (e) setError(e.message);
    else { setGammes(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (g: SplitGammeRow) => {
    setEditing(g);
    setForm({
      label: g.label,
      eyebrow: g.eyebrow,
      title: g.title,
      link_to: g.link_to,
      main_image_url: g.main_image_url ?? '',
      side_image_1_url: g.side_image_1_url ?? '',
      side_image_2_url: g.side_image_2_url ?? '',
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (field: UploadField, file: File, key: string) => {
    setUploading(field);
    setError(null);
    try {
      const url = await uploadPublicImage('split-gammes-images', file, key);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      label: form.label.trim(),
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      link_to: form.link_to.trim(),
      main_image_url: form.main_image_url.trim() || null,
      side_image_1_url: form.side_image_1_url.trim() || null,
      side_image_2_url: form.side_image_2_url.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: e } = await (supabase as any)
      .from('home_split_gammes')
      .update(payload)
      .eq('id', editing.id);
    if (e) { setError(e.message); return; }
    setModalOpen(false);
    load();
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const from = gammes.findIndex((g) => g.id === draggingId);
    const to = gammes.findIndex((g) => g.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...gammes];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const updated = reordered.map((g, i) => ({ ...g, position: i + 1 }));
    setGammes(updated);
    setDraggingId(null);
    setDragOverId(null);
    await Promise.all(
      updated.map((g) =>
        (supabase as any).from('home_split_gammes').update({ position: g.position }).eq('id', g.id)
      )
    );
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  const UPLOAD_ZONES: { field: UploadField; label: string; aspect: string }[] = [
    { field: 'main_image_url',   label: 'Photo principale (gauche)', aspect: 'aspect-[3/2]' },
    { field: 'side_image_1_url', label: 'Photo côté — haut',         aspect: 'aspect-square' },
    { field: 'side_image_2_url', label: 'Photo côté — bas',          aspect: 'aspect-square' },
  ];

  return (
    <div className={DASH_MAIN_PAD}>
      <DashEyebrow>Contenu</DashEyebrow>
      <DashPageHeader title="Choisis ton moment" />

      {error && <AdminErrorAlert message={error} onRetry={() => setError(null)} />}

      {loading ? (
        <p className="text-sm text-black/45 mt-6">Chargement…</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/35 mb-1">
            Glisser-déposer pour réordonner les onglets
          </p>
          {gammes.map((g) => (
            <div
              key={g.id}
              draggable
              onDragStart={() => handleDragStart(g.id)}
              onDragOver={(e) => handleDragOver(e, g.id)}
              onDrop={(e) => handleDrop(e, g.id)}
              onDragEnd={handleDragEnd}
              className={[
                'flex items-center gap-3 rounded-[8px] border bg-white p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
                draggingId === g.id ? 'opacity-40 border-noir/30' : 'border-noir/[0.08]',
                dragOverId === g.id && draggingId !== g.id ? 'border-noir/50 ring-1 ring-noir/20' : '',
              ].join(' ')}
            >
              <GripVertical size={14} className="flex-shrink-0 text-black/25" />
              <div className="flex gap-1.5 flex-shrink-0">
                {(['main_image_url', 'side_image_1_url', 'side_image_2_url'] as UploadField[]).map((field) => (
                  <div key={field} className="h-12 w-12 rounded-[6px] overflow-hidden bg-noir/[0.05]">
                    {g[field]
                      ? <img src={g[field] as string} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center"><Upload size={12} className="text-black/20" /></div>
                    }
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-black/40 truncate">{g.eyebrow}</p>
                <p className="text-[13px] font-light text-black truncate">{g.title}</p>
              </div>
              <Button isIconOnly size="sm" variant="ghost" onPress={() => openEdit(g)} aria-label="Modifier">
                <Pencil size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs — outside modal to avoid portal issues */}
      {(['main_image_url', 'side_image_1_url', 'side_image_2_url'] as UploadField[]).map((field) => (
        <input
          key={field}
          ref={fileRefs[field]}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && editing) handleFileUpload(field, f, editing.key);
            e.target.value = '';
          }}
        />
      ))}

      <Modal state={modalOverlay}>
        <Modal.Backdrop variant="blur" isDismissable>
          <Modal.Container scroll="inside" placement="center" size="full" className="mx-auto max-h-[92vh] w-[min(100vw-1rem,560px)] shadow-2xl">
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                  {editing?.label} — modifier
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 shrink-0 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black" />
              </Modal.Header>
              <Modal.Body className="flex-1 overflow-y-auto px-5 py-5">
                <div className="flex flex-col gap-4">
                  {([
                    { key: 'label',   label: 'Label onglet', placeholder: 'Wellness' },
                    { key: 'eyebrow', label: 'Eyebrow',      placeholder: 'Wellness · PessÓra' },
                    { key: 'title',   label: 'Titre',        placeholder: 'Un concentré de bien-être au naturel' },
                    { key: 'link_to', label: 'Lien CTA',     placeholder: '/menu?gamme=wellness' },
                  ] as const).map(({ key, label, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
                      <input
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="rounded-[6px] border border-noir/[0.15] px-3 py-2 text-[13px] outline-none focus:border-noir/40"
                      />
                    </label>
                  ))}

                  {UPLOAD_ZONES.map(({ field, label, aspect }) => (
                    <div key={field} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
                      {form[field] ? (
                        <div className={`relative rounded-[6px] overflow-hidden border border-noir/[0.12] ${aspect}`}>
                          <img src={form[field]} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, [field]: '' }))}
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-black/60 hover:text-black"
                            aria-label="Supprimer la photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRefs[field].current?.click()}
                          disabled={uploading !== null}
                          className="flex items-center justify-center gap-2 rounded-[6px] border border-dashed border-noir/[0.2] py-6 text-[12px] text-black/40 hover:border-noir/40 hover:text-black/60 transition-colors disabled:opacity-50"
                        >
                          <Upload size={14} />
                          {uploading === field ? 'Envoi…' : 'Choisir une photo'}
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onPress={() => setModalOpen(false)}>Annuler</Button>
                    <Button
                      onPress={save}
                      isDisabled={!form.label.trim() || !form.title.trim() || uploading !== null}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
