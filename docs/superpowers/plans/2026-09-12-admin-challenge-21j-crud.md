# Admin CRUD Challenge 21 jours — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'admin un espace dédié `/admin/challenge-21j` pour éditer un challenge (titre/date/actif seulement), générer en masse les créneaux de bilan sur sa fenêtre J-14→J, et voir les inscrits avec leur créneau de bilan + réponses du questionnaire.

**Architecture:** Trois hooks React indépendants (`useAdminChallenges`, `useAdminChallengeSlots`, `useAdminChallengeRegistrants`) au-dessus de deux modules de logique pure testés (`challengeSlotGenerator.ts`, `challengeRegistrantMatch.ts`), assemblés dans une seule page `AdminChallenge21j.tsx`. Aucune nouvelle table ni colonne — uniquement des requêtes sur le schéma existant (`events`, `bilan_slots`, `event_registrations`, `bilan_bookings`).

**Tech Stack:** React + TypeScript, Supabase JS client, Vitest (tests unitaires des modules purs uniquement — convention du projet : les hooks admin existants comme `useAdminEventRegistrations.ts` ne sont pas testés).

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-09-12-admin-challenge-21j-crud-design.md`.
- Ne touche à aucun composant de la page publique (`ChallengeHero`, `ChallengeCountdownSection`, `ChallengeInclusBanners`, etc.).
- Ne crée aucune nouvelle table/colonne/migration.
- Aucune écriture en base pendant le développement sans l'annoncer (protocole équipe) — les inserts se font via l'UI admin authentifiée, pas de script direct.
- Réutilise `slugify`, `labelBase`, `inputBase` de `src/components/admin/eventEditorTypes.ts` plutôt que d'en recréer des variantes.
- Réutilise `normalizePhone` de `src/lib/phone.ts` pour toute comparaison de téléphone (jamais une comparaison de chaîne brute).
- `npx tsc --noEmit` doit rester propre après chaque tâche.

---

### Task 1: Générateur de créneaux (logique pure, testée)

**Files:**
- Create: `src/lib/challengeSlotGenerator.ts`
- Test: `src/__tests__/challengeSlotGenerator.test.ts`

**Interfaces:**
- Produces: `SlotCandidate { date: string; heure: string }`, `ExistingSlot { date: string; heure: string }`, `generateSlotCandidates(startDate: string, endDate: string, heures: string[], excludedWeekdays: number[]): SlotCandidate[]`, `dedupeSlotCandidates(candidates: SlotCandidate[], existing: ExistingSlot[]): SlotCandidate[]`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/challengeSlotGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlotCandidates, dedupeSlotCandidates } from '../lib/challengeSlotGenerator';

describe('generateSlotCandidates', () => {
  it('génère un créneau par heure et par jour non exclu', () => {
    // 2026-09-14 = lundi, 2026-09-15 = mardi
    const result = generateSlotCandidates('2026-09-14', '2026-09-15', ['09:00', '14:00'], []);
    expect(result).toEqual([
      { date: '2026-09-14', heure: '09:00' },
      { date: '2026-09-14', heure: '14:00' },
      { date: '2026-09-15', heure: '09:00' },
      { date: '2026-09-15', heure: '14:00' },
    ]);
  });

  it('exclut les jours de semaine demandés (0=dimanche)', () => {
    // 2026-09-13 = dimanche, 2026-09-14 = lundi
    const result = generateSlotCandidates('2026-09-13', '2026-09-14', ['10:00'], [0]);
    expect(result).toEqual([{ date: '2026-09-14', heure: '10:00' }]);
  });

  it('rend un tableau vide si startDate est après endDate', () => {
    expect(generateSlotCandidates('2026-09-20', '2026-09-14', ['10:00'], [])).toEqual([]);
  });

  it('inclut le jour de fin (borne inclusive)', () => {
    const result = generateSlotCandidates('2026-09-14', '2026-09-14', ['10:00'], []);
    expect(result).toEqual([{ date: '2026-09-14', heure: '10:00' }]);
  });
});

describe('dedupeSlotCandidates', () => {
  it('retire les candidats déjà présents (date+heure exacte)', () => {
    const candidates = [
      { date: '2026-09-14', heure: '09:00' },
      { date: '2026-09-14', heure: '10:00' },
    ];
    const existing = [{ date: '2026-09-14', heure: '09:00' }];
    expect(dedupeSlotCandidates(candidates, existing)).toEqual([
      { date: '2026-09-14', heure: '10:00' },
    ]);
  });

  it('ne retire rien si aucun chevauchement', () => {
    const candidates = [{ date: '2026-09-14', heure: '09:00' }];
    const existing = [{ date: '2026-09-15', heure: '09:00' }];
    expect(dedupeSlotCandidates(candidates, existing)).toEqual(candidates);
  });

  it('rend un tableau vide si tout est déjà présent', () => {
    const candidates = [{ date: '2026-09-14', heure: '09:00' }];
    expect(dedupeSlotCandidates(candidates, candidates)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/challengeSlotGenerator.test.ts`
