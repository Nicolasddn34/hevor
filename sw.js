/* Service worker Hevor : garde l'appli sur le téléphone pour l'ouvrir sans réseau.
   Change VERSION à chaque mise à jour pour renouveler le cache. */
const VERSION = 'hevor-1.6.0';
const CORE = [
  './', './index.html', './app.css', './app.js', './config.js', './manifest.webmanifest',
  './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-firestore-compat.js',
  './fonts/barlow-latin-400-normal.woff2', './fonts/barlow-latin-500-normal.woff2', './fonts/barlow-latin-600-normal.woff2', './fonts/barlow-latin-700-normal.woff2',
  './fonts/barlow-condensed-latin-600-normal.woff2', './fonts/barlow-condensed-latin-700-normal.woff2', './fonts/barlow-condensed-latin-800-normal.woff2',
  './fonts/barlow-condensed-latin-600-italic.woff2', './fonts/barlow-condensed-latin-700-italic.woff2', './fonts/barlow-condensed-latin-800-italic.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.png', './icons/logo.png'
];
self.addEventListener('install', e => {
  // cache: 'reload' contourne le cache HTTP pour toujours prendre la version qui vient d'être publiée
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok ? c.put(u, r) : null).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return; // rien d'externe n'est mis en cache
  // Page et config : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
  if (req.mode === 'navigate' || url.pathname.endsWith('/config.js') || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); return r; })
      .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req).then(r => r || caches.match('./'))));
    return;
  }
  // Le reste (fichiers de cette version) : cache d'abord, réseau sinon
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r && r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; })));
});
