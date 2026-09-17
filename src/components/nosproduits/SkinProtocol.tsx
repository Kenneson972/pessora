import { motion } from 'framer-motion';
import { PageShell } from '../layout/PageShell';
import { useFadeUpWhenVisible, useStaggerReveal } from '../../lib/motionReveal';
import { SKIN_PROTOCOL_STEPS, type SkinProtocolStep } from '../../data/skinProtocol';
import type { GammeProduct } from '../../types/database';

const matchProducts = (step: SkinProtocolStep, products: GammeProduct[]): GammeProduct[] =>
  products.filter((p) =>
    step.keyword.some((k) => p.name.toLowerCase().includes(k.toLowerCase())),
  );

/**
 * Bloc « Le protocole » — Gamme Skin.
 *
 * Décrit QUOI appliquer et DANS QUEL ORDRE. Les mots entre guillemets sont ceux de
 * ses fiches produits, jamais les nôtres. Aucune promesse de résultat, aucune photo
 * de cliente : ce bloc ne dépend d'aucun accord, il est vrai aujourd'hui.
 */
const SkinProtocol = ({ products }: { products: GammeProduct[] }) => {
  const fadeIntro = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  return (
    <section aria-labelledby="skin-protocole" className="pb-16 md:pb-20">
      <PageShell>
        <div className="rounded-[2px] bg-surface-product-well px-6 py-12 md:px-12 md:py-16">
          <motion.div className="mx-auto max-w-2xl text-center" {...fadeIntro}>
            <p className="text-editorial-tagline mb-3">Le protocole</p>
            <h2
              id="skin-protocole"
              className="font-display font-normal tracking-[-0.01em] text-black"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.6vw, 30px)' }}
            >
              Quoi appliquer, dans quel ordre.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[13px] font-light leading-relaxed text-black/60">
              Cinq gestes, du nettoyage à la protection. Les mots entre guillemets sont ceux de la
              fiche produit.
            </p>
          </motion.div>

          <motion.ol
            className="mt-12 grid list-none grid-cols-1 gap-y-12 p-0 md:grid-cols-3 md:gap-x-10 md:gap-y-14"
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: '0px 0px -48px 0px' }}
          >
            {SKIN_PROTOCOL_STEPS.map((step, index) => {
              const matches = matchProducts(step, products);
              return (
                <motion.li key={step.geste} variants={item} className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[12px] tabular-nums text-black/45">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3
                      className="font-display text-[19px] font-normal text-black"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {step.geste}
                    </h3>
                  </div>

                  {matches.length > 0 && (
                    <ul className="mt-4 flex list-none flex-wrap items-center gap-3 p-0">
                      {matches.slice(0, 3).map((product) => (
                        <li
                          key={product.id}
                          className="flex items-center gap-2"
                          title={product.name}
                        >
                          {product.image_url && (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-white">
                              <img
                                src={product.image_url}
                                alt=""
                                className="h-full w-full object-contain p-1"
                                loading="lazy"
                                decoding="async"
                              />
                            </span>
                          )}
                          <span className="max-w-[9rem] text-[11px] font-light leading-tight text-black/60">
                            {product.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {step.mention && (
                    <blockquote className="mt-4 border-l border-noir/[0.12] pl-4">
                      <p
                        className="font-display text-[14px] font-light italic leading-snug text-black/60"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        « {step.mention} »
                      </p>
                      <footer className="mt-1 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45">
                        {step.mentionSource}
                      </footer>
                    </blockquote>
                  )}
                </motion.li>
              );
            })}
          </motion.ol>

          <motion.p
            className="mx-auto mt-14 max-w-2xl text-center text-[11px] font-normal uppercase tracking-[0.12em] text-black/45"
            {...fadeIntro}
          >
            Ce protocole décrit des gestes, pas un effet.
          </motion.p>
        </div>
      </PageShell>
    </section>
  );
};

export default SkinProtocol;
