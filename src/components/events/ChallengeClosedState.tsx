// src/components/events/ChallengeClosedState.tsx
import { NewsletterSignup } from '../layout/NewsletterSignup';

/**
 * Aucune date sur cette page qui ne soit une ligne en base (règle
 * équipe, 11/09) : pas de rythme de vagues codé en dur. Le jour où
 * Catherine crée son prochain challenge dans l'admin, il apparaît sans
 * qu'on touche à ce composant.
 */
export function ChallengeClosedState() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28 lg:px-[72px]">
        <div className="rounded-[2px] border border-noir/10 bg-surface-card p-8 md:p-14">
          <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Prochaine vague</p>
          <h1
            className="mb-5 font-display font-normal"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
          >
            Le prochain Challenge 21 jours <em className="italic text-black/55">ouvre bientôt</em>
          </h1>
          <p className="mb-8 max-w-[56ch] text-[14px] leading-relaxed text-black/62">
            Les créneaux de bilan s'ouvrent deux semaines avant le début de chaque challenge.
            Laisse ton e-mail : tu seras prévenu·e le jour de l'ouverture, avant tout le monde.
          </p>
          <NewsletterSignup theme="light" source="challenge-closed" align="left" />
        </div>
      </div>
    </div>
  );
}
