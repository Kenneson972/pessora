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
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-white/60">
            <i aria-hidden="true" className="block h-[5px] w-[5px] rounded-full bg-gold" />
            {frenchMonth(eventDate)}
          </span>
          <h1
            className="font-display font-light leading-[1.03]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.4vw, 40px)', maxWidth: '15ch' }}
          >
            Challenge <em className="italic text-white/60">21 jours</em>
          </h1>
          <p className="mt-5 max-w-[38ch] text-[15px] font-light leading-relaxed text-white/80">
            21 jours pour reprendre la main sur ton énergie, ta forme et tes habitudes.
          </p>
        </div>
      </div>
    </header>
  );
}
