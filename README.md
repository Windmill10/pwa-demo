# PWA Notifications Demo

A minimal React Progressive Web App to test installability and notifications on mobile (especially iPhone).

## What it demonstrates

- **Install to Home Screen** (PWA manifest + service worker)
- **Local Notifications** via the Web Notification API (works immediately)
- **Push Notification subscription** via Push API (requires backend server)
- GitHub Pages deployment ready

## Important iOS Notes

- iOS **16.4+** is required for web push notifications in PWAs. You have iOS 18, so this is satisfied.
- You **must** add the app to the Home Screen before push subscriptions work in standalone mode. Safari regular tabs do not support web push on iOS.
- Safari is the browser to use.
- If you previously installed the app during the first (broken) deployment, **delete the Home Screen icon first** before re-adding it, because iOS caches the old service worker aggressively.

## Local Setup

```bash
npm install
npm run preview
```

## Deploy to GitHub Pages

The `homepage` in `package.json` is already set to `https://Windmill10.github.io/pwa-demo`.

```bash
# First time setup (if you haven't created the repo yet)
git init
git add .
git commit -m "Initial PWA demo"
gh repo create Windmill10/pwa-demo --public --source=. --remote=origin --push

# Redeploy after any code changes
npm run deploy
```

Then go to `https://github.com/Windmill10/pwa-demo/settings/pages`, set Source to **Deploy from a branch**, and choose the `gh-pages` branch.

## Clearing Stale Cache (Important!)

If you see a pitch black screen after redeploying, the old service worker from the first build is cached:

1. On iPhone: **Settings > Safari > Advanced > Website Data**
2. Search for `windmill10.github.io` and swipe left to **Delete**
3. Delete the Home Screen icon if you had one
4. Reload `https://Windmill10.github.io/pwa-demo/` in Safari
5. Re-add to Home Screen if testing push

## Testing Push Notifications End-to-End

### 1. Update the VAPID Public Key in the Frontend

The frontend has a hardcoded VAPID public key in `src/App.jsx`. You need to replace it with your own.

Generate VAPID keys (one-time):
```bash
cd server
npm install
npx web-push generate-vapid-keys
```

Copy the **Public Key** and replace the string in `src/App.jsx` inside the `subscribePush` function. Then rebuild and redeploy:
```bash
cd ..
npm run build
npm run deploy
```

### 2. Start the Push Server

In one terminal:
```bash
cd server
export VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
export VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
npm start
```

### 3. Expose the Server to the Internet

Your iPhone must reach this server. Use `ngrok`:
```bash
ngrok http 3001
```
(Or use `npx localtunnel --port 3001`)

### 4. Get a Push Subscription from the iPhone

1. Open `https://Windmill10.github.io/pwa-demo/` in Safari on your iPhone
2. Tap **Request Notification Permission**
3. Tap **Subscribe to Push**
4. The app will display a JSON block under **Push Subscription**. Copy this JSON.

### 5. Send a Push from the Server

Send the subscription to your server:
```bash
curl -X POST https://YOUR_NGROK_URL/subscribe \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"...","keys":{"p256dh":"...","auth":"..."}}'
```

Then trigger the push:
```bash
curl -X POST https://YOUR_NGROK_URL/send \
  -H "Content-Type: application/json" \
  -d '{"id":"ID_RETURNED_ABOVE","payload":{"title":"Hello","body":"This came from the server!"}}'
```

You should see the notification arrive on your iPhone, even if the app is in the background.

### Broadcast to All Subscribers

```bash
curl -X POST https://YOUR_NGROK_URL/send-all \
  -H "Content-Type: application/json" \
  -d '{"payload":{"title":"Broadcast","body":"Sent to all devices"}}'
```

## Project Structure

```
pwa-demo/
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js            # Service worker (caching + push handler)
│   └── icon-*.png       # App icons
├── src/
│   ├── App.jsx          # UI and notification logic
│   ├── index.css        # iOS-style styling
│   └── main.jsx         # Entry + SW registration + error display
├── server/
│   ├── push-server.js   # Express server for sending push
│   └── package.json     # Server dependencies
├── index.html           # PWA meta tags
├── vite.config.js       # Build config
└── package.json         # Frontend dependencies + gh-pages deploy
```

## Assets

Icons are generated at `public/icon-192.png` and `public/icon-512.png`. You can replace them with your own designs.
