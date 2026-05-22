import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
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

  const move = async (card: HomeCarouselCard, dir: -1 | 1) => {
    const idx = cards.findIndex((c) => c.id === card.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cards.length) return;
    const swap = cards[swapIdx];
    await Promise.all([
      (supabase as any).from('home_carousel_cards').update({ position: swap.position }).eq('id', card.id),
      (supabase as any).from('home_carousel_cards').update({ position: card.position }).eq('id', swap.id),
    ]);
    load();
  };

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
        <div className="mt-6 flex flex-col gap-3">
          {cards.map((card, idx) => (
            <div key={card.id} className="flex items-center gap-4 rounded-[8px] border border-noir/[0.08] bg-white p-4">
              <div className="h-14 w-14 flex-shrink-0 rounded-[6px] overflow-hidden bg-noir/[0.05]">
                {card.image_url
                  ? <img src={card.image_url} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-[18px]">📸</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-black/40 truncate">{card.eyebrow}</p>
                <p className="text-[13px] font-light text-black truncate">{card.title}</p>
                {card.link_to && <p className="text-[10px] text-black/35 truncate">{card.link_to}</p>}
              </div>
              <span className={`text-[9px] uppercase tracking-[0.14em] px-2 py-1 rounded-full ${card.active ? 'bg-green-50 text-green-700' : 'bg-noir/[0.05] text-black/40'}`}>
                {card.active ? 'Actif' : 'Masqué'}
              </span>
              <div className="flex gap-1">
                <Button isIconOnly size="sm" variant="ghost" onPress={() => move(card, -1)} isDisabled={idx === 0} aria-label="Monter">
                  <ArrowUp size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => move(card, 1)} isDisabled={idx === cards.length - 1} aria-label="Descendre">
                  <ArrowDown size={14} />
                </Button>
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
                  {([
                    { label: 'Eyebrow (petit texte)', key: 'eyebrow', placeholder: 'Wellness · Coup de cœur' },
                    { label: 'Titre', key: 'title', placeholder: 'Ton moment bien-être' },
                    { label: "URL de l'image", key: 'image_url', placeholder: 'https://…' },
                    { label: 'Lien (optionnel)', key: 'link_to', placeholder: '/menu?gamme=wellness' },
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
                    <Button onPress={save} isDisabled={!form.eyebrow.trim() || !form.title.trim()}>
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
