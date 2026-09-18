/**
 * Les 3 piliers publics de la carte — **une seule table**, dans un module à part.
 *
 * Pourquoi à part : cette table est lue par la page « La carte », par la **barre secondaire
 * du menu** et par la **résolution des liens entrants** (`?gamme=`). Si elle vivait dans
 * `menuData.ts` (qui porte tout le catalogue de secours), la barre de navigation — présente
 * sur toutes les pages — embarquerait le catalogue entier. Ici, elle est légère et tout le
 * monde lit la même définition. `menuData.ts` la ré-exporte pour ne rien casser.
 *
 * Décision RDV Catherine 10/09/2026 : MEGA THÉ / PROTEIN SHAKE / COFFEE.
 * « Énergie » n'existe plus comme libellé visible — mais les boissons, elles, sont toujours
 * en vente (5 `energie` + 3 `wellness` en base le 17/09), donc elles ne disparaissent pas :
 * elles se rangent sous Mega Thé, et c'est ce que lit le visiteur.
 *
 * 🔴 Deux replis qui se ressemblent et ne disent PAS la même chose — ne pas les « harmoniser » :
 * - `getPillar(categorie)` = **catégorie de produit** venant de la base → repli `mega_the`
 *   (filet du brief 10/09 : un produit dont la catégorie est inconnue ne doit jamais être
 *   masqué de la carte).
 * - `resoudreGammePilier(mot)` = **mot d'un lien entrant** (`/menu?gamme=…`, favoris,
 *   bio Instagram, lien partagé) → repli `null` = « Tous ». Un mot qu'on ne connaît pas ne
 *   doit jamais fabriquer une page vide : on montre toute la carte plutôt que rien.
 */
export type Pillar = 'mega_the' | 'protein_shake' | 'coffee';

/** Ordre d'affichage public des piliers. */
export const PILLARS: Pillar[] = ['mega_the', 'protein_shake', 'coffee'];

export const PILLAR_NAMES: Record<Pillar, string> = {
  mega_the: 'Mega Thé',
  protein_shake: 'Protein Shake',
  coffee: 'Coffee',
};

/**
 * Mapping catégorie DB -> pilier public. shakes/coffee confirmés par Catherine.
 * energie + wellness -> mega_the : mapping provisoire (recettes à base de thé/infusion),
 * à confirmer avec la carte complète. Filet obligatoire (brief 10/09) : toute catégorie
 * DB absente de ce mapping retombe aussi sur mega_the — jamais masquée.
 */
const CATEGORY_TO_PILLAR: Record<string, Pillar> = {
  wellness: 'mega_the',
  energie: 'mega_the',
  shakes: 'protein_shake',
  coffee: 'coffee',
};

export function getPillar(category: string): Pillar {
  return CATEGORY_TO_PILLAR[category] ?? 'mega_the';
}

export function estPilier(mot: string): mot is Pillar {
  return (PILLARS as string[]).includes(mot);
}

/**
 * Résout la valeur d'un lien entrant (`?gamme=`) en pilier affichable, ou `null` = « Tous ».
 *
 * Trois cas, dans cet ordre :
 * 1. un pilier (`mega_the`, `protein_shake`, `coffee`) → lui-même ;
 * 2. un **mot ancien** de la carte, résolu par la MÊME table que la page
 *    (`energie`/`wellness` → Mega Thé, `shakes` → Protein Shake, `coffee` → Coffee) ;
 * 3. tout le reste → `null`. « Tous » est **réservé au mot vraiment inconnu** : c'est ce
 *    repli-là qui protège les liens qu'on ne peut pas énumérer (bio Instagram, QR, favoris).
 */
export function resoudreGammePilier(valeur: string | null | undefined): Pillar | null {
  const mot = (valeur ?? '').trim().toLowerCase();
  if (!mot) return null;
  if (estPilier(mot)) return mot;
  if (mot in CATEGORY_TO_PILLAR) return CATEGORY_TO_PILLAR[mot];
  return null;
}
