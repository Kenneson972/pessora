import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayInMartinique, startOfDayMartinique } from '../lib/martiniqueDate';

describe('todayInMartinique', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne la date du jour au format YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    expect(todayInMartinique()).toBe('2026-09-11');
  });

  it('reste sur le jour Martinique à 20h30 heure locale (23h30 UTC) — ne bascule pas au lendemain UTC', () => {
    vi.useFakeTimers();
    // 2026-09-11 23:30 UTC = 2026-09-11 19:30 heure de Martinique (UTC-4) : encore le 11.
    vi.setSystemTime(new Date('2026-09-11T23:30:00Z'));
    expect(todayInMartinique()).toBe('2026-09-11');
  });

  it('bascule au jour suivant seulement après minuit heure de Martinique (04h00 UTC)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T04:00:00Z'));
    expect(todayInMartinique()).toBe('2026-09-12');
  });
});

describe('startOfDayMartinique', () => {
  // Falsifiable : compare l'instant produit à sa lecture EN MARTINIQUE, pas
  // au littéral qui l'a construit — comparer startOfDayMartinique(x) au
  // littéral new Date(x + 'T00:00:00-04:00') comparerait le même littéral à
  // lui-même, et un offset faux (-05:00) passerait quand même au vert.
  // formatToParts plutôt que .format() : le séparateur horaire rendu par
  // 'fr-CA' varie selon la version d'ICU ('00:00' ou '00 h 00') — on
  // reconstruit nous-mêmes 'HH:MM' pour ne pas dépendre de ce détail.
  const hm = (d: Date) => {
    const parts = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Martinique',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23', // sans ça, certaines versions d'ICU rendent '24:00'
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('hour')}:${get('minute')}`;
  };

  it('vu depuis la Martinique, tombe exactement à 00:00', () => {
    const t = startOfDayMartinique('2026-09-16');
    expect(hm(t)).toBe('00:00');
  });

  it('1 ms avant, c’est encore la veille (23:59)', () => {
    const t = startOfDayMartinique('2026-09-16');
    expect(hm(new Date(t.getTime() - 1))).toContain('23:59');
  });

  it('est un instant absolu, identique en UTC (variante inattaquable)', () => {
    expect(startOfDayMartinique('2026-09-16').toISOString()).toBe('2026-09-16T04:00:00.000Z');
  });
});
