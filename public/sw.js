// Offline play: every file the game fetches is kept in a cache as it comes in. While online the network
// always goes first (so a new version arrives as soon as it's published); offline, the cached copy is used.
const CACHE = 'shmupjp-v2'; // src/pwa.js fills it too
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Content-hashed Vite JS chunks never change for a given filename: serve from cache immediately.
const HASHED_CHUNK = /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.js$/;

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const netFirst = () =>
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      // offline: the cached copy (whatever headers it was cached with); the game's page for any address in it
      .catch(() =>
        caches.match(req, { ignoreVary: true, ignoreSearch: req.mode === 'navigate' }).then((hit) => hit ?? (req.mode === 'navigate' ? caches.match('index.html', { ignoreVary: true }) : Response.error())),
      );
  if (HASHED_CHUNK.test(url.pathname)) {
    e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? netFirst()));
    return;
  }
  e.respondWith(netFirst());
});
