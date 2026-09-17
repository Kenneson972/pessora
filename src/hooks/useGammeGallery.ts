import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { pairesPubliees, type BeforeAfterPair } from '../lib/beforeAfter';

export type Gamme = 'sport' | 'skin' | 'wellness';

/**
 * Avant/après d'une gamme (`gamme_galleries.pairs`).
 *
 * Contrat de lecture, arrêté le 17/09/2026 :
 * - une ligne par gamme (`pairs jsonb`, forme `[{avant, apres, legende}]`), la ligne
 *   `'skin'` pré-créée vide par la migration → lecture déterministe ;
 * - 🔴 `.single()` JETTE sur 0 ligne, et un DELETE admin est autorisé : on lit donc en
 *   **`maybeSingle()`**, qui rend `null` sans jeter. Le bloc reste invisible, jamais cassé ;
 * - le jsonb est filtré par `pairesPubliees` : **une paire incomplète ne s'affiche pas** ;
 * - une lecture en erreur (table absente, réseau) rend `[]` → invisible côté visiteur.
 *   Le silence n'est acceptable que là où il n'y a rien à faire : l'écran admin, lui,
 *   affiche l'erreur.
 */
export function useGammeGallery(gamme: Gamme) {
  const [pairs, setPairs] = useState<BeforeAfterPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (supabase as any)
      .from('gamme_galleries')
      .select('pairs')
      .eq('gamme', gamme)
      .maybeSingle()
      .then(
        ({
          data,
          error,
        }: {
          data: { pairs: unknown } | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (error && import.meta.env.DEV) {
            console.warn('[useGammeGallery] avant/après illisible —', error.message);
          }
          setPairs(pairesPubliees(data?.pairs));
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme]);

  return { pairs, loading };
}

export default useGammeGallery;
