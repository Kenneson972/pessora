import { useGammeGallery } from '../../hooks/useGammeGallery';
import { ParticipantPhotosBlock } from '../common/ParticipantPhotosBlock';

/**
 * Bloc « photos partagées » de la page d'une gamme (Skin) — avant/après déposé par
 * Catherine depuis son admin.
 *
 * Le composant porte lui-même sa lecture : `RangeDetail` rend `<SkinBeforeAfterSection />`
 * et n'a besoin ni d'un état ni d'un hook supplémentaire (il reste lisible, et la page
 * ne fait la requête que pour la gamme concernée).
 *
 * Rien à montrer tant qu'elle n'a rien déposé : la lecture rend `null` et le bloc
 * DISPARAÎT — pas de cadre vide, pas de photo de démonstration, pas de photo achetée.
 */
export function SkinBeforeAfterSection() {
  const { gallery, loading } = useGammeGallery('skin');
  if (loading) return null;
  return <ParticipantPhotosBlock gallery={gallery} />;
}

export default SkinBeforeAfterSection;
