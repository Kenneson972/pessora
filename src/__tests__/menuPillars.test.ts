import { describe, it, expect } from 'vitest';
import { getPillar, PILLAR_NAMES } from '../data/menuData';

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
