import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from '@phosphor-icons/react'

interface LoginViewProps {
  onLoginSuccess: () => void
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [token, setToken] = useState('')
  const [serverUrl, setServerUrl] = useKV('server-url', 'http://localhost:8080')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = serverUrl || 'http://localhost:8080'
    
    if (!url.trim()) {
      toast.error('請輸入伺服器地址')
      return
    }

    if (!token.trim()) {
      toast.error('請輸入 API Token')
      return
    }

    setIsLoading(true)

    try {
      apiClient.setBaseURL(url)
      const isValid = await apiClient.verifyToken({ token })
      
      if (isValid) {
        await window.spark.kv.set('auth-token', token)
        await window.spark.kv.set('server-url', url)
        
        toast.success('連接成功')
        onLoginSuccess()
      } else {
        toast.error('Token 驗證失敗，請檢查 Token 是否正確')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || '連接失敗，請檢查伺服器地址和 Token')
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
            請在伺服器設定檔中配置 API Token，然後在此輸入相同的 Token
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
            <Label htmlFor="token">API Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="輸入 API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? '連接中...' : '連接'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
