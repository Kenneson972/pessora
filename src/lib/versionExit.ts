/**
 * Sortie de secours affichée quand on a cessé de recharger automatiquement.
 *
 * 🔴 Défaut trouvé en recette (@vela, 17/09) : la première version écrivait la carte dans
 * `#root`, **juste avant** `ReactDOM.createRoot(...).render(...)`. Or `#root` appartient à
 * React : au montage, puis à chaque rendu, React réconcilie ce conteneur **à partir de son
 * propre arbre virtuel** et efface tout ce qu'il n'a pas écrit. Résultat mesuré : la tempête
 * de rechargements était bien arrêtée (2 chargements contre 74 en production) mais le
 * visiteur tombait sur une **page blanche** — un cul-de-sac au lieu de la sortie annoncée.
 *
 * La règle : une sortie de secours ne vit **jamais** dans un nœud que pilote une autre
 * bibliothèque. Elle est ici créée en **frère de `#root`**, sous `document.body`, en couche
 * fixe opaque au-dessus de la page — React peut rendre ce qu'il veut en dessous, la carte
 * reste à l'écran. Un test le prouve (`src/__tests__/versionExit.test.ts`) en simulant un
 * rendu React qui vide `#root`.
 */
import { oublierRecharges } from './chunkReload';

export const ID_SORTIE = 'pessora-sortie-version';

const FOND = '#f9f7f4';
const ENCRE = '#1E3529';
const CORPS = '#3a3a3a';

function texte(contenu: string, styles: Partial<CSSStyleDeclaration>): HTMLParagraphElement {
  const p = document.createElement('p');
  p.textContent = contenu;
  Object.assign(p.style, styles);
  return p;
}

/**
 * Affiche la sortie de secours et renvoie son conteneur (ou l'existant si déjà affichée).
 * `reload` est injectable pour être éprouvable sans déclencher de navigation.
 */
export function afficherSortieDeVersion(
  reload: () => void = () => window.location.reload(),
): HTMLElement {
  const existante = document.getElementById(ID_SORTIE);
  if (existante) return existante;

  const couche = document.createElement('div');
  couche.id = ID_SORTIE;
  Object.assign(couche.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: FOND,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  });

  const carte = document.createElement('div');
  carte.style.maxWidth = '420px';
  carte.style.textAlign = 'center';

  const titre = texte('Une nouvelle version du site est disponible', {
    margin: '0 0 8px',
    color: ENCRE,
    fontSize: '18px',
  });

  const corps = texte(
    "La page n'a pas pu se charger complètement. Rechargez-la pour récupérer la dernière version.",
    { margin: '0 0 20px', color: CORPS, fontSize: '14px', lineHeight: '1.6' },
  );

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.textContent = 'Recharger la page';
  Object.assign(bouton.style, {
    minHeight: '44px',
    padding: '0 20px',
    border: '0',
    borderRadius: '24px',
    background: ENCRE,
    color: '#ffffff',
    fontSize: '13px',
    letterSpacing: '0.04em',
    cursor: 'pointer',
  });
  bouton.addEventListener('click', () => {
    // L'action explicite du visiteur efface la mémoire : sinon il retomberait
    // immédiatement sur la borne et sur cette même page.
    oublierRecharges();
    reload();
  });

  carte.append(titre, corps, bouton);
  couche.append(carte);
  document.body.append(couche);
  return couche;
}
