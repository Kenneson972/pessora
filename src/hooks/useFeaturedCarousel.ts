import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { HomeCarouselCard } from '../types/homeCarousel';

export function useFeaturedCarousel() {
  const [cards, setCards] = useState<HomeCarouselCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('home_carousel_cards')
        .select('*')
        .eq('active', true)
        .order('position', { ascending: true });
      if (!cancelled) {
        setCards(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { cards, loading };
}
