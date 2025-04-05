const CACHE_NAME = 'bolt-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
];

// Install event handler with improved error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch(error => {
          console.error('Failed to cache static assets:', error);
          // Continue installation even if some assets fail to cache
          return Promise.resolve();
        });
      })
  );
});

// Activate event handler
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Message event handler (added during initial evaluation)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event handler with improved caching strategy and error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(error => console.error('Failed to cache response:', error));

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });

        return cachedResponse || fetchPromise;
      })
  );
});

// Helper function to handle API requests
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (!response.ok) throw new Error('API request failed');
    return response;
  } catch (error) {
    console.error('API request error:', error);
    return new Response(JSON.stringify({ error: 'API request failed' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}