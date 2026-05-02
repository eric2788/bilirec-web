/// <reference lib="webworker" />

/**
 * Custom Service Worker for BiliRec
 * Built with vite-plugin-pwa (injectManifest strategy).
 * self.__WB_MANIFEST is replaced at build time with the precache manifest.
 */

declare const self: ServiceWorkerGlobalScope & {
  // Injected by vite-plugin-pwa at build time
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// ── Type helpers (not in standard webworker lib) ──────────
interface NotificationAction {
  action: string
  title: string
  icon?: string
}

interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: readonly NotificationAction[]
  renotify?: boolean
}

// ── Constants ──────────────────────────────────────────────
const CACHE_NAME = 'bilirec-cache-v2'
const APP_SUBSCRIBE_URL = '/?tab=subscribe'
const PUSH_PUBLIC_KEY_ENDPOINT = '/notify/public-key'
const PUSH_SUBSCRIBE_ENDPOINT = '/notify/subscription'

// ── Install: precache all build assets ────────────────────
self.addEventListener('install', (event) => {
  console.debug('[SW] install fired')

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const urls = self.__WB_MANIFEST.map((entry) => entry.url)
      console.debug(`[SW] precaching ${urls.length} assets`)

      // Cache one-by-one to avoid all-or-nothing failure
      const results = await Promise.allSettled(
        urls.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] failed to precache:', url, err)
            throw err
          }),
        ),
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        console.warn(`[SW] ${failed}/${urls.length} assets failed to precache`)
      }
    }),
  )

  // Do NOT call skipWaiting() here.
  // The page controls when to activate the new SW via SKIP_WAITING message.
})

// ── Activate: clean old caches ────────────────────────────
self.addEventListener('activate', (event) => {
  console.debug('[SW] activate fired')

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.debug('[SW] deleting old cache:', name)
            return caches.delete(name)
          }),
      ),
    ),
  )

  // Take control of all clients immediately after activation
  event.waitUntil(self.clients.claim())
})

// ── Message: handle SKIP_WAITING from page ────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.debug('[SW] SKIP_WAITING received, activating new SW')
    self.skipWaiting()
  }
})

// ── Fetch: network-first with runtime cache fallback ──────
self.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchEvent
  const { request } = fetchEvent

  // Only handle GET requests
  if (request.method !== 'GET') {
    return
  }

  // Only handle same-origin requests
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  // Skip precache-related requests (workbox internal)
  if (url.pathname.startsWith('/workbox-')) {
    return
  }

  fetchEvent.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for runtime fallback
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
            statusText: 'Service Unavailable',
          })
        })
      }),
  )
})

// ── Push ──────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.debug('[SW] push received')
  const pushEvent = event as PushEvent
  const payload = parsePushPayload(pushEvent.data)
  console.debug('[SW] push payload:', JSON.stringify(payload))
  const payloadData = (payload.data as Record<string, unknown> | undefined) ?? {}
  const roomId = payloadData.roomId || payload.room_id || payload.roomId
  const notification = buildLiveNotification(payload)
  const actions = buildNotificationActions()

  const notificationOptions: ExtendedNotificationOptions = {
    body: notification.body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: notification.tag,
    data: {
      ...payloadData,
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
  }

  console.debug('[SW] showNotification:', notification.title, notificationOptions)
  pushEvent.waitUntil(
    self.registration.showNotification(notification.title, notificationOptions),
  )
})

// ── Notification Click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as NotificationEvent
  console.debug(
    '[SW] notificationclick action:',
    notificationEvent.action,
    'data:',
    JSON.stringify(notificationEvent.notification.data),
  )

  notificationEvent.notification.close()

  notificationEvent.waitUntil(
    (async () => {
      const data = notificationEvent.notification.data || {}
      const roomId = data.roomId
      const appUrl =
        typeof data.appUrl === 'string' ? data.appUrl : APP_SUBSCRIBE_URL
      const appTargetUrl = new URL(appUrl, self.location.origin).toString()
      const liveUrl =
        data.liveUrl ||
        (roomId ? `https://live.bilibili.com/${roomId}` : null)
      const action = notificationEvent.action

      // On Android some surfaces may hide action buttons; default click should still be useful.
      if ((action === 'open-live' || !action) && liveUrl) {
        await self.clients.openWindow(liveUrl)
        return
      }

      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const existingClient = clientList.find((client) =>
        client.url.startsWith(self.location.origin),
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

      await self.clients.openWindow(appTargetUrl)
    })(),
  )
})

