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
