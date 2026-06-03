import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface BusinessHours {
  weekdays: { days: string; hours: string };
  saturday: { days: string; hours: string };
  sunday: { days: string; hours: string };
}

function parseHoursRange(hours: string): { start: number; end: number } | null {
  // "9h30 - 18h" → { start: 9.5, end: 18 }
  const m = hours.match(/(\d+)h(\d*)\s*-\s*(\d+)h(\d*)/);
  if (!m) return null;
  const startH = parseInt(m[1], 10);
  const startM = parseInt(m[2] || '0', 10);
  const endH = parseInt(m[3], 10);
  const endM = parseInt(m[4] || '0', 10);
  return { start: startH + startM / 60, end: endH + endM / 60 };
}

function getTodayRange(hours: BusinessHours): { start: number; end: number } | null {
  const day = new Date().getDay();
  // 0 = dimanche, 6 = samedi
  if (day === 0) return null; // fermé
  const h = day === 6 ? hours.saturday.hours : hours.weekdays.hours;
  return parseHoursRange(h);
}

const SLOT_INTERVAL = 15; // minutes

interface Slot {
  label: string;
  value: string; // ISO time "HH:mm"
  disabled: boolean;
}

interface PickupTimePickerProps {
  businessHours: BusinessHours;
  value: string;
  onChange: (time: string) => void;
}

export function PickupTimePicker({ businessHours, value, onChange }: PickupTimePickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    function compute() {
      const range = getTodayRange(businessHours);
      if (!range) { setSlots([]); return; }

      const result: Slot[] = [];

      const startMinutes = range.start * 60;
      const endMinutes = range.end * 60;

      for (let m = startMinutes; m <= endMinutes; m += SLOT_INTERVAL) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const label = `${h}h${min > 0 ? min : ''}`;
        const valueStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const disabled = false;
        result.push({ label, value: valueStr, disabled });
      }
      setSlots(result);
    }

    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [businessHours]);

  if (slots.length === 0) {
    return (
      <div className="px-4 py-2.5 md:px-5 border-t border-noir/[0.06]">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock size={11} strokeWidth={1.3} className="text-sapin/45" />
          <span className="text-[8px] font-normal uppercase tracking-[0.16em] text-black/45">Créneau de retrait</span>
        </div>
        <p className="text-[10px] font-light text-black/40">
          {new Date().getDay() === 0 ? "Fermé le dimanche." : "Aucun créneau aujourd'hui."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 md:px-5 border-t border-noir/[0.06]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Clock size={11} strokeWidth={1.3} className="text-sapin/45" />
        <span className="text-[8px] font-normal uppercase tracking-[0.16em] text-black/45">Créneau de retrait</span>
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
