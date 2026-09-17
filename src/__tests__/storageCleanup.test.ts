import { describe, it, expect } from 'vitest';
import { cheminDepuisUrl, cheminsRetires } from '../lib/storagePaths';

/**
 * Garde de SUPPRESSION RÉELLE — le défaut trouvé en recette par @vela le 17/09/2026.
 *
 * Retirer une photo la dépubliait (base + page) mais **laissait le fichier dans le
 * bucket**, joignable par son URL. La feuille signée par les personnes photographiées
 * promet un « retrait à tout moment » : tant que le fichier reste en ligne, **la promesse
 * est fausse**. Ce qui suit est la partie pure du correctif : quelle URL correspond à
 * quel fichier, et lequel est devenu orphelin.
 */
const BUCKET = 'gamme-gallery-images';
const url = (chemin: string) =>
  `https://tulhiipucrnyejheuitv.supabase.co/storage/v1/object/public/${BUCKET}/${chemin}`;

describe('nettoyage du stockage', () => {
  it('extrait le chemin depuis une URL publique du bucket', () => {
    expect(cheminDepuisUrl(url('gammes/skin/avant/1737-a.jpg'), BUCKET)).toBe(
      'gammes/skin/avant/1737-a.jpg',
    );
  });

  it('ne touche pas à une URL qui n’appartient pas au bucket', () => {
    const autre = 'https://exemple.fr/storage/v1/object/public/event-images/x.jpg';
    expect(cheminDepuisUrl(autre, BUCKET)).toBeNull();
    expect(cheminsRetires([autre], [], BUCKET)).toEqual([]);
  });

  it('efface ce qui a disparu, et RIEN d’autre', () => {
    const a = url('gammes/skin/avant/a.jpg');
    const p = url('gammes/skin/apres/p.jpg');
    const c = url('gammes/skin/avant/c.jpg');
    const d = url('gammes/skin/apres/d.jpg');

    // la paire (a,p) est retirée, (c,d) est conservée
    expect(cheminsRetires([a, p, c, d], [c, d], BUCKET)).toEqual([
      'gammes/skin/avant/a.jpg',
      'gammes/skin/apres/p.jpg',
    ]);

    // une photo REMPLACÉE : l'ancienne version devient orpheline
    const a2 = url('gammes/skin/avant/a2.jpg');
    expect(cheminsRetires([a, p], [a2, p], BUCKET)).toEqual(['gammes/skin/avant/a.jpg']);

    // la même image utilisée deux fois n'est jamais effacée
    expect(cheminsRetires([a, a, p], [a, p], BUCKET)).toEqual([]);
  });

  it('ne demande aucune suppression quand on n’a rien retiré', () => {
    const a = url('gammes/skin/avant/a.jpg');
    expect(cheminsRetires([a], [a], BUCKET)).toEqual([]);
    expect(cheminsRetires([], [], BUCKET)).toEqual([]);
  });
});
