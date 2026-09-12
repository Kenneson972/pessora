/**
 * Format a date string with full information (year included)
 * Appends T00:00:00 so JS parses as local time (Martinique UTC-4), not UTC midnight
 * Example: "2026-09-15" → "jeudi 15 septembre 2026"
 */
export const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

/**
 * Format a date string without year
 * Appends T00:00:00 so JS parses as local time (Martinique UTC-4), not UTC midnight
 * Example: "2026-09-15" → "jeudi 15 septembre"
 */
export const formatDateShort = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
