import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { splitGammesData } from '../../data/homeSplitGammes';
import { useFadeUpWhenVisible, SPRING_TAB, EDITORIAL_EASE } from '../../lib/motionReveal';

const PHOTO_TRANSITION = { duration: 0.32, ease: EDITORIAL_EASE };

function PhotoSlot({ src, alt }: { src: string | null; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-top"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className="absolute inset-0 bg-noir/[0.06] flex flex-col items-center justify-center gap-2 text-black/25">
      <span className="text-[9px] uppercase tracking-[0.16em]">Photo à venir</span>
    </div>
  );
}

export function HomeSplitGammes() {
  const [activeKey, setActiveKey] = useState<string>('wellness');
  const navigate = useNavigate();
  const active = splitGammesData.find((g) => g.key === activeKey) ?? splitGammesData[0];
  const headerAnim = useFadeUpWhenVisible();

  return (
    <section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <motion.div className="mb-8 text-center" {...headerAnim}>
          <h2
            className="mb-3 font-display font-normal leading-[1.02] text-black"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
          >
            Choisis ton moment
          </h2>
          <p className="mx-auto mb-6 max-w-[36ch] text-[13px] font-light leading-relaxed text-black/50">
            Chaque boisson PessÓra est pensée pour un instant précis.
          </p>

          {/* Tabs with sliding layoutId pill */}
          <LayoutGroup id="split-gammes-tabs">
            <div className="flex justify-center gap-2 flex-wrap">
              {splitGammesData.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveKey(g.key)}
                  className={[
                    'relative overflow-hidden px-5 py-2 rounded-full text-[11px] font-normal tracking-[0.06em] border transition-colors duration-200',
                    activeKey === g.key
                      ? 'border-noir text-white'
                      : 'bg-white border-noir/[0.15] text-black/55 hover:border-noir/30 hover:text-black',
                  ].join(' ')}
                >
                  {activeKey === g.key && (
                    <motion.span
                      layoutId="split-tab-bg"
                      className="absolute inset-0 bg-noir"
                      transition={SPRING_TAB}
                    />
                  )}
                  <span className="relative">{g.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </motion.div>

        {/* Photo grid */}
        <motion.div
          className="grid grid-cols-[3fr_2fr] gap-1 rounded-[12px] overflow-hidden h-[420px] md:h-[520px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EDITORIAL_EASE, delay: 0.1 }}
        >
          {/* Grande photo gauche */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`main-${active.key}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={PHOTO_TRANSITION}
              >
                <PhotoSlot src={active.mainImage} alt={active.eyebrow} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8 pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={`overlay-${active.key}`}
                className="absolute inset-0 flex flex-col justify-end p-6 md:p-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
              >
                <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/58 mb-1.5">{active.eyebrow}</p>
                <h3 className="text-[18px] md:text-[22px] font-light text-white leading-snug mb-4">{active.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => navigate(active.linkTo)}
                  className="self-start h-9 min-h-9 rounded-full border border-white/30 bg-white/15 backdrop-blur-sm px-4 text-[9px] uppercase tracking-[0.14em] text-white hover:bg-white/25"
                >
                  Voir la gamme
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 2 photos droite */}
          <div className="flex flex-col gap-1">
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side0-${active.key}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...PHOTO_TRANSITION, delay: 0.06 }}
                >
                  <PhotoSlot src={active.sideImages[0]} alt={`${active.label} boisson 1`} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side1-${active.key}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...PHOTO_TRANSITION, delay: 0.12 }}
                >
                  <PhotoSlot src={active.sideImages[1]} alt={`${active.label} boisson 2`} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
