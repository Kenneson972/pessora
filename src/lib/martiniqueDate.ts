/**
 * "Aujourd'hui" côté front, calculé sur le fuseau America/Martinique —
 * jamais toISOString() (bascule au jour suivant dès 20h00 heure locale, en
 * plein milieu de soirée) ni le fuseau du visiteur. Même règle que la base
 * : (now() AT TIME ZONE 'America/Martinique')::date.
 */
export function todayInMartinique(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date());
}

// events.date est une DATE naïve ('YYYY-MM-DD'), pas un horodatage.
// America/Martinique = -04:00 SANS heure d'été DEPUIS 1980 (vérifié 2024→2100 par
// @vela) ; -05:00 existait avant 1980. Le littéral est donc sûr pour nos dates,
// mais il n'est pas "permanent depuis toujours".
// Pas d'heure d'été = pas de calcul d'offset — c'est précisément ce calcul qui
// produit le bug Dalcielo (ChefValidUntilTimer calcule dans le fuseau du
// navigateur). startOfDayMartinique() rend un instant absolu (un Date n'a pas
// de fuseau) : deux visiteurs, deux fuseaux, le même `remaining`.
//
// Deux fonctions, deux métiers — todayInMartinique() (chaîne 'YYYY-MM-DD',
// comparaisons de date) ne se substitue pas à celle-ci (instant comparable),
// et inversement.
export function startOfDayMartinique(date: string): Date {
  return new Date(`${date}T00:00:00-04:00`);
}
