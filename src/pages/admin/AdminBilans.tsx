// src/pages/admin/AdminBilans.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Check,
  XCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { EmptyState, Segment } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

interface BilanSlot {
  id: string;
  date: string;
  heure: string;
  disponible: boolean;
  created_at: string;
}

interface BilanBooking {
  id: string;
  slot_id: string;
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  message: string | null;
  statut: 'en_attente' | 'confirme' | 'annule';
  created_at: string;
  bilan_slots: BilanSlot;
}

const STATUT_LABELS = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  annule: 'Annulé',
};

const STATUT_STYLES = {
  en_attente: 'bg-amber-50 text-amber-700',
  confirme: 'bg-gold-dim/10 text-gold-dim',
  annule: 'bg-noir/5 text-black/30',
};

const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
}

function sameISO(a: string, b: string) {
  return a === b;
}

/** Grille 6 × 7 commençant le lundi. */
function buildMonthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const jsDow = first.getDay(); // 0 dim … 6 sam
  const mondayOffset = (jsDow + 6) % 7; // lun=0
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const AdminBilans = () => {
  useEffect(() => { document.title = 'Bilans — Admin PessÓra'; }, []);
  const [tab, setTab] = useState<'demandes' | 'creneaux'>('demandes');
  const [bookings, setBookings] = useState<BilanBooking[]>([]);
  const [slots, setSlots] = useState<BilanSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('all');

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(today));
  const [newHeure, setNewHeure] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);

  /** Suppression sans `window.confirm` — modale intégrée */
  type ConfirmDelete =
    | { kind: 'slot'; id: string; linkedCount: number }
    | { kind: 'booking'; id: string };
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const closeConfirmDelete = useCallback(() => setConfirmDelete(null), []);

  const fetchBookings = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('bilan_bookings')
      .select('*, bilan_slots(*)')
      .order('created_at', { ascending: false });
    setBookings(data ?? []);
  }, []);

  const fetchSlots = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('bilan_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('heure', { ascending: true });
    setSlots(data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBookings(), fetchSlots()]).finally(() => setLoading(false));
  }, [fetchBookings, fetchSlots]);

  const updateStatut = async (id: string, statut: BilanBooking['statut']) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_bookings').update({ statut }).eq('id', id);
    fetchBookings();
  };

  const requestDeleteBooking = (id: string) => {
    setConfirmDelete({ kind: 'booking', id });
  };

  const runConfirmedDelete = async () => {
    if (!confirmDelete || deleteInProgress) return;
    setDeleteInProgress(true);
    try {
      if (confirmDelete.kind === 'booking') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('bilan_bookings').delete().eq('id', confirmDelete.id);
        await fetchBookings();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('bilan_slots').delete().eq('id', confirmDelete.id);
        await fetchSlots();
        if (confirmDelete.linkedCount > 0) await fetchBookings();
      }
      setConfirmDelete(null);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const createSlotAtSelected = async () => {
    if (!selectedDate || !newHeure) return;
    setSavingSlot(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('bilan_slots')
      .insert({ date: selectedDate, heure: newHeure, disponible: true });
    setNewHeure('');
    setSavingSlot(false);
    fetchSlots();
  };

  const toggleSlotDisponible = async (slot: BilanSlot) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('bilan_slots')
      .update({ disponible: !slot.disponible })
      .eq('id', slot.id);
    fetchSlots();
  };

  const updateSlotHeure = async (slot: BilanSlot, heure: string) => {
    if (!heure || heure === slot.heure?.slice(0, 5)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('bilan_slots')
      .update({ heure })
      .eq('id', slot.id);
    fetchSlots();
  };

  const requestDeleteSlot = (id: string) => {
    const linkedCount = bookings.filter((b) => b.slot_id === id).length;
    setConfirmDelete({ kind: 'slot', id, linkedCount });
  };

  const filteredBookings =
    filterStatut === 'all' ? bookings : bookings.filter((b) => b.statut === filterStatut);

  // Lookups pour le calendrier
  const slotsByDate = useMemo(() => {
    const map = new Map<string, BilanSlot[]>();
    for (const s of slots) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [slots]);

  const bookingsBySlot = useMemo(() => {
    const map = new Map<string, BilanBooking[]>();
    for (const b of bookings) {
      if (b.statut === 'annule') continue;
      const arr = map.get(b.slot_id) ?? [];
      arr.push(b);
      map.set(b.slot_id, arr);
    }
    return map;
  }, [bookings]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayISO = useMemo(() => toISODate(today), [today]);
  const selectedSlots = useMemo(() => {
    const arr = slotsByDate.get(selectedDate) ?? [];
    return [...arr].sort((a, b) => a.heure.localeCompare(b.heure));
  }, [slotsByDate, selectedDate]);

  const inputClass =
    'h-11 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-base sm:text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

  if (loading) return <p className="text-[11px] text-black/30">Chargement…</p>;

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Bilans bien-être"
        subtitle="Demandes de réservation, créneaux et historique."
      />
      <div className={DASH_MAIN_PAD}>
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-noir/[0.06]">
          {(['demandes', 'creneaux'] as const).map((t) => (
            <button type="button"
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-1 mr-4 text-[11px] font-normal transition-colors border-b-[1.5px] -mb-px ${
                tab === t
                  ? 'border-noir text-noir'
                  : 'border-transparent text-black/35 hover:text-noir'
              }`}
            >
              {t === 'demandes'
                ? `Demandes · ${bookings.filter((b) => b.statut === 'en_attente').length}`
                : 'Créneaux'}
            </button>
          ))}
        </div>

        {tab === 'demandes' && (
          <div>
            <div className="mb-5">
              <Segment
                size="sm"
                selectedKey={filterStatut}
                onSelectionChange={(k) => setFilterStatut((k as string) ?? 'all')}
                aria-label="Filtrer par statut"
              >
                {(['all', 'en_attente', 'confirme', 'annule'] as const).map((s) => (
                  <Segment.Item key={s} id={s}>
                    <Segment.Separator />
                    {s === 'all' ? 'Tous' : STATUT_LABELS[s as keyof typeof STATUT_LABELS]}
                  </Segment.Item>
                ))}
              </Segment>
            </div>

            {filteredBookings.length === 0 ? (
              <EmptyState className="rounded-[2px] border border-noir/[0.06] bg-white p-10">
                <EmptyState.Header>
                  <EmptyState.Title className="text-[13px] font-normal text-black">
                    Aucune demande
                  </EmptyState.Title>
                  <EmptyState.Description className="text-[11px] font-light text-black/40">
                    Les demandes de bilan apparaîtront ici dès qu’un membre aura réservé un créneau.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <div className="bg-white rounded-[2px] border border-noir/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-noir/[0.05]">
                      {['Client', 'Email', 'Créneau', 'Message', 'Statut', ''].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[8px] font-normal uppercase tracking-[0.25em] text-black/35"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const slot = b.bilan_slots;
                      const d = slot ? parseISODate(slot.date) : null;
                      return (
                        <tr
                          key={b.id}
                          className="border-b border-noir/[0.04] hover:bg-noir/[0.01]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-[12px] font-normal text-black">
                              {b.prenom} {b.nom}
                            </p>
                            {b.telephone && (
                              <p className="text-[10px] text-black/35">{b.telephone}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[11px] text-black/50">{b.email}</td>
                          <td className="px-5 py-4">
                            {d ? (
                              <div>
                                <p className="text-[11px] font-normal text-black">
                                  {d.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                                <p className="text-[10px] text-black/40">
                                  {slot.heure?.slice(0, 5)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-black/30">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 max-w-[180px]">
                            <p className="text-[11px] text-black/50 truncate">
                              {b.message || '—'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[8px] uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${STATUT_STYLES[b.statut]}`}
                            >
                              {STATUT_LABELS[b.statut]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {b.statut !== 'confirme' && (
                                <button type="button"
                                  onClick={() => updateStatut(b.id, 'confirme')}
                                  title="Confirmer"
                                  className="flex h-11 w-11 items-center justify-center text-black/30 hover:text-black transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              {b.statut !== 'annule' && (
                                <button type="button"
                                  onClick={() => updateStatut(b.id, 'annule')}
                                  title="Annuler"
                                  className="flex h-11 w-11 items-center justify-center text-black/30 hover:text-red-500 transition-colors"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                              {b.statut === 'en_attente' && (
                                <button type="button"
                                  onClick={() => updateStatut(b.id, 'en_attente')}
                                  title="Remettre en attente"
                                  className="flex h-11 w-11 items-center justify-center text-black/20 hover:text-amber-600 transition-colors"
                                >
                                  <Clock size={14} />
                                </button>
                              )}
                              <button type="button"
                                onClick={() => requestDeleteBooking(b.id)}
                                className="flex h-11 w-11 items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'creneaux' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Calendrier */}
            <section className="bg-white rounded-[2px] border border-noir/[0.06] p-5">
              <header className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CalendarIcon size={14} className="text-black/35" />
                  <h2 className="text-[13px] font-normal tracking-[0.04em]">
                    {MONTHS_FR[cursor.getMonth()]} {cursor.getFullYear()}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button"
                    onClick={() => setCursor((c) => addMonths(c, -1))}
                    className="h-11 w-11 flex items-center justify-center rounded-[2px] text-black/45 hover:text-noir hover:bg-noir/[0.04] transition-colors"
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button type="button"
                    onClick={() => {
                      setCursor(today);
                      setSelectedDate(todayISO);
                    }}
                    className="h-11 px-3 text-[10px] uppercase tracking-[0.12em] text-black/55 hover:text-noir border border-noir/10 rounded-[2px]"
                  >
                    Aujourd’hui
                  </button>
                  <button type="button"
                    onClick={() => setCursor((c) => addMonths(c, 1))}
                    className="h-11 w-11 flex items-center justify-center rounded-[2px] text-black/45 hover:text-noir hover:bg-noir/[0.04] transition-colors"
                    aria-label="Mois suivant"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-7 gap-px bg-noir/[0.06] border border-noir/[0.06] rounded-[2px] overflow-hidden">
                {WEEKDAYS_SHORT.map((w) => (
                  <div
                    key={w}
                    className="bg-white py-2 text-center text-[9px] uppercase tracking-[0.18em] text-black/35"
                  >
                    {w}
                  </div>
                ))}
                {grid.map((d) => {
                  const iso = toISODate(d);
                  const isCurrentMonth = d.getMonth() === cursor.getMonth();
                  const isToday = sameISO(iso, todayISO);
                  const isSelected = sameISO(iso, selectedDate);
                  const daySlots = slotsByDate.get(iso) ?? [];
                  const total = daySlots.length;
                  const dispo = daySlots.filter((s) => s.disponible).length;
                  const reserved = daySlots.reduce(
                    (acc, s) => acc + (bookingsBySlot.get(s.id)?.length ?? 0),
                    0,
                  );
                  return (
                    <button type="button"
                      key={iso}
                      onClick={() => setSelectedDate(iso)}
                      className={`relative bg-white min-h-[78px] p-2 text-left transition-colors ${
                        isSelected
                          ? 'ring-1 ring-inset ring-noir bg-noir/[0.02]'
                          : 'hover:bg-noir/[0.02]'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                          isToday
                            ? 'bg-noir text-white'
                            : isSelected
                            ? 'text-noir'
                            : 'text-black/70'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {total > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-noir" />
                            <span className="text-[9px] text-black/55">
                              {dispo}/{total} dispo
                            </span>
                          </div>
                          {reserved > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-dim" />
                              <span className="text-[9px] text-gold-dim">
                                {reserved} réservé{reserved > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-black/45">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-noir" /> créneaux
                  disponibles
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-dim" />{' '}
                  réservations actives
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-noir" />
                  aujourd’hui
                </span>
              </div>
            </section>

            {/* Panneau latéral : jour sélectionné */}
            <aside className="bg-white rounded-[2px] border border-noir/[0.06] p-5 self-start">
              <header className="mb-4">
                <p className="text-[9px] uppercase tracking-[0.22em] text-black/35">
                  Jour sélectionné
                </p>
                <h3 className="mt-1 text-[14px] font-normal text-noir">
                  {parseISODate(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </header>

              {/* Ajout créneau */}
              <div className="bg-surface-muted/60 rounded-[2px] border border-noir/[0.06] p-3 mb-5">
                <label className="block text-[9px] uppercase tracking-[0.2em] text-black/40 mb-1.5">
                  Nouveau créneau
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    className={`${inputClass} flex-1`}
                    value={newHeure}
                    onChange={(e) => setNewHeure(e.target.value)}
                    step={300}
                  />
                  <button type="button"
                    onClick={createSlotAtSelected}
                    disabled={savingSlot || !newHeure}
                    className="inline-flex h-11 items-center gap-1.5 px-4 bg-noir text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-anthracite transition-colors disabled:opacity-40"
                  >
                    <Plus size={13} />
                    {savingSlot ? '…' : 'Ajouter'}
                  </button>
                </div>
              </div>

              {/* Liste créneaux du jour */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] text-black/40 mb-2">
                  Créneaux ({selectedSlots.length})
                </p>
                {selectedSlots.length === 0 ? (
                  <p className="text-[11px] text-black/35 py-6 text-center">
                    Aucun créneau. Ajoutez-en un ci-dessus.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedSlots.map((slot) => {
                      const linked = bookingsBySlot.get(slot.id) ?? [];
                      const hasBooking = linked.length > 0;
                      return (
                        <li
                          key={slot.id}
                          className="border border-noir/[0.06] rounded-[2px] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              defaultValue={slot.heure?.slice(0, 5)}
                              onBlur={(e) => updateSlotHeure(slot, e.target.value)}
                              className={`${inputClass} h-11 w-[100px] text-[12px]`}
                              step={300}
                            />
                            <button type="button"
                              onClick={() => toggleSlotDisponible(slot)}
                              className={`flex-1 text-center text-[8px] uppercase tracking-[0.12em] h-11 rounded-[2px] transition-colors ${
                                slot.disponible
                                  ? 'bg-gold-dim/10 text-gold-dim hover:bg-noir/5 hover:text-black/40'
                                  : 'bg-noir/5 text-black/30 hover:bg-gold-dim/10 hover:text-gold-dim'
                              }`}
                            >
                              {slot.disponible ? 'Disponible' : 'Indisponible'}
                            </button>
                            <button type="button"
                              onClick={() => requestDeleteSlot(slot.id)}
                              className="h-11 w-11 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                              aria-label="Supprimer le créneau"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {hasBooking && (
                            <ul className="mt-2 space-y-1.5 pl-1">
                              {linked.map((b) => (
                                <li
                                  key={b.id}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] text-noir">
                                      {b.prenom} {b.nom}
                                    </p>
                                    <p className="truncate text-[10px] text-black/40">
                                      {b.email}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 text-[8px] uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${STATUT_STYLES[b.statut]}`}
                                  >
                                    {STATUT_LABELS[b.statut]}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={
          confirmDelete?.kind === 'slot'
            ? 'Supprimer ce créneau ?'
            : 'Supprimer cette demande ?'
        }
        description={
          confirmDelete?.kind === 'slot' && confirmDelete.linkedCount > 0 ? (
            <>
              Ce créneau a{' '}
              <span className="text-noir">
                {confirmDelete.linkedCount} réservation
                {confirmDelete.linkedCount > 1 ? 's' : ''}
              </span>{' '}
              liée{confirmDelete.linkedCount > 1 ? 's' : ''}. La suppression est définitive.
            </>
          ) : confirmDelete?.kind === 'slot' ? (
            'Cette action supprime le créneau de façon définitive.'
          ) : confirmDelete ? (
            'La demande sera retirée de la liste de façon définitive.'
          ) : null
        }
        loading={deleteInProgress}
        onClose={closeConfirmDelete}
        onConfirm={runConfirmedDelete}
      />
    </div>
  );
};

export default AdminBilans;
