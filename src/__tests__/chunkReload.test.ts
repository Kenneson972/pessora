import { describe, it, expect } from 'vitest';
import {
  CLE_RECHARGES,
  MAX_RECHARGES,
  doitRecharger,
  lireRecharges,
  morceauFautif,
  noterRecharge,
  oublierRecharges,
} from '../lib/chunkReload';

/**
 * Garde anti-boucle du rechargement sur morceau obsolète.
 *
 * Le défaut corrigé : le garde-fou était effacé à la dernière ligne de `src/main.tsx`,
 * donc il ne protégeait plus rien après le démarrage initial. Sur un morceau
 * **définitivement absent**, chaque navigation rechargeait la page → **boucle infinie**,
 * c'est-à-dire pire que l'écran figé qu'on réparait.
 *
 * Ce qui est éprouvé ici, c'est la partie qui décide — la seule qui peut faire boucler une
 * page. Les deux cas de recette attendus : morceau périmé → **un** rechargement ; morceau
 * absent pour de bon → **aucune tempête**.
 */

/** Faux stockage, pour éprouver aussi le cas « stockage indisponible » (Safari privé). */
const fauxStockage = (initial: string | null = null) => {
  let valeur = initial;
  return {
    getItem: () => valeur,
    setItem: (_cle: string, v: string) => {
      valeur = v;
    },
    removeItem: () => {
      valeur = null;
    },
    lire: () => valeur,
  };
};

const stockageQuiLeve = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('SecurityError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('rechargement sur morceau obsolète', () => {
  it('extrait le morceau fautif du message de Vite', () => {
    const err = new Error(
      'Failed to fetch dynamically imported module: https://www.pessora.fr/assets/RangeDetail-BB8FYOsc.js',
    );
    expect(morceauFautif(err)).toBe('https://www.pessora.fr/assets/RangeDetail-BB8FYOsc.js');
  });

  it('ne devine pas de morceau quand le message n’en porte pas', () => {
    expect(morceauFautif(new Error('autre chose'))).toBeNull();
    expect(morceauFautif(undefined)).toBeNull();
  });

  it('mémorise un rechargement et refuse le second sur le MÊME morceau', () => {
    const s = fauxStockage();
    expect(doitRecharger(lireRecharges(s), 'a.js')).toBe(true);
    noterRecharge('a.js', s);
    expect(lireRecharges(s)).toEqual(['a.js']);
    // le même morceau neige encore : on ne recharge PAS une deuxième fois
    expect(doitRecharger(lireRecharges(s), 'a.js')).toBe(false);
  });

  it('tolère un autre morceau, mais s’arrête à la borne (pas de tempête)', () => {
    const s = fauxStockage();
    const vus: string[] = [];
    let rechargements = 0;
    // le visiteur navigue : chaque nouveau morceau manque
    for (const morceau of ['a.js', 'b.js', 'c.js', 'd.js']) {
      if (doitRecharger(lireRecharges(s), morceau)) {
        noterRecharge(morceau, s);
        rechargements += 1;
        vus.push(morceau);
      }
    }
    expect(rechargements).toBe(MAX_RECHARGES);
    expect(lireRecharges(s)).toHaveLength(MAX_RECHARGES);
  });

  it('atteint la borne : on rend la main au lieu de recharger', () => {
    const s = fauxStockage(JSON.stringify(['a.js', 'b.js']));
    expect(doitRecharger(lireRecharges(s), 'c.js')).toBe(false);
  });

  it('ne lève jamais quand le stockage est indisponible (Safari privé)', () => {
    expect(() => lireRecharges(stockageQuiLeve)).not.toThrow();
    expect(() => noterRecharge('a.js', stockageQuiLeve)).not.toThrow();
    expect(() => oublierRecharges(stockageQuiLeve)).not.toThrow();
    // stockage muet = pas de mémoire : on ne peut PAS affirmer « déjà rechargé »
    expect(lireRecharges(stockageQuiLeve)).toEqual([]);
  });

  it('un rechargement explicite du visiteur repart de zéro', () => {
    const s = fauxStockage(JSON.stringify(['a.js', 'b.js']));
    oublierRecharges(s);
    expect(lireRecharges(s)).toEqual([]);
    expect(s.lire()).toBeNull();
    expect(CLE_RECHARGES).toBe('pessora-reload-after-preload-error');
  });
});
