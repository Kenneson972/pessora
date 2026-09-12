import { ChallengeCountdown } from './ChallengeCountdown';

function frenchMonth(dateStr: string): string {
  const month = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export interface ChallengeHeroProps {
  /** Date ISO (YYYY-MM-DD) du challenge affiché. */
  eventDate: string;
  /** event.date >= aujourd'hui (porte 8) — n'est PAS events.registration_open. */
  isUpcoming?: boolean;
}

export function ChallengeHero({ eventDate, isUpcoming = true }: ChallengeHeroProps) {
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
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-32 lg:px-[72px]">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-white/70">
          <i aria-hidden="true" className="block h-[5px] w-[5px] rounded-full bg-gold" />
          Challenge 21 jours · {frenchMonth(eventDate)}
        </span>
        <h1
          className="font-display font-light leading-[1.04]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.6vw, 54px)', maxWidth: '19ch' }}
        >
          Quel est ton <em className="italic text-white/60">prochain objectif&nbsp;?</em>
        </h1>
        <p className="mt-6 max-w-[44ch] text-[15px] font-light leading-relaxed text-white/90">
          21 jours pour reprendre la main sur ton énergie, ta forme et tes habitudes.
          Encadré, en collectif, avec un suivi réel — pas un défi à tenir seul.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          {isUpcoming && (
            <a
              href="#inscription"
              className="inline-flex items-center gap-2 rounded-full bg-ivory px-8 py-4 text-[10px] uppercase tracking-[0.2em] text-noir transition-colors hover:bg-gold"
            >
              Je veux mon bilan
            </a>
          )}
          <a
            href="#programme"
            className="border-b border-white/25 pb-0.5 text-[9px] uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Ce qui est inclus
          </a>
        </div>
        {isUpcoming && <ChallengeCountdown targetDate={eventDate} />}
      </div>
    </header>
  );
}
