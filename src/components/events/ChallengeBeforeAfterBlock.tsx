/**
 * Photos partagées par les participant·es — droits à l'image gérés par Catherine, jamais de photo
 * de banque d'images. 14/09 : la galerie est éditable depuis /admin/challenge-21j
 * (events.gallery, uploadée dans le bucket event-images). Retourne null tant qu'elle est vide —
 * un bloc de preuve vide ne se publie jamais (règle Lyra, voir ChallengeStatsBlock).
 */
export interface ChallengeBeforeAfterBlockProps {
  gallery: string[] | null | undefined;
}

export function ChallengeBeforeAfterBlock({ gallery }: ChallengeBeforeAfterBlockProps) {
  if (!Array.isArray(gallery) || gallery.length === 0) return null;

  return (
    <section className="border-b border-noir/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-10 md:py-16 lg:px-[72px]">
        {/* 14/09 — un seul titre par section, et il ne porte AUCUNE promesse de
            résultat : « Avant / après » + « challengers précédents » affirmait que
            les précédents ont obtenu un résultat — ce qu'on s'interdit, dans le
            texte comme dans la composition. Le kicker « Résultats » tombe avec lui
            (il était aussi à 45 % de noir, sous AA).
            Le libellé générique porte l'attribution : la légende par photo reste
            optionnelle dans l'admin, elle ne conditionne pas le bloc. */}
        <h2
          className="mb-3 font-display font-normal leading-none text-noir"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 34px)' }}
        >
          Photos partagées par les participant·es
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
