/**
 * Photos partagées par les participant·es — droits à l'image gérés par Catherine,
 * jamais de photo de banque d'images.
 *
 * Composant PARTAGÉ : rendu à l'identique sur la page d'un challenge (galerie de
 * l'événement) et sur la page d'une gamme (galerie de la gamme, « avant / après »).
 * Une seule copie du dessin et de la phrase d'accord — deux copies divergeraient.
 *
 * Règles portées par ce fichier :
 * - **vide = absent** : `null` tant qu'aucune photo n'est déposée. Un cadre vide, une
 *   grille de tirets ou un « avant/après » de démonstration ne se publient jamais.
 * - **aucune promesse de résultat** : le titre ne dit pas « avant / après » et ne parle
 *   pas de « résultats » (14/09 : « challengers précédents » affirmait un résultat
 *   obtenu — interdit, dans le texte comme dans la composition).
 * - **l'attribution est affichée** sous les photos ; la consigne d'accord, elle, vit
 *   là où Catherine téléverse (son écran admin), pas ici.
 */
export interface ParticipantPhotosBlockProps {
  gallery: string[] | null | undefined;
  /** Titre du bloc — le même libellé partout par défaut. */
  title?: string;
}

export function ParticipantPhotosBlock({
  gallery,
  title = 'Photos partagées par les participant·es',
}: ParticipantPhotosBlockProps) {
  if (!Array.isArray(gallery) || gallery.length === 0) return null;

  return (
    <section className="border-b border-noir/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-10 md:py-16 lg:px-[72px]">
        <h2
          className="mb-3 font-display font-normal leading-none text-noir"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 34px)' }}
        >
          {title}
        </h2>
        <p className="mb-8 text-[12px] font-light text-black/60">
          Publiées avec l'accord des personnes photographiées.
        </p>
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
      </div>
    </section>
  );
}

export default ParticipantPhotosBlock;
