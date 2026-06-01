import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE = 'https://pessora.mq';

interface SlugRow { slug: string; updated_at?: string; image_url?: string | null }
interface GammeSlugRow { slug: string; gamme: string; updated_at?: string; image_url?: string | null }

async function main() {
  const [productsRes, eventsRes, gammeProductsRes] = await Promise.all([
    supabase.from('products').select('slug,updated_at,image_url').eq('active', true).not('slug', 'is', null) as any,
    supabase.from('events').select('slug,updated_at').eq('active', true).not('slug', 'is', null) as any,
    supabase.from('gamme_products').select('slug,gamme,updated_at,image_url').eq('active', true).not('slug', 'is', null) as any,
  ]);

  const productSlugs = (productsRes.data || []) as SlugRow[];
  const eventSlugs = (eventsRes.data || []) as SlugRow[];
  const gammeProducts = (gammeProductsRes.data || []) as GammeSlugRow[];

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', priority: '1', changefreq: 'weekly' },
    { loc: '/concept', priority: '0.8', changefreq: 'monthly' },
    { loc: '/menu', priority: '0.9', changefreq: 'weekly' },
    { loc: '/nos-produits', priority: '0.85', changefreq: 'weekly' },
    { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
    { loc: '/contact-partenariat', priority: '0.65', changefreq: 'monthly' },
    { loc: '/evenements', priority: '0.85', changefreq: 'weekly' },
    { loc: '/bilan-bien-etre', priority: '0.75', changefreq: 'monthly' },
    { loc: '/ora-plus', priority: '0.75', changefreq: 'monthly' },
    { loc: '/pessobot', priority: '0.6', changefreq: 'monthly' },
    { loc: '/connexion', priority: '0.4', changefreq: 'yearly' },
    { loc: '/inscription', priority: '0.4', changefreq: 'yearly' },
    { loc: '/mentions-legales', priority: '0.3', changefreq: 'yearly' },
    { loc: '/politique-confidentialite', priority: '0.35', changefreq: 'yearly' },
    { loc: '/cgv', priority: '0.35', changefreq: 'yearly' },
  ];

  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod: string; image?: string }> = staticPages.map(s => ({ ...s, lastmod: today }));

  for (const { slug, updated_at, image_url } of productSlugs) {
    urls.push({ loc: `/menu/${slug}`, priority: '0.7', changefreq: 'weekly', lastmod: (updated_at ?? today).split('T')[0], image: image_url ?? undefined });
  }

  for (const { slug, updated_at } of eventSlugs) {
    urls.push({ loc: `/evenements/${slug}`, priority: '0.7', changefreq: 'monthly', lastmod: (updated_at ?? today).split('T')[0] });
  }

  for (const { slug, gamme, updated_at, image_url } of gammeProducts) {
    urls.push({ loc: `/nos-produits/${gamme}/${slug}`, priority: '0.65', changefreq: 'weekly', lastmod: (updated_at ?? today).split('T')[0], image: image_url ?? undefined });
  }

  // Pages gamme (sans slug produit)
  const rangeKeys = [...new Set(gammeProducts.map((g) => g.gamme).filter(Boolean))];
  for (const r of rangeKeys) {
    urls.push({ loc: `/nos-produits/${r}`, priority: '0.75', changefreq: 'weekly', lastmod: today });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls.map(u => {
      const img = u.image ? `<image:image><image:loc>${u.image}</image:loc></image:image>` : '';
      return `  <url><loc>${BASE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${img}</url>`;
    }),
    '</urlset>',
    '',
  ].join('\n');

  const outPath = path.resolve(import.meta.dirname!, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`sitemap.xml généré : ${urls.length} URLs → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
