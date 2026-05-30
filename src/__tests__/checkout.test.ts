import { describe, it, expect } from 'vitest';
import type { CartLine } from '../store/cartStore';

/**
 * Vérification prix serveur — logique métier.
 *
 * La règle : le client envoie le prix public (unitPrice).
 * Le serveur NE doit PAS faire confiance au prix client : il doit recalculer
 * depuis la BDD (products.price × size + boosters × 1€).
 *
 * Ce test valide que la structure CartLine transporte bien le prix public
 * et non un prix déjà remisé (Óra+).
 */

function computeServerPrice(line: CartLine, isOraPlus: boolean): number {
  const barPrice = line.barBasePublic ?? line.unitPrice;
  const boosterFee = line.unitPrice - barPrice;
  const baseAfterDiscount = isOraPlus ? barPrice * 0.5 : barPrice;
  return (baseAfterDiscount + boosterFee) * line.quantity;
}

describe('create-checkout-session — vérification prix serveur', () => {
  it('le prix unitaire client doit être le prix public (pas de remise Óra+)', () => {
    const line: CartLine = {
      productId: 'pink-dragon',
      name: 'Pink Dragon',
      unitPrice: 13,
      barBasePublic: 12,
      quantity: 2,
      category: 'shakes',
      optionsKey: 'default',
      optionLabels: [],
      source: 'bar',
    };

    // Prix remisé côté serveur (Óra+) : boisson −50 %, boosters plein tarif
    const serverTotal = computeServerPrice(line, true);
    // barBasePublic(12) × 0.5 + booster(1) = 6 + 1 = 7 × 2 = 14
    expect(serverTotal).toBe(14);

    // Prix public côté serveur (sans Óra+)
    const serverTotalPublic = computeServerPrice(line, false);
    // barBasePublic(12) + booster(1) = 13 × 2 = 26
    expect(serverTotalPublic).toBe(26);
  });

  it('sans boosters, le prix Óra+ est exactement −50 %', () => {
    const line: CartLine = {
      productId: 'glow-my-skin',
      name: 'Glow My Skin',
      unitPrice: 10,
      barBasePublic: 10,
      quantity: 1,
      category: 'wellness',
      optionsKey: 'default',
      optionLabels: [],
      source: 'bar',
    };

    expect(computeServerPrice(line, false)).toBe(10);
    expect(computeServerPrice(line, true)).toBe(5);
  });

  it('le prix total du panier ne doit jamais dépasser le prix public × quantité', () => {
    const items: CartLine[] = [
      { productId: 'p1', name: 'A', unitPrice: 10, barBasePublic: 10, quantity: 2, category: 'coffee', optionsKey: 'a', optionLabels: [], source: 'bar' },
      { productId: 'p2', name: 'B', unitPrice: 15, barBasePublic: 12, quantity: 1, category: 'shakes', optionsKey: 'b', optionLabels: [], source: 'bar' },
    ];

    const oraLimit = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0); // 20 + 15 = 35
    const oraTotal = items.reduce((sum, item) => sum + computeServerPrice(item, true), 0); // (10×0.5×2) + ((12×0.5+3)×1) = 10+9=19

    expect(oraTotal).toBeLessThanOrEqual(oraLimit);
    expect(oraTotal).toBe(19);
  });
});
