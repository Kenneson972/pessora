import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, GripVertical, X } from 'lucide-react';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import type { HomeCarouselCard } from '../../types/homeCarousel';

const EMPTY_FORM = { eyebrow: '', title: '', image_url: '', link_to: '', active: true };

export default function AdminCarousel() {
  const [cards, setCards] = useState<HomeCarouselCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HomeCarouselCard | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HomeCarouselCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const modalOverlay = useOverlayState({
    isOpen: modalOpen,
    onOpenChange: (open) => { if (!open) setModalOpen(false); },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await (supabase as any)
      .from('home_carousel_cards')
      .select('*')
      .order('position', { ascending: true });
    if (e) setError(e.message);
    else { setCards(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (card: HomeCarouselCard) => {
    setEditing(card);
    setForm({
      eyebrow: card.eyebrow,
      title: card.title,
      image_url: card.image_url ?? '',
      link_to: card.link_to ?? '',
      active: card.active,
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicImage('carousel-images', file, 'home');
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e: any) {
      setError(e.message ?? 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const payload = {
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      image_url: form.image_url.trim() || null,
      link_to: form.link_to.trim() || null,
      active: form.active,
    };
    if (editing) {
      const { error: e } = await (supabase as any)
        .from('home_carousel_cards')
        .update(payload)
        .eq('id', editing.id);
      if (e) { setError(e.message); return; }
    } else {
      const position = cards.length > 0 ? Math.max(...cards.map((c) => c.position)) + 1 : 1;
      const { error: e } = await (supabase as any)
        .from('home_carousel_cards')
        .insert({ ...payload, position });
      if (e) { setError(e.message); return; }
    }
    setModalOpen(false);
    load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: e } = await (supabase as any)
      .from('home_carousel_cards')
      .delete()
      .eq('id', deleteTarget.id);
    setDeleting(false);
    if (e) setError(e.message);
    else { setDeleteTarget(null); load(); }
  };

  // Drag & drop handlers — reorders locally, then persists new positions
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }

    const from = cards.findIndex((c) => c.id === draggingId);
    const to = cards.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;

    const reordered = [...cards];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    // Assign sequential positions
    const updated = reordered.map((c, i) => ({ ...c, position: i + 1 }));
    setCards(updated);
    setDraggingId(null);
    setDragOverId(null);

    // Persist all position changes
    await Promise.all(
      updated.map((c) =>
        (supabase as any).from('home_carousel_cards').update({ position: c.position }).eq('id', c.id)
      )
    );
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  return (
    <div className={DASH_MAIN_PAD}>
      <DashEyebrow>Contenu</DashEyebrow>
      <DashPageHeader
        title="Carrousel éditorial"
        action={
          <Button size="sm" onPress={openCreate} className="gap-1.5">
            <Plus size={14} /> Ajouter une carte
          </Button>
        }
      />

      {error && <AdminErrorAlert message={error} onRetry={() => setError(null)} />}

      {loading ? (
        <p className="text-sm text-black/45 mt-6">Chargement…</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/35 mb-1">
            Glisser-déposer pour réordonner
          </p>
          {cards.map((card) => (
            <div
              key={card.id}
              draggable
              onDragStart={() => handleDragStart(card.id)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDrop={(e) => handleDrop(e, card.id)}
              onDragEnd={handleDragEnd}
              className={[
                'flex items-center gap-3 rounded-[8px] border bg-white p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
                draggingId === card.id ? 'opacity-40 border-noir/30' : 'border-noir/[0.08]',
                dragOverId === card.id && draggingId !== card.id ? 'border-noir/50 ring-1 ring-noir/20' : '',
              ].join(' ')}
            >
              <GripVertical size={14} className="flex-shrink-0 text-black/25" />
              <div className="h-12 w-12 flex-shrink-0 rounded-[6px] overflow-hidden bg-noir/[0.05]">
                {card.image_url
                  ? <img src={card.image_url} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center">
                      <Upload size={14} className="text-black/20" />
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-black/40 truncate">{card.eyebrow}</p>
                <p className="text-[13px] font-light text-black truncate">{card.title}</p>
                {card.link_to && <p className="text-[10px] text-black/35 truncate">{card.link_to}</p>}
              </div>
              <span className={`text-[9px] uppercase tracking-[0.14em] px-2 py-1 rounded-full flex-shrink-0 ${card.active ? 'bg-green-50 text-green-700' : 'bg-noir/[0.05] text-black/40'}`}>
                {card.active ? 'Actif' : 'Masqué'}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <Button isIconOnly size="sm" variant="ghost" onPress={() => openEdit(card)} aria-label="Modifier">
                  <Pencil size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => setDeleteTarget(card)} aria-label="Supprimer" className="text-red-500 hover:text-red-600">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-sm text-black/40 py-8 text-center">Aucune carte. Cliquez "Ajouter une carte".</p>
          )}
        </div>
      )}

      <Modal state={modalOverlay}>
        <Modal.Backdrop variant="blur" isDismissable>
          <Modal.Container scroll="inside" placement="center" size="full" className="mx-auto max-h-[92vh] w-[min(100vw-1rem,520px)] shadow-2xl">
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                  {editing ? 'Modifier la carte' : 'Nouvelle carte'}
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 shrink-0 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black" />
              </Modal.Header>
              <Modal.Body className="flex-1 overflow-y-auto px-5 py-5">
                <div className="flex flex-col gap-4">
                  {/* Eyebrow & Titre */}
                  {([
                    { label: 'Eyebrow (petit texte)', key: 'eyebrow', placeholder: 'Wellness · Coup de cœur' },
                    { label: 'Titre', key: 'title', placeholder: 'Ton moment bien-être' },
                  ] as const).map(({ label, key, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
                      <input
                        value={form[key] as string}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="rounded-[6px] border border-noir/[0.15] px-3 py-2 text-[13px] outline-none focus:border-noir/40"
                      />
                    </label>
                  ))}

                  {/* Photo upload */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Photo</span>
                    {form.image_url ? (
                      <div className="relative rounded-[6px] overflow-hidden border border-noir/[0.12] aspect-[3/2]">
                        <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-black/60 hover:text-black"
                          aria-label="Supprimer la photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 rounded-[6px] border border-dashed border-noir/[0.2] py-8 text-[12px] text-black/40 hover:border-noir/40 hover:text-black/60 transition-colors disabled:opacity-50"
                      >
                        <Upload size={14} />
                        {uploading ? 'Envoi en cours…' : 'Choisir une photo'}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }}
                    />
                    <p className="text-[10px] text-black/35">JPEG, PNG ou WebP — 5 Mo max</p>
                  </div>

                  {/* Lien */}
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">Lien (optionnel)</span>
                    <input
                      value={form.link_to}
                      onChange={(e) => setForm((f) => ({ ...f, link_to: e.target.value }))}
                      placeholder="/menu?gamme=wellness"
                      className="rounded-[6px] border border-noir/[0.15] px-3 py-2 text-[13px] outline-none focus:border-noir/40"
                    />
                  </label>

                  {/* Actif */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    />
                    <span className="text-[13px] text-black/70">Carte active (visible sur le site)</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onPress={() => setModalOpen(false)}>Annuler</Button>
                    <Button
                      onPress={save}
                      isDisabled={!form.eyebrow.trim() || !form.title.trim() || uploading}
                    >
                      {editing ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </div>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cette carte ?"
        description={`"${deleteTarget?.title}" sera supprimée définitivement.`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
