import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  OPENING_HOURS,
  buildPickupSlots,
  chatbotHoursText,
  displayLines,
  formatRange,
  isWeeklyHours,
  resolveOpeningHours,
  todayRange,
} from '../data/openingHours';

// Dates de référence — construites en heure locale (jamais en UTC) :
// 19/09/2026 = samedi, 20/09/2026 = dimanche, 21/09/2026 = lundi, 22/09/2026 = mardi.
const SAMEDI = new Date(2026, 8, 19);
const DIMANCHE = new Date(2026, 8, 20);
const LUNDI = new Date(2026, 8, 21);
const MARDI = new Date(2026, 8, 22);

const values = (date: Date) => buildPickupSlots(OPENING_HOURS, date).map((s) => s.value);
const last = (arr: string[]) => arr[arr.length - 1];

describe('horaires — affichage dérivé', () => {
  it('regroupe les jours consécutifs et écrit le lundi à part', () => {
    expect(displayLines(OPENING_HOURS)).toEqual([
      { label: 'Lundi', value: '16h00 - 19h00' },
      { label: 'Mardi au vendredi', value: '10h00 - 19h00' },
      { label: 'Samedi', value: '09h00 - 14h00' },
      { label: 'Dimanche', value: 'Fermé' },
    ]);
  });

  it('formate une plage comme le panneau du bar', () => {
    expect(formatRange({ open: '09:00', close: '14:00' })).toBe('09h00 - 14h00');
    expect(formatRange(null)).toBe('Fermé');
  });

  it('la réponse du PessoBot est construite, jamais recopiée', () => {
    const texte = chatbotHoursText();
    expect(texte).toContain('Lundi : 16h00 - 19h00');
    expect(texte).toContain('Mardi : 10h00 - 19h00');
    expect(texte.trimEnd().endsWith('Dimanche : fermé')).toBe(true);
    expect(texte).not.toContain('9h30');
  });
});

describe('horaires — créneaux de retrait (Click & Collect)', () => {
  it('le LUNDI commence à 16 h et ne propose JAMAIS 10 h', () => {
    const lundi = values(LUNDI);
    expect(lundi[0]).toBe('16:00');
    expect(lundi).not.toContain('10:00');
    expect(lundi).not.toContain('15:45');
    expect(last(lundi)).toBe('19:00');
  });

  it('le MARDI ouvre à 10 h et ferme à 19 h', () => {
    const mardi = values(MARDI);
    expect(mardi[0]).toBe('10:00');
    expect(last(mardi)).toBe('19:00');
    expect(mardi).toHaveLength(37); // 9 h × 4 créneaux + le dernier
  });

  it('le SAMEDI reste 09 h – 14 h', () => {
    expect(values(SAMEDI)[0]).toBe('09:00');
    expect(last(values(SAMEDI))).toBe('14:00');
  });

  it('le DIMANCHE ne propose aucun créneau', () => {
    expect(todayRange(OPENING_HOURS, DIMANCHE)).toBeNull();
    expect(values(DIMANCHE)).toEqual([]);
  });
});

describe('horaires — la base fait foi, sinon le modèle (jamais un autre jeu de valeurs)', () => {
  it('accepte une base complète et valide', () => {
    const base = { ...OPENING_HOURS, 1: { open: '15:30', close: '18:30' } };
    const resolved = resolveOpeningHours(base);
    expect(resolved.source).toBe('base');
    expect(resolved.hours[1]).toEqual({ open: '15:30', close: '18:30' });
  });

  it('signale une base incomplète au lieu de l’absorber en silence', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resolved = resolveOpeningHours({ 1: { open: '16:00', close: '19:00' } });
    expect(resolved.source).toBe('modele');
    expect(resolved.hours).toBe(OPENING_HOURS);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('n’accepte pas une plage mal formée', () => {
    expect(isWeeklyHours({ ...OPENING_HOURS, 3: { open: '9h30', close: '18h' } })).toBe(false);
    expect(isWeeklyHours(OPENING_HOURS)).toBe(true);
  });
});

describe('horaires — gardes anti-divergence', () => {
  const html = readFileSync('index.html', 'utf8');

  it('le balisage Google (index.html) dit la même chose que le modèle', () => {
    const bloc = html.match(/"openingHoursSpecification"\s*:\s*(\[[\s\S]*?\n\s*\])/);
    expect(bloc, 'balisage openingHoursSpecification introuvable dans index.html').not.toBeNull();

    const specs = JSON.parse(bloc![1]) as Array<{
      dayOfWeek: string | string[];
      opens: string;
      closes: string;
    }>;

    const byDay: Record<string, { opens: string; closes: string }> = {};
    for (const spec of specs) {
      const days = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek];
      for (const day of days) byDay[day] = { opens: spec.opens, closes: spec.closes };
    }

    const noms = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // noms[] suit l'index de Date.getDay() : 0 = dimanche, comme OPENING_HOURS.
    for (let jour = 0; jour <= 6; jour += 1) {
      const plage = OPENING_HOURS[jour as 0 | 1 | 2 | 3 | 4 | 5 | 6];
      const spec = byDay[noms[jour]];
      expect(spec, `jour manquant dans le balisage : ${noms[jour]}`).toBeDefined();
      if (plage === null) {
        // Convention schema.org pour « fermé » : opens == closes.
        expect({ jour: noms[jour], spec }).toEqual({ jour: noms[jour], spec: { opens: '00:00', closes: '00:00' } });
      } else {
        expect({ jour: noms[jour], spec }).toEqual({
          jour: noms[jour],
          spec: { opens: plage.open, closes: plage.close },
        });
      }
    }
  });

  it('aucune heure en dur n’est revenue dans infoData.ts', () => {
    const source = readFileSync('src/data/infoData.ts', 'utf8');
    for (const ancienne of ['9h30', '10h30', '18h', '14h']) {
      expect(source, `« ${ancienne} » est réapparu dans infoData.ts`).not.toContain(ancienne);
    }
  });

  it('les copies en dur ont disparu des surfaces qui portaient les horaires', () => {
    for (const fichier of [
      'src/components/common/Chatbot.tsx',
      'src/pages/Contact.tsx',
      'src/components/cart/PickupTimePicker.tsx',
    ]) {
      const source = readFileSync(fichier, 'utf8');
      expect(source, `heures en dur dans ${fichier}`).not.toMatch(/9h30|10h30|18h\b/);
    }
  });
});
