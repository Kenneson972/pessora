import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getPillar, PILLAR_NAMES, resoudreGammePilier } from '../data/menuData';

describe('getPillar — nav publique 3 piliers (MEGA THÉ / PROTEIN SHAKE / COFFEE)', () => {
  it('mappe shakes -> protein_shake et coffee -> coffee (confirmé Catherine)', () => {
    expect(getPillar('shakes')).toBe('protein_shake');
    expect(getPillar('coffee')).toBe('coffee');
  });

  it('mappe energie et wellness -> mega_the (mapping provisoire en attente de la carte)', () => {
    expect(getPillar('energie')).toBe('mega_the');
    expect(getPillar('wellness')).toBe('mega_the');
  });

  it('filet : une catégorie DB inconnue retombe sur mega_the (jamais masquée)', () => {
    expect(getPillar('categorie-future-inconnue')).toBe('mega_the');
    expect(getPillar('')).toBe('mega_the');
  });

  it('chaque pilier a un nom affichable', () => {
    expect(PILLAR_NAMES.mega_the).toBe('Mega Thé');
    expect(PILLAR_NAMES.protein_shake).toBe('Protein Shake');
    expect(PILLAR_NAMES.coffee).toBe('Coffee');
  });
});

/**
 * Défaut du 17/09 : la page lisait `?gamme=` avec un **cast** (`filterKey as Pillar`), sans
 * résolution — alors que les liens qui l'alimentent parlaient encore l'ancien vocabulaire
 * (`wellness`, `energie`, `shakes`). Trois des quatre entrées de la barre du menu tombaient
 * donc sur « Aucun produit ». Ce qui est éprouvé ici, c'est la résolution, et le fait
 * qu'AUCUN lien écrit dans le projet ne puisse plus mener à une page vide.
 */
describe('résolution des liens entrants ?gamme=', () => {
  it('reconnaît les 3 piliers tels quels', () => {
    expect(resoudreGammePilier('mega_the')).toBe('mega_the');
    expect(resoudreGammePilier('protein_shake')).toBe('protein_shake');
    expect(resoudreGammePilier('coffee')).toBe('coffee');
  });

  it('range les mots anciens sur leur pilier, via la MÊME table que la page', () => {
    // energie + wellness -> Mega Thé : les boissons sont toujours en vente, elles ne
    // disparaissent pas parce que le libellé a changé de main.
    expect(resoudreGammePilier('wellness')).toBe('mega_the');
    expect(resoudreGammePilier('energie')).toBe('mega_the');
    expect(resoudreGammePilier('shakes')).toBe('protein_shake');
  });

  it('tolère la casse et les espaces d’un lien recopié à la main', () => {
    expect(resoudreGammePilier(' Shakes ')).toBe('protein_shake');
    expect(resoudreGammePilier('MEGA_THE')).toBe('mega_the');
  });

  it('un mot vraiment inconnu rend « Tous » (null), JAMAIS une page vide', () => {
    expect(resoudreGammePilier('boissons')).toBeNull();
    expect(resoudreGammePilier('')).toBeNull();
    expect(resoudreGammePilier(null)).toBeNull();
    expect(resoudreGammePilier(undefined)).toBeNull();
  });
});

describe('aucun lien du projet ne peut mener à une page vide', () => {
  it('chaque ?gamme= écrit dans src/ se résout sur un pilier', () => {
    const fichiers: string[] = [];
    const parcourir = (dir: string) => {
      for (const entree of readdirSync(dir)) {
        const chemin = join(dir, entree);
        if (statSync(chemin).isDirectory()) parcourir(chemin);
        else if (/\.(ts|tsx)$/.test(entree)) fichiers.push(chemin);
      }
    };
    parcourir('src');

    const trouves: { fichier: string; mot: string }[] = [];
    for (const fichier of fichiers) {
      for (const m of readFileSync(fichier, 'utf8').matchAll(/\?gamme=([A-Za-z0-9_]+)/g)) {
        trouves.push({ fichier, mot: m[1] });
      }
    }
    expect(trouves.length).toBeGreaterThan(0); // la sonde trouve bien des liens

    const orphelins = trouves
      .filter(({ mot }) => resoudreGammePilier(mot) === null)
      .map(({ fichier, mot }) => `${fichier} : ?gamme=${mot}`);
    expect(orphelins).toEqual([]);
  });
});
