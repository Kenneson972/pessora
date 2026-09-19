/**
 * Habillage commun des blocs « photos » — le titre, la phrase d'accord et l'espacement.
 *
 * Partagé par le mur de photos (page d'un challenge) et l'avant/après apparié (page
 * d'une gamme) : deux objets différents, mais **une seule** écriture du titre et de la
 * phrase d'attribution. Deux copies divergeraient, et c'est la phrase juridique qui
 * passerait à la trappe.
 *
 * Le vide n'est jamais rendu ici : c'est à l'appelant de ne pas monter le bloc (règle
 * « un bloc de preuve vide ne se publie jamais »).
 */
export interface ParticipantPhotosSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function ParticipantPhotosSection({
  title = 'Photos partagées par les participant·es',
  children,
}: ParticipantPhotosSectionProps) {
  return (
    <section className="border-b border-noir/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-10 md:py-16 lg:px-[72px]">
        <h2
          className="mb-3 font-display font-normal leading-none text-noir"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 34px)' }}
        >
          {title}
        </h2>
        <p className="mb-8 text-[12px] font-normal text-black/60">
          Publiées avec l'accord des personnes photographiées.
        </p>
        {children}
      </div>
    </section>
  );
}

export default ParticipantPhotosSection;
