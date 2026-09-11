export interface BilanSlotLike {
  challenge_event_id: string | null;
}

export interface ChallengeEventLike {
  id: string;
  title: string;
  date: string;
  active: boolean;
}

/** Fenêtre de recevabilité d'un challenge : J-14 → J (même règle que fn_bilan_slot_bookable en base). */
function isWithinBookingWindow(challengeDate: string, todayStr: string): boolean {
  const challenge = new Date(challengeDate + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const windowStart = new Date(challenge);
  windowStart.setDate(windowStart.getDate() - 14);
  return today >= windowStart && today <= challenge;
}

/**
 * État lisible du rattachement d'un créneau — un créneau orphelin ne doit
 * jamais disparaître en silence (exigence cliente). Distingue désormais
 * "désactivé" (active=false) de "hors fenêtre" (actif mais la date du
 * challenge ne couvre pas encore/plus ce créneau), au lieu d'un seul
 * libellé `→ titre` qui ne disait pas si le créneau était réellement
 * réservable côté public.
 */
export function slotChallengeLabel(
  slot: BilanSlotLike,
  challenges: ChallengeEventLike[],
  todayStr: string,
): string {
  if (!slot.challenge_event_id) {
    return 'Orphelin — hors de la fenêtre d’un challenge actif (J-14 → J)';
  }

  const challenge = challenges.find((c) => c.id === slot.challenge_event_id);
  if (!challenge) {
    return 'Rattaché (challenge introuvable)';
  }

  if (!challenge.active) {
    return `→ ${challenge.title} (désactivé — invisible publiquement)`;
  }

  if (!isWithinBookingWindow(challenge.date, todayStr)) {
    return `→ ${challenge.title} (hors fenêtre — pas encore réservable)`;
  }

  return `→ ${challenge.title}`;
}
