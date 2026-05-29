import { menuItems as staticMenuItems } from '../data/menuData';
import type { MenuItem } from '../data/menuData';
import { supabase } from './supabaseClient';
import type { Product } from '../types/database';

type CatalogCache = {
  items: MenuItem[];
  source: 'supabase' | 'fallback';
  at: number;
};

let cache: CatalogCache | null = null;
const TTL_MS = 120_000;

export function invalidateMenuCatalogCache(): void {
  cache = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pessora:products-changed'));
  }
}

const MENU_CATEGORY_KEYS: MenuItem['category'][] = ['wellness', 'energie', 'shakes', 'coffee'];

/** Normalise la catégorie BDD → clé menu (évite produits « orphelins » si typo / valeur hors enum). */
export function normalizeMenuCategory(raw: string | null | undefined): MenuItem['category'] | null {
  const c = (raw ?? '').trim().toLowerCase();
  if (MENU_CATEGORY_KEYS.includes(c as MenuItem['category'])) return c as MenuItem['category'];
  const aliases: Record<string, MenuItem['category']> = {
    'énergie': 'energie',
    'energie_drink': 'energie',
    'energy': 'energie',
    shake: 'shakes',
    shakes_proteines: 'shakes',
    cafe: 'coffee',
    café: 'coffee',
  };
  const mapped = aliases[c];
  return mapped ?? null;
}

export function productRowToMenuItem(p: Product): MenuItem | null {
  const category = normalizeMenuCategory(p.category);
  if (!category) {
    if (import.meta.env.DEV) {
      console.warn('[menuCatalog] catégorie ignorée pour produit', p.slug ?? p.id, ':', p.category);
    }
    return null;
  }
  const rawBadges = p.badges ?? [];
  const badges = rawBadges.filter((b): b is NonNullable<MenuItem['badges']>[number] =>
    b === 'vegan' || b === 'glutenfree' || b === 'vitamins'
  );
  return {
    id: p.slug ?? p.id,
    name: p.name,
    description: p.description ?? '',
    category,
    price: p.price ?? 0,
    price_small: p.price_small ?? undefined,
    price_medium: p.price_medium ?? undefined,
    price_large: p.price_large ?? undefined,
    calories: p.calories ?? undefined,
    protein: p.protein ?? undefined,
    ingredients: p.ingredients ?? [],
    benefits: p.benefits ?? [],
    pitch: p.pitch ?? '',
    icon: p.icon_emoji ?? undefined,
    badges: badges.length ? badges : undefined,
    gallery: (p as any).gallery ?? [],
  };
}

/**
 * Carrousel / vitrine : préfère la ligne Supabase ; si la catégorie est hors enum,
 * retombe sur l’entrée `menuData` du même slug pour ne pas perdre la slide (sinon fallback statique incomplet).
 */
export function resolveMenuItemFromProduct(p: Product): MenuItem | null {
  const fromDb = productRowToMenuItem(p);
  if (fromDb) return fromDb;
  const slug = p.slug?.trim();
  if (!slug) return null;
  const fallback = staticMenuItems.find((m) => m.id === slug);
  if (fallback && import.meta.env.DEV) {
    console.warn('[menuCatalog] carrousel : fallback menuData pour slug', slug, '(catégorie BDD non reconnue ?)');
  }
  return fallback ?? null;
}

/** Charge le menu : Supabase si disponible, sinon données locales (fallback). */
export async function loadMenuCatalog(): Promise<{ items: MenuItem[]; source: 'supabase' | 'fallback' }> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return { items: cache.items, source: cache.source };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error || !data?.length) {
    if (import.meta.env.DEV && error) console.warn('[menuCatalog]', error.message);
    cache = { items: staticMenuItems, source: 'fallback', at: Date.now() };
    return { items: staticMenuItems, source: 'fallback' };
  }

  const items = (data as Product[]).flatMap((p) => {
    const row = productRowToMenuItem(p);
    return row ? [row] : [];
  });
  if (items.length === 0) {
    if (import.meta.env.DEV) console.warn('[menuCatalog] aucun produit avec catégorie reconnue — fallback statique');
    cache = { items: staticMenuItems, source: 'fallback', at: Date.now() };
    return { items: staticMenuItems, source: 'fallback' };
  }
  cache = { items, source: 'supabase', at: Date.now() };
  return { items, source: 'supabase' };
}
