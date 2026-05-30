import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface HomeBannerData {
  id: number;
  title: string;
  subtitle: string;
  image_url: string | null;
  updated_at: string;
}

export function useHomeBanner() {
  const [data, setData] = useState<HomeBannerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: row, error } = await (supabase as any)
      .from('home_banner')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && row) setData(row as HomeBannerData);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

export async function updateHomeBanner(payload: { title: string; subtitle: string; image_url?: string | null }) {
  const { error } = await (supabase as any)
    .from('home_banner')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}
