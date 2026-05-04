# Push Notification Server

A minimal Node.js/Express server for sending Web Push notifications to the PWA demo.

## Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Generate VAPID keys (one-time):
   ```bash
   npx web-push generate-vapid-keys
   ```
   This prints a **Public Key** and a **Private Key**.

3. Set the keys as environment variables (do this in your terminal before running the server):
   ```bash
   export VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"
   export VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
   ```

4. Update the frontend to use your new public key. Open `../src/App.jsx` and replace the hardcoded `vapidPublicKey` in the `subscribePush` function with your key.

5. Start the server:
   ```bash
   npm start
   ```

## Exposing to the Internet (required for iPhone testing)

Your iPhone must be able to reach this server. Use one of these tools:

- **ngrok** (recommended):
  ```bash
  ngrok http 3001
  ```
  Then use the HTTPS URL (e.g., `https://abc123.ngrok.io`) as your server address.

- **localtunnel**:
  ```bash
  npx localtunnel --port 3001
  ```

## Sending a Push

### Option A: Automatic (frontend sends subscription to server)

If you update the frontend to POST the subscription to `https://your-ngrok-url/subscribe`, the server stores it automatically.

### Option B: Manual (copy-paste subscription)

1. In the PWA app, tap **Subscribe to Push**.
2. Copy the JSON shown under **Push Subscription**.
3. POST it to the server:
   ```bash
   curl -X POST https://your-ngrok-url/subscribe \
     -H "Content-Type: application/json" \
     -d '{"endpoint":"...","keys":{"p256dh":"...","auth":"..."}}'
   ```
   Remember the `id` returned.
4. Send a notification:
   ```bash
   curl -X POST https://your-ngrok-url/send \
     -H "Content-Type: application/json" \
     -d '{"id":"PASTE_ID_HERE","payload":{"title":"Hello","body":"This is a server push!"}}'
   ```

### Option C: Broadcast to all subscribers

```bash
curl -X POST https://your-ngrok-url/send-all \
  -H "Content-Type: application/json" \
  -d '{"payload":{"title":"Broadcast","body":"Sent to all devices"}}'
```

## iOS Requirements

- **iOS 16.4+** is required for Web Push in PWAs.
- The app **must** be added to the Home Screen. Push will not work in a regular Safari tab on iOS.
- The phone must be able to reach your server (hence ngrok/localtunnel).
