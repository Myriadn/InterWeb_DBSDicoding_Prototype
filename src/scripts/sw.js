/* eslint-disable no-restricted-globals */
// Service Worker for Push Notification and PWA Functionality

// Cache names
const APP_SHELL_CACHE = 'story-app-shell-v1';
const CONTENT_CACHE = 'story-app-content-v1';
const IMAGE_CACHE = 'story-app-images-v1';
const STATIC_CACHE = 'story-app-static-v1';
const ALL_CACHES = [APP_SHELL_CACHE, CONTENT_CACHE, IMAGE_CACHE, STATIC_CACHE];

// Application Shell files - critical UI components
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.png',
  '/app.bundle.js',
  '/manifest.json',
  '/images/logo.png',
];

// Static assets - CSS, JS libraries, fonts
const STATIC_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap',
];

// PWA icons - disesuaikan dengan manifest.json
const PWA_ICONS = [
  '/images/icons/maskable-icon-x48.png',
  '/images/icons/maskable-icon-x96.png',
  '/images/icons/maskable-icon-x192.png',
  '/images/icons/maskable-icon-x384.png',
  '/images/icons/maskable-icon-x512.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png'
];

// Install event - cache App Shell and static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache App Shell
      caches.open(APP_SHELL_CACHE).then((cache) => {
        console.log('Caching app shell files');
        return cache.addAll(APP_SHELL_FILES);
      }),
      
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll([...STATIC_ASSETS, ...PWA_ICONS]);
      }),
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return ALL_CACHES.includes(cacheName) === false;
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper function to determine if URL is navigational (HTML) request
const isNavigationRequest = (request) => {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept').includes('text/html'))
  );
};

// Helper function to determine if URL is an API request
const isApiRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('dicoding.com/api') || 
         url.includes('story-api.dicoding.dev');
};

// Helper function to determine if URL is an image
const isImageRequest = (request) => {
  return (
    request.destination === 'image' ||
    request.url.match(/\.(jpe?g|png|gif|svg|webp)$/i)
  );
};

// Helper for offline fallback page
const offlineFallback = () => {
  return caches.match(new Request('/offline.html'));
};

// Fetch event with different strategies for different types of requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin && !isApiRequest(url.href)) {
    // For CDN resources (CSS, JS) - Cache first, then network
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
      event.respondWith(
        caches.match(request)
          .then(response => response || 
            fetch(request)
              .then(networkResponse => {
                const clonedResponse = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, clonedResponse));
                return networkResponse;
              })
              .catch(() => {
                // Return nothing for fonts and non-critical external resources
                if (request.url.match(/\.(woff2?|ttf|eot)$/i)) {
                  return new Response();
                }
                return offlineFallback();
              })
          )
      );
    }
    return;
  }
  
  // Handle navigation requests - App Shell (Cache First)
  if (isNavigationRequest(request)) {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch(request))
        .catch(() => offlineFallback())
    );
    return;
  }
  
  // Handle API requests - Network First with timeout
  if (isApiRequest(url.href)) {
    event.respondWith(
      Promise.race([
        // Network request with timeout
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
          
          fetch(request)
            .then(response => {
              // Don't cache API error responses
              if (!response.ok) {
                return resolve(response);
              }
              
              // Clone and cache the response for offline use
              const clonedResponse = response.clone();
              caches.open(CONTENT_CACHE)
                .then(cache => cache.put(request, clonedResponse));
              
              resolve(response);
            })
            .catch(reject);
        }),
        
        // Fallback to cached response after timeout
        new Promise(resolve => {
          setTimeout(
            () => {
              caches.match(request)
                .then(cachedResponse => {
                  if (cachedResponse) {
                    resolve(cachedResponse);
                  } else {
                    // If we have no cached data, try to at least show empty state UI
                    resolve(
                      new Response(
                        JSON.stringify({ 
                          error: true, 
                          message: 'Data tidak tersedia saat offline',
                          listStory: []
                        }),
                        { 
                          headers: { 'Content-Type': 'application/json' } 
                        }
                      )
                    );
                  }
                });
            },
            3000
          );
        })
      ])
      .catch(() => {
        // If both network and cache fail
        return new Response(
          JSON.stringify({ 
            error: true, 
            message: 'Tidak dapat terhubung ke server',
            listStory: []
          }),
          { 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      })
    );
    return;
  }
  
  // Handle image requests - Cache First, then network
  if (isImageRequest(request)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then(networkResponse => {
              const clonedResponse = networkResponse.clone();
              caches.open(IMAGE_CACHE)
                .then(cache => cache.put(request, clonedResponse));
              return networkResponse;
            })
            .catch(() => {
              // Return placeholder image if the image is unavailable
              if (request.url.includes('.svg')) {
                return caches.match('/images/icons/icon-72x72.png');
              } else {
                return caches.match('/images/icons/icon-192x192.png');
              }
            });
        })
    );
    return;
  }
  
  // Default strategy for all other requests - Stale While Revalidate
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached response immediately
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            // Update the cache with the fresh data
            const clonedResponse = networkResponse.clone();
            caches.open(CONTENT_CACHE)
              .then(cache => cache.put(request, clonedResponse));
            return networkResponse;
          })
          .catch(() => {
            console.log('Fetch failed; returning offline fallback');
            return cachedResponse;
          });
          
        return cachedResponse || fetchPromise;
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let notificationData;

  try {
    notificationData = event.data.json();
  } catch (e) {
    // Jika format data bukan JSON, gunakan text
    notificationData = {
      title: 'Story App Notification',
      options: {
        body: event.data ? event.data.text() : 'Ada story baru!',
      },
    };
  }

  // Pastikan data notifikasi sesuai format yang diharapkan
  const title = notificationData.title || 'Story App Notification';
  const options = notificationData.options || {
    body: 'Ada cerita baru untuk Anda!',
  };

  // Tambahkan properti tambahan ke options
  options.icon = '/favicon.png';
  options.badge = '/favicon.png';
  options.vibrate = [100, 50, 100];
  options.data = {
    dateOfArrival: Date.now(),
    primaryKey: 1,
    url: '/'
  };
  options.actions = [
    {
      action: 'explore',
      title: 'Lihat Cerita',
    },
    {
      action: 'close',
      title: 'Tutup',
    },
  ];

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Cek apakah sudah ada jendela yang terbuka
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Jika tidak ada jendela yang terbuka, buka jendela baru
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});