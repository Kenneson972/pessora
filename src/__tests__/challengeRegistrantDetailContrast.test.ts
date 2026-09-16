import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Garde de contraste — fiche détail d'un inscrit Challenge 21j.
 *
 * La fiche (`src/components/admin/ChallengeRegistrantDetailModal.tsx`) reçoit deux
 * nouvelles lignes : l'email d'inscription et « newsletter : oui/non ». Cette garde
 * empêche de figer du texte sous WCAG AA dans la fiche qui les accueille.
 *
 * FAIL-CLOSED (exigence QA Vela, 16/09/2026) : un jeton de couleur que la garde ne
 * sait pas résoudre est un ÉCHEC, jamais un silence. Les notations entre crochets
 * (`text-black/[0.4]`, `text-[#999]`) et les palettes nommées (`text-gray-400`) sont
 * résolues, pas ignorées — sinon la garde laisserait passer exactement les lignes
 * qu'elle est censée surveiller.
 *
 * Les couleurs ne sont pas recopiées de mémoire : elles sont lues à l'exécution dans
 * `node_modules/tailwindcss/theme.css` (palette Tailwind v4, oklch) et dans
 * `src/index.css` (surcharges Pessora, dont `--color-noir`), puis converties
 * oklch -> luminance relative WCAG. Validation : red-600 v4 = 4,76:1 contre 4,83:1
 * annoncé pour le hex v3 équivalent (#dc2626) — dérive de palette connue, le socle
 * de calcul est juste.
 *
 * Pourquoi une garde sur la SOURCE et pas un rendu : le composant importe `Sheet`
 * depuis `@heroui-pro/react`, dont le paquet installé sur le VPS est un installeur
 * sans `main`/`exports` (code réel récupéré par le postinstall avec la licence,
 * absente ici) — le module n'est pas résolvable localement.
 *
 * Seuil : 4,5:1 (WCAG 2.1 AA texte normal ; tout le texte de la fiche est < 18,66 px gras).
 * Fond de référence : blanc (`bg-white` de la `Sheet.Dialog`). Un jeton à moins de
 * 5 % du seuil est signalé dans l'échec pour vérification humaine — jamais toléré en silence.
 */

const COMPONENT = resolve(process.cwd(), 'src/components/admin/ChallengeRegistrantDetailModal.tsx');
const THEME_FILES = [
  resolve(process.cwd(), 'node_modules/tailwindcss/theme.css'),
  resolve(process.cwd(), 'src/index.css'),
];

const AA_NORMAL_TEXT = 4.5;

// ---------------------------------------------------------------------------
// Couleurs : oklch / hex -> luminance relative WCAG
// ---------------------------------------------------------------------------

function toLinearFromSrgb(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminanceFromSrgb([r, g, b]: [number, number, number]): number {
  return 0.2126 * toLinearFromSrgb(r) + 0.7152 * toLinearFromSrgb(g) + 0.0722 * toLinearFromSrgb(b);
}

/** oklch(L C H) -> sRGB [0-255] (Oklab de Björn Ottosson, bornes appliquées). */
function oklchToSrgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return linear.map((c) => {
    const clamped = Math.min(1, Math.max(0, c));
    const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
  }) as [number, number, number];
}

function parseCssColor(value: string): [number, number, number] | null {
  const raw = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const oklch = /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i.exec(raw);
  if (oklch) {
    const l = Number(oklch[1]) > 1 ? Number(oklch[1]) / 100 : Number(oklch[1]);
    return oklchToSrgb(l, Number(oklch[2]), Number(oklch[3]));
  }
  return null;
}

/** Palette lue dans le CSS réel : `--color-<nom>: <oklch|hex>`. */
function loadPalette(): Map<string, [number, number, number]> {
  const palette = new Map<string, [number, number, number]>();
  for (const file of THEME_FILES) {
    let css: string;
    try {
      css = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
      const rgb = parseCssColor(match[2]);
      if (rgb) palette.set(match[1], rgb);
    }
  }
  return palette;
}

const WHITE: [number, number, number] = [255, 255, 255];

function contrastOnWhite(rgb: [number, number, number]): number {
  return 1.05 / (luminanceFromSrgb(rgb) + 0.05);
}

/** Composition alpha sur blanc (ce que fait CSS) : `text-black/40` -> gris #999999. */
function overWhite(rgb: [number, number, number], alpha: number): [number, number, number] {
  return rgb.map((c) => Math.round(alpha * c + (1 - alpha) * 255)) as [number, number, number];
}

// ---------------------------------------------------------------------------
// Jetons de classe -> couleur
// ---------------------------------------------------------------------------

type Resolution = { ok: true; rgb: [number, number, number] } | { ok: false; reason: string };

/** Utilitaires `text-*` qui ne sont PAS une couleur (taille, alignement, débordement). */
const NOT_A_COLOR =
  /^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip))$/;

/** Taille arbitraire (`text-[10px]`) : un `text-*` qui n'est pas une couleur non plus. */
const ARBITRARY_SIZE = /^text-\[-?[\d.]+(px|rem|em|%|vw|vh|ch)\]$/;

const isColorToken = (token: string) => !NOT_A_COLOR.test(token) && !ARBITRARY_SIZE.test(token);

