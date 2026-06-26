const CACHE_NAME = 'sam-rutero-cache-v49';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/municipios.js',
  '/js/api.js',
  '/js/modals.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
  // OMITIMOS CDNs aqu? porque causan error 302 en cache.addAll
  // Ser?n cacheados autom?ticamente por la estrategia runtime network-first
];

// Install Event: cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static app shell...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle offline caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy for API calls: Network-only. NEVER CACHE PRIVATE DATA IN SERVICE WORKER.
  if (requestUrl.pathname.includes('/api/v1/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategy for Map Tiles (CartoDB tiles or OSM tiles): Cache-first + dynamic caching
  if (requestUrl.host.includes('basemaps.cartocdn.com') || requestUrl.host.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, and fetch in background to refresh
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok && event.request.method === 'GET') {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          });
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok && event.request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default Strategy for App Shell assets: Network-first so visual fixes are not trapped in old PWA cache.
  event.respondWith(
    fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Remove the response.type !== 'basic' restriction so CDN/CORS files are cached too!
        
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
