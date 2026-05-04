import { useState, useEffect, useCallback } from 'react'

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return false
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    setPrompt(null)
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome === 'accepted'
  }, [prompt])

  return { prompt, isInstalled, install }
}

function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission)
  const [pushSub, setPushSub] = useState(null)
  const [log, setLog] = useState([])

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  const requestPermission = useCallback(async () => {
    const p = await Notification.requestPermission()
    setPermission(p)
    addLog(`Notification permission: ${p}`)
    return p
  }, [addLog])

  const sendLocal = useCallback(() => {
    if (permission !== 'granted') {
      addLog('Cannot notify: permission denied')
      return
    }
    const n = new Notification('Local Notification', {
      body: 'This is a local notification sent from the app.',
      icon: '/pwa-demo/icon-192.png',
      badge: '/pwa-demo/icon-192.png',
      tag: 'local-' + Date.now()
    })
    addLog('Sent local notification')
    setTimeout(() => n.close(), 5000)
  }, [permission, addLog])

  const subscribePush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      addLog('Push not supported: no Service Worker support')
      return null
    }
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      // VAPID public key for demo only. In production, generate your own.
      const vapidPublicKey = 'BOcTu-6OgRFXaW0Y7rUHVrRODT0qMPjKbKCs8tUAn6z8OvTfk9PCs4HSIR1ITKZSN6nNfRrtNtxksH8Gq7T1bFA'
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
        addLog('Push subscription created')
      } catch (err) {
        addLog(`Push subscribe failed: ${err.message}`)
        return null
      }
    } else {
      addLog('Already subscribed to push')
    }
    setPushSub(sub)
    return sub
  }, [addLog])

  const unsubscribePush = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      addLog('Push subscription removed')
    } else {
      addLog('No active push subscription')
    }
    setPushSub(null)
  }, [addLog])

  const testPush = useCallback(async () => {
    addLog('Push requires a backend server. See README for setup.')
  }, [addLog])

  return { permission, pushSub, log, requestPermission, sendLocal, subscribePush, unsubscribePush, testPush }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function App() {
  const { prompt, isInstalled, install } = useInstallPrompt()
  const { permission, pushSub, log, requestPermission, sendLocal, subscribePush, unsubscribePush, testPush } = useNotifications()
  const [swState, setSwState] = useState('unknown')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwState('active'))
        .catch(() => setSwState('error'))
    } else {
      setSwState('unsupported')
    }
  }, [])

  const permissionLabel = permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Default'

  return (
    <>
      <header>
        <h1>PWA Demo</h1>
        <p>Notifications & Installability</p>
      </header>

      <section className="card gap-2">
        <h2>Install</h2>
        <div className="row">
          <span className="status on">
            <span className="dot" />
            {isInstalled ? 'Installed (standalone)' : 'Browser tab'}
          </span>
          <span className="status on">
            <span className="dot" />
            SW: {swState}
          </span>
        </div>
        {!isInstalled && (
          <button onClick={install} disabled={!prompt}>
            {prompt ? 'Add to Home Screen' : 'Install prompt unavailable'}
          </button>
        )}
        <p className="info">
          On iOS Safari: tap the Share button, then "Add to Home Screen".
          iOS 16.4+ is required for web push in installed PWAs.
        </p>
      </section>

      <section className="card gap-3">
        <h2>Notifications</h2>
        <div className="row">
          <span>Permission</span>
          <span className={permission === 'granted' ? 'status on' : 'status off'}>
            <span className="dot" />
            {permissionLabel}
          </span>
        </div>

        <div className="gap-2">
          {permission !== 'granted' && (
            <button onClick={requestPermission}>Request Notification Permission</button>
          )}
          <button onClick={sendLocal} disabled={permission !== 'granted'}>
            Send Local Notification
          </button>
          <button onClick={subscribePush} disabled={permission !== 'granted'} className="secondary">
            {pushSub ? 'Push Subscribed' : 'Subscribe to Push'}
          </button>
          {pushSub && (
            <>
              <button onClick={testPush} className="secondary">
                Test Push (needs backend)
              </button>
              <button onClick={unsubscribePush} className="secondary">
                Unsubscribe Push
              </button>
            </>
          )}
        </div>

        <p className="info">
          <strong>Local notifications</strong> work immediately without a server.
          <br />
          <strong>Push notifications</strong> require a backend server with VAPID keys.
          On iOS, you must add this app to the Home Screen before push works.
        </p>
      </section>

      <section className="card gap-2">
        <h2>Event Log</h2>
        <pre>{log.length ? log.join('\n') : 'No events yet.'}</pre>
      </section>

      {pushSub && (
        <section className="card gap-2">
          <h2>Push Subscription</h2>
          <pre>{JSON.stringify(pushSub.toJSON(), null, 2)}</pre>
        </section>
      )}
    </>
  )
}
