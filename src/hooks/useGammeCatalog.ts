import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { rangesData } from '../data/productsData';
import type { GammeProduct } from '../types/database';

function getStaticProducts(gamme: 'sport' | 'skin' | 'wellness'): GammeProduct[] {
  const range = rangesData[gamme];
  if (!range) return [];
  return range.products.map((p, i) => ({
    id: `static-${gamme}-${i}`,
    gamme,
    subcategory: null,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price.replace('€', '').replace(' / ', '/').split('/')[0].trim()),
    price_alt: p.price.includes('/')
      ? parseFloat(p.price.split('/')[1].replace('€', '').trim())
      : null,
    active: true,
    image_url: null,
    sort_order: i,
    created_at: '',
  }));
}

export function useGammeCatalog(gamme: 'sport' | 'skin' | 'wellness') {
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'supabase' | 'fallback' | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', gamme)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(
        ({
          data,
          error,
        }: {
          data: GammeProduct[] | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (error || !data?.length) {
            if (import.meta.env.DEV && error) {
              console.warn('[useGammeCatalog] fallback statique —', error.message);
            }
            setProducts(getStaticProducts(gamme));
            setSource('fallback');
          } else {
            setProducts(data);
            setSource('supabase');
          }
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme]);

  return { products, loading, source };
}
