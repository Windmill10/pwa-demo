const webpush = require('web-push')

// Paste your VAPID keys here (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = 'BOcTu-6OgRFXaW0Y7rUHVrRODT0qMPjKbKCs8tUAn6z8OvTfk9PCs4HSIR1ITKZSN6nNfRrtNtxksH8Gq7T1bFA'
const VAPID_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'

webpush.setVapidDetails(
  'mailto:you@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

// Example: send a push notification to a subscription
// In production, store subscriptions in a database
async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log('Push sent successfully')
  } catch (err) {
    console.error('Push failed:', err.statusCode, err.body || err.message)
  }
}

// Demo usage (paste subscription object from the app's UI):
// const sub = { endpoint: '...', keys: { p256dh: '...', auth: '...' } }
// sendPush(sub, { title: 'Hello', body: 'World' })

module.exports = { sendPush, VAPID_PUBLIC_KEY }
