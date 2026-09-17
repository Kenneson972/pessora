/**
 * Chemins de stockage — partie PURE, sans client Supabase.
 *
 * Séparée de `storageCleanup.ts` exprès : ce fichier ne dépend d'aucune variable
 * d'environnement, donc il se teste partout (un module qui importe le client Supabase
 * ne se charge pas dans une suite sans `.env` — le fichier de test échoue alors à la
 * collecte, silencieusement, et « 0 test » ressemble à un vert).
 */

/** Les buckets où l'on dépose des photos et où l'on doit donc pouvoir effacer. */
export type BucketSupprimable = 'gamme-gallery-images' | 'event-images';

/** `/storage/v1/object/public/<bucket>/<chemin>` → `<chemin>` (null si l'URL n'est pas du bucket). */
export function cheminDepuisUrl(url: string, bucket: string): string | null {
  const marqueur = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marqueur);
  if (index === -1) return null;
  const chemin = url.slice(index + marqueur.length).split('?')[0].split('#')[0];
  return chemin.length > 0 ? chemin : null;
}

/**
 * Fichiers présents AVANT et plus référencés APRÈS — donc à effacer.
 *
 * Couvre les deux cas : la photo retirée, et la photo **remplacée** (l'ancienne devient
 * orpheline). Un fichier encore référencé ailleurs n'est jamais effacé, même si la même
 * image est utilisée deux fois.
 */
export function cheminsRetires(avant: string[], apres: string[], bucket: string): string[] {
  const encoreUtilises = new Set(
    apres.map((url) => cheminDepuisUrl(url, bucket)).filter((c): c is string => Boolean(c)),
  );
  const aEffacer = new Set<string>();
  for (const url of avant) {
    const chemin = cheminDepuisUrl(url, bucket);
    if (chemin && !encoreUtilises.has(chemin)) aEffacer.add(chemin);
  }
  return [...aEffacer];
}
