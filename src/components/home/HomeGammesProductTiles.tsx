import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { rangesData } from '../../data/productsData';
import { SPRING_SMOOTH } from '../../lib/motionReveal';

const RANGES = [
  { id: 'wellness' as const, sub: 'Compléments nutrition' },
  { id: 'sport'   as const, sub: 'Performance & récupération' },
  { id: 'skin'    as const, sub: 'Beauté & éclat' },
];

export function HomeGammesProductTiles({ onTabChange }: { onTabChange: (id: string) => void }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {RANGES.map((r, i) => (
        <motion.button
          key={r.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...SPRING_SMOOTH, delay: i * 0.1 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onTabChange(r.id);
            navigate(`/nos-produits#collection-${r.id}`);
          }}
          className="group relative aspect-[4/5] overflow-hidden rounded-[2px] text-left"
          aria-label={`Voir la gamme ${rangesData[r.id].title}`}
        >
          <img
            src={rangesData[r.id].heroImage}
            alt={rangesData[r.id].title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-noir/10" />
          <div className="absolute top-4 left-4">
            <span className="text-[13px] font-light text-white">{rangesData[r.id].title.replace('Gamme ', '')}</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/58">{r.sub}</span>
            <motion.div
              className="w-7 h-7 rounded-full border border-white/30 bg-white/12 flex items-center justify-center"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
            >
              <ArrowRight size={12} className="text-white/80" />
            </motion.div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
