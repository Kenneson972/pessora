import { useState, useEffect } from 'react';
import { getCarouselMenuItems, homeProductCarousel } from '../data/homeProductCarousel';
import type { HomeCarouselBadge, HomeCarouselEntry } from '../data/homeProductCarousel';
import type { MenuItem } from '../data/menuData';
import { resolveMenuItemFromProduct } from '../lib/menuCatalog';
import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types/database';

export type HomeCarouselRow = {
  entry: { id: string; badge?: HomeCarouselBadge; imageSrc?: string | null };
  item: MenuItem;
};

function buildCarouselRow(
  p: Product,
  tmpl?: Pick<HomeCarouselEntry, 'badge' | 'imageSrc'>,
): HomeCarouselRow | null {
  if (p.slug == null || String(p.slug).trim() === '') return null;
  const item = resolveMenuItemFromProduct(p);
  if (!item) return null;
  const dbBadge =
    p.carousel_badge === 'nouveaute' || p.carousel_badge === 'coup-de-coeur'
      ? p.carousel_badge
      : undefined;
  return {
    entry: {
      id: p.slug,
      badge: dbBadge ?? tmpl?.badge,
      imageSrc: p.image_url ?? tmpl?.imageSrc ?? null,
    },
    item,
  };
}

export function useHomeCarouselRows() {
  const [rows, setRows] = useState<HomeCarouselRow[]>(() =>
    getCarouselMenuItems(homeProductCarousel),
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchCarousel() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('active', true)
        .not('carousel_sort', 'is', null)
        .order('carousel_sort', { ascending: true });

      if (cancelled) return;

      if (error || !data?.length) {
        if (import.meta.env.DEV && error) {
          console.warn('[useHomeCarousel] lecture products:', error.message);
        }
        setRows(getCarouselMenuItems(homeProductCarousel));
        return;
      }

      const list = data as Product[];
      const next: HomeCarouselRow[] = [];
      for (const p of list) {
        const row = buildCarouselRow(p);
        if (row) next.push(row);
      }

      // Produits du template vitrine encore sans carousel_sort en BDD (ex. Hydra après insert) — évite une slide « fantôme ».
      const included = new Set(next.map((r) => r.entry.id));
      const fillerSlugs = homeProductCarousel.map((e) => e.id).filter((id) => !included.has(id));
      if (fillerSlugs.length > 0) {
        const { data: fillerData } = await (supabase as any)
          .from('products')
          .select('*')
          .eq('active', true)
          .in('slug', fillerSlugs)
          .is('carousel_sort', null);

        if (cancelled) return;

        if (fillerData?.length) {
          const fillers = fillerData as Product[];
          for (const tmpl of homeProductCarousel) {
            if (included.has(tmpl.id)) continue;
            const p = fillers.find((x) => x.slug === tmpl.id);
            if (!p) continue;
            const row = buildCarouselRow(p, { badge: tmpl.badge, imageSrc: tmpl.imageSrc });
            if (!row) continue;
            next.push(row);
            included.add(tmpl.id);
          }
        }
      }

      if (cancelled) return;

      if (next.length > 0) {
        setRows(next);
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('[useHomeCarousel] aucune slide exploitable — fallback statique');
      }
      setRows(getCarouselMenuItems(homeProductCarousel));
      return;
    }

    void fetchCarousel();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchCarousel();
    };
    document.addEventListener('visibilitychange', onVisible);

    const onCatalogChange = () => void fetchCarousel();
    window.addEventListener('pessora:products-changed', onCatalogChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pessora:products-changed', onCatalogChange);
    };
  }, []);

  return { rows };
}
