import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { buildPickupSlots, todayRange, OPENING_HOURS, type WeeklyHours } from '../../data/openingHours';

const SLOT_INTERVAL = 15; // minutes

interface Slot {
  label: string;
  value: string; // ISO time "HH:MM"
  disabled: boolean;
}

interface PickupTimePickerProps {
  /**
   * Horaires d'ouverture, dérivés de la source unique (`bar_settings.opening_hours`,
   * repli sur le modèle `openingHours.ts`). Les créneaux du jour en découlent :
   * plus aucune heure en dur ici — c'est ce qui proposait un retrait à 10 h un lundi.
   */
  hours?: WeeklyHours;
  value: string;
  onChange: (time: string) => void;
}

export function PickupTimePicker({ hours = OPENING_HOURS, value, onChange }: PickupTimePickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    function compute() {
      setSlots(buildPickupSlots(hours, new Date(), SLOT_INTERVAL).map((slot) => ({ ...slot, disabled: false })));
    }

    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [hours]);

  if (slots.length === 0) {
    return (
      <div className="px-4 py-2.5 md:px-5 border-t border-noir/[0.06]">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock size={11} strokeWidth={1.3} className="text-sapin/45" />
          <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-black/45">Créneau de retrait</span>
        </div>
        <p className="text-[10px] font-light text-black/40">
          {todayRange(hours) === null ? "Fermé aujourd'hui." : "Aucun créneau aujourd'hui."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 md:px-5 border-t border-noir/[0.06]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Clock size={11} strokeWidth={1.3} className="text-sapin/45" />
        <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-black/45">Créneau de retrait</span>
      </div>
      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
        {slots.map((slot) => {
          const selected = value === slot.value;
          return (
            <button
              key={slot.value}
              type="button"
              disabled={slot.disabled}
              onClick={() => onChange(slot.value)}
              className={`min-h-[24px] px-1.5 py-0 rounded-[2px] text-[9px] font-normal transition-colors ${
                selected
                  ? 'bg-sapin text-white'
                  : slot.disabled
                    ? 'text-black/15 cursor-not-allowed'
                    : 'border border-noir/15 text-black/55 hover:border-sapin/40 hover:text-sapin'
              }`}
              aria-pressed={selected}
              aria-label={`Retrait à ${slot.label}`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
