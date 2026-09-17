import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Gamme = 'sport' | 'skin' | 'wellness';

/**
 * Galerie « photos partagées » d'une gamme (avant/après).
 *
 * Contrat de lecture, arrêté le 17/09/2026 :
 * - la table `gamme_galleries` porte une ligne par gamme, la ligne `'skin'` est
 *   pré-créée vide par la migration → la lecture est déterministe, jamais de `null`
 *   à gérer côté composant ;
 * - 🔴 `.single()` JETTE quand la ligne est absente (0 ligne) — et la policy autorise
 *   un DELETE admin, donc la ligne PEUT disparaître. On lit donc en **`maybeSingle()`**,
 *   qui rend `null` sans jeter : le bloc reste INVISIBLE, jamais cassé. Variante
 *   équivalente si le paquet changeait : `.limit(1)` puis `data?.[0]`.
 * - aucune donnée de repli : il n'y a rien à montrer quand il n'y a rien. Un bloc de
 *   preuve vide ne se publie jamais (même règle que le bloc du Challenge).
 * - une lecture qui échoue (table absente, réseau) rend `null` → invisible à l'écran.
 *   C'est volontaire côté visiteur, et c'est pourquoi l'écran admin, lui, DOIT afficher
 *   l'erreur : le silence n'est acceptable que là où il n'y a rien à faire.
 */
export function useGammeGallery(gamme: Gamme) {
  const [gallery, setGallery] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (supabase as any)
      .from('gamme_galleries')
      .select('gallery')
      .eq('gamme', gamme)
      .maybeSingle()
      .then(
        ({
          data,
          error,
        }: {
          data: { gallery: string[] | null } | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (error && import.meta.env.DEV) {
            console.warn('[useGammeGallery] galerie illisible —', error.message);
          }
          const urls = Array.isArray(data?.gallery) ? data!.gallery.filter(Boolean) : [];
          setGallery(urls.length > 0 ? urls : null);
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme]);

  return { gallery, loading };
}

export default useGammeGallery;
