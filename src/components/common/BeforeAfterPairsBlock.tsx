import { ParticipantPhotosSection } from './ParticipantPhotosSection';
import { pairesPubliees } from '../../lib/beforeAfter';

/**
 * Avant / après apparié — page d'une gamme (Skin).
 *
 * Deux photos de la **même personne**, l'une à côté de l'autre, chacune étiquetée
 * « Avant » / « Après » : sans l'étiquette, savoir laquelle est l'avant ne serait vrai
 * que pour les gens qui connaissent la personne. L'étiquette est rendue **dans le bloc
 * de son image**, donc elle ne peut pas se retrouver attachée au mauvais fichier.
 *
 * Ce que ce bloc ne fait pas, volontairement : il ne promet aucun résultat. La légende
 * décrit le protocole suivi — le texte est écrit côté client, jamais par la personne
 * photographiée.
 *
 * Une paire incomplète est ignorée (cf. `pairesPubliees`), et s'il n'en reste aucune, le
 * bloc n'existe pas : pas de cadre vide, jamais.
 */
function Vignette({ url, etiquette }: { url: string; etiquette: string }) {
  return (
    <div className="min-w-0">
      <div className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
        <img
          src={url}
          alt={`Photo ${etiquette.toLowerCase()} d'une participante`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="mt-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60">
        {etiquette}
      </p>
    </div>
  );
}

export function BeforeAfterPairsBlock({ pairs }: { pairs: unknown }) {
  const publiees = pairesPubliees(pairs);
  if (publiees.length === 0) return null;

  return (
    <ParticipantPhotosSection>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-10 md:gap-y-12">
        {publiees.map((paire, index) => (
          <figure key={`${paire.avant}-${index}`} className="min-w-0">
            <div className="grid grid-cols-2 gap-3">
              <Vignette url={paire.avant} etiquette="Avant" />
              <Vignette url={paire.apres} etiquette="Après" />
            </div>
            {paire.legende && (
              <figcaption className="mt-3 text-[12px] font-light leading-relaxed text-black/60">
                {paire.legende}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </ParticipantPhotosSection>
  );
}

export default BeforeAfterPairsBlock;
