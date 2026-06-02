import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { HomeCarouselCard } from '../types/homeCarousel';

export function useFeaturedCarousel() {
  const [cards, setCards] = useState<HomeCarouselCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cardsData }, { data: settingsData }] = await Promise.all([
        (supabase as any)
          .from('home_carousel_cards')
          .select('*')
          .eq('active', true)
          .order('position', { ascending: true }),
        (supabase as any)
          .from('home_featured_settings')
          .select('active')
          .maybeSingle(),
      ]);
      if (!cancelled) {
        setCards(cardsData ?? []);
        setEnabled(settingsData?.active ?? true);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { cards, loading, enabled };
}
