/// <reference lib="webworker" />
// @ts-check

/**
 * @typedef {ExtendableEvent & { oldSubscription?: PushSubscription | null, newSubscription?: PushSubscription | null }} PushSubscriptionChangeEventLike
 */

const CACHE_NAME = 'bilirec-cache-v1'
const APP_SUBSCRIBE_URL = '/?tab=subscribe'
const PUSH_PUBLIC_KEY_ENDPOINT = '/notify/public-key'
const PUSH_SUBSCRIBE_ENDPOINT = '/notify/subscription'
/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self))
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/main.css',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  console.debug('[SW] install fired')
  const installEvent = /** @type {ExtendableEvent} */ (event)

  installEvent.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('Cache addAll failed:', err)
      })
    })
  )
  sw.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.debug('[SW] activate fired')
  const activateEvent = /** @type {ExtendableEvent} */ (event)

  activateEvent.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  activateEvent.waitUntil(sw.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event)
  const { request } = fetchEvent

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (!url.origin.startsWith(self.location.origin)) {
    return
  }

  fetchEvent.respondWith(
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
  console.debug('[SW] push received')
  const pushEvent = /** @type {PushEvent} */ (event)
  const payload = parsePushPayload(pushEvent.data)
  console.debug('[SW] push payload:', JSON.stringify(payload))
  const roomId = payload.data?.roomId || payload.room_id || payload.roomId
  const notification = buildLiveNotification(payload)
  const actions = buildNotificationActions()

  const notificationOptions = /** @type {NotificationOptions} */ ({
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
      actions,
      renotify: true,
    })

  console.debug('[SW] showNotification:', notification.title, notificationOptions)
  pushEvent.waitUntil(
    sw.registration.showNotification(notification.title, notificationOptions)
  )
})

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = /** @type {NotificationEvent} */ (event)
  console.debug('[SW] notificationclick action:', notificationEvent.action, 'data:', JSON.stringify(notificationEvent.notification.data))

  notificationEvent.notification.close()

  notificationEvent.waitUntil((async () => {
    const data = notificationEvent.notification.data || {}
    const roomId = data.roomId
    const appUrl = typeof data.appUrl === 'string' ? data.appUrl : APP_SUBSCRIBE_URL
    const appTargetUrl = new URL(appUrl, sw.location.origin).toString()
    const liveUrl = data.liveUrl || (roomId ? `https://live.bilibili.com/${roomId}` : null)
    const action = notificationEvent.action

    // On Android some surfaces may hide action buttons; default click should still be useful.
    if ((action === 'open-live' || !action) && liveUrl) {
      await sw.clients.openWindow(liveUrl)
      return
    }

    const clientList = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existingClient = clientList.find(
      /** @param {WindowClient} client */
      (client) => client.url.startsWith(sw.location.origin)
    )

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

    await sw.clients.openWindow(appTargetUrl)
  })())
})

self.addEventListener('pushsubscriptionchange', (event) => {
  console.debug('[SW] pushsubscriptionchange fired')
  const changeEvent = /** @type {PushSubscriptionChangeEventLike} */ (event)
  console.debug('[SW] old subscription:', changeEvent.oldSubscription?.endpoint ?? null)
  console.debug('[SW] new subscription:', changeEvent.newSubscription?.endpoint ?? null)
  changeEvent.waitUntil(handlePushSubscriptionChange(changeEvent))
})

/**
 * @param {PushMessageData | null | undefined} data
 */
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

/**
 * @param {any} payload
 */
function buildLiveNotification(payload) {
  const eventType = typeof payload.type === 'string' ? payload.type : 'live_detected'
  const roomId = payload.room_id || payload.roomId || payload.data?.roomId
  const streamer = payload.streamer_name || payload.streamer || '主播'
  const roomTitle = payload.room_title || payload.title || ''

  const isAutoRecord = eventType === 'live_auto_record_started'
  const titlePrefix = isAutoRecord ? '已開播並開始錄製' : '已開播'
  const titleRoom = roomId ? ` #${roomId}` : ''
  const title = `${streamer}${titleRoom} ${titlePrefix}`

  // First line: room title as subtitle; second line: message content
  const bodyParts = []
  if (roomTitle) {
    bodyParts.push(truncateNotificationText(singleLine(roomTitle), 60))
  }
  const body = bodyParts.join('\n') || '您有新的直播通知'

  return {
    title,
    body,
    tag: roomId ? `room-${roomId}-${eventType}` : `bilirec-${eventType}`,
  }
}

/**
 * @param {string} value
 */
function singleLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

/**
 * @param {string} value
 * @param {number} maxLength
 */
function truncateNotificationText(value, maxLength) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function buildNotificationActions() {
  const preferredActions = [
    { action: 'open-live', title: '進入直播間' },
    { action: 'open-app', title: '訂閲管理' },
  ]

  const notificationCtor = /** @type {{ maxActions?: number }} */ (Notification)
  const maxActions = Number.isInteger(notificationCtor.maxActions)
    ? /** @type {number} */ (notificationCtor.maxActions)
    : preferredActions.length

  if (maxActions <= 0) {
    return []
  }

  return preferredActions.slice(0, maxActions)
}

/**
 * @param {PushSubscriptionChangeEventLike} event
 */
async function handlePushSubscriptionChange(event) {
  try {
    let subscription = event.newSubscription

    if (!subscription) {
      const config = await fetchPushPublicKeyConfig()
      if (!config.enabled || !config.public_key) {
        return
      }

      subscription = await sw.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(config.public_key),
      })
    }

    await syncSubscriptionToServer(subscription)
  } catch (error) {
    console.error('Failed to recover push subscription in service worker:', error)
    await notifyClientsPushResubscribeRequired()
  }
}

async function fetchPushPublicKeyConfig() {
  const response = await fetch(PUSH_PUBLIC_KEY_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch push public key: ${response.status}`)
  }

  return response.json()
}

/**
 * @param {PushSubscription} subscription
 */
async function syncSubscriptionToServer(subscription) {
  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const auth = json.keys?.auth
  const p256dh = json.keys?.p256dh

  if (!endpoint || !auth || !p256dh) {
    throw new Error('Invalid push subscription payload')
  }

  const response = await fetch(PUSH_SUBSCRIBE_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint,
      keys: {
        auth,
        p256dh,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to sync push subscription: ${response.status}`)
  }
}

async function notifyClientsPushResubscribeRequired() {
  const windowClients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windowClients.forEach(
    /** @param {WindowClient} client */
    (client) => {
      client.postMessage({ type: 'push-resubscribe-required' })
    }
  )
}

/**
 * @param {string} base64String
 */
function base64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
