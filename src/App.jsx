import { useState, useEffect, useCallback } from 'react'

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent || ''
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
    setIsIOS(isIOSDevice)

    // Detect standalone mode (PWA launched from Home Screen)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(isStandaloneMode)

    // beforeinstallprompt only fires on Android/Chrome, never on iOS
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return false
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    setPrompt(null)
    if (outcome === 'accepted') setIsStandalone(true)
    return outcome === 'accepted'
  }, [prompt])

  return { prompt, isStandalone, isIOS, install }
}

function useNotifications() {
  const [supportsNotification, setSupportsNotification] = useState(typeof Notification !== 'undefined')
  const [permission, setPermission] = useState(() => {
    if (typeof Notification !== 'undefined') return Notification.permission
    return 'unsupported'
  })
  const [pushSub, setPushSub] = useState(null)
  const [log, setLog] = useState([])

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      addLog('Notification API not available in this context')
      return 'unsupported'
    }
    const p = await Notification.requestPermission()
    setPermission(p)
    setSupportsNotification(true)
    addLog(`Notification permission: ${p}`)
    return p
  }, [addLog])

  const sendLocal = useCallback(() => {
    if (typeof Notification === 'undefined' || permission !== 'granted') {
      addLog('Cannot notify: permission not granted or API unavailable')
      return
    }
    const n = new Notification('Local Notification', {
      body: 'This is a local notification from the PWA.',
      icon: '/pwa-demo/icon-192.png',
      badge: '/pwa-demo/icon-192.png',
      tag: 'local-' + Date.now()
    })
    addLog('Sent local notification')
    setTimeout(() => n.close(), 5000)
  }, [permission, addLog])

  const subscribePush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      addLog('Push not supported: no Service Worker')
      return null
    }
    if (typeof Notification === 'undefined') {
      addLog('Push not supported: Notification API unavailable')
      return null
    }
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const vapidPublicKey = 'BIo9TLcro0pWXGREXvCjx7yIn8Eq2HozdeyjZT9n397zq3upDRcPPun-yvdTO2yXMsFL-g3uvcc4gL5-J0GvRaw'
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

  return { supportsNotification, permission, pushSub, log, requestPermission, sendLocal, subscribePush, unsubscribePush, testPush }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function App() {
  const { prompt, isStandalone, isIOS, install } = useInstallPrompt()
  const { supportsNotification, permission, pushSub, log, requestPermission, sendLocal, subscribePush, unsubscribePush, testPush } = useNotifications()
  const [swState, setSwState] = useState('unknown')
  const isSecure = window.isSecureContext

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwState('active'))
        .catch(() => setSwState('error'))
    } else {
      setSwState('unsupported')
    }
  }, [])

  const needsHomeScreen = isIOS && !isStandalone

  return (
    <>
      <header>
        <h1>PWA Demo</h1>
        <p>Notifications & Installability</p>
      </header>

      {/* Status overview */}
      <section className="card gap-2">
        <h2>Status</h2>
        <div className="row">
          <span>Mode</span>
          <span className={isStandalone ? 'status on' : 'status off'}>
            <span className="dot" />
            {isStandalone ? 'Standalone (Home Screen)' : 'Browser Tab'}
          </span>
        </div>
        <div className="row">
          <span>Service Worker</span>
          <span className={swState === 'active' ? 'status on' : 'status off'}>
            <span className="dot" />
            {swState}
          </span>
        </div>
        <div className="row">
          <span>HTTPS</span>
          <span className={isSecure ? 'status on' : 'status off'}>
            <span className="dot" />
            {isSecure ? 'Yes' : 'No (insecure context)'}
          </span>
        </div>
        <div className="row">
          <span>Notifications</span>
          <span className={supportsNotification ? 'status on' : 'status off'}>
            <span className="dot" />
            {supportsNotification ? 'Available' : 'Unavailable'}
          </span>
        </div>
        {isIOS && !isSecure && (
          <p className="info" style={{ color: '#ff3b30' }}>
            <strong>Not a secure context.</strong> iOS requires HTTPS for notifications.
            Use the deployed GitHub Pages URL instead of a local IP address.
          </p>
        )}
      </section>

      {/* Install / Home Screen instructions */}
      <section className="card gap-2">
        <h2>Install</h2>
        {!isStandalone && (
          <>
            {isIOS ? (
              <div className="gap-2">
                <p className="info">
                  <strong>iOS Safari does not support the install prompt.</strong>
                  To use this as a PWA on iPhone:
                </p>
                <ol className="info" style={{ paddingLeft: 20 }}>
                  <li>Open this page in <strong>Safari</strong> (not Chrome/Firefox)</li>
                  <li>Tap the <strong>Share button</strong> (square with up arrow)</li>
                  <li>Tap <strong>"Add to Home Screen"</strong></li>
                  <li>Open the app from your Home Screen</li>
                </ol>
                <p className="info">
                  Notifications only work when launched from the Home Screen icon.
                </p>
              </div>
            ) : (
              <button onClick={install} disabled={!prompt}>
                {prompt ? 'Add to Home Screen' : 'Install prompt unavailable'}
              </button>
            )}
          </>
        )}
        {isStandalone && (
          <p className="info" style={{ color: '#34c759' }}>
            Running as installed PWA. Notifications are supported on iOS 16.4+.
          </p>
        )}
      </section>

      {/* Notifications */}
      <section className="card gap-3">
        <h2>Notifications</h2>

        {needsHomeScreen && (
          <p className="info" style={{ color: '#ff3b30' }}>
            <strong>Notifications unavailable.</strong> On iOS, you must add this app to the Home Screen
            and open it from the Home Screen icon before the Notification API becomes available.
          </p>
        )}

        {!isSecure && (
          <p className="info" style={{ color: '#ff3b30' }}>
            <strong>Not a secure context.</strong> Push subscriptions require HTTPS.
            Access this app via the GitHub Pages URL for full functionality.
          </p>
        )}

        {supportsNotification && permission !== 'granted' && permission !== 'unsupported' && (
          <button onClick={requestPermission}>Request Notification Permission</button>
        )}

        {supportsNotification && permission === 'granted' && (
          <>
            <button onClick={sendLocal}>Send Local Notification</button>
            {isSecure ? (
              <button onClick={subscribePush} className="secondary">
                {pushSub ? 'Push Subscribed' : 'Subscribe to Push'}
              </button>
            ) : (
              <button disabled className="secondary">
                Push requires HTTPS
              </button>
            )}
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
          </>
        )}

        {permission === 'denied' && (
          <p className="info">
            Notification permission was denied. Go to <strong>Settings &gt; Safari &gt; Notifications</strong>{' '}
            (or the app's settings if installed) to re-enable.
          </p>
        )}
      </section>

      {/* Event Log */}
      <section className="card gap-2">
        <h2>Event Log</h2>
        <pre>{log.length ? log.join('\n') : 'No events yet. Tap buttons above to test.'}</pre>
      </section>

      {/* Push Subscription JSON */}
      {pushSub && (
        <section className="card gap-2">
          <h2>Push Subscription</h2>
          <pre>{JSON.stringify(pushSub.toJSON(), null, 2)}</pre>
        </section>
      )}
    </>
  )
}