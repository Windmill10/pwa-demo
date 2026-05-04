import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Surface JS errors to the DOM so users don't see a blank screen
window.onerror = function (msg, url, line, col, err) {
  const el = document.getElementById('root')
  if (el) {
    el.innerHTML = `<div style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;color:#ff3b30">
      <h2>App Error</h2>
      <pre style="text-align:left;font-size:13px;background:#1c1c1e;color:#f5f5f7;padding:16px;border-radius:12px;overflow:auto">
${String(msg)}\n${url}:${line}:${col}
${err?.stack || ''}
      </pre>
    </div>`
  }
}

// Force service worker update and activate
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa-demo/sw.js')
    .then((reg) => {
      console.log('SW registered:', reg.scope)
      // Check for updates immediately
      reg.update()
      // If an updated SW is waiting, skip waiting to activate it
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is ready, tell it to skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        }
      })
    })
    .catch((err) => {
      console.error('SW registration failed:', err)
      // Don't let SW failure block the app
    })

  // When a new SW takes over, reload to ensure fresh assets
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
