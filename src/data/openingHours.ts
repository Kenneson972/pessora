// src/data/openingHours.ts
//
// SOURCE UNIQUE DES HORAIRES D'OUVERTURE — côté front.
//
// Un seul objet porte les horaires ; tout le reste en DÉRIVE :
//   • les lignes affichées (contact, pied de page, PessoBot),
//   • les créneaux de retrait du panier (Click & Collect),
//   • le balisage Google (index.html, vérifié par un test de cohérence).
//
// Modèle : une plage par jour, indexée comme `Date.getDay()` (0 = dimanche).
// `null` = fermé. Format des heures : 'HH:MM' en 24 h.
//
// La base fait foi quand elle est remplie : `bar_settings.opening_hours`
// (même forme, 7 clés). Sinon on retombe sur les valeurs de ce module — qui
// sont les mêmes : un repli qui change de valeur serait une panne silencieuse.
//
// ⚠️ Ne JAMAIS réécrire une heure en dur ailleurs : ajouter ici, et laisser
// les surfaces dériver. Un test (`openingHours.test.ts`) échoue si le balisage
// de `index.html` diverge de ce module.

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayRange {
  /** Ouverture, 'HH:MM' 24 h. */
  open: string;
  /** Fermeture, 'HH:MM' 24 h. */
  close: string;
}

/** Une plage par jour ; `null` = fermé. */
export type WeeklyHours = Record<DayIndex, DayRange | null>;

/**
 * Horaires de PessÓra (relevé du 19/09/2026 : l'enseigne du bar).
 * Le lundi est distinct du reste de la semaine — c'est ce jour-là qui casse
 * l'ancien modèle « semaine / samedi / dimanche ».
 */
export const OPENING_HOURS: WeeklyHours = {
  0: null, // dimanche : fermé
  1: { open: '16:00', close: '19:00' }, // lundi
  2: { open: '10:00', close: '19:00' },
  3: { open: '10:00', close: '19:00' },
  4: { open: '10:00', close: '19:00' },
  5: { open: '10:00', close: '19:00' },
  6: { open: '09:00', close: '14:00' }, // samedi
};

const DAY_NAMES: Record<DayIndex, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

/** Ordre d'affichage : lundi → dimanche (la semaine française commence lundi). */
const DISPLAY_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDayRange(value: unknown): value is DayRange {
  if (!value || typeof value !== 'object') return false;
  const { open, close } = value as Partial<DayRange>;
  return typeof open === 'string' && typeof close === 'string' && HHMM.test(open) && HHMM.test(close);
}

/** Vrai si l'objet porte les 7 jours et que chaque jour est une plage valide ou `null`. */
export function isWeeklyHours(value: unknown): value is WeeklyHours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return DISPLAY_ORDER.every((day) => {
    const entry = record[String(day)];
    return entry === null || isDayRange(entry);
  });
}

export interface ResolvedHours {
  hours: WeeklyHours;
  source: 'base' | 'modele';
}

/**
 * Rend les horaires à utiliser : la base si elle est complète et valide,
 * sinon le modèle du module. Une base incomplète est SIGNALÉE, jamais absorbée
 * en silence (une valeur d'horaires fausse se voit chez la cliente).
 */
export function resolveOpeningHours(base?: unknown): ResolvedHours {
  if (base == null) return { hours: OPENING_HOURS, source: 'modele' };
  if (isWeeklyHours(base)) return { hours: base, source: 'base' };
  console.warn(
    '[horaires] `bar_settings.opening_hours` est incomplet ou mal formé — horaires du modèle utilisés. ' +
      'Corriger la base : 7 jours (0 = dimanche), chaque plage en HH:MM, ou null si fermé.',
  );
  return { hours: OPENING_HOURS, source: 'modele' };
}

/** '16:00' → '16h00', '09:00' → '09h00' (la forme écrite sur le panneau du bar). */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return `${String(Number(h)).padStart(2, '0')}h${m}`;
}

/** { open: '16:00', close: '19:00' } → '16h00 - 19h00' ; `null` → 'Fermé'. */
export function formatRange(range: DayRange | null): string {
  return range ? `${formatTime(range.open)} - ${formatTime(range.close)}` : 'Fermé';
}

export interface HoursLine {
  label: string;
  value: string;
}

function sameRange(a: DayRange | null, b: DayRange | null): boolean {
  if (a === null || b === null) return a === b;
  return a.open === b.open && a.close === b.close;
}

/**
 * Lignes d'affichage, regroupées automatiquement : deux jours consécutifs qui
 * ouvrent aux mêmes heures donnent une seule ligne (« Mardi au vendredi »).
 * Rien à écrire à la main — le regroupement suit les valeurs.
 */
export function displayLines(hours: WeeklyHours = OPENING_HOURS): HoursLine[] {
  const lines: HoursLine[] = [];
  let group: DayIndex[] = [];

  const flush = () => {
    if (group.length === 0) return;
    const first = group[0];
    const last = group[group.length - 1];
    const label =
      group.length === 1
        ? DAY_NAMES[first]
        : `${DAY_NAMES[first]} au ${DAY_NAMES[last].toLowerCase()}`;
    lines.push({ label, value: formatRange(hours[first]) });
    group = [];
  };

  for (const day of DISPLAY_ORDER) {
    if (group.length > 0 && !sameRange(hours[group[0]], hours[day])) flush();
    group.push(day);
  }
  flush();

  return lines;
}

/** Plage du jour demandé (défaut : aujourd'hui). `null` = fermé. */
export function todayRange(hours: WeeklyHours = OPENING_HOURS, date: Date = new Date()): DayRange | null {
  return hours[date.getDay() as DayIndex];
}

export interface PickupSlot {
  label: string;
  /** 'HH:MM' — envoyé avec la commande. */
  value: string;
}

const SLOT_INTERVAL_MINUTES = 15;

/** Créneaux de retrait du jour, dérivés de la plage du jour. `[]` si fermé. */
export function buildPickupSlots(
  hours: WeeklyHours = OPENING_HOURS,
  date: Date = new Date(),
  stepMinutes: number = SLOT_INTERVAL_MINUTES,
): PickupSlot[] {
  const range = todayRange(hours, date);
  if (!range) return [];

  const [startH, startM] = range.open.split(':').map(Number);
  const [endH, endM] = range.close.split(':').map(Number);

  const slots: PickupSlot[] = [];
  for (let m = startH * 60 + startM; m <= endH * 60 + endM; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push({
      label: `${h}h${min > 0 ? min : ''}`,
      value: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
    });
  }
  return slots;
}

/** Réponse du PessoBot sur les horaires — construite, jamais recopiée. */
export function chatbotHoursText(hours: WeeklyHours = OPENING_HOURS): string {
  const lines = DISPLAY_ORDER.map((day) =>
    hours[day] === null
      ? `${DAY_NAMES[day]} : fermé`
      : `${DAY_NAMES[day]} : ${formatRange(hours[day])}`,
  );
  return `Nous sommes ouverts :\n\n${lines.join('\n')}`;
}
