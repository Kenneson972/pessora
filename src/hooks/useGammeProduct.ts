// src/hooks/useGammeProduct.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GammeProduct } from '../types/database';

export function useGammeProduct(
  gamme: string | undefined,
  slug: string | undefined,
): { product: GammeProduct | null; loading: boolean; error: string | null } {
  const [product, setProduct] = useState<GammeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gamme || !slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', gamme)
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
      .then(
        ({
          data,
          error: err,
        }: {
          data: GammeProduct | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (err) {
            setError(err.message);
            setProduct(null);
          } else {
            setProduct(data);
          }
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme, slug]);

  return { product, loading, error };
}
