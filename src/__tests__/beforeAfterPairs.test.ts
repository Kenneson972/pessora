import { describe, it, expect } from 'vitest';
import { pairesPubliees, paireComplete } from '../lib/beforeAfter';

/**
 * Garde d'appariement — la règle que @vela a ajoutée au critère de recette :
 * **une paire incomplète ne doit jamais s'afficher**. Si l'avant est déposé et que
 * l'après manque, publier la seule photo reviendrait à présenter **une image comme un
 * avant/après** — le faux exact qu'on veut éviter. Mesuré : cette règle vit dans une
 * seule fonction, utilisée par le bloc public ET par l'écran de dépôt.
 */
describe('avant/après — paires pubiées', () => {
  it('ne publie que les paires complètes', () => {
    const entrees = [
      { avant: 'a1.jpg', apres: 'p1.jpg', legende: null }, // complète
      { avant: 'a2.jpg', apres: '', legende: null }, // il manque l'après
      { avant: '', apres: 'p3.jpg', legende: null }, // il manque l'avant
      { avant: '   ', apres: 'p4.jpg', legende: null }, // blanc = manquant
      { avant: 'a5.jpg', apres: 'p5.jpg', legende: '  Protocole J0/J14/J28.  ' }, // complète
    ];
    const publiees = pairesPubliees(entrees);
    expect(publiees).toHaveLength(2);
    expect(publiees.map((p) => p.avant)).toEqual(['a1.jpg', 'a5.jpg']);
    expect(publiees[1].legende).toBe('Protocole J0/J14/J28.');
  });

  it('ne jette jamais sur un jsonb abîmé (null, objet, chaîne, items bâtards)', () => {
    for (const entree of [null, undefined, {}, 'texte', 42, [null, 1, 'a', [], { avant: 5 }]]) {
      expect(() => pairesPubliees(entree)).not.toThrow();
      expect(pairesPubliees(entree)).toEqual([]);
    }
  });

  it('normalise la légende : vide ou absente devient null', () => {
    const [p] = pairesPubliees([{ avant: 'a.jpg', apres: 'p.jpg', legende: '   ' }]);
    expect(p.legende).toBeNull();
  });

  it('paireComplete dit vrai seulement avec les deux photos', () => {
    expect(paireComplete({ avant: 'a.jpg', apres: 'p.jpg' })).toBe(true);
    expect(paireComplete({ avant: 'a.jpg', apres: '' })).toBe(false);
    expect(paireComplete({ avant: '', apres: 'p.jpg' })).toBe(false);
    expect(paireComplete(null)).toBe(false);
  });
});
