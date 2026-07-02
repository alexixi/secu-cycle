const VERSION = 'v1';
const STATIC_CACHE = `secucycle-static-${VERSION}`;
const HTML_CACHE = `secucycle-html-${VERSION}`;
const TILE_CACHE = `secucycle-tiles-${VERSION}`;
const TILE_MAX_ENTRIES = 300;

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(HTML_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const keep = new Set([STATIC_CACHE, HTML_CACHE, TILE_CACHE]);
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    if (sameOrigin && url.pathname.startsWith('/api')) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(HTML_CACHE).then((c) => c.put('/index.html', copy));
                    return res;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
        );
        return;
    }

    if (sameOrigin && url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(request).then((cached) =>
                cached || fetch(request).then((res) => {
                    const copy = res.clone();
                    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
                    return res;
                })
            )
        );
        return;
    }

    if (url.hostname.endsWith('maptiler.com')) {
        event.respondWith(
            caches.open(TILE_CACHE).then((cache) =>
                cache.match(request).then((cached) => {
                    const network = fetch(request).then((res) => {
                        if (res.ok) {
                            cache.put(request, res.clone());
                            trimCache(TILE_CACHE, TILE_MAX_ENTRIES);
                        }
                        return res;
                    }).catch(() => cached);
                    return cached || network;
                })
            )
        );
    }
});
