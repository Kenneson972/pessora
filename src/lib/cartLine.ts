import { boosters, milkOptions, type MenuItem } from '../data/menuData';

/** Lait personnalisable : coffee uniquement (plus de choix lait sur les shakes). */
const needsMilkChoice = (category: MenuItem['category']) => category === 'coffee';

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
  const unitPrice = basePrice + boosterIds.length * 1;
  return { optionsKey, optionLabels, unitPrice, barBasePublic: basePrice };
}
