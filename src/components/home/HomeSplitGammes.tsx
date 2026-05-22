import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { splitGammesData } from '../../data/homeSplitGammes';

function PhotoSlot({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover object-top ${className ?? ''}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className={`h-full w-full bg-noir/[0.06] flex flex-col items-center justify-center gap-2 text-black/25 ${className ?? ''}`}>
      <span className="text-[32px]">📸</span>
      <span className="text-[9px] uppercase tracking-[0.16em]">Photo à venir</span>
    </div>
  );
}

export function HomeSplitGammes() {
  const [activeKey, setActiveKey] = useState<string>('wellness');
  const navigate = useNavigate();
  const active = splitGammesData.find((g) => g.key === activeKey) ?? splitGammesData[0];

  return (
    <section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 text-center">
          <h2
            className="mb-3 font-display font-normal leading-[1.02] text-black"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
          >
            Choisis ton moment
          </h2>
          <p className="mx-auto mb-6 max-w-[36ch] text-[13px] font-light leading-relaxed text-black/50">
            Chaque boisson PessÓra est pensée pour un instant précis.
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {splitGammesData.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveKey(g.key)}
                className={[
                  'px-5 py-2 rounded-full text-[11px] font-normal tracking-[0.06em] border transition-all duration-200',
                  activeKey === g.key
                    ? 'bg-noir text-white border-noir'
                    : 'bg-white text-black/55 border-noir/[0.15] hover:border-noir/30 hover:text-black',
                ].join(' ')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[3fr_2fr] gap-1 rounded-[12px] overflow-hidden h-[420px] md:h-[520px]">
          <div className="relative overflow-hidden">
            <PhotoSlot src={active.mainImage} alt={active.eyebrow} />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
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
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex-1 overflow-hidden">
              <PhotoSlot src={active.sideImages[0]} alt={`${active.label} boisson 1`} />
            </div>
            <div className="flex-1 overflow-hidden">
              <PhotoSlot src={active.sideImages[1]} alt={`${active.label} boisson 2`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
