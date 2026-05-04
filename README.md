# PWA Notifications Demo

A minimal React Progressive Web App to test installability and notifications on mobile (especially iPhone).

## What it demonstrates

- **Install to Home Screen** (PWA manifest + service worker)
- **Local Notifications** via the Web Notification API
- **Push Notification subscription** via Push API
- GitHub Pages deployment ready

## Important iOS Notes

- iOS **16.4+** is required for web push notifications in PWAs.
- You **must** add the app to the Home Screen before push subscriptions work in standalone mode.
- Safari must be used; third-party browsers on iOS still use WebKit but may lag on PWA features.

## Local Setup

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Replace `USERNAME` in `package.json` `homepage` with your GitHub username:
   ```json
   "homepage": "https://USERNAME.github.io/pwa-demo"
   ```
2. Replace `USERNAME` in `index.html` if you forked paths (the `base` in `vite.config.js` already assumes `/pwa-demo/`).
3. Create a repository on GitHub named `pwa-demo`, push this code, then run:
   ```bash
   npm run deploy
   ```
4. Enable GitHub Pages in the repo settings (Source: GitHub Actions, or branch `gh-pages` if using the deploy script).

## Push Notifications Backend

For real push delivery, you need a backend server. A minimal Node.js example:

```js
const webpush = require('web-push')
// Generate VAPID keys once with: webpush.generateVAPIDKeys()
webpush.setVapidDetails(
  'mailto:you@example.com',
  'BOcTu-6OgRFXaW0Y7rUHVrRODT0qMPjKbKCs8tUAn6z8OvTfk9PCs4HSIR1ITKZSN6nNfRrtNtxksH8Gq7T1bFA',
  'PRIVATE_KEY_HERE'
)

const subscription = { /* paste subscription JSON from app UI */ }
webpush.sendNotification(subscription, JSON.stringify({
  title: 'Hello from server',
  body: 'This is a real push notification'
}))
```

**Never commit private VAPID keys to git.**

## Project Structure

```
pwa-demo/
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js            # Service worker (caching + push handler)
│   └── icon-*.png       # App icons (generate your own)
├── src/
│   ├── App.jsx          # UI and notification logic
│   ├── index.css        # iOS-style styling
│   └── main.jsx         # Entry + SW registration
├── index.html           # PWA meta tags
├── vite.config.js       # Build + PWA plugin
└── package.json         # Dependencies + gh-pages deploy script
```

## Assets

You should generate real PNG icons at 192x192 and 512x512 and place them in `public/`.
Placeholder filenames are used in the manifest and HTML.
