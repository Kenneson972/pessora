import { ParticipantPhotosSection } from './ParticipantPhotosSection';

/**
 * Mur de photos partagées — page d'un challenge (`events.gallery`).
 *
 * Utilisé pour les photos d'un événement : toutes les photos au même rang, sans
 * appariement (l'avant/après apparié, c'est `BeforeAfterPairsBlock`, pour une gamme).
 *
 * Règles : vide = absent (l'appelant ne monte rien, et ici on rend `null` de toute
 * façon) · aucune promesse de résultat dans le titre · l'attribution est affichée dans
 * le titre du bloc (`ParticipantPhotosSection`).
 */
export interface ParticipantPhotosBlockProps {
  gallery: string[] | null | undefined;
}

export function ParticipantPhotosBlock({ gallery }: ParticipantPhotosBlockProps) {
  if (!Array.isArray(gallery) || gallery.length === 0) return null;

  return (
    <ParticipantPhotosSection>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {gallery.map((url) => (
          <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
            <img
              src={url}
              alt="Photo partagée par une participante"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </ParticipantPhotosSection>
  );
}

export default ParticipantPhotosBlock;
