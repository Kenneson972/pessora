import { motion } from 'framer-motion';
import { Smartphone, Users, Dumbbell, Salad, MessagesSquare, Target, type LucideIcon } from 'lucide-react';
import { useFadeUpWhenVisible, EDITORIAL_EASE } from '../../lib/motionReveal';

/** Ralentit un reveal (respecte prefers-reduced-motion — duration:0 reste 0). */
function slowReveal(reveal: ReturnType<typeof useFadeUpWhenVisible>, duration: number, delay: number) {
  const isReducedMotion = (reveal.transition as { duration?: number }).duration === 0;
  return isReducedMotion
    ? reveal.transition
    : { duration, ease: EDITORIAL_EASE, delay };
}

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

/** Voile côté texte seulement (gauche → transparent vers 65%) — le reste de
 * l'image (la bannière) reste visible et net, à droite. */
const LEFT_SCRIM =
  'linear-gradient(90deg, oklch(7% .004 55 / 0.88) 0%, oklch(7% .004 55 / 0.75) 40%, oklch(7% .004 55 / 0.32) 65%, transparent 85%)';

function InclusRow({ item, index }: { item: InclusItem; index: number }) {
  const bannerReveal = useFadeUpWhenVisible();
  const textReveal = useFadeUpWhenVisible();
  return (
    // Le whileInView vit sur ce <li> (pas de overflow-hidden ici) — le
    // recadrage de l'image vit sur le <div> enfant juste en dessous. Jamais
    // les deux sur le même élément (bug connu, mémoire projet).
    <motion.li
      className="relative aspect-[4/3] w-full sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[32/9]"
      {...bannerReveal}
      transition={slowReveal(bannerReveal, 1.1, index * 0.1)}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2px]">
        {item.image ? (
          <img src={item.image} alt={item.label} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: IMAGE_FALLBACK }} />
        )}

        <div aria-hidden="true" className="absolute inset-0" style={{ background: LEFT_SCRIM }} />

        {!item.image && (
          <item.icon
            aria-hidden="true"
            strokeWidth={1.3}
            className="absolute right-[12%] top-1/2 -translate-y-1/2 text-white/85"
            style={{ width: '64px', height: '64px' }}
          />
        )}
      </div>

      <motion.div
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-[560px] flex-col justify-center px-8 sm:w-[55%] md:px-14 lg:w-[45%]"
        {...textReveal}
        transition={slowReveal(textReveal, 0.9, index * 0.1 + 0.25)}
      >
        <item.icon aria-hidden="true" strokeWidth={1.4} className="mb-4 text-white" style={{ width: '26px', height: '26px' }} />
        <h3
          className="mb-3 font-display font-normal text-white"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.4vw, 30px)' }}
        >
          {item.label}
        </h3>
        <p className="max-w-[40ch] text-[14px] font-light leading-relaxed text-white/80">{item.description}</p>
      </motion.div>
    </motion.li>
  );
}

/**
 * Les 6 "inclus", en grandes bannières indépendantes (retour utilisateur,
 * 12/09) : chaque bannière est une seule image pleine largeur/hauteur —
 * pas deux colonnes séparées — avec le texte superposé à gauche sur un
 * voile qui s'efface vers la droite, pour laisser l'image respirer.
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
        <ul className="flex flex-col gap-6 md:gap-8">
          {INCLUS.map((item, index) => (
            <InclusRow key={item.label} item={item} index={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}
