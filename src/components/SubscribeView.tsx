import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusIcon, BellIcon } from '@phosphor-icons/react'
import { SubscribeCard } from './SubscribeCard'
import { EmptyState } from './EmptyState'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RoomInfo } from '@/lib/types'
import { LoadingScreen } from './LoadingScreen'
import { usePageVisibility } from '@/hooks/use-visibility'

interface SubscribeViewProps {
  onRefresh?: () => void
}

export function SubscribeView({ onRefresh }: SubscribeViewProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [recordingRoomIds, setRecordingRoomIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  const isVisible = usePageVisibility()

  const fetchRooms = useCallback(async (isInitial = false) => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer && !isInitial) {
      scrollPositionRef.current = scrollContainer.scrollTop
    }
    
    if (isInitial) {
      setIsLoading(true)
    }
    
    try {
      const roomIds = await apiClient.getSubscribedRooms()
      const validRoomIds = roomIds ?? []
      
      if (validRoomIds.length === 0) {
        setRooms([])
        setRecordingRoomIds(new Set())
      } else {
        // Fetch room info and recording status in parallel
        const [roomInfos, recordStatuses] = await Promise.all([
          apiClient.getRoomInfos(validRoomIds),
          Promise.all(validRoomIds.map(id => 
            apiClient.getRecordStatus(id).catch(() => ({ room_id: id, status: 'idle' as const }))
          ))
        ])
        
        // Build set of rooms that are currently recording
        const recordingIds = new Set(
          recordStatuses
            .filter(status => status.status === 'recording')
            .map(status => status.room_id)
        )
        
        setRecordingRoomIds(recordingIds)
        setRooms(Array.isArray(roomInfos) ? roomInfos : [])
      }
    } catch (error: any) {
      console.error('Failed to fetch subscribed rooms:', error)
      toast.error('無法載入訂閱列表')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    fetchRooms(true)
    const interval = setInterval(() => fetchRooms(false), 5000)
    return () => clearInterval(interval)
  }, [isVisible, fetchRooms])

  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current
    }
  }, [rooms])

  const handleSubscribe = async () => {
    const id = parseInt(roomId.trim())

    if (!roomId.trim() || isNaN(id)) {
      toast.error('請輸入有效的房間 ID')
      return
    }

    setIsAdding(true)
    try {
      await apiClient.subscribeRoom(id)
      toast.success('已成功訂閱房間')
      setIsDialogOpen(false)
      setRoomId('')
      fetchRooms()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to subscribe room:', error)
      if (error.response?.status === 409) {
        toast.error('已訂閱此房間')
      } else if (error.response?.status === 400) {
        toast.error('無效的房間 ID')
      } else {
        toast.error(error.response?.data || '訂閱失敗')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleUnsubscribe = async (roomId: number) => {
    try {
      await apiClient.unsubscribeRoom(roomId)
      toast.success('已取消訂閱')
      fetchRooms()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to unsubscribe room:', error)
      if (error.response?.status === 404) {
        toast.error('未訂閱此房間')
      } else {
        toast.error(error.response?.data || '取消訂閱失敗')
      }
    }
  }

  const handleStartRecord = async (roomId: number) => {
    try {
      await apiClient.startRecord({ roomId })
      setRecordingRoomIds(prev => new Set([...prev, roomId]))
      toast.success('已開始錄製')
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to start record:', error)
      toast.error(error.response?.data || '啟動錄製失敗')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">訂閱管理</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon size={20} />
                訂閱
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>訂閱直播間</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  id="room-id"
                  type="number"
                  placeholder="輸入房間 ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                />
                <Button
                  onClick={handleSubscribe}
                  className="w-full"
                  disabled={isAdding}
                >
                  {isAdding ? '訂閱中...' : '訂閱房間'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <LoadingScreen />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={
              <span className="text-muted-foreground">
                <BellIcon size={40} />
              </span>
            }
            title="還沒有訂閱任何房間"
            description="點擊右上角的「訂閱」按鈕開始訂閱直播間"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 w-full">
            {rooms.map((room) => (
              <div key={room.room_id} className="w-full">
                <SubscribeCard
                  roomInfo={room}
                  isRecording={recordingRoomIds.has(room.room_id)}
                  onUnsubscribe={handleUnsubscribe}
                  onStartRecord={handleStartRecord}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
