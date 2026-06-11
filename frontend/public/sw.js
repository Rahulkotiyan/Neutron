const CACHE_NAME = 'neutron-cache-v2';
const STATIC_CACHE = 'neutron-static-v2';
const API_CACHE = 'neutron-api-v2';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// API endpoints to cache with network-first strategy
const CACHEABLE_API_PATTERNS = [
  /^\/api\/posts/,
  /^\/api\/groups/,
  /^\/api\/search/,
  /^\/api\/colleges/,
  /^\/api\/branches/
];

// Sensitive endpoints - no caching
const NO_CACHE_PATTERNS = [
  /^\/api\/auth/,
  /^\/api\/messages/,
  /^\/api\/notifications/,
  /^\/api\/keys/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== CACHE_NAME
            )
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

  // Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip caching in development mode to avoid stale-asset issues
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
  
  // Handle different request types with appropriate strategies
  if (url.origin === self.location.origin) {
    // Same-origin static assets - always fetch fresh (no cache)
    // Cache was causing stale CSS/JS on physical devices after deployment
    return;
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - smart routing based on endpoint
    event.respondWith(handleApiRequest(request));
  } else {
    // External resources (CDNs) - stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

// Network-first strategy for API requests
async function networkFirst(request, cacheName, maxAge = 5 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache fresh response with timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    
    // Fallback to cache if available and not too old
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < maxAge) {
        return cachedResponse;
      } else {
      }
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached immediately, update in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Skip chrome-extension URLs and other unsupported schemes
  if (!request.url.startsWith('http') && !request.url.startsWith('https')) {
    return fetch(request);
  }
  
  // Always try to update cache in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
  });
  
  // Return cached version immediately, or wait for network if no cache
  if (cachedResponse) {
    return cachedResponse;
  } else {
    return networkPromise;
  }
}

// Smart API request handling
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Don't cache sensitive endpoints
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return fetch(request);
  }
  
  // Use network-first for cacheable API endpoints
  if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request, API_CACHE, 5 * 60 * 1000); // 5 minutes
  }
  
  // Default to network-only for other API requests
  return fetch(request);
}

// Background cache update
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // e.g., sync offline form submissions, messages, etc.
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});
