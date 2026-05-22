import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { splitGammesData } from '../data/homeSplitGammes';

export interface SplitGammeRow {
  id: string;
  key: string;
  position: number;
  label: string;
  eyebrow: string;
  title: string;
  link_to: string;
  main_image_url: string | null;
  side_image_1_url: string | null;
  side_image_2_url: string | null;
}

export function useSplitGammes(): { gammes: SplitGammeRow[]; loading: boolean } {
  const [gammes, setGammes] = useState<SplitGammeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from('home_split_gammes')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }: { data: SplitGammeRow[] | null; error: unknown }) => {
        if (error || !data || data.length === 0) {
          setGammes(
            splitGammesData.map((g, i) => ({
              id: g.key,
              key: g.key,
              position: i + 1,
              label: g.label,
              eyebrow: g.eyebrow,
              title: g.title,
              link_to: g.linkTo,
              main_image_url: g.mainImage,
              side_image_1_url: g.sideImages[0],
              side_image_2_url: g.sideImages[1],
            }))
          );
        } else {
          setGammes(data);
        }
        setLoading(false);
      });
  }, []);

  return { gammes, loading };
}
