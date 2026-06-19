// Service Worker for Push Notifications
const CACHE_NAME = 'steatus-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event for caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'sTEAtus',
        body: event.data.text() || 'You have a new notification',
        icon: '/favicon-32x32.png',
        badge: '/favicon-32x32.png'
      };
    }
  } else {
    notificationData = {
      title: 'sTEAtus',
      body: 'You have a new notification',
      icon: '/favicon-32x32.png',
      badge: '/favicon-32x32.png'
    };
  }

  const notificationOptions = {
    body: notificationData.body || 'New mood update from your friend',
    icon: notificationData.icon || '/favicon-32x32.png',
    badge: notificationData.badge || '/favicon-32x32.png',
    tag: notificationData.tag || 'mood-update',
    renotify: true,
    requireInteraction: notificationData.requireInteraction || false,
    actions: [
      {
        action: 'view',
        title: 'View App',
        icon: '/favicon-32x32.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon-32x32.png'
      }
    ],
    data: {
      url: notificationData.url || '/',
      ...notificationData.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'sTEAtus',
      notificationOptions
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Default action or 'view' action - open/focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app not already open
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'mood-sync') {
    event.waitUntil(syncMoodUpdates());
  }
});

async function syncMoodUpdates() {
  // This would sync any offline mood updates when connection is restored
  console.log('Syncing mood updates...');
  // Implementation would depend on your offline storage strategy
}

// Handle updates to the service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

console.log('Service Worker loaded');