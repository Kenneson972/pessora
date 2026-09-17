import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BarStatusProvider } from './providers/BarStatusProvider'
import App from './App.tsx'
import './index.css'

window.addEventListener('vite:preloadError', () => {
  const key = 'pessora-reload-after-preload-error'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BarStatusProvider>
      <App />
    </BarStatusProvider>
    <Analytics />
  </React.StrictMode>,
)

sessionStorage.removeItem('pessora-reload-after-preload-error')
