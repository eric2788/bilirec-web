import { apiClient } from '@/lib/api'

export type NotificationBootstrapResult =
  | 'started'
  | 'permission-denied'
  | 'permission-default'
  | 'push-unavailable'
  | 'unsupported'
  | 'worker-unavailable'

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  await navigator.serviceWorker.register('/sw.js')
  return navigator.serviceWorker.ready
}

function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

function base64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export async function startLiveNotifications(): Promise<NotificationBootstrapResult> {
  const registration = await getServiceWorkerRegistration()
  if (!registration) {
    return 'unsupported'
  }

  if (!canUseNotifications()) {
    return 'unsupported'
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission === 'denied') {
    return 'permission-denied'
  }

  if (permission !== 'granted') {
    return 'permission-default'
  }

  if (!('PushManager' in window) || !registration.pushManager) {
    return 'push-unavailable'
  }

  try {
    const config = await apiClient.getWebPushPublicKey()
    if (!config.enabled || !config.public_key) {
      return 'started'
    }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(config.public_key),
      })
    }

    const json = subscription.toJSON()
    const endpoint = json.endpoint
    const auth = json.keys?.auth
    const p256dh = json.keys?.p256dh

    if (!endpoint || !auth || !p256dh) {
      throw new Error('Invalid push subscription payload')
    }

    await apiClient.registerWebPushSubscription({
      endpoint,
      keys: {
        auth,
        p256dh,
      },
    })

    return 'started'
  } catch (error) {
    console.error('Failed to sync Web Push subscription:', error)
    return 'push-unavailable'
  }
}

export async function stopLiveNotifications(): Promise<void> {
  const registration = await getServiceWorkerRegistration()
  if (!registration?.pushManager) {
    return
  }

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    return
  }

  const endpoint = subscription.endpoint

  try {
    await apiClient.removeWebPushSubscription({ endpoint })
  } catch (error) {
    // Backend may reject when session already expired; local unsubscribe should still proceed.
    console.warn('Failed to remove Web Push subscription on server:', error)
  }

  try {
    await subscription.unsubscribe()
  } catch (error) {
    console.warn('Failed to unsubscribe local Web Push subscription:', error)
  }
}
