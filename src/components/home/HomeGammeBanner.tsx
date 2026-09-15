import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSplitGammes } from '../../hooks/useSplitGammes';
import { EDITORIAL_EASE } from '../../lib/motionReveal';

const GAMME_COLORS: Record<string, { panel: string; photo: string }> = {
  wellness: { panel: '#1E3529', photo: '#EBF3EC' },
  energie:  { panel: '#5C2508', photo: '#FEF2E8' },
  shakes:   { panel: '#2A1842', photo: '#F3EEF9' },
  coffee:   { panel: '#1A0D04', photo: '#FBF5EC' },
};
const DEFAULT_COLORS = { panel: '#151210', photo: '#F7F4F0' };

export function HomeGammeBanner() {
  const { gammes, loading } = useSplitGammes();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="section-wrapper py-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] rounded-[2px] overflow-hidden md:h-[400px]">
          <div className="bg-noir/[0.10] animate-pulse min-h-[200px] md:min-h-0" />
          <div className="bg-noir/[0.04] animate-pulse min-h-[260px] md:min-h-0" />
        </div>
      </div>
    );
  }

  const featured = gammes[0];
  if (!featured) return null;

  const colors = GAMME_COLORS[featured.key] ?? DEFAULT_COLORS;

  return (
    <section className="bg-surface-page py-8 md:py-10">
      <div className="section-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] rounded-[2px] overflow-hidden md:h-[400px]">
          {/* Panneau texte gauche */}
          <div
            className="relative flex flex-col justify-center px-8 py-10 md:px-12 md:py-14 min-h-[220px] md:min-h-0"
            style={{ backgroundColor: colors.panel }}
          >
            {/* 14/09 — le panneau porte une couleur de MARQUE qui change a chaque gamme
                (rgb(98,78,52), rgb(105,113,91)…). Mesure a l'oeil et au calcul : le
                meme `text-white/40` lit 2,68:1 sur l'une et passe sur l'autre — donc
                aucun reglage d'opacite ne tient sur les quatre. On pose un scrim
                (la recette des bannieres inclus), qui rend le contraste independant
                de la gamme affichee, et on remonte l'eyebrow d'un cran.
                Le scrim reste LEGER et desature vers la droite : la couleur de marque
                du panneau doit rester lisible, on ne la remplace pas. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-noir/45 via-noir/25 to-noir/5"
            />
            <p className="relative text-[10px] uppercase tracking-[0.28em] text-white/75 mb-3">
              {featured.eyebrow}
            </p>
            <h3
              className="relative font-display font-normal text-white leading-[1.06] mb-7"
              style={{ fontSize: 'clamp(22px, 2.4vw, 34px)' }}
            >
              {featured.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigate(featured.link_to)}
              className="relative self-start h-11 min-h-[44px] rounded-full border border-white/45 text-white text-[12px] uppercase tracking-[0.16em] hover:border-white hover:bg-white/10 px-5 transition-colors duration-200"
            >
              Voir la gamme
            </Button>
          </div>

          {/* Panneau photo droite */}
          <div
            className="relative overflow-hidden min-h-[260px] md:min-h-0"
            style={{ backgroundColor: colors.photo }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={featured.key}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: EDITORIAL_EASE }}
              >
                {featured.main_image_url ? (
                  <img
                    src={featured.main_image_url}
                    alt={featured.label}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-black/20 text-[9px] uppercase tracking-[0.2em]">
                    Photo à venir
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
