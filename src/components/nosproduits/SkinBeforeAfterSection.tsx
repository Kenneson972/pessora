import { useGammeGallery } from '../../hooks/useGammeGallery';
import { BeforeAfterPairsBlock } from '../common/BeforeAfterPairsBlock';

/**
 * Section avant/après de la page d'une gamme (Skin) — photos déposées par Catherine
 * depuis son admin, appariées deux à deux (avant / après).
 *
 * Le composant porte sa propre lecture : `RangeDetail` rend `<SkinBeforeAfterSection />`
 * sans état ni hook supplémentaire (et sans ajouter un hook après son retour anticipé).
 *
 * Rien à montrer tant qu'aucune paire n'est complète : la lecture rend une liste vide et
 * le bloc DISPARAÎT — pas de cadre vide, pas de photo de démonstration, pas de photo
 * achetée, et jamais une moitié de paire.
 */
export function SkinBeforeAfterSection() {
  const { pairs, loading } = useGammeGallery('skin');
  if (loading) return null;
  return <BeforeAfterPairsBlock pairs={pairs} />;
}

export default SkinBeforeAfterSection;
