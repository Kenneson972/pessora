// src/components/events/ChallengeLanding.tsx
import type { Event } from '../../types/database';
import { ChallengeHero } from './ChallengeHero';
import { ChallengeTrustBadges } from './ChallengeTrustBadges';
import { ChallengeStatsBlock } from './ChallengeStatsBlock';
import { ChallengeProgramCard } from './ChallengeProgramCard';
import { ChallengeBeforeAfterBlock } from './ChallengeBeforeAfterBlock';
import { ChallengeTestimonialsBlock } from './ChallengeTestimonialsBlock';
import { ChallengeRegistrationCard } from './ChallengeRegistrationCard';

export interface ChallengeLandingProps {
  event: Event & { registrationCount: number };
}

/**
 * Expérience complète "Challenge 21 jours" — ordre imposé par
 * docs/superpowers/specs/2026-09-11-challenge-21j-landing-design.md §2.
 * Montée par EvenementDetail.tsx (/evenements/:slug, type='challenge') et
 * par ChallengeLandingPage.tsx (/evenements/challenge-21-jours, état
 * "ouvert") — un seul composant, jamais deux implémentations.
 */
export function ChallengeLanding({ event }: ChallengeLandingProps) {
  return (
    <div className="bg-white">
      <ChallengeHero eventDate={event.date} />
      <ChallengeTrustBadges />
      <ChallengeStatsBlock />
      <ChallengeProgramCard />
      <ChallengeBeforeAfterBlock />
      <ChallengeTestimonialsBlock />
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-10 md:py-[6.5rem] lg:px-[72px]">
        <ChallengeRegistrationCard event={event} />
      </div>
    </div>
  );
}
