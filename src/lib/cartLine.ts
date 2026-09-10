import { boosters, milkOptions, BOOSTER_PRICE_EUR, type MenuItem } from '../data/menuData';

/** Lait personnalisable : coffee uniquement (plus de choix lait sur les shakes). */
const needsMilkChoice = (category: MenuItem['category']) => category === 'coffee';

export type SizeKey = 'small' | 'medium' | 'large';

/**
 * Tailles vendables pour un produit : prix renseigné ET taille non archivée
 * (`price_X_active`, admin — voir AdminProductForm.tsx). Une taille archivée
 * n'apparaît jamais côté client, même si son prix est encore en base.
 */
export function getAvailableSizes(item: {
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  price_small_active?: boolean;
  price_medium_active?: boolean;
  price_large_active?: boolean;
}): { size: SizeKey; price: number }[] {
  const candidates: { size: SizeKey; price?: number; active?: boolean }[] = [
    { size: 'small', price: item.price_small, active: item.price_small_active },
    { size: 'medium', price: item.price_medium, active: item.price_medium_active },
    { size: 'large', price: item.price_large, active: item.price_large_active },
  ];
  return candidates
    .filter((c): c is { size: SizeKey; price: number; active?: boolean } => c.price != null && c.active !== false)
    .map((c) => ({ size: c.size, price: c.price }));
}

export function buildDrinkCartOptions(
  drink: MenuItem,
  milkId: string,
  boosterIds: string[],
  sizePrice?: number,
  size?: 'small' | 'medium' | 'large',
): { optionsKey: string; optionLabels: string[]; unitPrice: number; barBasePublic: number } {
  const milk = milkOptions.find((m) => m.id === milkId);
  const sortedBoost = [...boosterIds].sort();
  const hasMilk = needsMilkChoice(drink.category);
  const parts: string[] = [];
  if (hasMilk) parts.push(`milk:${milkId}`);
  parts.push(`boost:${sortedBoost.join(',')}`);
  if (size) parts.push(`size:${size}`);
  const optionsKey = parts.join('|');
  const optionLabels: string[] = [];
  if (hasMilk) {
    optionLabels.push(`Lait : ${milk?.name ?? milkId}`);
  }
  for (const id of sortedBoost) {
    const b = boosters.find((x) => x.id === id);
    if (b) optionLabels.push(`+ ${b.name}`);
  }
  if (size) {
    const sizeLabel = size === 'small' ? 'Petit' : size === 'medium' ? 'Moyen' : 'Grand';
    optionLabels.push(`Taille : ${sizeLabel}`);
  }
  const basePrice = sizePrice ?? drink.price;
  const unitPrice = basePrice + boosterIds.length * BOOSTER_PRICE_EUR;
  return { optionsKey, optionLabels, unitPrice, barBasePublic: basePrice };
}
