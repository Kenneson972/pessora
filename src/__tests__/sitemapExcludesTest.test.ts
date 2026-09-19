import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contrôle du sitemap — le banc d'essai (slug `test-%`) ne doit JAMAIS être
 * indexé. Le sitemap est un fichier généré (`scripts/generate-sitemap.ts`) puis
 * versionné dans `public/sitemap.xml` ; la requête events exclut `test-%`, mais
 * un prédicat erroné (casse, colonne) échouerait en silence. Ce test lit le
 * fichier RÉELLEMENT généré et rouge si une URL `/evenements/test-` y apparaît.
 */
describe('sitemap : aucun slug test- indexé', () => {
  it('ne contient aucune URL /evenements/test-', () => {
    const xml = readFileSync(resolve(process.cwd(), 'public', 'sitemap.xml'), 'utf-8');
    expect(xml).not.toMatch(/<loc>[^<]*\/evenements\/test-/i);
  });
});
