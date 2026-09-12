import { NewsletterSignup } from '../layout/NewsletterSignup';

/**
 * Remplace la carte d'inscription quand event.date est déjà passée
 * (porte 8, docs/CONSIGNES-CLAUDE.md du 12/09) : le contenu de la page
 * reste visible, mais on ne propose plus jamais de s'inscrire à un
 * challenge fini — ni CTA, ni sélecteur de créneaux.
 */
export function ChallengeEndedState() {
  return (
    <div id="inscription" className="rounded-[2px] border border-noir/10 bg-surface-card p-8 md:p-14">
      <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Challenge 21 jours</p>
      <h2
        className="mb-5 font-display font-normal"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
      >
        Ce challenge est terminé <em className="italic text-black/55">— le prochain ouvre bientôt</em>
      </h2>
      <p className="mb-8 max-w-[56ch] text-[14px] leading-relaxed text-black/62">
        Les créneaux de bilan s'ouvrent deux semaines avant le début de chaque challenge.
        Laisse ton e-mail : tu seras prévenu·e le jour de l'ouverture, avant tout le monde.
      </p>
      <NewsletterSignup theme="light" source="challenge-ended" align="left" />
    </div>
  );
}
