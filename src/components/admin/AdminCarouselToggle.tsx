import { cn } from '@heroui/react';

const labelClass = 'mb-1.5 block text-[10px] font-normal uppercase tracking-[0.14em] text-black/45';
const inputClass =
  'w-full min-h-11 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-3 py-2 text-base sm:text-[13px] text-black placeholder:text-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

interface Props {
  included: boolean;
  onIncludeChange: (v: boolean) => void;
  position: string;
  onPositionChange: (v: string) => void;
  badge: string;
  onBadgeChange: (v: string) => void;
  busy: boolean;
}

export function AdminCarouselToggle({
  included,
  onIncludeChange,
  position,
  onPositionChange,
  badge,
  onBadgeChange,
  busy,
}: Props) {
  return (
    <div className="space-y-4 rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] px-4 py-4">
      <div>
        <p className={labelClass}>Carrousel d'accueil</p>
        <label className="mt-2 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={included}
            onChange={(e) => {
              const on = e.target.checked;
              onIncludeChange(on);
              if (!on) {
                onPositionChange('');
                onBadgeChange('');
              }
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-black"
            disabled={busy}
          />
          <span>
            <span className="block text-[13px] font-normal text-black/85">
              Ajouter cette boisson au carrousel d'accueil
            </span>
            <span className="mt-0.5 block text-[11px] font-light leading-relaxed text-black/42">
              Rien à taper : laissez « Position » vide pour placer automatiquement en dernier (nouveau produit) ou
              conserver la position actuelle à l'édition.
            </span>
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="carousel-position" className={labelClass}>Position dans le carrousel</label>
          <input
            id="carousel-position"
            type="number"
            inputMode="numeric"
            min={1}
            disabled={!included || busy}
            className={cn(inputClass, (!included || busy) && 'cursor-not-allowed opacity-45')}
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            placeholder="Automatique si vide"
          />
          <p className="mt-1.5 text-[10px] font-light leading-relaxed text-black/38">
            Optionnel : 1 = première slide. Vide = ordre auto ou inchangé selon le cas.
          </p>
        </div>
        <div>
          <label htmlFor="carousel-badge" className={labelClass}>Pastille sur l'accueil</label>
          <select
            id="carousel-badge"
            disabled={!included || busy}
            className={cn(inputClass, (!included || busy) && 'cursor-not-allowed opacity-45')}
            value={badge}
            onChange={(e) => onBadgeChange(e.target.value)}
          >
            <option value="">—</option>
            <option value="nouveaute">Nouveauté</option>
            <option value="coup-de-coeur">Coup de cœur</option>
          </select>
        </div>
      </div>
    </div>
  );
}
