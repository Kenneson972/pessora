/**
 * Miroir client de public.normalize_phone() (migration
 * 20260911100000_lot_a_challenge_bilan_server_guards.sql) : chiffres
 * seuls, 9 derniers conservés. Sert à valider à la saisie AVANT l'envoi
 * (le serveur reste la garantie finale — voir P0003 dans bilanErrors.ts).
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-9);
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).length === 9;
}
