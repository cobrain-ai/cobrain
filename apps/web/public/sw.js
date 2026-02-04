// CoBrain Service Worker - Push Notifications
// Version: 1.0.0

const CACHE_NAME = 'cobrain-v1'

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(clients.claim())
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let data = {
    title: 'CoBrain Reminder',
    body: 'You have a reminder',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'cobrain-reminder',
    data: {},
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch (e) {
      // If not JSON, use text as body
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    tag: data.tag || 'cobrain-reminder',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: '✓ Complete',
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 1h',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  const notificationData = event.notification.data || {}
  const reminderId = notificationData.reminderId
  const noteId = notificationData.noteId

  if (event.action === 'complete' && reminderId) {
    // Complete the reminder via API
    event.waitUntil(
      fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }).then(() => {
        console.log('[SW] Reminder completed')
      }).catch((error) => {
        console.error('[SW] Failed to complete reminder:', error)
      })
    )
  } else if (event.action === 'snooze' && reminderId) {
    // Snooze the reminder for 1 hour
    event.waitUntil(
      fetch(`/api/reminders/${reminderId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: '1h' }),
      }).then(() => {
        console.log('[SW] Reminder snoozed')
      }).catch((error) => {
        console.error('[SW] Failed to snooze reminder:', error)
      })
    )
  } else {
    // Default action: open the note or app
    const urlToOpen = noteId ? `/notes?highlight=${noteId}` : '/'

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a CoBrain tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // Open a new window
        return clients.openWindow(urlToOpen)
      })
    )
  }
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed')
})

// Background sync (for offline queued notifications)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders())
  }
})

async function syncReminders() {
  console.log('[SW] Syncing reminders...')
  // This could be used for offline support in the future
}
