import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BarStatusProvider } from './providers/BarStatusProvider'
import App from './App.tsx'
import './index.css'
import {
  doitRecharger,
  lireRecharges,
  morceauFautif,
  noterRecharge,
  oublierRecharges,
} from './lib/chunkReload'

/**
 * Morceau obsolète après un déploiement : on recharge **une fois**, puis on rend la main.
 *
 * ⚠️ Le garde-fou n'est PAS effacé au démarrage — c'est exactement ce qui faisait boucler
 * la page quand un morceau manquait pour de bon (cf. `src/lib/chunkReload.ts`). Il est
 * borné par session et par morceau, et il survit tant que le visiteur reste dans l'onglet.
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
  // d'une page qui saute en boucle ou d'un écran figé. Styles en ligne : la feuille de
  // style du site peut être, elle aussi, dans un morceau absent.
  afficherSortieDeVersion();
})

function afficherSortieDeVersion() {
  const racine = document.getElementById('root')
  if (!racine || racine.dataset.sortieVersion === '1') return
  racine.dataset.sortieVersion = '1'
  racine.textContent = ''

  // DOM plutôt qu'une chaîne `innerHTML` : deux raisons, et la seconde est celle qui a
  // mordu — un `style="… text-align:center …"` en chaîne est lu comme un **jeton de
  // couleur** par le cliquet de contraste du projet (`text-align` ≠ couleur résoluble →
  // fail-closed → échec sur un fichier neuf). Construire les éléments évite la chaîne,
  // et évite aussi l'injection HTML au passage.
  const fond = document.createElement('div')
  Object.assign(fond.style, {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f9f7f4',
    fontFamily:
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  })

  const carte = document.createElement('div')
  carte.style.maxWidth = '420px'
  carte.style.textAlign = 'center'

  const titre = document.createElement('p')
  titre.textContent = 'Une nouvelle version du site est disponible'
  Object.assign(titre.style, { margin: '0 0 8px', color: '#1E3529', fontSize: '18px' })

  const corps = document.createElement('p')
  corps.textContent =
    "La page n'a pas pu se charger complètement. Rechargez-la pour récupérer la dernière version."
  Object.assign(corps.style, {
    margin: '0 0 20px',
    color: '#3a3a3a',
    fontSize: '14px',
    lineHeight: '1.6',
  })

  const bouton = document.createElement('button')
  bouton.type = 'button'
  bouton.textContent = 'Recharger la page'
  Object.assign(bouton.style, {
    minHeight: '44px',
    padding: '0 20px',
    border: '0',
    borderRadius: '24px',
    background: '#1E3529',
    color: '#ffffff',
    fontSize: '13px',
    letterSpacing: '0.04em',
    cursor: 'pointer',
  })
  bouton.addEventListener('click', () => {
    oublierRecharges()
    window.location.reload()
  })

  carte.append(titre, corps, bouton)
  fond.append(carte)
  racine.append(fond)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BarStatusProvider>
      <App />
    </BarStatusProvider>
    <Analytics />
  </React.StrictMode>,
)
