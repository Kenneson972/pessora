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

const BASE = 'https://www.pessora.fr';

interface SlugRow { slug: string; created_at?: string; image_url?: string | null }
interface GammeSlugRow { slug: string; gamme: string; created_at?: string; image_url?: string | null }

async function main() {
  // NB: aucune des 3 tables n'a de colonne `updated_at` (seulement `created_at`) —
  // une requête sur une colonne inexistante échoue et Supabase renvoie data: null,
  // silencieusement ramené à [] plus bas si on ne vérifie pas `error` explicitement.
  const [productsRes, eventsRes, gammeProductsRes] = await Promise.all([
    supabase.from('products').select('slug,created_at,image_url').eq('active', true).not('slug', 'is', null) as any,
    supabase.from('events').select('slug,created_at').eq('active', true).not('slug', 'is', null) as any,
    supabase.from('gamme_products').select('slug,gamme,created_at,image_url').eq('active', true).not('slug', 'is', null) as any,
  ]);

  for (const [label, res] of [['products', productsRes], ['events', eventsRes], ['gamme_products', gammeProductsRes]] as const) {
    if (res.error) {
      console.error(`[generate-sitemap] requête ${label} en échec :`, res.error.message);
      process.exit(1);
    }
  }

  const productSlugs = (productsRes.data || []) as SlugRow[];
  const eventSlugs = (eventsRes.data || []) as SlugRow[];
  const gammeProducts = (gammeProductsRes.data || []) as GammeSlugRow[];

  const today = new Date().toISOString().split('T')[0];

  // Règle durable : uniquement des pages de CONTENU public ici — jamais une
  // page technique (auth, admin, interne) ni une route supprimée. Le fichier
  // est régénéré, pas édité à la main.
  const staticPages = [
    { loc: '/', priority: '1', changefreq: 'weekly' },
    { loc: '/concept', priority: '0.8', changefreq: 'monthly' },
    { loc: '/menu', priority: '0.9', changefreq: 'weekly' },
    { loc: '/nos-produits', priority: '0.85', changefreq: 'weekly' },
    { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
    { loc: '/contact-partenariat', priority: '0.65', changefreq: 'monthly' },
    { loc: '/evenements', priority: '0.85', changefreq: 'weekly' },
    { loc: '/pessobot', priority: '0.6', changefreq: 'monthly' },
    { loc: '/mentions-legales', priority: '0.3', changefreq: 'yearly' },
    { loc: '/politique-confidentialite', priority: '0.35', changefreq: 'yearly' },
    { loc: '/cgv', priority: '0.35', changefreq: 'yearly' },
  ];

  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod: string; image?: string }> = staticPages.map(s => ({ ...s, lastmod: today }));

  for (const { slug, created_at, image_url } of productSlugs) {
    urls.push({ loc: `/menu/${slug}`, priority: '0.7', changefreq: 'weekly', lastmod: (created_at ?? today).split('T')[0], image: image_url ?? undefined });
  }

  for (const { slug, created_at } of eventSlugs) {
    urls.push({ loc: `/evenements/${slug}`, priority: '0.7', changefreq: 'monthly', lastmod: (created_at ?? today).split('T')[0] });
  }

  for (const { slug, gamme, created_at, image_url } of gammeProducts) {
    urls.push({ loc: `/nos-produits/${gamme}/${slug}`, priority: '0.65', changefreq: 'weekly', lastmod: (created_at ?? today).split('T')[0], image: image_url ?? undefined });
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
  // Note: quand le site dépasse 50 000 URLs, générer un sitemap_index.xml
  // avec des sous-sitemaps par type : sitemap-pages.xml, sitemap-produits.xml, etc.
  console.log(`sitemap.xml généré : ${urls.length} URLs → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