Expected: FAIL — `Cannot find module '../lib/challengeSlotGenerator'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/challengeSlotGenerator.ts

export interface SlotCandidate {
  date: string; // 'YYYY-MM-DD'
  heure: string; // 'HH:MM'
}

export interface ExistingSlot {
  date: string;
  heure: string;
}

/**
 * Génère les créneaux candidats pour une plage de dates (bornes incluses),
 * une liste d'heures type, en excluant certains jours de semaine
 * (0=dimanche … 6=samedi, comme Date#getDay()).
 */
export function generateSlotCandidates(
  startDate: string,
  endDate: string,
  heures: string[],
  excludedWeekdays: number[],
): SlotCandidate[] {
  const candidates: SlotCandidate[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (start > end) return candidates;

  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (!excludedWeekdays.includes(weekday)) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      for (const heure of heures) {
        candidates.push({ date: dateStr, heure });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return candidates;
}

/** Retire les candidats déjà présents dans `existing` (comparaison date+heure exacte). */
export function dedupeSlotCandidates(
  candidates: SlotCandidate[],
  existing: ExistingSlot[],
): SlotCandidate[] {
  const existingKeys = new Set(existing.map((s) => `${s.date}|${s.heure}`));
  return candidates.filter((c) => !existingKeys.has(`${c.date}|${c.heure}`));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/challengeSlotGenerator.test.ts`
Expected: PASS — 7 tests verts

- [ ] **Step 5: Commit**

```bash
git add src/lib/challengeSlotGenerator.ts src/__tests__/challengeSlotGenerator.test.ts
git commit -m "feat(admin-challenge): générateur de créneaux de bilan (logique pure testée)"
```

---

### Task 2: Rattachement inscrit ↔ réservation de bilan par téléphone (logique pure, testée)

**Files:**
- Create: `src/lib/challengeRegistrantMatch.ts`
- Test: `src/__tests__/challengeRegistrantMatch.test.ts`

**Interfaces:**
- Consumes: `normalizePhone` de `src/lib/phone.ts` (déjà existant, signature `(phone: string) => string`)
- Produces: `RegistrantLike { telephone: string }`, `BilanBookingLike { telephone: string; date_rdv: string; heure_rdv: string; statut: string }`, `matchBilanBooking<T extends BilanBookingLike>(registrant: RegistrantLike, bookings: T[]): T | null`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/challengeRegistrantMatch.test.ts
import { describe, it, expect } from 'vitest';
import { matchBilanBooking } from '../lib/challengeRegistrantMatch';

const booking = (overrides: Partial<{ telephone: string; date_rdv: string; heure_rdv: string; statut: string }> = {}) => ({
  telephone: '0696000000',
  date_rdv: '2026-09-14',
  heure_rdv: '09:00:00',
  statut: 'en_attente',
  ...overrides,
});