function resolveTextToken(token: string, palette: Map<string, [number, number, number]>): Resolution {
  // 1. valeur arbitraire : text-[#999], text-[oklch(...)]
  const arbitrary = /^text-\[(.+)\]$/.exec(token);
  if (arbitrary) {
    const inner = arbitrary[1];
    // taille arbitraire (text-[10px]) : pas une couleur
    if (/^-?[\d.]+(px|rem|em|%|vw|vh|ch)$/.test(inner)) return { ok: false, reason: 'taille, pas une couleur' };
    const rgb = parseCssColor(inner);
    if (rgb) return { ok: true, rgb };
    return { ok: false, reason: `valeur arbitraire non résolue : text-[${inner}]` };
  }

  // 2. couleur + opacité : text-black/40, text-black/[0.4], text-gray-400/50
  const withAlpha = /^text-(.+?)\/(?:\[([\d.]+)\]|(\d{1,3}))$/.exec(token);
  if (withAlpha) {
    const base = palette.get(withAlpha[1]);
    if (!base) {
      return { ok: false, reason: `couleur de base absente de la palette lue dans le CSS : ${withAlpha[1]}` };
    }
    const alphaRaw = withAlpha[2] ?? String(Number(withAlpha[3]) / 100);
    const alpha = Number(alphaRaw);
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      return { ok: false, reason: `opacité illisible : ${token}` };
    }
    return { ok: true, rgb: overWhite(base, alpha) };
  }

  // 3. couleur pleine : text-noir, text-black, text-gray-400
  const bare = /^text-(.+)$/.exec(token);
  if (bare) {
    const rgb = palette.get(bare[1]);
    if (rgb) return { ok: true, rgb };
    return { ok: false, reason: `palette « ${bare[1]} » inconnue — à ajouter au CSS ou à retirer du composant` };
  }

  return { ok: false, reason: `jeton illisible : ${token}` };
}

function textTokens(source: string): { token: string; line: number }[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const seen = new Map<string, number>();
  code.split('\n').forEach((content, index) => {
    for (const match of content.matchAll(/(?:hover:|focus:|active:|group-hover:)?(text-(?:\[[^\]]+\]|[a-z0-9-]+(?:\/\[[\d.]+\]|\/\d{1,3})?))/g)) {
      const token = match[1].replace(/^(hover|focus|active|group-hover):/, '');
      if (!isColorToken(token)) continue;
      if (!seen.has(token)) seen.set(token, index + 1);
    }
  });
  return [...seen].map(([token, line]) => ({ token, line }));
}

// ---------------------------------------------------------------------------

describe('ChallengeRegistrantDetailModal — contraste (WCAG AA sur fond blanc)', () => {
  const palette = loadPalette();
  const source = readFileSync(COMPONENT, 'utf8');
  const tokens = textTokens(source);

  it('la palette est bien lue dans le CSS du projet (sinon la garde serait aveugle)', () => {
    expect(palette.size).toBeGreaterThan(100);
    expect(palette.has('black')).toBe(true);
    expect(palette.has('noir'), 'src/index.css doit définir --color-noir').toBe(true);
  });

  it('des jetons de couleur de texte sont bien détectés dans la fiche', () => {
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('aucun jeton de couleur de texte sous 4,5:1 — et aucun jeton non résolu (fail-closed)', () => {
    const problems: string[] = [];

    for (const { token, line } of tokens) {
      const resolution = resolveTextToken(token, palette);
      if (!resolution.ok) {
        problems.push(`l.${line} ${token} — NON RÉSOLU : ${resolution.reason}`);
        continue;
      }
      const ratio = contrastOnWhite(resolution.rgb);
      if (ratio < AA_NORMAL_TEXT) {
        const margin = ratio >= AA_NORMAL_TEXT * 0.95 ? ' (proche du seuil — vérifier à la main)' : '';
        problems.push(`l.${line} ${token} = ${ratio.toFixed(2)}:1 sur blanc${margin}`);
      }
    }

    expect(problems, `Texte sous WCAG AA (4,5:1) ou jeton non résolu :\n${problems.join('\n')}`).toEqual([]);
  });

  it("le libellé des deux lignes de la fiche (email d'inscription, newsletter) est mesuré", () => {
    const labelClass = /const labelClass = '([^']+)'/.exec(source)?.[1];
    expect(labelClass, 'labelClass introuvable — mettre la garde à jour avec le composant').toBeTruthy();

    const colorToken = labelClass!.split(/\s+/).find((c) => /^text-/.test(c) && isColorToken(c));
    expect(colorToken, `labelClass sans couleur : ${labelClass}`).toBeTruthy();

    const resolution = resolveTextToken(colorToken!, palette);
    expect(resolution.ok, `labelClass non résolu : ${colorToken}`).toBe(true);
    expect(contrastOnWhite((resolution as { ok: true; rgb: [number, number, number] }).rgb)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('la garde est fail-closed : notations en crochets et palettes nommées sous AA sont attrapées', () => {
    // Les deux échappatoires trouvées par @vela le 16/09/2026 — elles doivent échouer.
    for (const token of ['text-black/[0.4]', 'text-gray-400', 'text-black/40']) {
      const resolution = resolveTextToken(token, palette);
      expect(resolution.ok, `${token} devrait être résolu (jeton non résolu = échec)`).toBe(true);
      expect(
        contrastOnWhite((resolution as { ok: true; rgb: [number, number, number] }).rgb),
        `${token} devrait être sous 4,5:1`,
      ).toBeLessThan(AA_NORMAL_TEXT);
    }
    // Un jeton de palette inconnue n'est jamais ignoré.
    expect(resolveTextToken('text-chartreuse-900', palette).ok).toBe(false);
  });

  it('le calcul est fiable (auto-test du seuil)', () => {
    expect(contrastOnWhite([153, 153, 153])).toBeLessThan(AA_NORMAL_TEXT); // text-black/40
    expect(contrastOnWhite([102, 102, 102])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT); // text-black/60
    expect(contrastOnWhite([220, 38, 38])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT); // red-600 v3
  });
});
