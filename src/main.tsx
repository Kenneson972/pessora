import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { BarStatusProvider } from './providers/BarStatusProvider';
import App from './App.tsx';
import './index.css';
import { doitRecharger, lireRecharges, morceauFautif, noterRecharge } from './lib/chunkReload';
import { afficherSortieDeVersion } from './lib/versionExit';

/**
 * Morceau obsolète après un déploiement : on recharge **une fois**, puis on rend la main.
 *
 * ⚠️ Le garde-fou n'est PAS effacé au démarrage — c'est exactement ce qui faisait boucler
 * la page quand un morceau manquait pour de bon (cf. `src/lib/chunkReload.ts`). Il est
 * borné par session et par morceau, et il survit tant que le visiteur reste dans l'onglet.
 *
 * ⚠️ La sortie de secours s'affiche **hors de `#root`** (cf. `src/lib/versionExit.ts`) :
 * écrite dans `#root`, React l'effaçait au montage et le visiteur voyait une page blanche.
 */
window.addEventListener('vite:preloadError', (event) => {
  const morceau = morceauFautif((event as Event & { payload?: unknown }).payload);
  const deja = lireRecharges();

  if (doitRecharger(deja, morceau)) {
    noterRecharge(morceau ?? 'inconnu');
    window.location.reload();
    return;
  }

  // Borne atteinte : on arrête de recharger et on donne une sortie au visiteur, au lieu
  // d'une page qui saute en boucle ou d'un écran figé.
  afficherSortieDeVersion();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BarStatusProvider>
      <App />
    </BarStatusProvider>
    <Analytics />
  </React.StrictMode>,
);
