import { useMemo } from 'react';
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
  const slots = useMemo<Slot[]>(() => {
    const range = getTodayRange(businessHours);
    if (!range) return [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const result: Slot[] = [];

    const startMinutes = Math.ceil(range.start * 60 / SLOT_INTERVAL) * SLOT_INTERVAL;
    const endMinutes = range.end * 60 - 15; // dernier créneau possible

    for (let m = startMinutes; m <= endMinutes; m += SLOT_INTERVAL) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const label = `${h}h${min > 0 ? min : ''}`;
      const valueStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const slotTotalMinutes = h * 60 + min;
      // Désactiver les créneaux dans moins de 10 min (temps de préparation)
      const disabled = slotTotalMinutes <= currentMinutes + 10;
      result.push({ label, value: valueStr, disabled });
    }
    return result;
  }, [businessHours]);

  if (slots.length === 0) {
    return (
      <div className="px-5 py-4 md:px-6 border-t border-noir/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={13} strokeWidth={1.3} className="text-black/40" />
          <span className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/45">
            Créneau de retrait
          </span>
        </div>
        <p className="text-[11px] font-light text-black/40">
          {new Date().getDay() === 0
            ? "Le bar est fermé le dimanche."
            : "Aucun créneau disponible aujourd'hui."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 md:px-6 border-t border-noir/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={13} strokeWidth={1.3} className="text-black/40" />
        <span className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/45">
          Créneau de retrait
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const selected = value === slot.value;
          return (
            <button
              key={slot.value}
              type="button"
              disabled={slot.disabled}
              onClick={() => onChange(slot.value)}
              className={`min-h-[36px] px-3 py-1.5 rounded-[2px] text-[11px] font-normal transition-colors ${
                selected
                  ? 'bg-noir text-white'
                  : slot.disabled
                    ? 'text-black/15 cursor-not-allowed'
                    : 'border border-noir/15 text-black/55 hover:border-noir/30 hover:text-noir'
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
