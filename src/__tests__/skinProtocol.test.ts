import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
 * (`src/data/productsData.ts`) dont deux phrases ont été citées ici **à tort** — elles
 * ne sont pas sur la fiche de la cliente (« Prépare la peau à recevoir les soins
 * suivants. », « …au quotidien. »). Un guillemet attribué à une fiche qui ne le porte
 * pas est de la même famille qu'une promesse fabriquée. La recette sur le déployé les a
 * attrapées une fois ; ce test empêche qu'une réédition les réintroduise en silence.
 *
 * Statique volontairement — **aucun appel base dans la suite** : ce test ne prouve pas
 * que la phrase est toujours sur la fiche live (ça, c'est la recette sur le déployé, qui
 * compare le texte rendu à `gamme_products.description`). Il fige ce qu'on s'autorise à
 * écrire : toute citation hors de cette liste doit faire échouer la suite.
 */
const CITATIONS_AUTORISEES = [
  'Utilisation quotidienne matin et soir.',
  'Appliquer matin et soir par tapotements légers.',
];

const COMPOSANT = resolve(process.cwd(), 'src/components/nosproduits/SkinProtocol.tsx');
const DONNEES = resolve(process.cwd(), 'src/data/skinProtocol.ts');

const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
/** `« {notice.text} »` n'est pas une citation écrite en dur : on neutralise les interpolations. */
const sansInterpolations = (src: string) => src.replace(/\{[^{}]*\}/g, '·');

describe('Protocole Gamme Skin — citations', () => {
  it('ne déclare que les phrases de la fiche publiée', () => {
    expect(SKIN_PRODUCT_NOTICES.map((n) => n.text).sort()).toEqual([...CITATIONS_AUTORISEES].sort());
  });

  it('les citations déclarées sont bien rendues par le composant', () => {
    const src = readFileSync(COMPOSANT, 'utf8');
    expect(src, 'les citations déclarées doivent être lues par le composant').toMatch(
      /SKIN_PRODUCT_NOTICES/,
    );
  });

  it('n’écrit aucune autre phrase entre guillemets « … »', () => {
    const intrus: string[] = [];
    for (const fichier of [COMPOSANT, DONNEES]) {
      const code = sansInterpolations(sansCommentaires(readFileSync(fichier, 'utf8')));
      for (const match of code.matchAll(/«([^»]{4,})»/g)) {
        const texte = match[1].trim();
        if (!CITATIONS_AUTORISEES.includes(texte)) {
          intrus.push(`${fichier.split('/src/')[1]} : « ${texte} »`);
        }
      }
    }
    expect(
      intrus,
      `Citation non sourcée — seules les phrases de la fiche publiée sont autorisées :\n${intrus.join('\n')}`,
    ).toEqual([]);
  });
});
