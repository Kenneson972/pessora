import type { LucideIcon } from 'lucide-react';
import {
  Dumbbell,
  Droplets,
  Milk,
  Sparkles,
  Sparkle,
  Zap,
  Leaf,
  Wheat,
} from 'lucide-react';
import type { MenuItem } from '../data/menuData';

/** Icônes catégories menu (cohérent avec la home). */
export const categoryLucide: Record<MenuItem['category'], LucideIcon> = {
  wellness: Sparkles,
  energie: Zap,
  shakes: Milk,
  coffee: Sparkle,
};

export const boosterLucide: Record<string, LucideIcon> = {
  collagene: Sparkles,
  creatine: Dumbbell,
  proteine: Milk,
  electrolytes: Zap,
  fibres: Leaf,
  'aloe-vera': Droplets,
};

const milkLucide: Record<string, LucideIcon> = {
  avoine: Wheat,
  amandes: Sparkle,
  coco: Droplets,
  riz: Wheat,
};

export function MilkOptionIcon({ id }: { id: string }) {
  const Icon = milkLucide[id] ?? Milk;
  return <Icon className="h-8 w-8" strokeWidth={1.25} aria-hidden />;
}
