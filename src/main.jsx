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

// Unregister any stale service workers from previous deployments,
// then register the fresh one. This breaks the cycle where an old SW
// serves a cached index.html that references deleted asset files.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    return Promise.all(registrations.map((reg) => reg.unregister()))
  }).then(() => {
    return navigator.serviceWorker.register('/pwa-demo/sw.js')
  }).then((reg) => {
    console.log('SW registered:', reg.scope)
    // Force update check
    reg.update()
  }).catch((err) => {
    console.error('SW registration failed:', err)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)