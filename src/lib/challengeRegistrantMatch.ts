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
