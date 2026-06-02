// Mapping cuillères doseuses par produit gamme (offertes, sans surcoût)
// slug → { label, color }
export const SPOON_MAP: Record<string, { label: string; color: string } | undefined> = {
  // Vert foncé — Formula 1, PDM
  'formula-1-950g':     { label: 'Cuillère doseuse vert foncé',  color: '#1B5E20' },
  'protein-drink-pdm':  { label: 'Cuillère doseuse vert foncé',  color: '#1B5E20' },

  // Vert clair — Beta Heart, Rebuild Strength
  'rebuild-whey':       { label: 'Cuillère doseuse vert clair',  color: '#66BB6A' },

  // Rouge — Night Mode, Collagen Skin Booster
  'collagene':          { label: 'Cuillère doseuse rouge',       color: '#D32F2F' },

  // Jaune — CR7 Drive, Multi-fibres, Formula 3
  'electrolytes-cr7-boite':  { label: 'Cuillère doseuse jaune',  color: '#FBC02D' },
  'electrolytes-sachet-x10': { label: 'Cuillère doseuse jaune',  color: '#FBC02D' },
  'fibres':                  { label: 'Cuillère doseuse jaune',  color: '#FBC02D' },
};
