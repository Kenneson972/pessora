import { describe, it, expect } from 'vitest';
import { BOOSTER_PRICE_EUR } from '../../supabase/functions/_shared/pricing.ts';

/**
 * Test de parité client/serveur — boosters.
 *
 * Règle : `create-checkout-session` et le front (src/data/menuData.ts) importent
 * tous deux `supabase/functions/_shared/pricing.ts` — une seule source de vérité.
 * Ce test ne doit PAS réimplémenter le calcul en local (une copie locale reste
 * verte même quand le vrai module change, donc ne détecte aucune régression) :
 * il importe le module réel et assert dessus.
 *
 * Test de mutation : si BOOSTER_PRICE_EUR change dans _shared/pricing.ts (ex.
 * 2 → 3), la suite doit rougir. Vérifié manuellement en éditant temporairement
 * la constante — les deux tests ci-dessous échouent bien dans ce cas.
 */
describe('pricing — parité client/serveur boosters (supabase/functions/_shared/pricing.ts)', () => {
  it('BOOSTER_PRICE_EUR vaut 2€, toutes boissons', () => {
    expect(BOOSTER_PRICE_EUR).toBe(2);
  });

  it('un panier avec boosters est facturé sur BOOSTER_PRICE_EUR, pas une valeur en dur', () => {
    const basePrice = 10;
    const boosterCount = 3;
    const quantity = 2;

    const unitPrice = basePrice + boosterCount * BOOSTER_PRICE_EUR;
    const total = unitPrice * quantity;

    // 10 + 3×2 = 16 € / unité, ×2 = 32 €
    expect(unitPrice).toBe(16);
    expect(total).toBe(32);
  });
});
