export type DownloadOptions = {
  suggestedName?: string
  onProgress?: (loaded: number, total?: number) => void
  signal?: AbortSignal
}

/**
 * Download a URL to disk using a prioritized fallback:
 *  1. showSaveFilePicker (File System Access API) — best
 *  2. StreamSaver (streaming via service worker) — cross-browser streaming fallback
 *  3. Anchor `<a download>` — last resort (browser handles download)
 */
export async function downloadUrlToDisk(url: string, options: DownloadOptions = {}): Promise<void> {
  const { suggestedName, onProgress, signal } = options
  const filename = suggestedName ?? (() => {
    try { return new URL(url, window.location.href).pathname.split('/').pop() || 'download' } catch { return 'download' }
  })()

  // 1) Try File System Access API
  if (typeof window.showSaveFilePicker === 'function') {
    const handle = await window.showSaveFilePicker({ suggestedName: filename })
    const writable = await handle.createWritable()

    const res = await fetch(url, { credentials: 'include', signal })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(errText || `HTTP ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('Readable stream not supported by the environment')

    let received = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          // write chunk directly
          // `writable.write` accepts the chunk in modern browsers
          await writable.write(value)
          received += value.length
          try { onProgress?.(received, Number(res.headers.get('content-length')) || undefined) } catch (e) { /* ignore callback errors */ }
        }
      }
      await writable.close()
      return
    } catch (e) {
      // attempt to abort/close on error
      try { 
        await writable.abort?.() 
        await (handle as any).remove?.()
      } catch (er) {
        console.warn(er)
      }
      throw e
    }
  }

  // 2) Try StreamSaver (dynamic import) — works well on browsers without FS API
  let streamSaver: any = null
  try {
    const mod = await import('streamsaver')
    streamSaver = (mod && (mod as any).default) || mod
  } catch (e) {
    streamSaver = null
  }

  // Only use StreamSaver if the environment is secure (service workers require HTTPS or localhost)
  const isSecureForSW = (window.isSecureContext === true) || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  if (!(streamSaver && streamSaver.supported && isSecureForSW)) {
    // StreamSaver not usable; skip to anchor fallback
    // (Note: attempts to use StreamSaver in insecure contexts would fail due to SW restrictions)
  } else {
    // ensure service worker is registered (mitm) — ignore errors
    try {
      if (navigator.serviceWorker && 'register' in navigator.serviceWorker) {
        // register the bundled service worker placed at /streamsaver-sw.js
        // registration is idempotent and quick when the SW already exists
        await navigator.serviceWorker.register('/streamsaver-sw.js')
      }
    } catch (e) {
      // registration may fail (insecure context etc.), fall back to anchor below
      console.warn('StreamSaver service worker registration failed, falling back to anchor download:', e)
      streamSaver = null
    }

    if (streamSaver) {
      // point streamSaver to the service worker path
      try { streamSaver.mitm = '/streamsaver-sw.js' } catch (e) { /* ignore */ }

      const res = await fetch(url, { credentials: 'include', signal })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const total = Number(res.headers.get('content-length')) || undefined

      // create a write stream and manually write chunks so we can report progress
      const fileStream = streamSaver.createWriteStream(filename, { size: total })
      const writer = (fileStream as any).getWriter()
      const reader = res.body?.getReader()
      if (!reader) throw new Error('Readable stream not supported by the environment')

      let received = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            await writer.write(value)
            received += value.length
            try { onProgress?.(received, total) } catch (e) { /* ignore */ }
          }
        }
        await writer.close()
        return
      } catch (e) {
        try { await writer.abort?.() } catch (_) {}
        throw e
      }
    }
  }

  // 3) Last resort: let browser handle the download via anchor
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  a.download = filename || ''
  document.body.appendChild(a)
  a.click()
  a.remove()
  return
}
