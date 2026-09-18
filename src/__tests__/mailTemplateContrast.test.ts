import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

/**
 * Garde du GABARIT DE MAIL — contraste et palette.
 *
 * Pourquoi cette garde existe (défaut mesuré le 17/09 dans le lot newsletter) : la ligne
 * d'adresse du pied de mail était en `#888` à **11 px** — `3,20:1` sur `#f5f3f0`, **sous
 * AA**. C'est exactement la couleur que le brief §4.3 nomme comme piège (« jamais le #888 ») ;
 * elle avait été évitée pour le lien de sortie, puis réutilisée une ligne plus bas.
 *
 * ⚠️ Et le point de fond : **aucun autre instrument ne voit ce fichier.** Le cliquet de
 * contraste scanne `src/**` et cherche des classes `text-*` ; le corps du mail vit dans
 * `supabase/functions/send-newsletter/index.ts`, en **styles en ligne** (`color:#888`).
 * Hors de portée deux fois. Un critère sans instrument est un critère de bonne volonté :
 * celui-ci est exécutable.
 *
 * TROIS RÈGLES, et la troisième est celle qui protège le visiteur :
 *  1. toute couleur de TEXTE du gabarit doit être **déclarée** ici (une couleur non déclarée
 *     fait tomber le test en la nommant) ;
 *  2. chaque couple déclaré (encre × fond) est **recomputé** : `≥ 4,5:1` exigé, avec le
 *     rapport mesuré dans le message d'échec ;
 *  3. le lien de sortie « Se désinscrire » doit rester un **lien TEXTE d'au moins 13 px**
 *     (jamais une image : les clients mail bloquent les images, et c'est le seul chemin de
 *     sortie de la liste).
 *
 * Ce que la garde ne fait pas, dit franchement : les couples encre × fond sont **déclarés**
 * à la main. Si on change le fond d'un bloc sans toucher à cette table, le test continuera de
 * calculer l'ancien couple. C'est un choix assumé — la table est courte, lisible et revue à
 * chaque modification du gabarit —, pas une preuve automatique.
 */
const GABARIT = resolve(process.cwd(), 'supabase/functions/send-newsletter/index.ts');

/** Les encres du gabarit, avec le fond sur lequel chacune est réellement posée. */
const ENCRES_DECLAREES = [
  { couleur: '#1E3529', fond: '#ffffff', ou: 'titre du message (h2)' },
  { couleur: '#3a3a3a', fond: '#ffffff', ou: 'corps du message' },
  { couleur: '#1E3529', fond: '#f5f3f0', ou: 'nom du bar (pied)' },
  { couleur: '#6b6b6b', fond: '#f5f3f0', ou: "ligne d'adresse (pied, 11 px)" },
  {
    couleur: '#3a3a3a',
    fond: '#f5f3f0',
    ou: 'mention « vous recevez cet e-mail » et lien « Se désinscrire »',
  },
  { couleur: 'rgba(255,255,255,0.55)', fond: '#1E3529', ou: 'sur-titre du bandeau' },
];

const SEUIL_AA = 4.5;

// --- contraste WCAG -----------------------------------------------------------
const canal = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (rgb: [number, number, number]) =>
  0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2]);

function versRgb(couleur: string, fond: [number, number, number] = [255, 255, 255]): [number, number, number] {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(couleur.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(couleur.trim());
  if (rgba) {
    const [, r, g, b, a] = rgba;
    const alpha = a === undefined ? 1 : Number(a);
    const sur = (canal1: number, fondCanal: number) => Math.round(alpha * canal1 + (1 - alpha) * fondCanal);
    return [sur(Number(r), fond[0]), sur(Number(g), fond[1]), sur(Number(b), fond[2])];
  }
  throw new Error(`couleur illisible : ${couleur}`);
}

function contraste(avant: string, arriere: string): number {
  const fond = versRgb(arriere);
  const l1 = luminance(versRgb(avant, fond));
  const l2 = luminance(fond);
  const [clair, sombre] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (clair + 0.05) / (sombre + 0.05);
}

// --- lecture du gabarit ------------------------------------------------------
const source = readFileSync(GABARIT, 'utf8');
const relatif = relative(process.cwd(), GABARIT);

/** Toutes les déclarations `color:` (hors `background-color:`) avec leur ligne. */
function encresDuGabarit(): { couleur: string; ligne: number }[] {
  const trouvees: { couleur: string; ligne: number }[] = [];
  source.split('\n').forEach((texte, index) => {
    const motif = /(?<!background-)color:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]*\))/g;
    for (const m of texte.matchAll(motif)) {
      trouvees.push({ couleur: m[1], ligne: index + 1 });
    }
  });
  return trouvees;
}

describe('gabarit de mail newsletter — contraste et palette', () => {
  it('toute couleur de texte du gabarit est déclarée (aucune encre surprise)', () => {
    const declarees = new Set(ENCRES_DECLAREES.map((e) => e.couleur.toLowerCase()));
    const intrus = encresDuGabarit()
      .filter(({ couleur }) => !declarees.has(couleur.toLowerCase()))
      .map(({ couleur, ligne }) => `${relatif}:${ligne} — encre non déclarée : ${couleur}`);
    expect(
      intrus,
      `Le gabarit de mail utilise une couleur de texte absente de la table de cette garde.\n` +
        `Soit on l'ajoute avec son fond (et le contraste est recomputé), soit on ne l'emploie pas :\n` +
        `${intrus.join('\n')}`,
    ).toEqual([]);
  });

  it('chaque couple encre × fond déclaré passe AA (≥ 4,5:1)', () => {
    const echecs = ENCRES_DECLAREES.map((e) => ({
      ...e,
      ratio: contraste(e.couleur, e.fond),
    }))
      .filter((e) => e.ratio < SEUIL_AA)
      .map((e) => `${e.ou} : ${e.couleur} sur ${e.fond} → ${e.ratio.toFixed(2)}:1`);
    expect(echecs, `Encre sous AA dans le gabarit de mail :\n${echecs.join('\n')}`).toEqual([]);
  });

  it('le lien de sortie reste un lien TEXTE d’au moins 13 px', () => {
    const ancre = /<a href="\$\{[^}]*\}"[^>]*>([^<]*)<\/a>/.exec(source);
    expect(ancre, 'aucun lien texte trouvé dans le gabarit (le lien de sortie a disparu ?)').not.toBeNull();
    const texte = ancre![1].trim();
    // un lien de sortie posé en image disparaît chez qui bloque les images (cas courant)
    expect(texte.length, 'le lien de sortie ne porte plus de texte lisible').toBeGreaterThan(0);
    expect(texte).toBe('Se désinscrire');

    // la taille vit sur le <p> qui porte le lien
    const avant = source.slice(0, ancre!.index);
    const bloc = avant.slice(avant.lastIndexOf('<p '));
    const taille = /font-size:\s*(\d+)px/.exec(bloc);
    expect(taille, 'le lien de sortie ne déclare plus de taille de police').not.toBeNull();
    expect(
      Number(taille![1]),
      `le lien de sortie est à ${taille![1]} px — en dessous de 13 px il devient illisible sur téléphone`,
    ).toBeGreaterThanOrEqual(13);
  });
});
