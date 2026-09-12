function frenchMonth(dateStr: string): string {
  const month = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export interface ChallengeHeroProps {
  /** Date ISO (YYYY-MM-DD) du challenge affiché. */
  eventDate: string;
  /**
   * Le CTA suit la FENÊTRE, pas isPast (docs/CONSIGNES-CLAUDE.md, 12/09) :
   * true seulement s'il existe ≥ 1 créneau réservable. Un challenge sans
   * créneau rattaché affichait un CTA menant à un parcours que la RLS
   * refusait déjà — deux conditions, jamais une seule.
   */
  showCta?: boolean;
}

/**
 * Refonte du 12/09 (retour utilisateur) : composition minimaliste,
 * uniquement label + titre + description courte + un seul CTA — plus de
 * lien secondaire, plus d'élément qui "remplit" l'espace. Colonne droite
 * réservée (~55-60%, vide) pour la future image, desktop uniquement ;
 * jamais un espace vide conservé artificiellement sur mobile.
 * Background inchangé — seule la composition du contenu a bougé.
 */
export function ChallengeHero({ eventDate, showCta = true }: ChallengeHeroProps) {
  return (
    <header className="relative overflow-hidden bg-surface-hero text-white">
      {/* Dégradé de repli — rendu définitif tant qu'aucun visuel réel n'est fourni.
          Jamais de cadre pointillé "à produire" en production (règle Lyra). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 18%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 62%), linear-gradient(160deg, oklch(15% .01 55) 0%, oklch(9% .006 55) 55%, oklch(7% .004 55) 100%)',
        }}
      />
      <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center px-4 py-20 md:min-h-[640px] md:px-10 md:py-28 lg:px-[72px]">
        <div className="grid w-full grid-cols-1 lg:grid-cols-[44%_1fr] lg:gap-10">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-white/60">
              <i aria-hidden="true" className="block h-[5px] w-[5px] rounded-full bg-gold" />
              Challenge 21 jours · {frenchMonth(eventDate)}
            </span>
            <h1
              className="font-display font-light leading-[1.03]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.4vw, 40px)', maxWidth: '15ch' }}
            >
              Quel est ton <em className="italic text-white/60">prochain objectif&nbsp;?</em>
            </h1>
            <p className="mt-5 max-w-[38ch] text-[15px] font-light leading-relaxed text-white/80">
              21 jours pour reprendre la main sur ton énergie, ta forme et tes habitudes.
            </p>
            {showCta && (
              <a
                href="#inscription"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ivory px-8 py-4 text-[10px] uppercase tracking-[0.2em] text-noir transition-colors hover:bg-gold"
              >
                Je veux mon bilan
              </a>
            )}
          </div>
          {/* Réservé pour la future image — desktop seulement, rien à mobile. */}
          <div aria-hidden="true" className="hidden lg:block" />
        </div>
      </div>
    </header>
  );
}
