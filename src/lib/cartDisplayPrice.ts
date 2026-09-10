import { oraMemberUnitPrice } from './oraPricing';
import { BOOSTER_PRICE_EUR } from '../data/menuData';

/** Nombre de boosters encodés dans `optionsKey` (segments `boost:…`). */
export function boosterCountFromOptionsKey(optionsKey: string): number {
  const m = optionsKey.match(/(?:^|\|)boost:([^|]*)/);
  if (!m?.[1]) return 0;
  return m[1].split(',').filter(Boolean).length;
}

/**
 * Prix unitaire affiché / facturé côté client pour une ligne bar :
 * - public si pas Óra+
 * - base boisson remisée + boosters au prix bar si Óra+
 *
 * `unitPrice` en magasin est toujours le tarif **public** (base + BOOSTER_PRICE_EUR × boosters).
 * `barBasePublic` = base taille seule (sans boosters), si disponible.
 */
export function displayBarLineUnit(
  line: {
    unitPrice: number;
    source: 'bar' | 'gamme';
    barBasePublic?: number;
    optionsKey: string;
  },
  isOraPlus: boolean,
): number {
  if (line.source !== 'bar' || !isOraPlus) return line.unitPrice;
  const n = boosterCountFromOptionsKey(line.optionsKey);
  const base = line.barBasePublic ?? Math.max(0, line.unitPrice - n * BOOSTER_PRICE_EUR);
  return oraMemberUnitPrice(base) + n * BOOSTER_PRICE_EUR;
}
