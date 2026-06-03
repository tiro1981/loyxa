/* ============================================
   MODA STYLE — Service Worker (PWA)
   Strategy: network-first for app shell (HTML/CSS/JS),
             cache-first for static images.
   ============================================ */

const CACHE_NAME = 'moda-style-v2';
const SHELL = [
    './',
    './index.html',
    './admin.html',
    './style.css',
    './admin.css',
    './script.js',
    './admin.js',
    './manifest.json',
    './icon.svg',
    './icon-192.svg',
    './icon-512.svg',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL).catch(() => null))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const sameOrigin = url.origin === location.origin;
    const isHtmlCssJs = sameOrigin && /\.(html|css|js|json)(\?.*)?$|^\/$/i.test(url.pathname);

    if (isHtmlCssJs) {
        // Network-first — always try fresh, fall back to cache when offline.
        e.respondWith(
            fetch(req).then(r => {
                if (r && r.status === 200) {
                    const copy = r.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                }
                return r;
            }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
        );
    } else {
        // Cache-first — images, fonts, etc.
        e.respondWith(
            caches.match(req).then(res => res || fetch(req).then(r => {
                if (r && r.status === 200) {
                    const copy = r.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                }
                return r;
            }).catch(() => res))
        );
    }
});
