/**
 * Avant / après apparié — la règle, en un seul endroit.
 *
 * Une paire = **deux photos de la même personne**, plus une légende optionnelle qui
 * décrit le protocole (jamais un résultat).
 *
 * 🔴 **Une paire incomplète ne s'affiche JAMAIS.** Si l'avant est déposé et que l'après
 * manque (envoi échoué, dépôt interrompu), publier la seule photo reviendrait à
 * présenter **une image comme un avant/après** — exactement le faux qu'on veut éviter.
 * La règle vit ici parce qu'elle sert aux deux bouts : le bloc public filtre, et l'écran
 * de dépôt compte avec la même fonction (donc il annonce « il manque l'après » au lieu de
 * laisser dormir une moitié en silence).
 *
 * Le jsonb vient de la base : il n'est pas digne de confiance (objet, chaîne, null après
 * une reprise manuelle). Cette fonction ne jette jamais — elle rend un tableau vide.
 */
export interface BeforeAfterPair {
  avant: string;
  apres: string;
  legende: string | null;
}

const urlValide = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function pairesPubliees(valeur: unknown): BeforeAfterPair[] {
  if (!Array.isArray(valeur)) return [];
  const sortie: BeforeAfterPair[] = [];
  for (const item of valeur) {
    if (!item || typeof item !== 'object') continue;
    const { avant, apres, legende } = item as Record<string, unknown>;
    if (!urlValide(avant) || !urlValide(apres)) continue; // paire incomplète → rien
    sortie.push({
      avant: avant.trim(),
      apres: apres.trim(),
      legende: typeof legende === 'string' && legende.trim().length > 0 ? legende.trim() : null,
    });
  }
  return sortie;
}

/** Vrai si la paire en cours de dépôt est complète — sert à l'écran admin pour avertir. */
export function paireComplete(paire: { avant?: string; apres?: string } | null | undefined): boolean {
  return Boolean(urlValide(paire?.avant) && urlValide(paire?.apres));
}
