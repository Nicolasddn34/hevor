/* Service worker Hevor : garde l'appli sur le téléphone pour l'ouvrir sans réseau.
   Change VERSION à chaque mise à jour pour renouveler le cache. */
const VERSION = 'hevor-1.3.0';
const CORE = [
  './', './index.html', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.png', './icons/logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const CACHEABLE = u => u.origin === self.location.origin || /(^|\.)gstatic\.com$/.test(u.hostname) && u.pathname.startsWith('/firebasejs/') || u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (!CACHEABLE(url)) return;
  // Pages et config : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
  if (req.mode === 'navigate' || url.pathname.endsWith('/config.js') || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); return r; })
      .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req).then(r => r || caches.match('./'))));
    return;
  }
  // Le reste : cache d'abord, puis mise à jour en arrière-plan
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
