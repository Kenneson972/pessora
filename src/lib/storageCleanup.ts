import { supabase } from './supabaseClient';
import { cheminsRetires, type BucketSupprimable } from './storagePaths';

export type { BucketSupprimable };

/**
 * Effacement réel des fichiers retirés d'une galerie.
 *
 * 🔴 Le défaut trouvé en recette par @vela le 17/09/2026 : « Retirer cette paire » +
 * Enregistrer vidait la base et la page publique, mais **le fichier restait dans le
 * bucket**, toujours téléchargeable par quiconque a l'URL (historiques, aperçus de
 * partage, captures). Ce n'est pas de la propreté : la feuille d'accord signée promet un
 * « retrait à tout moment », et une photo dépubliée mais encore joignable rend **cette
 * promesse fausse**.
 *
 * Mesuré : `storage.from(...).remove(...)` fonctionne avec les **seuls droits de
 * l'admin** (`is_admin()`), sans clé serveur — la policy du bucket suffit.
 * ⚠️ L'URL peut répondre **200 pendant ~1 seconde** après l'effacement (copie CDN) : on
 * ne conclut pas sur un 200 pris dans la seconde, on regarde `storage.objects`.
 *
 * La partie qui décide QUOI effacer vit dans `storagePaths.ts` (pure, testée).
 */
export async function supprimerFichiersRetires(
  bucket: BucketSupprimable,
  avant: string[],
  apres: string[],
): Promise<string[]> {
  const chemins = cheminsRetires(avant, apres, bucket);
  if (chemins.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).storage.from(bucket).remove(chemins);
  if (error) throw new Error(error.message);
  return chemins;
}
