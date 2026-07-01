import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const event = new CustomEvent('sw-update-available', {
                detail: { worker: newWorker },
              })
              window.dispatchEvent(event)
            }
          })
        }
      })

      registration.addEventListener('statechange', () => {
        if (registration.active) {
          registration.active.postMessage({ type: 'CLIENT_READY' })
        }
      })
    } catch {
      // Service worker registration failed
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
