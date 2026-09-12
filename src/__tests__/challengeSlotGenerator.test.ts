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
