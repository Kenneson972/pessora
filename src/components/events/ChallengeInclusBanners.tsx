import { motion } from 'framer-motion';
import { Smartphone, Users, Dumbbell, Salad, MessagesSquare, Target, type LucideIcon } from 'lucide-react';
import { useFadeUpWhenVisible } from '../../lib/motionReveal';

interface InclusItem {
  label: string;
  description: string;
  /** Fournie par Catherine, une à une — le composant tient sans elle. */
  image?: string;
  icon: LucideIcon;
}

const INCLUS: InclusItem[] = [
  {
    label: 'Application GetFitNow',
    description: "Ton coach dans la poche : programmes d'entraînement guidés, suivis jour après jour, accessibles depuis ton téléphone.",
    icon: Smartphone,
    image: '/challenge-21j/inclus-getfitnow.webp',
  },
  {
    label: 'Communauté 24FIT PESSORA',
    description: "Un groupe qui avance avec toi — encouragements, énergie collective, jamais seul·e pendant les 21 jours.",
    icon: Users,
    image: '/challenge-21j/inclus-communaute.webp',
  },
  {
    label: 'Séances de sport',
    description: "Des séances pensées pour progresser sans se blesser, encadrées et adaptées à ton niveau.",
    icon: Dumbbell,
    image: '/challenge-21j/inclus-seances-sport.webp',
  },
  {
    label: 'Idées recettes',
    description: "Des recettes simples et gourmandes, pensées pour accompagner tes objectifs sans te compliquer la vie.",
    icon: Salad,
    image: '/challenge-21j/inclus-idees-recettes.webp',
  },
  {
    label: 'Conseils & accompagnement',
    description: "Un vrai suivi humain : des conseils personnalisés, une écoute réelle, pas un programme générique.",
    icon: MessagesSquare,
  },
  {
    label: 'Suivi de tes objectifs',
    description: "On avance ensemble vers ton objectif, étape par étape, avec un point réel sur ta progression.",
    icon: Target,
  },
];

/** Même dégradé que le hero — sert de repli tant qu'aucune image n'est fournie. */
const IMAGE_FALLBACK =
  'radial-gradient(120% 90% at 78% 18%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 62%), linear-gradient(160deg, oklch(15% .01 55) 0%, oklch(9% .006 55) 55%, oklch(7% .004 55) 100%)';

function InclusRow({ item, index }: { item: InclusItem; index: number }) {
  const reveal = useFadeUpWhenVisible();
  return (
    <li className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[42%_1fr] lg:gap-10">
      <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * 0.05 }}>
        <item.icon aria-hidden="true" strokeWidth={1.4} className="mb-4 text-sapin" style={{ width: '26px', height: '26px' }} />
        <h3
          className="mb-3 font-display font-normal text-noir"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(19px, 2vw, 26px)' }}
        >
          {item.label}
        </h3>
        <p className="max-w-[42ch] text-[14px] font-light leading-relaxed text-black/62">{item.description}</p>
      </motion.div>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2px] sm:aspect-[16/9]">
        {item.image ? (
          <img src={item.image} alt={item.label} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <>
            <div aria-hidden="true" className="absolute inset-0" style={{ background: IMAGE_FALLBACK }} />
            <item.icon
              aria-hidden="true"
              strokeWidth={1.3}
              className="absolute inset-0 m-auto text-white/90"
              style={{ width: '56px', height: '56px' }}
            />
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Les 6 "inclus", en rangées texte + image plutôt qu'en grille de cartes
 * (retour utilisateur, 12/09) : zone texte ~42% (titre, description) / zone
 * image ~58%, chaque rangée indépendante, le titre + la description en
 * reveal au scroll (léger décalage entre rangées).
 */
export function ChallengeInclusBanners() {
  return (
    <section id="inclus" className="bg-white py-16 md:py-[6.5rem]">
      <div className="mx-auto max-w-6xl px-4 md:px-10 lg:px-[72px]">
        <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Ce qui est inclus</p>
        <h2
          className="mb-12 font-display font-normal md:mb-16"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
        >
          Ce que tu ne fais pas seul
        </h2>
        <ul className="flex flex-col gap-14 md:gap-20">
          {INCLUS.map((item, index) => (
            <InclusRow key={item.label} item={item} index={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}
