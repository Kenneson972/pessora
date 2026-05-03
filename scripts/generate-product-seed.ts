/**
 * Génère le SQL d’upsert des produits depuis menuData + homeProductCarousel.
 * Usage : npx tsx scripts/generate-product-seed.ts > supabase/migrations/20260420111000_seed_products_from_menu.sql
 */
import { menuItems, type MenuItem } from '../src/data/menuData';
import { homeProductCarousel } from '../src/data/homeProductCarousel';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function arrSql(a: string[]): string {
  if (a.length === 0) return 'ARRAY[]::text[]';
  return `ARRAY[${a.map((x) => `'${esc(x)}'`).join(', ')}]::text[]`;
}

const carouselMeta = new Map<
  string,
  { sort: number; badge: string | null; image: string | null }
>();
homeProductCarousel.forEach((e, idx) => {
  carouselMeta.set(e.id, {
    sort: idx + 1,
    badge: e.badge ?? null,
    image: e.imageSrc ?? null,
  });
});

const rows = menuItems.map((item: MenuItem) => {
  const c = carouselMeta.get(item.id);
  const imageUrl = c?.image ?? null;
  const carouselSort = c ? c.sort : null;
  const carouselBadge = c?.badge ?? null;
  const badges = item.badges ?? [];

  return `(
  '${esc(item.id)}',
  '${esc(item.name)}',
  '${esc(item.category)}',
  ${item.price},
  ${item.calories ?? 'NULL'},
  ${item.protein ?? 'NULL'},
  '${esc(item.description)}',
  ${arrSql(item.ingredients)},
  ${arrSql(item.benefits)},
  '${esc(item.pitch)}',
  ${item.icon ? `'${esc(item.icon)}'` : 'NULL'},
  ${imageUrl ? `'${esc(imageUrl)}'` : 'NULL'},
  true,
  ${carouselSort ?? 'NULL'},
  ${carouselBadge ? `'${esc(carouselBadge)}'` : 'NULL'},
  ${arrSql(badges as string[])}
)`;
});

const sql = `-- Seed / upsert catalogue depuis menuData + homeProductCarousel (généré)
INSERT INTO public.products (
  slug,
  name,
  category,
  price,
  calories,
  protein,
  description,
  ingredients,
  benefits,
  pitch,
  icon_emoji,
  image_url,
  active,
  carousel_sort,
  carousel_badge,
  badges
) VALUES
${rows.join(',\n')}
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  description = EXCLUDED.description,
  ingredients = EXCLUDED.ingredients,
  benefits = EXCLUDED.benefits,
  pitch = EXCLUDED.pitch,
  icon_emoji = EXCLUDED.icon_emoji,
  image_url = COALESCE(EXCLUDED.image_url, public.products.image_url),
  active = EXCLUDED.active,
  carousel_sort = EXCLUDED.carousel_sort,
  carousel_badge = EXCLUDED.carousel_badge,
  badges = EXCLUDED.badges;
`;

console.log(sql);
