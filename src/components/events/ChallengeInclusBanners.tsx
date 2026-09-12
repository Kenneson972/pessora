import { motion } from 'framer-motion';
import { Smartphone, Users, Dumbbell, Salad, MessagesSquare, Target, type LucideIcon } from 'lucide-react';
import { useFadeUpWhenVisible } from '../../lib/motionReveal';

interface InclusItem {
  label: string;
  /** Fournie par Catherine, une à une — le composant tient sans elle. */
  image?: string;
  icon: LucideIcon;
}

const INCLUS: InclusItem[] = [
  { label: 'Application GetFitNow', icon: Smartphone, image: '/challenge-21j/inclus-getfitnow.webp' },
  { label: 'Communauté 24FIT PESSORA', icon: Users, image: '/challenge-21j/inclus-communaute.webp' },
  { label: 'Séances de sport', icon: Dumbbell, image: '/challenge-21j/inclus-seances-sport.webp' },
  { label: 'Idées recettes', icon: Salad, image: '/challenge-21j/inclus-idees-recettes.webp' },
  { label: 'Conseils & accompagnement', icon: MessagesSquare },
  { label: 'Suivi de tes objectifs', icon: Target },
];

/** Même dégradé que le hero — sert de repli tant qu'aucune image n'est fournie. */
const BANNER_FALLBACK =
  'radial-gradient(120% 90% at 78% 18%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 62%), linear-gradient(160deg, oklch(15% .01 55) 0%, oklch(9% .006 55) 55%, oklch(7% .004 55) 100%)';

function InclusBanner({ item, index }: { item: InclusItem; index: number }) {
  const reveal = useFadeUpWhenVisible();
  return (
    <li className="relative h-[280px] w-full overflow-hidden rounded-[2px] sm:h-[340px] md:h-[420px]">
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
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, oklch(7% .004 55 / 0.75) 0%, oklch(7% .004 55 / 0.28) 45%, transparent 75%)',
        }}
      />
      {!item.image && (
        <item.icon
          aria-hidden="true"
          strokeWidth={1.3}
          className="absolute inset-0 m-auto text-white/90"
          style={{ width: '64px', height: '64px' }}
        />
      )}
      {/* Le child animé n'a pas overflow-hidden lui-même (seul le <li> parent
          l'a, pour le recadrage image) — whileInView vit ici, pas sur le
          conteneur overflow. */}
      <motion.div
        className="absolute inset-x-5 bottom-5 flex items-end gap-3 sm:inset-x-8 sm:bottom-8"
        {...reveal}
        transition={{ ...reveal.transition, delay: index * 0.06 }}
      >
        {item.image && (
          <item.icon
            aria-hidden="true"
            strokeWidth={1.4}
            className="mb-0.5 shrink-0 text-white"
            style={{ width: '22px', height: '22px' }}
          />
        )}
        <span
          className="font-display font-light leading-tight text-white"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.2vw, 26px)' }}
        >
          {item.label}
        </span>
      </motion.div>
    </li>
  );
}

/**
 * Les 6 "inclus", en bannières longues et indépendantes plutôt qu'en grille
 * de petites cartes (retour utilisateur, 12/09 : "il faut les bannières
 * longues pas des petits carrés, avec un beau layout et de belles
 * animations"). Chaque libellé apparaît en reveal (fade + translation) au
 * scroll, avec un léger décalage entre bannières.
 */
export function ChallengeInclusBanners() {
  return (
    <section id="inclus" className="bg-white py-16 md:py-[6.5rem]">
      <div className="mx-auto max-w-6xl px-4 md:px-10 lg:px-[72px]">
        <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Ce qui est inclus</p>
        <h2
          className="mb-10 font-display font-normal"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
        >
          Ce que tu ne fais pas seul
        </h2>
        <ul className="flex flex-col gap-4 md:gap-6">
          {INCLUS.map((item, index) => (
            <InclusBanner key={item.label} item={item} index={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}