// ── Push Subscription Change ──────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  console.debug('[SW] pushsubscriptionchange fired')
  const changeEvent = event as ExtendableEvent & {
    oldSubscription?: PushSubscription | null
    newSubscription?: PushSubscription | null
  }
  console.debug(
    '[SW] old subscription:',
    changeEvent.oldSubscription?.endpoint ?? null,
  )
  console.debug(
    '[SW] new subscription:',
    changeEvent.newSubscription?.endpoint ?? null,
  )
  changeEvent.waitUntil(handlePushSubscriptionChange(changeEvent))
})

// ── Helpers ───────────────────────────────────────────────

function parsePushPayload(
  data: PushMessageData | null | undefined,
): Record<string, unknown> {
  if (!data) {
    return {}
  }

  try {
    return data.json()
  } catch {
    return { body: data.text() }
  }
}

function buildLiveNotification(payload: Record<string, unknown>) {
  const eventType =
    typeof payload.type === 'string' ? payload.type : 'live_detected'
  const roomId = payload.room_id || payload.roomId || (payload.data as Record<string, unknown>)?.roomId
  const streamer = payload.streamer_name || payload.streamer || '主播'
  const roomTitle = payload.room_title || payload.title || ''

  const isAutoRecord = eventType === 'live_auto_record_started'
  const titlePrefix = isAutoRecord ? '已開播並開始錄製' : '已開播'
  const titleRoom = roomId ? ` #${roomId}` : ''
  const title = `${streamer}${titleRoom} ${titlePrefix}`

  const bodyParts: string[] = []
  if (roomTitle) {
    bodyParts.push(truncateNotificationText(singleLine(String(roomTitle)), 60))
  }
  const body = bodyParts.join('\n') || '您有新的直播通知'

  return {
    title,
    body,
    tag: roomId ? `room-${roomId}-${eventType}` : `bilirec-${eventType}`,
  }
}

function singleLine(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function truncateNotificationText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function buildNotificationActions(): NotificationAction[] {
  const preferredActions: NotificationAction[] = [
    { action: 'open-live', title: '進入直播間' },
    { action: 'open-app', title: '訂閲管理' },
  ]

  const maxActions = (Notification as typeof Notification & { maxActions?: number })
    .maxActions
  const limit = Number.isInteger(maxActions) ? maxActions! : preferredActions.length

  if (limit <= 0) {
    return []
  }

  return preferredActions.slice(0, limit)
}

async function handlePushSubscriptionChange(event: {
  oldSubscription?: PushSubscription | null
  newSubscription?: PushSubscription | null
}): Promise<void> {
  try {
    let subscription = event.newSubscription

    if (!subscription) {
      const config = await fetchPushPublicKeyConfig()
      if (!config.enabled || !config.public_key) {
        return
      }

      subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(config.public_key) as BufferSource,
      })
    }

    await syncSubscriptionToServer(subscription)
  } catch (error) {
    console.error('Failed to recover push subscription in service worker:', error)
    await notifyClientsPushResubscribeRequired()
  }
}

async function fetchPushPublicKeyConfig(): Promise<{
  enabled: boolean
  public_key?: string
}> {
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

async function syncSubscriptionToServer(
  subscription: PushSubscription,
): Promise<void> {
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

async function notifyClientsPushResubscribeRequired(): Promise<void> {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  windowClients.forEach((client) => {
    client.postMessage({ type: 'push-resubscribe-required' })
  })
}

function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

// Required by vite-plugin-pwa injectManifest to avoid tree-shaking
export {}
