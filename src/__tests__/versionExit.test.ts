import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ID_SORTIE, afficherSortieDeVersion } from '../lib/versionExit';
import { CLE_RECHARGES } from '../lib/chunkReload';

/**
 * Sortie de secours du rechargement sur morceau obsolète — le défaut de recette du 17/09.
 *
 * Mesuré par @vela sur la preview : la tempête était arrêtée (2 chargements contre 74 en
 * production) mais le visiteur voyait une **page blanche** — la carte de sortie était écrite
 * dans `#root`, que React réconcilie à partir de son propre arbre, donc elle disparaissait.
 *
 * Ce qui est éprouvé ici : la carte **survit à un rendu de React**, elle n'est pas dans
 * `#root`, elle est idempotente, et son bouton remet le compteur à zéro. Le premier test
 * échoue sur l'implémentation fautive (celle qui écrivait dans `#root`).
 */
describe('sortie de secours « nouvelle version »', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    document.getElementById(ID_SORTIE)?.remove();
    sessionStorage.clear();
  });

  it('vit HORS de #root : un rendu de React qui vide #root ne l’efface pas', () => {
    afficherSortieDeVersion(() => {});

    const couche = document.getElementById(ID_SORTIE);
    expect(couche).not.toBeNull();
    // le nœud n'appartient pas au conteneur que pilote React
    expect(couche!.parentElement).toBe(document.body);
    expect(document.getElementById('root')!.contains(couche!)).toBe(false);

    // React monte : il réconcilie #root à partir de son arbre virtuel et l'écrase…
    const racine = document.getElementById('root')!;
    racine.replaceChildren(document.createElement('div'));
    racine.textContent = 'Application';

    // …la sortie de secours est toujours là, et toujours visible
    expect(document.getElementById(ID_SORTIE)).not.toBeNull();
    expect(document.body.contains(couche!)).toBe(true);
    expect(couche!.style.position).toBe('fixed');
    expect(couche!.style.zIndex).not.toBe('');
  });

  it('est idempotente : deux erreurs n’empilent pas deux cartes', () => {
    const un = afficherSortieDeVersion(() => {});
    const deux = afficherSortieDeVersion(() => {});
    expect(un).toBe(deux);
    expect(document.querySelectorAll(`#${ID_SORTIE}`)).toHaveLength(1);
  });

  it('porte le message, un bouton atteignable, et remet le compteur à zéro au clic', () => {
    sessionStorage.setItem(CLE_RECHARGES, JSON.stringify(['a.js', 'b.js']));
    const reload = vi.fn();
    afficherSortieDeVersion(reload);

    const couche = document.getElementById(ID_SORTIE)!;
    const texte = couche.textContent ?? '';
    expect(texte).toContain('Une nouvelle version du site est disponible');
    expect(texte).toContain('Recharger la page');

    const bouton = couche.querySelector('button')!;
    expect(bouton.style.minHeight).toBe('44px');
    // jsdom normalise les couleurs (`#ffffff` → `rgb(255, 255, 255)`) : on compare la valeur
    // normalisée, sinon l'assertion échoue sur un code juste.
    expect(bouton.style.color).toBe('rgb(255, 255, 255)');
    expect(bouton.style.backgroundColor).toBe('rgb(30, 53, 41)');

    bouton.click();
    expect(reload).toHaveBeenCalledTimes(1);
    // sans cet effacement, le visiteur retomberait aussitôt sur la borne
    expect(sessionStorage.getItem(CLE_RECHARGES)).toBeNull();
  });
});
