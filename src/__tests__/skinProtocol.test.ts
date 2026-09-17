import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { SKIN_PRODUCT_NOTICES } from '../data/skinProtocol';

/**
 * Garde de SOURÇAGE — citations du protocole Gamme Skin.
 *
 * Les deux phrases ci-dessous sont les SEULES que la fiche PUBLIÉE de la cliente
 * (`gamme_products.description`, celle que la page produit rend) porte sur un usage ou
 * une fréquence. Vérifiées par sous-chaîne exacte le 17/09/2026 :
 *   « Utilisation quotidienne matin et soir. »         → Gel Nettoyant Resurface
 *   « Appliquer matin et soir par tapotements légers. » → Gel Contour Yeux
 *
 * Pourquoi cette garde existe : le repo porte AUSSI un fallback statique
 * (`src/data/productsData.ts`) dont deux phrases ont été citées ici **à tort** — elles ne
 * sont pas sur la fiche de la cliente. Un guillemet attribué à une fiche qui ne le porte
 * pas est de la même famille qu'une promesse fabriquée.
 *
 * Quatre étages, et c'est le dernier qui répond à la faille relevée en recette
 * (« une citation posée dans un autre fichier passe au vert ») :
 *
 * 1. la LISTE déclarée doit être exactement les deux phrases autorisées ;
 * 2. le composant doit lire cette liste (pas de citation en dur qui la contourne) ;
 * 3. les fichiers du bloc (composant + données) ne peuvent écrire **aucune** autre phrase
 *    entre guillemets — `« … »`, `“ … ”` et `&laquo;…&raquo;` (les trois formes) ;
 * 4. **repo entier** : les phrases INTERDITES (celles du fallback) ne doivent apparaître
 *    nulle part, et les phrases AUTORISÉES nulle part AILLEURS que dans leur source
 *    unique `src/data/skinProtocol.ts` — un seul lieu d'édition, comme pour un champ.
 *
 * ⚠️ Pourquoi la règle 4 est écrite en PHRASES et non en « interdit tout `«…»` de
 * `src/**` » : la prose du site utilise légitimement les guillemets français. Mesuré le
 * 17/09/2026 : **11 occurrences dans 219 fichiers**, dont **4 de la prose légitime**
 * (`Concept.tsx`, `MentionsLegales.tsx`, `ManagerSketchMockup.tsx`). Une règle « tout
 * guillemet » aurait donc mis la suite au rouge sur du contenu sain — le faux rouge, la
 * pire des familles. Le résidu assumé : une phrase **neuve et inventée** citée dans un
 * nouveau composant n'est pas attrapée ; ce qui est attrapé, c'est tout ce qui vient de
 * la fiche publiée ou du fallback, c'est-à-dire le défaut qui s'est réellement produit.
 *
 * Statique volontairement — aucun appel base dans la suite : ce test ne prouve pas que la
 * phrase est toujours sur la fiche live (ça, c'est la recette sur le déployé, qui compare
 * le texte rendu à `gamme_products.description`).
 */
const CITATIONS_AUTORISEES = [
  'Utilisation quotidienne matin et soir.',
  'Appliquer matin et soir par tapotements légers.',
];

/** Phrases qu'on ne cite JAMAIS : elles ne sont pas sur la fiche publiée (fallback statique). */
const PHRASES_INTERDITES = [
  'Prépare la peau à recevoir les soins suivants',
  'Protection solaire SPF 30 + hydratation intense, au quotidien',
];

const ROOT = process.cwd();
const SOURCE_UNIQUE = 'src/data/skinProtocol.ts';
const COMPOSANT = resolve(ROOT, 'src/components/nosproduits/SkinProtocol.tsx');
const DONNEES = resolve(ROOT, SOURCE_UNIQUE);
const SRC_DIR = resolve(ROOT, 'src');

const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
/** `« {notice.text} »` n'est pas une citation écrite en dur : on neutralise les interpolations. */
const sansInterpolations = (src: string) => src.replace(/\{[^{}]*\}/g, '·');

const MOTIFS_CITATION = [/«([^»]{4,})»/g, /“([^”]{4,})”/g, /&laquo;([^&]{4,}?)&raquo;/g];

/** Tous les `.ts`/`.tsx` de `src/**`, hors tests (une garde n'est pas du contenu servi). */
function fichiersSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...fichiersSource(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\./.test(entry) || /\.d\.ts$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

/** Le catalogue statique EST la source de ces phrases — c'est le fallback lui-même, pas
 *  une citation. On l'exempte explicitement ; tout le reste de `src/**` reste scanné, donc
 *  citer une de ses phrases ailleurs tombe toujours. */
const CATALOGUE_FALLBACK = 'src/data/productsData.ts';

describe('Protocole Gamme Skin — citations', () => {
  it('ne déclare que les phrases de la fiche publiée', () => {
    expect(SKIN_PRODUCT_NOTICES.map((n) => n.text).sort()).toEqual([...CITATIONS_AUTORISEES].sort());
  });

  it('les citations déclarées sont bien rendues par le composant', () => {
    expect(readFileSync(COMPOSANT, 'utf8')).toMatch(/SKIN_PRODUCT_NOTICES/);
  });

  it('les fichiers du bloc n’écrivent aucune autre phrase entre guillemets', () => {
    const intrus: string[] = [];
    for (const fichier of [COMPOSANT, DONNEES]) {
      const code = sansInterpolations(sansCommentaires(readFileSync(fichier, 'utf8')));
      for (const motif of MOTIFS_CITATION) {
        for (const match of code.matchAll(motif)) {
          const texte = match[1].trim();
          if (!CITATIONS_AUTORISEES.includes(texte)) {
            intrus.push(`${relative(ROOT, fichier)} : « ${texte} »`);
          }
        }
      }
    }
    expect(
      intrus,
      `Citation non sourcée — seules les phrases de la fiche publiée sont autorisées :\n${intrus.join('\n')}`,
    ).toEqual([]);
  });

  it('aucune phrase du fallback n’est citée, et les autorisées vivent dans un SEUL fichier', () => {
    const fautes: string[] = [];
    for (const fichier of fichiersSource(SRC_DIR)) {
      const rel = relative(ROOT, fichier);
      if (rel === CATALOGUE_FALLBACK) continue;
      const code = sansCommentaires(readFileSync(fichier, 'utf8'));
      for (const phrase of PHRASES_INTERDITES) {
        if (code.includes(phrase)) fautes.push(`${rel} : phrase du fallback citée — « ${phrase} »`);
      }
      for (const phrase of CITATIONS_AUTORISEES) {
        if (code.includes(phrase) && rel !== SOURCE_UNIQUE) {
          fautes.push(`${rel} : citation autorisée écrite hors de sa source unique (${SOURCE_UNIQUE}) — « ${phrase} »`);
        }
      }
    }
    expect(
      fautes,
      `Sourçage des citations rompu (le bloc doit citer la fiche publiée et rien d'autre) :\n${fautes.join('\n')}`,
    ).toEqual([]);
  });
});
