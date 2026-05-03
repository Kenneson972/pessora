import { useState, useEffect } from 'react';
import type { MenuItem } from '../data/menuData';
import { loadMenuCatalog } from '../lib/menuCatalog';
import { supabase } from '../lib/supabaseClient';

export interface SearchEvent {
  id: string;
  title: string;
  slug: string;
  date: string;
  type: string;
  heure: string | null;
}

export interface SearchProduct {
  id: string;
  name: string;
  category: string;
  price: number | null;
}

export interface SearchResults {
  boissons: MenuItem[];
  evenements: SearchEvent[];
  produits: SearchProduct[];
  loading: boolean;
}

export function useSearch(query: string): SearchResults {
  const [evenements, setEvenements] = useState<SearchEvent[]>([]);
  const [produits, setProduits] = useState<SearchProduct[]>([]);
  const [boissons, setBoissons] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      setEvenements([]);
      setProduits([]);
      setBoissons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const today = new Date().toISOString().split('T')[0];
    const ql = q.toLowerCase();

    const timer = setTimeout(async () => {
      const [evRes, prRes, catalog] = await Promise.all([
        db.from('events')
          .select('id,title,slug,date,type,heure')
          .ilike('title', `%${q}%`)
          .gte('date', today)
          .order('date')
          .limit(5),
        db.from('products')
          .select('id,name,category,price,slug')
          .ilike('name', `%${q}%`)
          .eq('active', true)
          .limit(5),
        loadMenuCatalog(),
      ]);
      setEvenements(evRes.data ?? []);
      setProduits(prRes.data ?? []);
      setBoissons(
        catalog.items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(ql) || item.description.toLowerCase().includes(ql)
          )
          .slice(0, 6)
      );
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [q]);

  return { boissons, evenements, produits, loading };
}
