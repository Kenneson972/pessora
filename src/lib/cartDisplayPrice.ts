/** Nombre de boosters encodés dans `optionsKey` (segments `boost:…`). */
export function boosterCountFromOptionsKey(optionsKey: string): number {
  const m = optionsKey.match(/(?:^|\|)boost:([^|]*)/);
  if (!m?.[1]) return 0;
  return m[1].split(',').filter(Boolean).length;
}

/**
 * Prix unitaire affiché / facturé côté client pour une ligne bar : toujours le tarif public.
 * (Remise Óra+ retirée de la surface publique — offre repassée en présentiel.)
 */
export function displayBarLineUnit(
  line: {
    unitPrice: number;
    source: 'bar' | 'gamme';
    barBasePublic?: number;
    optionsKey: string;
  },
  _isOraPlus: boolean,
): number {
  return line.unitPrice;
}
