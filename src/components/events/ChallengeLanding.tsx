// src/components/events/ChallengeLanding.tsx
import type { Event } from '../../types/database';
import { todayInMartinique } from '../../lib/martiniqueDate';
import { useChallengeAvailability } from '../../hooks/useChallengeAvailability';
import { ChallengeHero } from './ChallengeHero';
import { ChallengeCountdownSection } from './ChallengeCountdownSection';
import { ChallengeTrustBadges } from './ChallengeTrustBadges';
import { ChallengeStatsBlock } from './ChallengeStatsBlock';
import { ChallengeProgramCard } from './ChallengeProgramCard';
import { ChallengeInclusBanners } from './ChallengeInclusBanners';
import { ChallengeBeforeAfterBlock } from './ChallengeBeforeAfterBlock';
import { ChallengeTestimonialsBlock } from './ChallengeTestimonialsBlock';
import { ChallengeRegistrationCard } from './ChallengeRegistrationCard';
import { ChallengeEndedState } from './ChallengeEndedState';
import { ChallengeAvailabilityNotice } from './ChallengeAvailabilityNotice';

export interface ChallengeLandingProps {
  event: Event & { registrationCount: number };
}

/**
 * Expérience complète "Challenge 21 jours" — ordre imposé par
 * docs/superpowers/specs/2026-09-11-challenge-21j-landing-design.md §2.
 * Montée par EvenementDetail.tsx (/evenements/:slug, type='challenge') et
 * par ChallengeLandingPage.tsx (/evenements/challenge-21-jours, état
 * "ouvert") — un seul composant, jamais deux implémentations.
 *
 * Porte 8 (docs/CONSIGNES-CLAUDE.md, 12/09) : EvenementDetail atteint aussi
 * les challenges à date passée (vieux lien/QR) — le contenu reste visible,
 * mais l'inscription et le sélecteur de créneaux disparaissent.
 *
 * "Le CTA suit la FENÊTRE, pas isPast" (même doc, même date) : le décompte
 * suit "challenge à venir", le CTA suit "il existe ≥ 1 créneau réservable"
 * — deux conditions distinctes, jamais la même.
 */
export function ChallengeLanding({ event }: ChallengeLandingProps) {
  const isPast = event.date < todayInMartinique();
  const availability = useChallengeAvailability(event.id, event.date);

  const showCta = !isPast && availability.case === 'bookable';
  const showCountdown = !isPast && availability.case !== 'full';

  return (
    <div className="bg-white">
      <ChallengeHero eventDate={event.date} showCta={showCta} />
      {showCountdown && <ChallengeCountdownSection targetDate={event.date} />}
      <ChallengeTrustBadges />
      <ChallengeStatsBlock />
      <ChallengeProgramCard isPast={isPast} />
      <ChallengeInclusBanners />
      <ChallengeBeforeAfterBlock />
      <ChallengeTestimonialsBlock />
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-10 md:py-[6.5rem] lg:px-[72px]">
        {isPast ? (
          <ChallengeEndedState />
        ) : availability.loading ? null : availability.case === 'bookable' ? (
          <ChallengeRegistrationCard event={event} />
        ) : (
          <ChallengeAvailabilityNotice case={availability.case} />
        )}
      </div>
    </div>
  );
}
