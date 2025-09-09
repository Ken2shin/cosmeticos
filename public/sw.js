const CACHE_NAME = "beauty-catalog-v1"
const urlsToCache = ["/", "/admin", "/checkout", "/icon-192x192.jpg", "/icon-512x512.jpg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Opened cache")
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.log("[SW] Cache install failed:", error)
      }),
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event)

  const options = {
    body: event.data ? event.data.text() : "Nueva notificación",
    icon: "/icon-192x192.jpg",
    badge: "/icon-192x192.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver",
        icon: "/icon-192x192.jpg",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icon-192x192.jpg",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Beauty Catalog", options))
})

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click received:", event)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
