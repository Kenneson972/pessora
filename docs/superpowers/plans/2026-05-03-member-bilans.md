# Mes Bilans — Espace Membre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a member-space page for bilan bien-être with history (list + cancel) and simplified booking (pre-filled profile data).

**Architecture:** New page `src/pages/member/MesBilans.tsx` — single file with inline data fetching (no separate hook). Calendar picker logic duplicated from `BilanBienEtre.tsx` (no extraction needed). Uses existing dashboard primitives (`DashCard`, `DashBtn`, `DashPageHeader`, etc.). Route added to `MEMBER_ROUTE_SEGMENTS` in `App.tsx`. Sidebar link updated in `MemberLayout.tsx`.

**Tech Stack:** React, TypeScript, Supabase, Tailwind, HeroUI Pro (Stepper), dashboard primitives (`components/dashboard/primitives.tsx`).

---

## File Structure

### New
- `src/pages/member/MesBilans.tsx` — The complete page component

### Modified
- `src/App.tsx` — Add `{ segment: 'bilans', element: <MesBilans /> }` to `MEMBER_ROUTE_SEGMENTS`
- `src/components/member/MemberLayout.tsx` — Change bilan link from `/bilan-bien-etre` to `${prefix}/bilans`

---

### Task 1: Add route and update sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/member/MemberLayout.tsx`

- [ ] **Step 1.1: Add lazy import + route segment for MesBilans**

In `src/App.tsx`:

After line 40 (`const MesEvenements`), add:
```typescript
const MesBilans = lazy(() => import('./pages/member/MesBilans'));
```

In the `MEMBER_ROUTE_SEGMENTS` array (line 69-77), add after the `evenements` entry:
```typescript
{ segment: 'bilans', element: <MesBilans /> },
```

- [ ] **Step 1.2: Update sidebar link**

In `src/components/member/MemberLayout.tsx`, line 28, change:
```typescript
{ label: 'Bilans bien-être', shortLabel: 'Bilans', icon: Heart, path: '/bilan-bien-etre' },
```
to:
```typescript
{ label: 'Mes bilans', shortLabel: 'Bilans', icon: Heart, path: `${prefix}/bilans` },
```

---

### Task 2: Create MesBilans.tsx — imports, types, constants, CalendarPicker

**File:**
- Create: `src/pages/member/MesBilans.tsx`

- [ ] **Step 2.1: Write imports and types**

```typescript
import { useEffect, useState, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { BilanSlot } from '../../types/database';
import {
  DashCard, DashEyebrow, DashPageHeader,
  DashBtn, DashStatusBadge,
} from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

type BilanBooking = {
  id: string;
  slot_id: string | null;
  user_id: string | null;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  date_rdv: string;
  heure_rdv: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  notes: string | null;
  created_at: string;
};

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(h: string): string {
  return h.slice(0, 5);
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  confirme: { label: 'Confirmé', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  annule: { label: 'Annulé', color: 'text-gray-500 bg-gray-50 border-gray-200' },
};
```

- [ ] **Step 2.2: Write CalendarPicker component**

```typescript
interface CalendarPickerProps {
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  minDateStr: string;
}

const CalendarPicker = ({ availableDates, selectedDate, onSelect, minDateStr }: CalendarPickerProps) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const canPrev = (() => {
    const [my, mm] = minDateStr.split('-').map(Number);
    return year > my || (year === my && month > mm - 1);
  })();

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-4">
        <button type="button"
          onClick={prev}
          disabled={!canPrev}
          className="w-10 h-10 flex items-center justify-center text-black/30 hover:text-black disabled:opacity-20 transition-colors rounded-full"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[11px] font-normal uppercase tracking-[0.28em] text-noir">
          {MOIS[month]} {year}
        </span>
        <button type="button"
          onClick={next}
          className="w-10 h-10 flex items-center justify-center text-black/30 hover:text-black transition-colors rounded-full"
          aria-label="Mois suivant"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {JOURS.map((j, i) => (
          <div key={i} className="text-center text-[9px] font-normal uppercase tracking-[0.15em] text-black/25 py-1">{j}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = toYMD(year, month, day);
          const isPast = dateStr < minDateStr;
          const isAvailable = availableDates.has(dateStr);
          const isSelected = dateStr === selectedDate;
          return (
            <button type="button"
              key={i}
              disabled={isPast || !isAvailable}
              onClick={() => onSelect(dateStr)}
              className={[
                'mx-auto w-10 h-10 flex flex-col items-center justify-center rounded-[2px] text-[12px] font-normal transition-all duration-150',
                isSelected
                  ? 'bg-noir text-white'
                  : isAvailable && !isPast
                  ? 'text-noir hover:bg-noir/[0.06] cursor-pointer'
                  : 'text-black/18 cursor-default',
              ].filter(Boolean).join(' ')}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {day}
              {isAvailable && !isPast && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-noir/30 mt-0.5 block" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

---

### Task 3: Write MesBilans.tsx — component state, data fetching, form schema

**File:**
- Modify: `src/pages/member/MesBilans.tsx`

- [ ] **Step 3.1: Write form schema, component state, and data fetching**

```typescript
const schema = z.object({
  notes: z.string().optional(),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter le traitement de vos données pour réserver.',
  }),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-4 text-base text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