describe('matchBilanBooking', () => {
  it('trouve la réservation avec le même numéro, même mal formaté', () => {
    const result = matchBilanBooking(
      { telephone: '06 96 00 00 00' },
      [booking({ telephone: '+596696000000' })],
    );
    expect(result?.date_rdv).toBe('2026-09-14');
  });

  it('ignore les réservations annulées', () => {
    const result = matchBilanBooking(
      { telephone: '0696000000' },
      [booking({ statut: 'annule' })],
    );
    expect(result).toBeNull();
  });

  it('rend null si aucune réservation ne correspond', () => {
    const result = matchBilanBooking(
      { telephone: '0696000000' },
      [booking({ telephone: '0697111111' })],
    );
    expect(result).toBeNull();
  });

  it('rend null si le téléphone de l’inscrit est vide', () => {
    const result = matchBilanBooking({ telephone: '' }, [booking()]);
    expect(result).toBeNull();
  });

  it('prend la première réservation non annulée si plusieurs correspondent', () => {
    const result = matchBilanBooking(
      { telephone: '0696000000' },
      [booking({ heure_rdv: '09:00:00' }), booking({ heure_rdv: '14:00:00' })],
    );
    expect(result?.heure_rdv).toBe('09:00:00');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/challengeRegistrantMatch.test.ts`
Expected: FAIL — `Cannot find module '../lib/challengeRegistrantMatch'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/challengeRegistrantMatch.ts
import { normalizePhone } from './phone';

export interface RegistrantLike {
  telephone: string;
}

export interface BilanBookingLike {
  telephone: string;
  date_rdv: string;
  heure_rdv: string;
  statut: string;
}

/**
 * Trouve la réservation de bilan (non annulée) correspondant à un inscrit,
 * par téléphone normalisé (même règle que public.normalize_phone() côté
 * serveur — voir src/lib/phone.ts). bilan_bookings n'a pas de clé étrangère
 * vers event_registrations : c'est le seul rattachement possible.
 */
export function matchBilanBooking<T extends BilanBookingLike>(
  registrant: RegistrantLike,
  bookings: T[],
): T | null {
  const target = normalizePhone(registrant.telephone);
  if (!target) return null;
  const match = bookings.find(
    (b) => b.statut !== 'annule' && normalizePhone(b.telephone) === target,
  );
  return match ?? null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/challengeRegistrantMatch.test.ts`
Expected: PASS — 5 tests verts

- [ ] **Step 5: Commit**

```bash
git add src/lib/challengeRegistrantMatch.ts src/__tests__/challengeRegistrantMatch.test.ts
git commit -m "feat(admin-challenge): rattachement inscrit/bilan par téléphone normalisé (testé)"
```

---

### Task 3: Hook `useAdminChallenges` (liste/édition des challenges)

**Files:**
- Create: `src/hooks/useAdminChallenges.ts`

**Interfaces:**
- Consumes: `slugify` de `src/components/admin/eventEditorTypes.ts`, `useAuth()` de `src/contexts/AuthContext.tsx` (expose `isAdmin: boolean`), `Event` de `src/types/database.ts`
- Produces: `ChallengeFormData { title: string; date: string; active: boolean }`, hook rendant `{ challenges: Event[]; loading: boolean; error: string | null; refetch: () => void; createChallenge: (form: ChallengeFormData) => Promise<{ data: Event | null; error: string | null }>; updateChallenge: (id: string, form: ChallengeFormData) => Promise<{ error: string | null }> }`

Pas de test unitaire pour ce hook — convention du projet : aucun hook admin existant n'est testé (ex. `useAdminEventRegistrations.ts`, même structure). La vérification se fait par `tsc` + relecture manuelle en Task 6 une fois branché dans l'écran.

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useAdminChallenges.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { slugify } from '../components/admin/eventEditorTypes';
import type { Event } from '../types/database';

export interface ChallengeFormData {
  title: string;
  date: string;
  active: boolean;
}

export function useAdminChallenges() {
  const { isAdmin } = useAuth();
  const [challenges, setChallenges] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin) { setChallenges([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*')
      .eq('type', 'challenge')
      .order('date', { ascending: false })
      .then(({ data, error: err }: { data: Event[] | null; error: { message: string } | null }) => {
        if (err) setError(err.message);
        setChallenges(data ?? []);
        setLoading(false);
      });
  }, [isAdmin]);

  useEffect(() => { refetch(); }, [refetch]);

  const createChallenge = async (
    form: ChallengeFormData,
  ): Promise<{ data: Event | null; error: string | null }> => {
    const slug = slugify(form.title) || `challenge-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('events')
      .insert({ type: 'challenge', title: form.title, date: form.date, slug, active: form.active })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    refetch();
    return { data, error: null };
  };

  const updateChallenge = async (
    id: string,
    form: ChallengeFormData,
  ): Promise<{ error: string | null }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('events')
      .update({ title: form.title, date: form.date, active: form.active })
      .eq('id', id);
    if (error) return { error: error.message };
    refetch();
    return { error: null };
  };

  return { challenges, loading, error, refetch, createChallenge, updateChallenge };
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `src/hooks/useAdminChallenges.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminChallenges.ts
git commit -m "feat(admin-challenge): hook useAdminChallenges — liste/création/édition"
```

---

### Task 4: Hook `useAdminChallengeSlots` (créneaux en masse)

**Files:**
- Create: `src/hooks/useAdminChallengeSlots.ts`

**Interfaces:**
- Consumes: `generateSlotCandidates`, `dedupeSlotCandidates`, `SlotCandidate` de `src/lib/challengeSlotGenerator.ts` (Task 1), `useAuth()`
- Produces: `ChallengeSlot { id: string; date: string; heure: string; disponible: boolean; challenge_event_id: string | null }`, `GenerateSlotsParams { startDate: string; endDate: string; heures: string[]; excludedWeekdays: number[] }`, hook rendant `{ slots: ChallengeSlot[]; loading: boolean; error: string | null; refetch: () => void; generateSlots: (params: GenerateSlotsParams) => Promise<{ inserted: number; error: string | null }>; toggleDisponible: (slot: ChallengeSlot) => Promise<void>; deleteSlot: (id: string) => Promise<void> }`

Pas de test unitaire (même convention que Task 3) — la logique de génération/dédup est déjà testée en Task 1, ce hook ne fait que l'orchestrer avec Supabase.

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useAdminChallengeSlots.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { generateSlotCandidates, dedupeSlotCandidates, type SlotCandidate } from '../lib/challengeSlotGenerator';

export interface ChallengeSlot {
  id: string;
  date: string;
  heure: string;
  disponible: boolean;
  challenge_event_id: string | null;
}

export interface GenerateSlotsParams {
  startDate: string;
  endDate: string;
  heures: string[];
  excludedWeekdays: number[];
}

export function useAdminChallengeSlots(challengeEventId: string | null) {
  const { isAdmin } = useAuth();
  const [slots, setSlots] = useState<ChallengeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin || !challengeEventId) { setSlots([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('bilan_slots')
      .select('id, date, heure, disponible, challenge_event_id')
      .eq('challenge_event_id', challengeEventId)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })
      .then(({ data, error: err }: { data: ChallengeSlot[] | null; error: { message: string } | null }) => {
        if (err) setError(err.message);
        setSlots(data ?? []);
        setLoading(false);
      });
  }, [isAdmin, challengeEventId]);

  useEffect(() => { refetch(); }, [refetch]);

  const generateSlots = async (
    params: GenerateSlotsParams,
  ): Promise<{ inserted: number; error: string | null }> => {
    const candidates = generateSlotCandidates(params.startDate, params.endDate, params.heures, params.excludedWeekdays);
    const existing = slots.map((s) => ({ date: s.date, heure: s.heure.slice(0, 5) }));
    const toInsert: SlotCandidate[] = dedupeSlotCandidates(candidates, existing);
    if (toInsert.length === 0) return { inserted: 0, error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bilan_slots')
      .insert(toInsert.map((c) => ({ date: c.date, heure: c.heure, disponible: true })));
    if (error) return { inserted: 0, error: error.message };
    refetch();
    return { inserted: toInsert.length, error: null };
  };

  const toggleDisponible = async (slot: ChallengeSlot) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_slots').update({ disponible: !slot.disponible }).eq('id', slot.id);
    refetch();
  };

  const deleteSlot = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bilan_slots').delete().eq('id', id);
    refetch();
  };

  return { slots, loading, error, refetch, generateSlots, toggleDisponible, deleteSlot };
}
```

⚠️ Note pour l'implémenteur : l'insert ne fixe jamais `challenge_event_id` — le trigger `fn_bilan_slot_attach_challenge` (déjà en base) le rattache automatiquement au challenge dont la fenêtre J-14→J couvre la date. Si le générateur est utilisé avec des dates hors de cette fenêtre pour le challenge sélectionné dans l'écran (Task 6 doit pré-remplir la plage par défaut à J-14→J), les créneaux resteront orphelins — ce n'est pas un bug de ce hook, mais un écart d'usage à éviter côté UI.

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `src/hooks/useAdminChallengeSlots.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminChallengeSlots.ts
git commit -m "feat(admin-challenge): hook useAdminChallengeSlots — génération en masse + gestion"
```

---

### Task 5: Hook `useAdminChallengeRegistrants` (vue enrichie)

**Files:**
- Create: `src/hooks/useAdminChallengeRegistrants.ts`

**Interfaces:**
- Consumes: `matchBilanBooking`, `BilanBookingLike` de `src/lib/challengeRegistrantMatch.ts` (Task 2), `EventRegistration` de `src/types/database.ts` (a un champ `post_registration_details: unknown` jsonb), `useAuth()`
- Produces: `ChallengeRegistrantRow { id: string; prenom: string; nom: string; telephone: string; created_at: string; objectif: string | null; complementRevenus: string | null; bilan: { date: string; heure: string } | null }`, hook rendant `{ rows: ChallengeRegistrantRow[]; loading: boolean; error: string | null; refetch: () => void }`

Pas de test unitaire (même convention) — la logique de jointure est déjà testée en Task 2.

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useAdminChallengeRegistrants.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { matchBilanBooking, type BilanBookingLike } from '../lib/challengeRegistrantMatch';
import type { EventRegistration } from '../types/database';

export interface ChallengeRegistrantRow {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  created_at: string;
  objectif: string | null;
  complementRevenus: string | null;
  bilan: { date: string; heure: string } | null;
}

function readDetail(details: unknown, key: string): string | null {
  if (!details || typeof details !== 'object') return null;
  const value = (details as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function useAdminChallengeRegistrants(challengeEventId: string | null) {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<ChallengeRegistrantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isAdmin || !challengeEventId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    Promise.all([
      db.from('event_registrations').select('*').eq('event_id', challengeEventId).order('created_at', { ascending: true }),
      db.from('bilan_bookings').select('telephone, date_rdv, heure_rdv, statut').eq('challenge_event_id', challengeEventId),
    ]).then(
      ([regRes, bookRes]: [
        { data: EventRegistration[] | null; error: { message: string } | null },
        { data: BilanBookingLike[] | null; error: { message: string } | null },
      ]) => {
        if (regRes.error) { setError(regRes.error.message); setLoading(false); return; }
        if (bookRes.error) { setError(bookRes.error.message); setLoading(false); return; }
        const bookings = bookRes.data ?? [];
        const enriched: ChallengeRegistrantRow[] = (regRes.data ?? []).map((r) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const details = (r as any).post_registration_details;
          const match = matchBilanBooking({ telephone: r.telephone }, bookings);
          return {
            id: r.id,
            prenom: r.prenom,
            nom: r.nom,
            telephone: r.telephone,
            created_at: r.created_at,
            objectif: readDetail(details, 'objectif_principal'),
            complementRevenus: readDetail(details, 'complement_revenus'),
            bilan: match ? { date: match.date_rdv, heure: match.heure_rdv } : null,
          };
        });
        setRows(enriched);
        setLoading(false);
      },
    );
  }, [isAdmin, challengeEventId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, error, refetch };
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `src/hooks/useAdminChallengeRegistrants.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminChallengeRegistrants.ts
git commit -m "feat(admin-challenge): hook useAdminChallengeRegistrants — inscrits + bilan + questionnaire"
```

---

### Task 6: Page `AdminChallenge21j.tsx` (briques A+B+C assemblées)

**Files:**
- Create: `src/pages/admin/AdminChallenge21j.tsx`

**Interfaces:**
- Consumes: `useAdminChallenges` (Task 3), `useAdminChallengeSlots` (Task 4), `useAdminChallengeRegistrants` (Task 5), `DashPageHeader` + props de `src/components/dashboard/primitives.tsx`, `DASH_MAIN_PAD` de `src/components/dashboard/layoutClasses.ts`, `AdminErrorAlert` de `src/components/dashboard/AdminErrorAlert.tsx`, `ConfirmDialog` de `src/components/dashboard/ConfirmDialog.tsx`, `labelBase`/`inputBase`/`formatLongDate` de `src/components/admin/eventEditorTypes.ts`

Pas de test — écran d'assemblage UI, la logique qu'il orchestre est déjà testée (Tasks 1-2).

- [ ] **Step 1: Write the page**

```tsx
// src/pages/admin/AdminChallenge21j.tsx
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
    const result = isCreating
      ? await createChallenge(form)
      : selected
        ? await updateChallenge(selected.id, form)
        : { error: 'Aucun challenge sélectionné.' };
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    if (isCreating && 'data' in result && result.data) {
      setSelectedId(result.data.id);
      setIsCreating(false);
    }
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
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminChallenge21j.tsx
git commit -m "feat(admin-challenge): écran AdminChallenge21j — briques A+B+C assemblées"
```

---

### Task 7: Routage + navigation

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx` (ajoute une entrée `NAV`)
- Modify: `src/AdminApp.tsx` (ajoute l'import lazy + la route)

**Interfaces:**
- Consumes: `AdminChallenge21j` (default export, Task 6), `ProtectedAdminRoute`, `AdminLayout` (déjà existants)

- [ ] **Step 1: Ajouter l'entrée de navigation**

Dans `src/pages/admin/AdminLayout.tsx`, ajouter `Trophy` à l'import lucide-react existant :

```ts
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Images, ClipboardList, CupSoda, Trophy } from 'lucide-react';
```

Puis dans le tableau `NAV`, juste après l'entrée `'Événements'` :

```ts
  { label: 'Événements', shortLabel: 'Évén.', icon: CalendarDays, path: '/admin/evenements' },
  { label: 'Challenge 21j', shortLabel: 'Challenge', icon: Trophy, path: '/admin/challenge-21j' },
```

- [ ] **Step 2: Ajouter la route**

Dans `src/AdminApp.tsx`, ajouter l'import lazy juste après `AdminEvenements` :

```ts
const AdminEvenements = lazy(() => import('./pages/admin/AdminEvenements'));
const AdminChallenge21j = lazy(() => import('./pages/admin/AdminChallenge21j'));
```

Puis ajouter la route juste après celle de `/admin/evenements` :

```tsx
                <Route path="/admin/evenements" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminEvenements /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/challenge-21j" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminChallenge21j /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
```

- [ ] **Step 3: Verify types and build**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 4: Run full test suite (non-regression)**

Run: `npx vitest run`
Expected: mêmes résultats qu'avant (les 10 échecs `cartStore.test.ts` préexistants, tout le reste vert, y compris les nouveaux tests des Tasks 1-2)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx src/AdminApp.tsx
git commit -m "feat(admin-challenge): route /admin/challenge-21j + entrée de navigation"
```

---

## Post-implémentation (hors plan, à faire par l'utilisateur/l'équipe)

- Recette manuelle en preview : créer un challenge, générer des créneaux sur une plage qui chevauche des créneaux existants (vérifier 0 doublon), vérifier qu'un inscrit avec un bilan réservé affiche bien son créneau.
- Écriture en base : la génération de créneaux en direct doit être annoncée (protocole équipe), même si c'est un `INSERT` standard et non une migration.
