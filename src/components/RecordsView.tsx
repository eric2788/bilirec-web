import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from '@phosphor-icons/react'
import { RecordCard } from './RecordCard'
import { EmptyState } from './EmptyState'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RecordTask } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface RecordsViewProps {
  onRefresh?: () => void
}

export function RecordsView({ onRefresh }: RecordsViewProps) {
  const [tasks, setTasks] = useState<RecordTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const fetchTasks = async () => {
    try {
      const data = await apiClient.getRecords()
      setTasks(data)
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error)
      toast.error('無法載入錄製任務')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAddRecord = async () => {
    const id = parseInt(roomId.trim())
    
    if (!roomId.trim() || isNaN(id)) {
      toast.error('請輸入有效的房間 ID')
      return
    }

    setIsAdding(true)
    try {
      await apiClient.startRecord({ roomId: id })
      toast.success('已開始錄製')
      setIsDialogOpen(false)
      setRoomId('')
      fetchTasks()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to start record:', error)
      toast.error(error.response?.data?.message || '啟動錄製失敗')
    } finally {
      setIsAdding(false)
    }
  }

  const handleStart = async (roomId: number) => {
    try {
      await apiClient.startRecord({ roomId })
      toast.success('已開始錄製')
      fetchTasks()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to start record:', error)
      toast.error(error.response?.data?.message || '啟動錄製失敗')
    }
  }

  const handleStop = async (roomId: number) => {
    try {
      await apiClient.stopRecord(roomId)
      toast.success('已停止錄製')
      fetchTasks()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to stop record:', error)
      toast.error(error.response?.data?.message || '停止錄製失敗')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">錄製管理</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-5 h-5" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加錄製任務</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  id="room-id"
                  type="number"
                  placeholder="輸入房間 ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRecord()}
                />
                <Button 
                  onClick={handleAddRecord} 
                  className="w-full"
                  disabled={isAdding}
                >
                  {isAdding ? '添加中...' : '開始錄製'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            }
            title="還沒有錄製任務"
            description="點擊右上角的「添加」按鈕開始錄製"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map((task) => (
              <RecordCard
                key={task.roomId}
                task={task}
                onStart={handleStart}
                onStop={handleStop}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
