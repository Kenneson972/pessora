/**
 * Rechargement après un morceau JS obsolète — la règle, en un seul endroit, testable.
 *
 * Le cas à réparer : un visiteur garde un onglet ouvert pendant un déploiement. Son
 * `index.html` référence des morceaux qui n'existent plus → au premier import dynamique,
 * Vite émet `vite:preloadError` et le clic ne fait rien. On recharge une fois : c'est le
 * bon comportement.
 *
 * 🔴 Le défaut de la première version (mergée puis corrigée ici) : le garde-fou était
 * effacé à la **dernière ligne du script d'entrée**, donc juste après `render()` — il ne
 * protégeait plus rien passé le démarrage. Si le morceau est **définitivement** absent
 * (déploiement raté, fichier supprimé), chaque tentative de navigation rechargeait la
 * page : **le visiteur n'atteignait jamais son écran**, et c'était pire que l'écran figé
 * qu'on réparait.
 *
 * Le garde-fou doit donc :
 * - être **borné** (pas « une fois par chargement de script », mais **N tentatives par
 *   session**, le morceau fautif étant mémorisé) ;
 * - **ne jamais dépendre d'un stockage qui peut lever** (Safari en navigation privée :
 *   `sessionStorage` jette) — sinon le gestionnaire d'erreur devient la nouvelle panne ;
 * - **rendre la main** une fois la borne atteinte : on arrête de recharger et on affiche
 *   une sortie explicite (recharger soi-même), au lieu de boucler.
 */
export const CLE_RECHARGES = 'pessora-reload-after-preload-error';

/** Nombre de rechargements automatiques tolérés par session avant de rendre la main. */
export const MAX_RECHARGES = 2;

/** Extrait le morceau fautif d'une erreur Vite (`Failed to fetch dynamically imported module: <url>`). */
export function morceauFautif(payload: unknown): string | null {
  const texte = payload instanceof Error ? payload.message : String(payload ?? '');
  const url = /https?:\/\/[^\s'")]+\.js[^\s'")]*/.exec(texte);
  return url?.[0] ?? null;
}

/** Décide s'il faut recharger : on ne recharge que si le morceau n'a pas déjà été tenté, et sous la borne. */
export function doitRecharger(dejaTentes: string[], morceau: string | null, max = MAX_RECHARGES): boolean {
  if (dejaTentes.length >= max) return false;
  if (morceau && dejaTentes.includes(morceau)) return false;
  return true;
}

/**
 * Accès au stockage sous essai/erreur : un `sessionStorage` indisponible ne doit ni lever
 * ni faire croire qu'on a déjà rechargé (ce qui afficherait un message au premier passage).
 */
export function lireRecharges(storage?: Pick<Storage, 'getItem'> | null): string[] {
  try {
    const brut = (storage ?? window.sessionStorage).getItem(CLE_RECHARGES);
    const liste = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function noterRecharge(morceau: string, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    const deja = lireRecharges(storage as Pick<Storage, 'getItem'> | undefined);
    const liste = [...deja, morceau];
    (storage ?? window.sessionStorage).setItem(CLE_RECHARGES, JSON.stringify(liste));
  } catch {
    // stockage indisponible : on continue sans mémoire. Un rechargement de plus au pire,
    // jamais une exception dans le gestionnaire d'erreur.
  }
}

/** Sortie de secours : l'action explicite du visiteur efface la mémoire de rechargement. */
export function oublierRecharges(storage?: Pick<Storage, 'removeItem'> | null): void {
  try {
    (storage ?? window.sessionStorage).removeItem(CLE_RECHARGES);
  } catch {
    /* rien à faire */
  }
}
