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
 * Pourquoi une garde sur la SOURCE et pas un rendu : le rendu du composant importe
 * `Sheet` depuis `@heroui-pro/react`, dont le paquet installé sur le VPS est un
 * installeur sans `main`/`exports` (le code réel est récupéré par le postinstall avec
 * la licence HeroUI Pro, absente ici) — le module n'est pas résolvable localement.
 * Mesure statique = même source de vérité que le CSS, zéro dépendance de rendu.
 *
 * Seuil : 4,5:1 (WCAG 2.1 AA, texte normal — tout le texte de la fiche est < 18,66 px gras).
 * Fond de référence : blanc (`bg-white` de la `Sheet.Dialog`).
 */

const SOURCE = resolve(process.cwd(), 'src/components/admin/ChallengeRegistrantDetailModal.tsx');

/** Couleurs Tailwind utilisées dans l'admin Pessora (échelle par défaut). */
const TAILWIND_HEX: Record<string, string> = {
  'noir': '#1a1a1a',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
};

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminanceOf(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Contraste d'une couleur sur fond blanc. */
function contrastOnWhite(hex: string): number {
  return 1.05 / (relativeLuminanceOf(hex) + 0.05);
}

/** `text-black/40` (noir à 40 % sur blanc) -> #999999. */
function resolveToken(token: string): { color: string; token: string } | null {
  const blackAlpha = /^text-black\/(\d{1,3})$/.exec(token);
  if (blackAlpha) {
    const value = Math.round(255 * (1 - Number(blackAlpha[1]) / 100));
    const hex = `#${value.toString(16).padStart(2, '0').repeat(3)}`;
    return { color: hex, token };
  }
  const named = /^text-(noir|red-\d{3})$/.exec(token);
  if (named && TAILWIND_HEX[named[1]]) {
    return { color: TAILWIND_HEX[named[1]], token };
  }
  return null;
}

/** Jetons de couleur de texte présents dans la source (classes Tailwind + variantes `hover:`). */
function textColorTokens(source: string): { token: string; color: string }[] {
  const tokens = new Map<string, string>();
  // Les commentaires ne sont pas du code : `text-black/40` cité dans un commentaire
  // d'explication ne doit pas être compté comme une couleur appliquée.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  for (const match of code.matchAll(/(?:hover:)?(text-black\/\d{1,3}|text-noir|text-red-\d{3})/g)) {
    const resolved = resolveToken(match[1]);
    if (resolved) tokens.set(resolved.token, resolved.color);
  }
  return [...tokens].map(([token, color]) => ({ token, color }));
}

describe('ChallengeRegistrantDetailModal — contraste (WCAG AA sur fond blanc)', () => {
  it('aucun jeton de couleur de texte sous 4,5:1 dans la fiche', () => {
    const source = readFileSync(SOURCE, 'utf8');
    const tokens = textColorTokens(source);

    expect(tokens.length).toBeGreaterThan(0);

    const failures = tokens
      .map((t) => ({ ...t, ratio: contrastOnWhite(t.color) }))
      .filter((t) => t.ratio < 4.5)
      .map((t) => `${t.token} (${t.color}) = ${t.ratio.toFixed(2)}:1`);

    expect(failures, `Jetons sous WCAG AA (4,5:1) :\n${failures.join('\n')}`).toEqual([]);
  });

  it("les deux lignes de la fiche (email d'inscription, newsletter) ont leur libellé à 10 px sous AA minimum", () => {
    const source = readFileSync(SOURCE, 'utf8');
    const labelClass = /const labelClass = '([^']+)'/.exec(source)?.[1];
    expect(labelClass, 'labelClass introuvable — la garde doit être mise à jour avec le composant').toBeTruthy();

    const colorToken = labelClass!.split(/\s+/).find((c) => /^(text-black\/\d{1,3}|text-noir|text-red-\d{3})$/.test(c));
    const resolved = colorToken ? resolveToken(colorToken) : null;
    expect(resolved, `labelClass sans couleur résolvable : ${labelClass}`).toBeTruthy();
    expect(contrastOnWhite(resolved!.color)).toBeGreaterThanOrEqual(4.5);
  });

  it('le calcul est fiable (auto-test du seuil)', () => {
    // Jeton mesuré dans le code AVANT correction : 2,85:1.
    expect(contrastOnWhite('#999999')).toBeLessThan(4.5);
    expect(contrastOnWhite('#666666')).toBeGreaterThanOrEqual(4.5);
  });
});
