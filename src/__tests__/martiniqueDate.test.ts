import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayInMartinique } from '../lib/martiniqueDate';

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
