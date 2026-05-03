import { boosters, milkOptions, type MenuItem } from '../data/menuData';

const NEEDS_MILK = (cat: string) => cat === 'shakes' || cat === 'coffee';

export function buildDrinkCartOptions(
  drink: MenuItem,
  milkId: string,
  boosterIds: string[],
  sizePrice?: number,
): { optionsKey: string; optionLabels: string[]; unitPrice: number } {
  const milk = milkOptions.find((m) => m.id === milkId);
  const sortedBoost = [...boosterIds].sort();
  const hasMilk = NEEDS_MILK(drink.category);
  const optionsKey = hasMilk ? `milk:${milkId}|boost:${sortedBoost.join(',')}` : `boost:${sortedBoost.join(',')}`;
  const optionLabels: string[] = [];
  if (hasMilk) {
    optionLabels.push(`Lait : ${milk?.name ?? milkId}`);
  }
  for (const id of sortedBoost) {
    const b = boosters.find((x) => x.id === id);
    if (b) optionLabels.push(`+ ${b.name}`);
  }
  const basePrice = sizePrice ?? drink.price;
  const unitPrice = basePrice + boosterIds.length * 1;
  return { optionsKey, optionLabels, unitPrice };
}
