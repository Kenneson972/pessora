import { NewsletterSignup } from '../layout/NewsletterSignup';
import type { ChallengeAvailabilityCase } from '../../hooks/useChallengeAvailability';

const COPY: Record<Exclude<ChallengeAvailabilityCase, 'bookable'>, { title: string; body: string; source: string }> = {
  'outside-window': {
    title: 'Les inscriptions au bilan ouvrent bientôt',
    body: "Les créneaux de bilan s'ouvrent deux semaines avant le début du challenge. Laisse ton e-mail : tu seras prévenu·e du prochain challenge, avant tout le monde.",
    source: 'challenge-outside-window',
  },
  full: {
    title: 'Les créneaux de bilan sont complets',
    body: "Tous les créneaux de bilan sont pris pour ce challenge. Laisse ton e-mail : tu seras prévenu·e du prochain challenge.",
    source: 'challenge-full',
  },
  'not-yet-created': {
    title: 'Les créneaux de bilan ne sont pas encore disponibles',
    body: "Reviens un peu plus tard, ou laisse ton e-mail : tu seras prévenu·e du prochain challenge.",
    source: 'challenge-not-yet-created',
  },
};

export interface ChallengeAvailabilityNoticeProps {
  case: Exclude<ChallengeAvailabilityCase, 'bookable'>;
}

/**
 * "Le CTA suit la FENÊTRE, pas isPast" (docs/CONSIGNES-CLAUDE.md, 12/09) —
 * CTA absent ⟹ un libellé d'état présent, jamais le silence (règle @nova).
 * Les deux premiers libellés sont grepables mot pour mot : "ouvrent
 * bientôt" seulement hors fenêtre, "sont complets" seulement dans la
 * fenêtre — ailleurs ce serait un mensonge daté.
 */
export function ChallengeAvailabilityNotice({ case: state }: ChallengeAvailabilityNoticeProps) {
  const { title, body, source } = COPY[state];
  return (
    <div id="inscription" className="rounded-[2px] border border-noir/10 bg-surface-card p-8 md:p-14">
      <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Challenge 21 jours</p>
      <h2
        className="mb-5 font-display font-normal"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
      >
        {title}
      </h2>
      <p className="mb-8 max-w-[56ch] text-[14px] leading-relaxed text-black/62">{body}</p>
      <NewsletterSignup theme="light" source={source} align="left" />
    </div>
  );
}
