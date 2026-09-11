import { describe, it, expect } from 'vitest';
import { slotChallengeLabel, type BilanSlotLike, type ChallengeEventLike } from '../lib/slotChallengeLabel';

const TODAY = '2026-09-11';

function slot(overrides: Partial<BilanSlotLike> = {}): BilanSlotLike {
  return { challenge_event_id: 'c1', ...overrides };
}

function challenge(overrides: Partial<ChallengeEventLike> = {}): ChallengeEventLike {
  return { id: 'c1', title: 'TEST-KEN Challenge', date: '2026-09-15', active: true, ...overrides };
}

describe('slotChallengeLabel', () => {
  it('créneau orphelin', () => {
    expect(slotChallengeLabel(slot({ challenge_event_id: null }), [], TODAY))
      .toBe('Orphelin — hors de la fenêtre d’un challenge actif (J-14 → J)');
  });

  it('challenge introuvable (id orphelin de fait)', () => {
    expect(slotChallengeLabel(slot({ challenge_event_id: 'inconnu' }), [challenge()], TODAY))
      .toBe('Rattaché (challenge introuvable)');
  });

  it('challenge actif, dans la fenêtre J-14 → J', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], TODAY))
      .toBe('→ TEST-KEN Challenge');
  });

  it('challenge désactivé', () => {
    expect(slotChallengeLabel(slot(), [challenge({ active: false })], TODAY))
      .toBe('→ TEST-KEN Challenge (désactivé — invisible publiquement)');
  });

  it('challenge actif mais hors fenêtre J-14 → J (trop tôt)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-12-25' })], TODAY))
      .toBe('→ TEST-KEN Challenge (hors fenêtre — pas encore réservable)');
  });

  it('window boundary: exactly at J-14 (window opens)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], '2026-09-01'))
      .toBe('→ TEST-KEN Challenge');
  });

  it('window boundary: exactly at J (window closes)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], '2026-09-15'))
      .toBe('→ TEST-KEN Challenge');
  });

  it('window boundary: one day before J-14 (before window opens)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], '2026-08-31'))
      .toBe('→ TEST-KEN Challenge (hors fenêtre — pas encore réservable)');
  });

  it('window boundary: one day after J (after window closes)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], '2026-09-16'))
      .toBe('→ TEST-KEN Challenge (hors fenêtre — pas encore réservable)');
  });
});
