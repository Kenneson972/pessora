import { ChallengeCountdown } from './ChallengeCountdown';

export interface ChallengeCountdownSectionProps {
  targetDate: string;
}

/**
 * Bloc dédié au minuteur — sorti du hero le 12/09 (trop d'information au
 * même endroit). Rendu par ChallengeLanding, jamais par ChallengeHero.
 * Pas un second dispositif signature (règle @lyra) : traitement sobre,
 * séparé par un simple filet, aucun cadre ni halo.
 */
export function ChallengeCountdownSection({ targetDate }: ChallengeCountdownSectionProps) {
  return (
    <section className="border-y border-noir/[0.07] bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-10 lg:px-[72px]">
        <p className="mb-6 text-[9px] uppercase tracking-[0.32em] text-black/42">
          Le prochain Challenge 21 jours commence dans
        </p>
        <ChallengeCountdown targetDate={targetDate} />
      </div>
    </section>
  );
}
