/**
 * Service Worker registration utilities.
 * Centralized SW lifecycle — imported by both App.tsx (update detection)
 * and notifications.ts (push subscription).
 */

/**
 * Register the service worker with updateViaCache: 'none' so the browser
 * always fetches the latest sw.js from the server (respecting HTTP cache headers).
 * Returns the registration promise for use by update-detection logic.
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> | null {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  return navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  })
}

/**
 * Get the active SW registration, registering if needed.
 * Used internally by notifications.ts for push subscription management.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  // If already registered, return the ready promise
  const existing = await navigator.serviceWorker.getRegistration('/sw.js')
  if (existing) {
    await existing.update() // force check for updates
    return navigator.serviceWorker.ready
  }

  await navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  })
  return navigator.serviceWorker.ready
}
