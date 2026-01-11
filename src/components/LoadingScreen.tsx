export function LoadingScreen({ full = false, size = 16 }: { full?: boolean; size?: number }) {
  const sizeClass = size === 16 ? 'w-16 h-16' : `${size} ${size}`

  if (full) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className={`inline-flex items-center justify-center ${sizeClass} bg-primary/10 rounded-full`}>
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full py-6">
      <div className="animate-pulse">
        <div className={`inline-flex items-center justify-center ${sizeClass} bg-primary/10 rounded-full`}>
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  )
}
