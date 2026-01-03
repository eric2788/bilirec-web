import { useState, useEffect } from 'react'
import { LoginView } from '@/components/LoginView'
import { RecordsView } from '@/components/RecordsView'
import { FilesView } from '@/components/FilesView'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { SignOut } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'records' | 'files'>('records')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await window.spark.kv.get<string>('auth-token')
        const serverUrl = await window.spark.kv.get<string>('server-url')
        
        if (token && serverUrl) {
          apiClient.setBaseURL(serverUrl)
          apiClient.setToken(token)
          setIsAuthenticated(true)
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
      await window.spark.kv.delete('auth-token')
      apiClient.clearAuth()
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
    <div className="min-h-screen bg-background">
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
              <h1 className="font-bold text-lg leading-none mb-1">錄製管理</h1>
              <p className="text-xs text-muted-foreground">Bilibili Recording</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="shrink-0"
          >
            <SignOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-73px)]">
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster richColors position="top-center" />
    </div>
  )
}

export default App