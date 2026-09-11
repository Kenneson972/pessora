/**
 * "Aujourd'hui" côté front, calculé sur le fuseau America/Martinique —
 * jamais toISOString() (bascule au jour suivant dès 20h00 heure locale, en
 * plein milieu de soirée) ni le fuseau du visiteur. Même règle que la base
 * : (now() AT TIME ZONE 'America/Martinique')::date.
 */
export function todayInMartinique(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date());
}