const MesBilans = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BilanBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [slots, setSlots] = useState<BilanSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BilanSlot | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: '',
      privacyAccepted: false,
    },
  });
```

- [ ] **Step 3.2: Write data fetching useEffect blocks**

```typescript
  // Fetch existing bookings
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('bilan_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('date_rdv', { ascending: false })
      .then(({ data }: { data: BilanBooking[] | null }) => {
        if (cancelled) return;
        setBookings(data ?? []);
        setBookingsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch available slots
  useEffect(() => {
    let cancelled = false;
    const fetchSlots = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bilan_slots')
        .select('*')
        .eq('disponible', true)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('heure', { ascending: true });
      if (cancelled) return;
      if (error) {
        setFetchError('Impossible de charger les créneaux.');
      } else {
        setSlots(data ?? []);
      }
      setSlotsLoading(false);
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, []);
```

- [ ] **Step 3.3: Write availableDates, timeSlotsForDate, and onSubmit**

```typescript
  const availableDates = new Set(slots.map(s => s.date));

  const timeSlotsForDate = selectedDate
    ? slots.filter(s => s.date === selectedDate)
    : [];

  const minDateStr = new Date().toISOString().split('T')[0];

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot || !user) return;
    setSubmitStatus('idle');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('bilan_bookings').insert({
      slot_id: selectedSlot.id,
      user_id: user.id,
      nom: user.lastName ?? '',
      prenom: user.firstName ?? '',
      telephone: user.phone ?? '',
      email: user.email ?? null,
      date_rdv: selectedSlot.date,
      heure_rdv: selectedSlot.heure,
      statut: 'en_attente' as const,
      notes: data.notes || null,
    });

    if (error) { setSubmitStatus('error'); return; }

    await db.from('bilan_slots').update({ disponible: false }).eq('id', selectedSlot.id);
    setSubmitStatus('success');
    setSlots(prev => prev.filter(s => s.id !== selectedSlot.id));
    setSelectedSlot(null);
    setSelectedDate(null);
    reset();
  };
```

- [ ] **Step 3.4: Write cancel handler**

```typescript
  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    setCancelLoading(bookingId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_bookings').update({ statut: 'annule' }).eq('id', bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, statut: 'annule' } : b));
    setCancelLoading(null);
  };
```

---

### Task 4: Write MesBilans.tsx — return JSX (the complete page UI)

**File:**
- Modify: `src/pages/member/MesBilans.tsx`

- [ ] **Step 4.1: Write the JSX return — header + history section + booking section**

```typescript
  const confirmedCount = bookings.filter(b => b.statut === 'confirme').length;
  const pendingCount = bookings.filter(b => b.statut === 'en_attente').length;

  return (
    <div>
      <DashPageHeader
        breadcrumb="Bilan personnalisé"
        title={<>Mes bilans <em className="italic text-black/55">bien-être</em></>}
        subtitle="Gérez vos rendez-vous et réservez un nouveau bilan en un clic."
      />

      <div className={DASH_MAIN_PAD}>
        {/* ── Stats ── */}
        <div className="mb-8 flex flex-wrap gap-4">
          <DashCard className="flex flex-col gap-2 min-w-[140px]">
            <DashEyebrow>Confirmés</DashEyebrow>
            <span className="font-display text-[28px] leading-none">{confirmedCount}</span>
          </DashCard>
          <DashCard className="flex flex-col gap-2 min-w-[140px]">
            <DashEyebrow>En attente</DashEyebrow>
            <span className="font-display text-[28px] leading-none">{pendingCount}</span>
          </DashCard>
        </div>

        {/* ── Section 1 : Historique ── */}
        <DashCard className="mb-10">
          <DashEyebrow className="mb-4">Historique</DashEyebrow>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-10" role="status">
              <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays size={32} strokeWidth={1} className="mx-auto text-black/25 mb-4" aria-hidden="true" />
              <p className="text-[13px] text-black/45">
                Aucun bilan pour le moment.
              </p>
              <p className="text-[12px] text-black/30 mt-1">
                Réservez votre premier bilan bien-être ci-dessous.
              </p>
            </div>
          ) : (
            <div>
              {bookings.map((b, i) => {
                const sm = STATUS_META[b.statut] ?? { label: b.statut, color: 'text-black/40' };
                const d = new Date(b.date_rdv + 'T00:00:00');
                const day = String(d.getDate());
                const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
                return (
                  <div
                    key={b.id}
                    className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-4 ${
                      i > 0 ? 'border-t border-noir/[0.06]' : ''
                    }`}
                  >
                    {/* Date tile */}
                    <div className="w-[48px] h-[48px] rounded-[10px] bg-surface-muted border border-noir/[0.06] flex flex-col items-center justify-center shrink-0">
                      <span className="font-display text-[15px] leading-none">{day}</span>
                      <span className="text-[8px] tracking-[0.14em] text-black/40 mt-[1px]">{month}</span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium leading-snug">Bilan bien-être</p>
                      <p className="text-[11.5px] text-black/45 mt-0.5">
                        {formatTime(b.heure_rdv)}
                        {b.notes ? ` · "${b.notes.slice(0, 40)}${b.notes.length > 40 ? '…' : ''}"` : ''}
                      </p>
                    </div>

                    {/* Status + cancel */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-full px-[8px] py-[3px] text-[9px] uppercase tracking-[0.14em] font-medium ${sm.color}`}>
                        {sm.label}
                      </span>
                      {b.statut === 'en_attente' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelLoading === b.id}
                          className="text-[10px] text-red-500/70 hover:text-red-600 underline underline-offset-2 transition-colors disabled:opacity-40"
                        >
                          {cancelLoading === b.id ? 'Annulation…' : 'Annuler'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>

        {/* ── Section 2 : Nouveau bilan ── */}
        <h2
          className="font-display font-normal text-noir mb-6 tracking-[-0.01em]"
          style={{ fontSize: 'clamp(22px, 2.6vw, 28px)' }}
        >
          Nouveau bilan
        </h2>

        {submitStatus === 'success' ? (
          <DashCard className="text-center py-12" aria-live="polite">
            <CheckCircle size={44} strokeWidth={1} className="text-emerald-500 mx-auto mb-5" aria-hidden="true" />
            <p className="font-display text-[24px] text-noir mb-3">Réservation confirmée !</p>
            <p className="text-[12px] text-black/50 leading-relaxed max-w-sm mx-auto">
              L'équipe PessÓra te confirme ton rendez-vous par WhatsApp sous 24h.
            </p>
            <button
              type="button"
              onClick={() => setSubmitStatus('idle')}
              className="mt-6 inline-flex items-center gap-2 text-[11px] text-noir/50 hover:text-noir transition-colors underline underline-offset-2"
            >
              Réserver un autre bilan <ArrowRight size={12} />
            </button>
          </DashCard>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Calendar + slots */}
            <div className="space-y-6">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12" role="status">
                  <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
                </div>
              ) : fetchError ? (
                <div className="flex items-start gap-3 rounded-[2px] border border-orange-200/80 bg-orange-50/90 p-4 text-[12px] text-orange-800" role="alert">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                  {fetchError}
                </div>
              ) : slots.length === 0 ? (
                <DashCard className="text-center py-10">
                  <Clock size={28} strokeWidth={1} className="mx-auto text-black/25 mb-3" aria-hidden="true" />
                  <p className="text-[12px] text-black/45">Aucun créneau disponible pour le moment.</p>
                </DashCard>
              ) : (
                <>
                  <DashCard>
                    <CalendarPicker
                      availableDates={availableDates}
                      selectedDate={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                      minDateStr={minDateStr}
                    />
                  </DashCard>

                  {selectedDate && timeSlotsForDate.length > 0 && (
                    <div>
                      <DashEyebrow className="mb-3">Créneaux disponibles</DashEyebrow>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Créneaux horaires disponibles">
                        {timeSlotsForDate.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            aria-pressed={selectedSlot?.id === slot.id}
                            className={`h-10 min-h-10 rounded-[2px] text-[12px] font-normal tracking-wide transition-colors duration-200 ${
                              selectedSlot?.id === slot.id
                                ? 'bg-noir text-white'
                                : 'bg-white border border-noir/[0.1] text-black hover:border-noir/30'
                            }`}
                          >
                            {slot.heure.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && timeSlotsForDate.length === 0 && (
                    <p className="text-[12px] text-black/40 text-center">
                      Aucun créneau disponible ce jour-là.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Form */}
            <div>
              <DashCard>
                <DashEyebrow className="mb-5">Confirmation</DashEyebrow>

                {/* Pre-filled profile info (read-only summary) */}
                <div className="mb-6 space-y-2 text-[12px] text-black/60">
                  <p><span className="text-black/40">Nom :</span> {user?.lastName ?? '—'}</p>
                  <p><span className="text-black/40">Prénom :</span> {user?.firstName ?? '—'}</p>
                  <p><span className="text-black/40">Téléphone :</span> {user?.phone ?? '—'}</p>
                  <p><span className="text-black/40">Email :</span> {user?.email ?? '—'}</p>
                </div>

                {submitStatus === 'error' && (
                  <div className="mb-5 flex items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                    Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  <Controller name="notes" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="bilans-notes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Message <span className="normal-case text-black/25">(optionnel)</span>
                      </label>
                      <textarea
                        id="bilans-notes"
                        {...field}
                        rows={3}
                        placeholder="Objectifs, questions, informations utiles..."
                        className="w-full border-b border-noir/10 bg-transparent py-3 text-base text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors resize-none"
                      />
                    </div>
                  )} />

                  {!selectedSlot && (
                    <p className="text-[11px] text-amber-600" role="status">
                      Sélectionne d'abord une date et un créneau dans le calendrier.
                    </p>
                  )}

                  <Controller
                    name="privacyAccepted"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label htmlFor="bilans-privacy" className="flex cursor-pointer items-start gap-3">
                          <input
                            id="bilans-privacy"
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-noir"
                          />
                          <span className="text-[11px] font-light leading-relaxed text-black/55">
                            J'accepte le traitement de mes données pour la prise de rendez-vous et le suivi du bilan.
                          </span>
                        </label>
                        {errors.privacyAccepted?.message && (
                          <p className="text-[11px] text-red-600">{errors.privacyAccepted.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <DashBtn
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full justify-center"
                  >
                    {isSubmitting ? 'Réservation…' : 'Confirmer mon Bilan Bien-être'}
                  </DashBtn>
                </form>
              </DashCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesBilans;
```

---

### Task 5: Fix PERKS constant in Dashboard.tsx

**File:**
- Modify: `src/pages/member/Dashboard.tsx`

- [ ] **Step 5.1: Update the Óra+ perks list**

In `src/pages/member/Dashboard.tsx`, lines 101-106, change:
```typescript
  const PERKS: { label: string; on: boolean }[] = [
    { label: 'Shakes à -10%',                  on: true },
    { label: '2 bilans/mois offerts',           on: true },
    { label: 'Accès ateliers prioritaire',      on: true },
    { label: 'Programme de parrainage Óra+',    on: false },
  ];
```
to:
```typescript
  const PERKS: { label: string; on: boolean }[] = [
    { label: 'Tarifs préférentiels boissons',   on: true },
    { label: 'Bilan bien-être personnalisé',    on: true },
    { label: 'Accès privilégié événements',     on: true },
    { label: 'Programme de parrainage Óra+',    on: false },
  ];
```

---

### Task 6: Build and verify

- [ ] **Step 6.1: Run TypeScript check and build**

```bash
npm run build
```

Expected: clean exit code 0. No new type errors.

- [ ] **Step 6.2: Verify the dev server starts with no console errors**

```bash
npm run dev
```
Check: page loads at `/mon-espace/bilans` without 404. Sidebar link points to `/mon-espace/bilans` not `/bilan-bien-etre`.
