import { Check } from 'lucide-react';

const INCLUS = [
  'Application GetFitNow',
  'Communauté 24FIT PESSORA',
  'Séances de sport',
  'Idées recettes',
  'Conseils & accompagnement',
  'Suivi de tes objectifs',
];

const TIMINGS = ['Ce mois-ci', 'Le mois prochain', 'Je souhaite en savoir plus'];

export function ChallengeProgramCard() {
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
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-sapin/20 pb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-noir">Challenge 21 jours</h3>
            <span className="text-[8px] uppercase tracking-[0.2em] text-gold-dim">Places limitées</span>
          </div>

          <ul className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-black/78">
                <Check size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-sapin" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

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
        </div>
      </div>
    </section>
  );
}
