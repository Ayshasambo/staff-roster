const CACHE_NAME = 'staff-roster-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/state.js',
  '/js/utils.js',
  '/js/components/Navbar.js',
  '/js/components/BottomNav.js',
  '/js/components/Modals.js',
  '/js/views/RosterView.js',
  '/js/views/StaffView.js',
  '/js/views/LeaveView.js',
  '/js/views/AnalyticsView.js'
];

// Install: Cache Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: Clean up previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-First for API, Stale-While-Revalidate for Static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Non-GET requests should always bypass cache
  if (event.request.method !== 'GET') {
    return;
  }

  // API endpoints: Network-first, with cached JSON fallback if offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'You are currently offline. Viewing cached data.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Static Assets & Navigation: Cache-First with Network Revalidation
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && event.request.url.startsWith('http')) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

      return cached || fetchPromise;
    })
  );
});

// Listen for SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
