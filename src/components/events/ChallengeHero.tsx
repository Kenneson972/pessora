function frenchMonth(dateStr: string): string {
  const month = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export interface ChallengeHeroProps {
  /** Date ISO (YYYY-MM-DD) du challenge affiché. */
  eventDate: string;
}

/**
 * Refonte du 12/09 (retour utilisateur) : l'image occupe tout le hero
 * (plein cadre, object-cover) — plus de colonne réservée séparée. Le texte
 * (label + nom du challenge + description) est superposé à gauche sur un
 * voile qui s'efface vers la droite, même traitement que
 * ChallengeInclusBanners. Aucun CTA dans le hero (retiré, l'inscription
 * reste accessible plus bas sur la page).
 */
export function ChallengeHero({ eventDate }: ChallengeHeroProps) {
  return (
    <header className="relative overflow-hidden bg-surface-hero text-white">
      <img
        src="/challenge-21j/hero-visuel.webp"
        alt="Challenge 21 jours"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, oklch(7% .004 55 / 0.88) 0%, oklch(7% .004 55 / 0.7) 32%, oklch(7% .004 55 / 0.28) 58%, oklch(7% .004 55 / 0.08) 78%, transparent 100%)',
        }}
      />
      <div className="relative mx-auto flex min-h-[480px] max-w-6xl items-center px-4 py-20 md:min-h-[600px] md:px-10 md:py-28 lg:px-[72px]">
        <div className="max-w-[26ch]">
          <span className="inline-flex items-baseline gap-2.5 text-[10px] uppercase tracking-[0.32em] text-white/55">
            <i aria-hidden="true" className="relative top-[-1px] inline-block h-[3px] w-[3px] rounded-full bg-gold" />
            {frenchMonth(eventDate)}
          </span>
          <h1
            className="mt-4 font-display font-normal leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.8vw, 44px)', maxWidth: '15ch' }}
          >
            Challenge
            <br />
            <em className="italic text-gold-dim">21 jours</em>
          </h1>
          <div aria-hidden="true" className="mt-6 h-px w-12 bg-gold/40" />
          <p className="mt-6 max-w-[36ch] text-[14px] font-light leading-[1.75] tracking-[0.01em] text-white/70">
            21 jours pour reprendre la main sur ton énergie, ta forme et tes habitudes.
          </p>
        </div>
      </div>
    </header>
  );
}
