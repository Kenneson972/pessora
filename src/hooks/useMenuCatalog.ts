import { useState, useEffect } from 'react';
import { menuItems as staticMenuItems } from '../data/menuData';
import type { MenuItem } from '../data/menuData';
import { loadMenuCatalog } from '../lib/menuCatalog';

export function useMenuCatalog() {
  const [items, setItems] = useState<MenuItem[]>(staticMenuItems);
  const [source, setSource] = useState<'supabase' | 'fallback' | 'hydrating'>('hydrating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMenuCatalog().then(({ items: next, source: src }) => {
      if (cancelled) return;
      setItems(next);
      setSource(src);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, menuItems: items, source, loading };
}
