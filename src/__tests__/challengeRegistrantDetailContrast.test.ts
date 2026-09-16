import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

/**
 * Garde de contraste WCAG AA — deux étages.
 *
 * 1. **Étage strict** : la fiche détail d'un inscrit Challenge 21j
 *    (`src/components/admin/ChallengeRegistrantDetailModal.tsx`) doit être à **zéro**
 *    jeton de texte sous 4,5:1. Elle reçoit les lignes email d'inscription et
 *    « newsletter : oui/non » : on ne pose pas du contenu neuf sur du texte illisible.
 * 2. **Étage cliquet (ratchet)** : tout `src/**` est scanné, et la dette de contraste
 *    existante est figée dans `contrast-baseline.json` (comptée par fichier). Un
 *    fichier **absent du cliquet** ou dont la dette **augmente** fait échouer la garde.
 *    La dette peut diminuer librement. Régénérer après une correction légitime :
 *
 *        CONTRAST_BASELINE=write npx vitest run src/__tests__/challengeRegistrantDetailContrast.test.ts --pool=threads
 *
 *    Sans le cliquet, la garde ne protégeait qu'un seul fichier : le commit suivant
 *    reposait les mêmes jetons ailleurs (constat QA du 16/09/2026 sur `EventForm.tsx`).
 *
 * FAIL-CLOSED : un jeton de couleur non résoluble compte comme de la dette (jamais
 * ignoré en silence). Les notations `text-black/[0.4]`, `text-gray-400` et les
 * palettes nommées sont résolues, pas sautées.
 *
 * Les couleurs ne sont pas recopiées de mémoire : elles sont lues dans
 * `node_modules/tailwindcss/theme.css` (palette Tailwind v4, oklch) et `src/index.css`
 * (surcharges Pessóra : `--color-noir`, `--color-gold`, `--color-muted`…), puis
 * converties oklch -> luminance relative WCAG. Contrôle du socle : red-600 v4 = 4,76:1
 * contre 4,83:1 annoncé pour le hex v3 équivalent (#dc2626) — dérive de palette connue.
 *
 * Hors périmètre, et c'est déclaré : les jetons de la **famille blanc**
 * (`text-white`, `text-ivory`…) ne sont pas jugés — un texte blanc suppose une surface
 * sombre, que cette garde statique ne sait pas voir. Les juger demanderait un contrôle
 * sur le DOM rendu, pas sur la source.
 *
 * Seuil : 4,5:1 (WCAG 2.1 AA texte normal — le texte concerné est < 18,66 px gras).
 * Fond de référence : blanc. Un jeton à moins de 5 % du seuil est signalé comme
 * tel dans l'échec : vérification humaine, jamais tolérance silencieuse.
 *
 * Pourquoi une garde sur la SOURCE et pas un rendu : les composants admin importent
 * `Sheet` depuis `@heroui-pro/react`, dont le paquet installé sur le VPS est un
 * installeur sans `main`/`exports` (code réel récupéré par le postinstall avec la
 * licence, absente ici) — le module n'est pas résolvable localement.
 */

const AA_NORMAL_TEXT = 4.5;
const FOCUS_FILE = resolve(process.cwd(), 'src/components/admin/ChallengeRegistrantDetailModal.tsx');
const BASELINE_FILE = resolve(process.cwd(), 'src/__tests__/contrast-baseline.json');
const SRC_DIR = resolve(process.cwd(), 'src');
const THEME_FILES = [
  resolve(process.cwd(), 'node_modules/tailwindcss/theme.css'),
  resolve(process.cwd(), 'src/index.css'),
];

// ---------------------------------------------------------------------------
// Couleurs : oklch / hex -> luminance relative WCAG
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

function toLinearFromSrgb(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminanceFromSrgb([r, g, b]: Rgb): number {
  return 0.2126 * toLinearFromSrgb(r) + 0.7152 * toLinearFromSrgb(g) + 0.0722 * toLinearFromSrgb(b);
}

/** oklch(L C H) -> sRGB [0-255] (Oklab de Björn Ottosson, bornes appliquées). */
function oklchToSrgb(L: number, C: number, H: number): Rgb {
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
  }) as Rgb;
}

