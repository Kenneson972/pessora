import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { rangesData } from '../../data/productsData';

const RANGES = [
  { id: 'wellness' as const, sub: 'Compléments nutrition' },
  { id: 'sport'   as const, sub: 'Performance & récupération' },
  { id: 'skin'    as const, sub: 'Beauté & éclat' },
];

export function NosProduitsTiles() {
  const navigate = useNavigate();
  return (
    <section className="bg-white px-4 pb-10 md:px-10 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <p className="mb-5 text-[9px] uppercase tracking-[0.26em] text-black/35">Explorer par gamme</p>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/nos-produits#collection-${r.id}`)}
              className="group relative aspect-[4/3] overflow-hidden rounded-[10px] text-left"
              aria-label={`Voir ${rangesData[r.id].title}`}
            >
              <img
                src={rangesData[r.id].heroImage}
                alt={rangesData[r.id].title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-transparent" />
              <span className="absolute top-4 left-4 text-[13px] font-light text-white">
                {rangesData[r.id].title.replace('Gamme ', '')}
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/55">{r.sub}</span>
                <div className="w-7 h-7 rounded-full border border-white/30 bg-white/12 flex items-center justify-center">
                  <ArrowRight size={11} className="text-white/80" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
