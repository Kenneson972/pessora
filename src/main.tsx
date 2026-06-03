import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BarStatusProvider } from './providers/BarStatusProvider'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BarStatusProvider>
      <App />
    </BarStatusProvider>
    <Analytics />
  </React.StrictMode>,
)