function parseCssColor(value: string): Rgb | null {
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
function loadPalette(): Map<string, Rgb> {
  const palette = new Map<string, Rgb>();
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

function contrastOnWhite(rgb: Rgb): number {
  return 1.05 / (luminanceFromSrgb(rgb) + 0.05);
}

/** Composition alpha sur blanc (ce que fait CSS) : `text-black/40` -> gris #999999. */
function overWhite(rgb: Rgb, alpha: number): Rgb {
  return rgb.map((c) => Math.round(alpha * c + (1 - alpha) * 255)) as Rgb;
}

// ---------------------------------------------------------------------------
// Jetons de classe -> couleur
// ---------------------------------------------------------------------------

type Resolution = { ok: true; rgb: Rgb } | { ok: false; reason: string };

/** Utilitaires `text-*` qui ne sont PAS une couleur (taille, alignement, débordement). */
const NOT_A_COLOR =
  /^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip))$/;

/** Taille arbitraire (`text-[10px]`, `text-[clamp(1.5rem,4vw,2.2rem)]`) : pas une couleur. */
const ARBITRARY_SIZE = /^text-\[(?:length:)?(?:clamp\(|-?[\d.]+(px|rem|em|%|vw|vh|ch)\b)/;

/** Famille blanc : hors périmètre (voir en tête de fichier). */
const WHITE_FAMILY = /^text-(white|ivory|ivory-warm)(\/|$)/;

const isColorToken = (token: string) =>
  !NOT_A_COLOR.test(token) && !ARBITRARY_SIZE.test(token) && !WHITE_FAMILY.test(token);

function resolveTextToken(token: string, palette: Map<string, Rgb>): Resolution {
  const arbitrary = /^text-\[(.+)\]$/.exec(token);
  if (arbitrary) {
    const rgb = parseCssColor(arbitrary[1]);
    if (rgb) return { ok: true, rgb };
    return { ok: false, reason: `valeur arbitraire non résolue : text-[${arbitrary[1]}]` };
  }

  const withAlpha = /^text-(.+?)\/(?:\[([\d.]+)\]|(\d{1,3}))$/.exec(token);
  if (withAlpha) {
    const base = palette.get(withAlpha[1]);
    if (!base) return { ok: false, reason: `couleur de base absente de la palette lue dans le CSS : ${withAlpha[1]}` };
    const alpha = Number(withAlpha[2] ?? String(Number(withAlpha[3]) / 100));
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return { ok: false, reason: `opacité illisible : ${token}` };
    return { ok: true, rgb: overWhite(base, alpha) };
  }

  const bare = /^text-(.+)$/.exec(token);
  if (bare) {
    const rgb = palette.get(bare[1]);
    if (rgb) return { ok: true, rgb };
    return { ok: false, reason: `palette « ${bare[1]} » inconnue du CSS` };
  }

  return { ok: false, reason: `jeton illisible : ${token}` };
}

/** Jetons de couleur présents dans un source (commentaires retirés, variantes `hover:` incluses). */
function textTokens(source: string): { token: string; line: number }[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const seen = new Map<string, number>();
  code.split('\n').forEach((content, index) => {
    for (const match of content.matchAll(/(?:hover:|focus:|active:|group-hover:)?(text-(?:\[[^\]]+\]|[a-z0-9-]+(?:\/\[[\d.]+\]|\/\d{1,3})?))/g)) {
      const token = match[1];
      if (!isColorToken(token)) continue;
      if (!seen.has(token)) seen.set(token, index + 1);
    }
  });
  return [...seen].map(([token, line]) => ({ token, line }));
}

/** Fichiers `.ts`/`.tsx` de `src/**`, hors tests. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\./.test(entry) || /\.d\.ts$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

/** Dette de contraste d'un fichier : jetons sous AA (ou non résolus) et leur nombre d'occurrences. */
function contrastDebt(
  file: string,
  palette: Map<string, Rgb>,
): { total: number; details: { token: string; line: number; occurrences: number; ratio: number | null; reason?: string }[] } {
  const source = readFileSync(file, 'utf8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const details: { token: string; line: number; occurrences: number; ratio: number | null; reason?: string }[] = [];

  for (const { token, line } of textTokens(source)) {
    const resolution = resolveTextToken(token, palette);
    const occurrences = code.split(token).length - 1;
    if (!resolution.ok) {
      details.push({ token, line, occurrences, ratio: null, reason: resolution.reason });
      continue;
    }
    const ratio = contrastOnWhite(resolution.rgb);
    if (ratio < AA_NORMAL_TEXT) details.push({ token, line, occurrences, ratio });
  }

  return { total: details.reduce((sum, d) => sum + d.occurrences, 0), details };
}

function readBaseline(): Record<string, number> {
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) as Record<string, number>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------

describe('Contraste — jeton de texte sous WCAG AA', () => {
  const palette = loadPalette();

  it('la palette est bien lue dans le CSS du projet (sinon la garde serait aveugle)', () => {
    expect(palette.size).toBeGreaterThan(100);
    expect(palette.has('black')).toBe(true);
    expect(palette.has('noir'), 'src/index.css doit définir --color-noir').toBe(true);
  });

  it('la fiche détail d’un inscrit Challenge 21j est à zéro jeton sous AA (fail-closed)', () => {
    const debt = contrastDebt(FOCUS_FILE, palette);
    const problems = debt.details.map((d) =>
      d.ratio === null
        ? `l.${d.line} ${d.token} — NON RÉSOLU : ${d.reason}`
        : `l.${d.line} ${d.token} = ${d.ratio.toFixed(2)}:1 sur blanc${
            d.ratio >= AA_NORMAL_TEXT * 0.95 ? ' (proche du seuil — vérifier à la main)' : ''
          }`,
    );
    expect(problems, `Texte sous WCAG AA (4,5:1) dans la fiche :\n${problems.join('\n')}`).toEqual([]);
  });

  it('le libellé des deux lignes de la fiche (email d’inscription, newsletter) est mesuré', () => {
    const source = readFileSync(FOCUS_FILE, 'utf8');
    const labelClass = /const labelClass = '([^']+)'/.exec(source)?.[1];
    expect(labelClass, 'labelClass introuvable — mettre la garde à jour avec le composant').toBeTruthy();

    const colorToken = labelClass!.split(/\s+/).find((c) => /^text-/.test(c) && isColorToken(c));
    expect(colorToken, `labelClass sans couleur : ${labelClass}`).toBeTruthy();

    const resolution = resolveTextToken(colorToken!, palette);
    expect(resolution.ok, `labelClass non résolu : ${colorToken}`).toBe(true);
    expect(contrastOnWhite((resolution as { ok: true; rgb: Rgb }).rgb)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('la garde est fail-closed : notations en crochets et palettes nommées sous AA sont attrapées', () => {
    for (const token of ['text-black/[0.4]', 'text-gray-400', 'text-black/40']) {
      const resolution = resolveTextToken(token, palette);
      expect(resolution.ok, `${token} devrait être résolu (jeton non résolu = échec)`).toBe(true);
      expect(
        contrastOnWhite((resolution as { ok: true; rgb: Rgb }).rgb),
        `${token} devrait être sous 4,5:1`,
      ).toBeLessThan(AA_NORMAL_TEXT);
    }
    expect(resolveTextToken('text-chartreuse-900', palette).ok).toBe(false);
  });

  it('le calcul est fiable (auto-test du seuil)', () => {
    expect(contrastOnWhite([153, 153, 153])).toBeLessThan(AA_NORMAL_TEXT); // text-black/40
    expect(contrastOnWhite([102, 102, 102])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT); // text-black/60
    expect(contrastOnWhite([220, 38, 38])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT); // red-600 v3
  });

  it('la dette de contraste de src/** n’augmente pas (cliquet)', () => {
    const current: Record<string, number> = {};
    const inventory: { token: string; total: number }[] = [];

    for (const file of sourceFiles(SRC_DIR)) {
      const debt = contrastDebt(file, palette);
      if (debt.total === 0) continue;
      current[relative(process.cwd(), file)] = debt.total;
      for (const d of debt.details) inventory.push({ token: `${relative(process.cwd(), file)} l.${d.line} ${d.token}`, total: d.occurrences });
    }

    // Mode régénération : `CONTRAST_BASELINE=write npx vitest run ...`
    if (process.env.CONTRAST_BASELINE === 'write') {
      writeFileSync(BASELINE_FILE, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
      console.log(`Cliquet régénéré : ${Object.keys(current).length} fichiers, ${Object.values(current).reduce((a, b) => a + b, 0)} occurrences.`);
      return;
    }

    const baseline = readBaseline();
    expect(Object.keys(baseline).length, 'cliquet vide — régénérer avec CONTRAST_BASELINE=write').toBeGreaterThan(0);

    const violations: string[] = [];
    for (const [file, total] of Object.entries(current)) {
      const known = baseline[file];
      if (known === undefined) {
        violations.push(`${file} : ${total} occurrence(s) sous AA — fichier absent du cliquet`);
        continue;
      }
      if (total > known) {
        violations.push(`${file} : ${total} occurrences sous AA contre ${known} au cliquet (+${total - known})`);
      }
    }

    expect(
      violations,
      `Dette de contraste AUGMENTÉE (corriger, ou régénérer le cliquet si c'est un arbitrage assumé) :\n${violations.join('\n')}`,
    ).toEqual([]);
  });
});
