import { Check, Clock, Users } from 'lucide-react';

const ITEMS = [
  {
    Icon: Check,
    title: 'Bilan obligatoire',
    description: 'Chaque participant fait son bilan bien-être avant de commencer.',
  },
  {
    Icon: Clock,
    title: '21 jours accompagnés',
    description: 'Séances, recettes et conseils — du premier au dernier jour.',
  },
  {
    Icon: Users,
    title: 'Communauté 24FIT PESSORA',
    description: 'On avance ensemble : c\'est ce qui fait tenir les 21 jours.',
  },
];

export function ChallengeTrustBadges() {
  return (
    <section className="border-b border-noir/[0.06] bg-surface-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-11 md:grid-cols-3 md:gap-12 md:px-10 lg:px-[72px]">
        {ITEMS.map(({ Icon, title, description }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-sapin/30">
              <Icon size={14} strokeWidth={1.3} className="text-sapin" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-noir">{title}</p>
              <p className="text-[13px] leading-relaxed text-black/58">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
