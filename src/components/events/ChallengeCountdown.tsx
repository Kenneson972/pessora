import { useEffect, useState } from 'react';
import { startOfDayMartinique } from '../../lib/martiniqueDate';

export interface ChallengeCountdownProps {
  /** Date ISO (YYYY-MM-DD) du début du challenge — events.date. */
  targetDate: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(targetMs: number): Remaining | null {
  const diff = targetMs - Date.now();
  // Strict : le minuteur s'efface dès que l'échéance est atteinte, même si
  // l'état de la page (isPast = date >= aujourd'hui) considère encore le
  // jour J comme "à venir" — un cran d'écart voulu entre deux définitions
  // de "maintenant" sur la même page (docs/CONSIGNES-CLAUDE.md, MINUTEUR §3).
  if (diff <= 0) return null;
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Compte à rebours vers le début du challenge (jour J, pas J-14). Ne
 * calcule rien lui-même au-delà de l'échéance reçue — startOfDayMartinique
 * rend un instant absolu, donc le décompte est identique quel que soit le
 * fuseau du visiteur (docs/CONSIGNES-CLAUDE.md, MINUTEUR §2-3).
 *
 * Anti-hydratation (comme ChefValidUntilTimer chez Dalcielo) : rien ne
 * s'affiche avant le montage client, serveur et navigateur ne voient pas la
 * même seconde.
 *
 * Traitement d'information, pas d'urgence (règles @lyra) : jamais de
 * rouge/cadre/halo/or, chiffres en noir, tabular-nums, pulsation des
 * secondes en opacité seule (jamais un rebond d'échelle), désactivée sous
 * prefers-reduced-motion. Vit dans son propre bloc (ChallengeCountdownSection),
 * plus dans le hero — décision du 12/09 (trop chargé).
 */
export function ChallengeCountdown({ targetDate }: ChallengeCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setMounted(true);
    const targetMs = startOfDayMartinique(targetDate).getTime();
    setRemaining(computeRemaining(targetMs));
    const id = setInterval(() => {
      setRemaining(computeRemaining(targetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!mounted || !remaining) return null;

  const units: { value: number; label: string }[] = [
    { value: remaining.days, label: 'jours' },
    { value: remaining.hours, label: 'heures' },
    { value: remaining.minutes, label: 'min' },
    { value: remaining.seconds, label: 'sec' },
  ];

  return (
    <div
      className="flex items-start justify-center gap-6 sm:gap-10"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {units.map((u, i) => (
        <div key={u.label} className="flex items-start gap-6 sm:gap-10">
          <div className="flex flex-col items-center">
            <span
              className={
                i === units.length - 1
                  ? 'font-display font-light text-noir motion-safe:animate-pulse'
                  : 'font-display font-light text-noir'
              }
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)' }}
            >
              {pad(u.value)}
            </span>
            <span className="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-black/45">{u.label}</span>
          </div>
          {i < units.length - 1 && <span className="pt-1 font-display font-light text-black/20" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)' }}>·</span>}
        </div>
      ))}
    </div>
  );
}
