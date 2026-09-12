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

  it('rend null si le telephone de l\'inscrit est vide', () => {
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
