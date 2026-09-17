import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageShell } from '../layout/PageShell';
import { useFadeUpWhenVisible, useStaggerReveal } from '../../lib/motionReveal';
import {
  SKIN_PROTOCOL_STEPS,
  SKIN_PRODUCT_NOTICES,
  SKIN_PORTRAIT_ASSETS,
} from '../../data/skinProtocol';
import type { GammeProduct } from '../../types/database';

const assetKey = (url: string) => url.split('?')[0].split('/').pop() ?? '';

const matchProducts = (keywords: string[], products: GammeProduct[]): GammeProduct[] =>
  products.filter((p) => keywords.some((k) => p.name.toLowerCase().includes(k.toLowerCase())));

/**
 * Vignette produit.
 *
 * Le packshot fourni par la cliente est un canevas large où le flacon n'occupe qu'une
 * bande étroite : un carré en `object-contain` rend un trait illisible. Les assets
 * mesurés (cf. `skinProtocol.ts`) se cadrent donc en puits portrait `object-cover`.
 * Une image absente ou cassée ne laisse pas de trou : la vignette disparaît, le nom reste.
 */
const Packshot = ({ product }: { product: GammeProduct }) => {
  const [failed, setFailed] = useState(false);
  if (!product.image_url || failed) return null;
  const portrait = SKIN_PORTRAIT_ASSETS.includes(assetKey(product.image_url));
  return (
    <span
      data-packshot={portrait ? 'portrait' : 'square'}
      className={
        portrait
          ? 'flex h-24 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-white'
          : 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-white'
      }
    >
      <img
        src={product.image_url}
        alt=""
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
        className={portrait ? 'h-full w-full object-cover' : 'h-full w-full object-contain p-1'}
      />
    </span>
  );
};

/**
 * Bloc « Le protocole » — Gamme Skin.
 *
 * Décrit QUOI appliquer et DANS QUEL ORDRE. Chaque citation est recopiée de la fiche
 * produit PUBLIÉE de la cliente, et posée sous le produit dont elle sort — jamais au
 * niveau du geste, où elle pourrait passer pour la source de sa voisine.
 * Aucune promesse de résultat, aucune photo de cliente : ce bloc ne dépend d'aucun accord.
 */
const SkinProtocol = ({ products }: { products: GammeProduct[] }) => {
  const fadeIntro = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  return (
    <section aria-labelledby="skin-protocole" className="pb-16 md:pb-20">
      <PageShell>
        <div className="rounded-[2px] bg-surface-product-well px-6 py-12 md:px-12 md:py-16">
          <motion.div className="mx-auto max-w-2xl text-center" {...fadeIntro}>
            <p className="mb-3 font-sans text-[0.5rem] font-normal uppercase tracking-[0.42em] text-black/60">
              Le protocole
            </p>
            <h2
              id="skin-protocole"
              className="font-display font-normal tracking-[-0.01em] text-black"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.6vw, 30px)' }}
            >
              Quoi appliquer, dans quel ordre.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[13px] font-light leading-relaxed text-black/60">
              Cinq gestes, du nettoyage à la protection. Les mots entre guillemets sont ceux de la
              fiche produit, recopiés sous le produit dont ils sortent.
            </p>
          </motion.div>

          <motion.ol
            className="mt-12 grid list-none grid-cols-1 items-start gap-y-12 p-0 md:grid-cols-3 md:gap-x-10 md:gap-y-14"
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: '0px 0px -48px 0px' }}
          >
            {SKIN_PROTOCOL_STEPS.map((step, index) => {
              const matches = matchProducts(step.keyword, products);
              return (
                <motion.li key={step.geste} variants={item} className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[12px] tabular-nums text-black/60">
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
                    <ul className="mt-5 list-none space-y-5 p-0">
                      {matches.map((product) => {
                        const notice = SKIN_PRODUCT_NOTICES.find((n) => n.source === product.name);
                        return (
                          <li key={product.id} className="flex items-start gap-4">
                            <Packshot product={product} />
                            <div className="min-w-0 pt-1">
                              <p className="text-[12px] font-light leading-snug text-black/60">
                                {product.name}
                              </p>
                              {notice && (
                                <p
                                  className="mt-1 text-pretty font-display text-[13px] font-light italic leading-snug text-black/60"
                                  style={{ fontFamily: 'var(--font-display)' }}
                                >
                                  « {notice.text} »
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </motion.li>
              );
            })}
          </motion.ol>

          <motion.p
            className="mx-auto mt-14 max-w-2xl text-center text-[11px] font-normal uppercase tracking-[0.12em] text-black/60"
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
