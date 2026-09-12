import { Smartphone, Users, Dumbbell, Salad, MessagesSquare, Target, type LucideIcon } from 'lucide-react';

interface InclusItem {
  label: string;
  /** Fournie par Catherine, une à une — le composant tient sans elle. */
  image?: string;
  /** docs/icones-inclus-21j.md — table de correspondance verrouillée. */
  icon: LucideIcon;
}

const INCLUS: InclusItem[] = [
  { label: 'Application GetFitNow', icon: Smartphone },
  { label: 'Communauté 24FIT PESSORA', icon: Users },
  { label: 'Séances de sport', icon: Dumbbell },
  { label: 'Idées recettes', icon: Salad },
  { label: 'Conseils & accompagnement', image: '/bannieres/conseils.jpg', icon: MessagesSquare },
  { label: 'Suivi de tes objectifs', icon: Target },
];

const TIMINGS = ['Ce mois-ci', 'Le mois prochain', 'Je souhaite en savoir plus'];

/**
 * Une seule lumière pour les six bannières (règle équipe, 12/09) — même
 * dégradé que ChallengeHero, sert aussi de repli tant qu'aucune image
 * n'est fournie. Jamais de cadre pointillé "à produire" en production.
 */
const BANNER_FALLBACK =
  'radial-gradient(120% 90% at 78% 18%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 62%), linear-gradient(160deg, oklch(15% .01 55) 0%, oklch(9% .006 55) 55%, oklch(7% .004 55) 100%)';

export interface ChallengeProgramCardProps {
  /** true sur un challenge à date passée (porte 8) — retire le sélecteur de timings du DOM. */
  isPast?: boolean;
}

export function ChallengeProgramCard({ isPast = false }: ChallengeProgramCardProps) {
  return (
    <section id="programme" className="sec bg-surface-muted py-16 md:py-[6.5rem]">
      <div className="mx-auto max-w-6xl px-4 md:px-10 lg:px-[72px]">
        <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Le programme</p>
        <h2
          className="mb-10 font-display font-normal"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
        >
          Ce que tu ne fais pas seul
        </h2>

        <div className="rounded-[2px] border border-sapin/45 bg-surface-card p-6 md:p-12">
          <div className="mb-8 border-b border-sapin/20 pb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-noir">Challenge 21 jours</h3>
          </div>

          <ul className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUS.map((item) => (
              <li key={item.label} className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.label}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div aria-hidden="true" className="absolute inset-0" style={{ background: BANNER_FALLBACK }} />
                )}
                {/* Voile étendu ~24px au-delà du seul besoin du libellé pour
                    couvrir aussi l'icône (docs/icones-inclus-21j.md) — sinon
                    le pire cas mesuré (photo claire, carte basse) retombe
                    sous 3:1. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(0deg, oklch(7% .004 55 / 0.82) 0%, oklch(7% .004 55 / 0.55) 35%, oklch(7% .004 55 / 0.18) 62%, transparent 100%)' }}
                />
                {!item.image && (
                  <item.icon
                    aria-hidden="true"
                    strokeWidth={1.4}
                    className="absolute inset-0 m-auto text-white"
                    style={{ width: '52px', height: '52px' }}
                  />
                )}
                <div className="absolute inset-x-3 bottom-3 flex flex-col items-start gap-1.5">
                  {item.image && (
                    <item.icon
                      aria-hidden="true"
                      strokeWidth={1.4}
                      className="text-white"
                      style={{ width: '20px', height: '20px' }}
                    />
                  )}
                  <span className="text-[12px] font-light leading-snug text-white">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>

          {!isPast && (
            <div className="flex flex-wrap items-center gap-3 border-t border-noir/[0.07] pt-7">
              <span className="mr-2 text-[9px] uppercase tracking-[0.2em] text-black/45">
                Quand souhaites-tu commencer ?
              </span>
              {TIMINGS.map((t, i) => (
                <span
                  key={t}
                  className={
                    i === 0
                      ? 'rounded-full bg-sapin px-4 py-2.5 text-[9px] uppercase tracking-[0.16em] text-white'
                      : 'rounded-full border border-noir/15 px-4 py-2.5 text-[9px] uppercase tracking-[0.16em] text-black/62'
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
