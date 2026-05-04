const express = require('express')
const webpush = require('web-push')

const app = express()
app.use(express.json())

// ------------------------------------------------------------------
// 1. VAPID KEYS
// ------------------------------------------------------------------
// Generate your own keys ONCE with:
//   npx web-push generate-vapid-keys
// Then set them as environment variables or paste them below.
// NEVER commit the private key to git.
// ------------------------------------------------------------------
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'PASTE_YOUR_PUBLIC_KEY_HERE'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'PASTE_YOUR_PRIVATE_KEY_HERE'
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com'

if (VAPID_PUBLIC_KEY.includes('PASTE') || VAPID_PRIVATE_KEY.includes('PASTE')) {
  console.error('\nERROR: You must set VAPID keys before starting the server.')
  console.error('Run: npx web-push generate-vapid-keys')
  console.error('Then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as environment variables.\n')
  process.exit(1)
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// ------------------------------------------------------------------
// In-memory store for demo only. In production, use a real database.
// ------------------------------------------------------------------
const subscriptions = new Map()

// ------------------------------------------------------------------
// 2. API ENDPOINTS
// ------------------------------------------------------------------

// Health check + public key
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    vapidPublicKey: VAPID_PUBLIC_KEY,
    endpoints: {
      POST: '/subscribe',
      POST: '/send',
      POST: '/send-all',
      GET: '/subscriptions'
    }
  })
})

// A frontend can call this to get the public key dynamically
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

// Receive a push subscription from the browser
app.post('/subscribe', (req, res) => {
  const sub = req.body
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' })
  }
  const id = Buffer.from(sub.endpoint).toString('base64').slice(0, 16)
  subscriptions.set(id, sub)
  console.log('New subscription:', id, sub.endpoint)
  res.json({ id, message: 'Subscribed' })
})

// Send a push to one subscriber by ID
app.post('/send', async (req, res) => {
  const { id, payload } = req.body
  const sub = subscriptions.get(id)
  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' })
  }
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload || { title: 'Test', body: 'Hello from server' }))
    res.json({ success: true, message: 'Push sent' })
  } catch (err) {
    console.error('Push failed:', err.statusCode, err.body || err.message)
    if (err.statusCode === 410 || err.statusCode === 404) {
      subscriptions.delete(id)
      console.log('Removed expired subscription:', id)
    }
    res.status(500).json({ error: err.message })
  }
})

// Send a push to ALL subscribers
app.post('/send-all', async (req, res) => {
  const payload = req.body.payload || { title: 'Broadcast', body: 'Hello everyone!' }
  const results = { sent: 0, failed: 0, errors: [] }

  for (const [id, sub] of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload))
      results.sent++
    } catch (err) {
      results.failed++
      results.errors.push({ id, error: err.message })
      if (err.statusCode === 410 || err.statusCode === 404) {
        subscriptions.delete(id)
      }
    }
  }

  res.json(results)
})

// List active subscriptions (for debugging)
app.get('/subscriptions', (req, res) => {
  res.json({
    count: subscriptions.size,
    ids: Array.from(subscriptions.keys())
  })
})

// ------------------------------------------------------------------
// 3. START SERVER
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Push server listening on http://localhost:${PORT}`)
  console.log(`GET  http://localhost:${PORT}/vapid-public-key`)
})
