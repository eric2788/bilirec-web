const CACHE_NAME = 'bilirec-cache-v1'
const APP_SUBSCRIBE_URL = '/?tab=subscribe'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/main.css',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('Cache addAll failed:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (!url.origin.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          })
        })
      })
  )
})

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data)
  const roomId = payload.data?.roomId || payload.room_id || payload.roomId
  const notification = buildLiveNotification(payload)

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: notification.tag,
      data: {
        ...(payload.data || {}),
        eventType: payload.type,
        streamerName: payload.streamer_name,
        roomTitle: payload.room_title,
        eventTimestamp: payload.timestamp,
        roomId,
        appUrl: APP_SUBSCRIBE_URL,
        liveUrl: roomId ? `https://live.bilibili.com/${roomId}` : null,
      },
      actions: [
        { action: 'open-live', title: '進入直播間' },
        { action: 'open-app', title: '訂閲管理' },
      ],
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil((async () => {
    const data = event.notification.data || {}
    const roomId = data.roomId
    const appUrl = data.appUrl || APP_SUBSCRIBE_URL
    const appTargetUrl = new URL(appUrl, self.location.origin).toString()
    const liveUrl = data.liveUrl || (roomId ? `https://live.bilibili.com/${roomId}` : null)
    const action = event.action

    if (action === 'open-live' && liveUrl) {
      await clients.openWindow(liveUrl)
      return
    }

    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existingClient = clientList.find((client) => client.url.startsWith(self.location.origin))

    if (existingClient) {
      if (typeof existingClient.navigate === 'function') {
        await existingClient.navigate(appTargetUrl)
      }
      await existingClient.focus()
      existingClient.postMessage({
        type: 'notification-click',
        roomId,
        tab: 'subscribe',
        action: action || 'default',
      })
      return
    }

    await clients.openWindow(appTargetUrl)
  })())
})

function parsePushPayload(data) {
  if (!data) {
    return {}
  }

  try {
    return data.json()
  } catch (error) {
    return { body: data.text() }
  }
}

function buildLiveNotification(payload) {
  const eventType = typeof payload.type === 'string' ? payload.type : 'live_detected'
  const roomId = payload.room_id || payload.roomId || payload.data?.roomId
  const streamer = payload.streamer_name || payload.streamer || '主播'
  const roomTitle = payload.room_title || payload.title || ''
  const message = payload.message || payload.body || ''

  const isAutoRecord = eventType === 'live_auto_record_started'
  const titlePrefix = isAutoRecord ? '已開播並開始錄製' : '已開播'
  const titleRoom = roomId ? ` #${roomId}` : ''
  const title = `${streamer}${titleRoom} ${titlePrefix}`

  const bodyParts = []
  if (roomTitle) {
    bodyParts.push(`《${roomTitle}》`)
  }
  if (message) {
    bodyParts.push(message)
  }

  return {
    title,
    body: bodyParts.join('\n') || '您有新的直播通知',
    tag: roomId ? `room-${roomId}-${eventType}` : `bilirec-${eventType}`,
  }
}
