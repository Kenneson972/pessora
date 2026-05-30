import { useHomeBanner } from '../../hooks/useHomeBanner';

export function HomeBanner() {
  const { data, loading } = useHomeBanner();

  if (loading || !data) {
    return (
      <section className="bg-surface-page py-8 md:py-10">
        <div className="section-wrapper">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] rounded-[2px] overflow-hidden md:h-[400px]">
            <div className="bg-noir/[0.10] animate-pulse min-h-[200px] md:min-h-0" />
            <div className="bg-noir/[0.04] animate-pulse min-h-[260px] md:min-h-0" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-page py-8 md:py-10">
      <div className="section-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] rounded-[2px] overflow-hidden md:h-[400px]">
          {/* Panneau texte gauche */}
          <div className="relative flex flex-col justify-center px-8 py-10 md:px-12 md:py-14 min-h-[220px] md:min-h-0 bg-sapin">
            <p className="text-[8px] uppercase tracking-[0.28em] text-white/40 mb-3">
              Bien-être · PessÓra
            </p>
            <h3
              className="font-display font-normal text-white leading-[1.06] mb-3"
              style={{ fontSize: 'clamp(22px, 2.4vw, 34px)' }}
            >
              {data.title}
            </h3>
            {data.subtitle && (
              <p className="text-[13px] font-light text-white/60 mb-7 leading-relaxed">
                {data.subtitle}
              </p>
            )}
          </div>

          {/* Panneau photo droite */}
          <div className="relative overflow-hidden min-h-[260px] md:min-h-0 bg-sapin-subtle">
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={data.title}
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sapin/30 text-[9px] uppercase tracking-[0.2em]">
                Photo à venir
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
