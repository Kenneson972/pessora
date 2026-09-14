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
        {/* 14/09 — 9 px / 42 % de noir = 3,03:1, mesuré en prod : sous AA.
            Corrigé à 10 px (plancher) et 60 % de noir = 5,25:1 sur blanc. */}
        <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-black/60">
          Le prochain Challenge 21 jours commence dans
        </p>
        <ChallengeCountdown targetDate={targetDate} />
      </div>
    </section>
  );
}
