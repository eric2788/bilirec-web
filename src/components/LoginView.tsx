import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from '@phosphor-icons/react'

interface LoginViewProps {
  onLoginSuccess: () => void
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [serverUrl, setServerUrl] = useState('http://localhost:8080')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadServerUrl = async () => {
      const saved = await storage.get<string>('server-url')
      if (saved) setServerUrl(saved)
    }
    loadServerUrl()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = serverUrl || 'http://localhost:8080'
    
    if (!url.trim()) {
      toast.error('請輸入伺服器地址')
      return
    }

    if (!username.trim()) {
      toast.error('請輸入用戶名')
      return
    }

    if (!password.trim()) {
      toast.error('請輸入密碼')
      return
    }

    setIsLoading(true)

    try {
      apiClient.setBaseURL(url)
      const result = await apiClient.login({ user: username, pass: password })
      
      if (result?.token) {
        await storage.set('auth-token', result.token)
        await storage.set('server-url', url)
        
        toast.success('登入成功')
        onLoginSuccess()
      } else {
        toast.error('登入失敗，請檢查用戶名和密碼')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || '登入失敗，請檢查伺服器地址和憑證')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 bg-card text-card-foreground">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Bilibili 錄製管理</h1>
          <p className="text-sm text-muted-foreground mt-2">連接到您的錄製伺服器</p>
        </div>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            請輸入您的帳號和密碼以登入錄製伺服器
          </AlertDescription>
        </Alert>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">伺服器地址</Label>
            <Input
              id="server-url"
              type="text"
              placeholder="http://localhost:8080"
              value={serverUrl || ''}
              onChange={(e) => setServerUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">用戶名</Label>
            <Input
              id="username"
              type="text"
              placeholder="輸入用戶名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              placeholder="輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
