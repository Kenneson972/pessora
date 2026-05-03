/**
 * Prix indicatifs Óra+ — alignés sur le messaging (jusqu’à -50 % sur les boissons).
 * Les montants réels peuvent varier ; la fiche boisson et la page Óra+ restent la référence.
 */
export const ORA_PLUS_MAX_DRINK_DISCOUNT = 0.5;

export function oraMemberUnitPrice(publicUnitPrice: number): number {
  return Math.round(publicUnitPrice * (1 - ORA_PLUS_MAX_DRINK_DISCOUNT) * 100) / 100;
}

export function formatEurFr(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
}
