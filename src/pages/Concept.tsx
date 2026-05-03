import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { barInfo } from '../data/infoData';
import { PageShell } from '../components/layout/PageShell';
import { PageHero } from '../components/layout/PageHero';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';

const Concept = () => {
  const fadeUp = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();
  const conceptImages = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1556761175-4b46a572b186?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1545201070-84682a36f181?auto=format&fit=crop&q=80&w=1200',
  ];

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Notre philosophie"
        title={<>L’équilibre <span className="italic text-black/55">redéfini</span></>}
        subtitle="Une approche du bien-être pensée pour votre quotidien, sans artifice superflu."
      />

      <section className="bg-surface-muted py-14 md:py-20">
        <PageShell>
          <motion.div className="mx-auto max-w-3xl space-y-8 text-center" {...fadeUp}>
            <p
              className="font-display font-normal leading-snug text-black"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.8vw, 30px)' }}
            >
              PessÓra n’est pas qu’un bar protéiné. C’est une invitation à{' '}
              <span className="italic text-black/65">ralentir</span> pour mieux{' '}
              <span className="italic text-black/65">repartir</span>.
            </p>
            <p className="text-[14px] font-light italic leading-relaxed text-black/45">
              « En Martinique, nous avons tout ce qu’il faut pour briller. Nous avons simplement créé le lieu
              pour nourrir cette lumière intérieure. »
            </p>
          </motion.div>
        </PageShell>
      </section>

      <section className="py-14 md:py-20">
        <PageShell>
          <motion.div
            className="space-y-16 md:space-y-24"
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -60px 0px' }}
          >
            {barInfo.values.map((value, index) => (
              <motion.div
                key={index}
                variants={item}
                className={`flex flex-col items-center gap-10 md:gap-14 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden md:w-3/5">
                  <img
                    src={conceptImages[index]}
                    alt=""
                    width={1200}
                    height={750}
                    className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  />
                </div>
                <div className="w-full space-y-5 md:w-2/5">
                  <span className="text-[10px] font-normal uppercase tracking-[0.22em] text-black/40">
                    Chapitre {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2
                    className="font-display font-normal tracking-[-0.02em] text-black"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 34px)' }}
                  >
                    {value.title}
                  </h2>
                  <p className="text-[14px] font-light leading-relaxed text-black/55">
                    {value.description}. Nous croyons que chaque gorgée doit être une étape vers une meilleure
                    version de soi-même, sans jamais sacrifier le plaisir gustatif.
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </PageShell>
      </section>

      <section className="border-t border-noir/[0.05] bg-white py-16 text-center md:py-20">
        <PageShell>
          <motion.div {...fadeUp}>
          <h2
            className="mb-8 font-display font-normal tracking-[-0.02em] text-black"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)' }}
          >
            Prêt à vivre l’expérience ?
          </h2>
          <Link
            to="/menu"
            className="text-editorial-link-underline inline-block"
          >
            Explorer la carte
          </Link>
          </motion.div>
        </PageShell>
      </section>
    </div>
  );
};

export default Concept;
