import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa-demo/sw.js')
    .then((reg) => console.log('SW registered:', reg.scope))
    .catch((err) => console.error('SW registration failed:', err))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
