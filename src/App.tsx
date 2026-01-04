import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { LoginView } from '@/components/LoginView'
import { RecordsView } from '@/components/RecordsView'
import { FilesView } from '@/components/FilesView'
import { BottomNav } from '@/components/BottomNav'
import { LeftSidebar } from '@/components/LeftSidebar'
import { Button } from '@/components/ui/button'
import { SignOutIcon, SunIcon, MoonIcon } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api'
import { storage } from '@/lib/storage'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'records' | 'files'>('records')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const serverUrl = await storage.get<string>('server-url')
        if (serverUrl) {
          apiClient.setBaseURL(serverUrl)
          // Try a harmless authenticated request to verify cookie-based auth
          try {
            await apiClient.getRecordTasks()
            setIsAuthenticated(true)
          } catch (error) {
            setIsAuthenticated(false)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      // Notify server to clear HttpOnly cookie
      await apiClient.logout()
      setIsAuthenticated(false)
      toast.success('已登出')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <Toaster richColors position="top-center" />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none mb-1 text-card-foreground">BiliRec</h1>
              <p className="text-xs text-muted-foreground">Bilibili 直播錄製系統</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 mr-2 text-card-foreground hover:text-primary rounded-md p-1 hover:bg-secondary/10 dark:hover:bg-secondary/10 hover:scale-[1.02]"
              aria-label="切換主題"
              onClick={() => {
                const active = resolvedTheme || theme || 'light'
                setTheme(active === 'dark' ? 'light' : 'dark')
              }}
            >
              {mounted ? ((resolvedTheme || theme) === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />) : <SunIcon size={18} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="shrink-0 text-card-foreground hover:text-destructive rounded-md p-1 hover:bg-secondary/10 dark:hover:bg-secondary/10 hover:scale-[1.02]"
              aria-label="登出"
            >
              <SignOutIcon size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-73px)] overflow-x-hidden flex">
        <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'records' ? (
                <RecordsView />
              ) : (
                <FilesView />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster richColors position="top-center" />
    </div>
  )
}

export default App