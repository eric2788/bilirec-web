import { useState, useEffect, useMemo, useRef } from 'react'
import { BellIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { SubscribeCard } from './SubscribeCard'
import { EmptyState } from './EmptyState'
import { RoomIdInputWithConfirmDialog } from './RoomIdInputWithConfirmDialog'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RecordInfo, RoomInfo } from '@/lib/types'
import { LoadingScreen } from './LoadingScreen'
import { usePageVisibility } from '@/hooks/use-visibility'
import { useScoredSearch } from '@/hooks/use-scored-search'
import { useRole } from '@/lib/role-context'
import { normalizeText } from '@/lib/utils'
import useSWR from 'swr'

interface SubscribesViewProps {
  onRefresh?: () => void
  pinnedRoomId?: number | null
}

export function SubscribesView({ onRefresh, pinnedRoomId }: SubscribesViewProps) {
  const { isReadOnly } = useRole()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  const isVisible = usePageVisibility()

  const {
    data: subscribedRoomIds = [],
    error: subscribedRoomsError,
    isLoading: isSubscribedRoomsLoading,
    mutate: mutateSubscribedRoomIds,
  } = useSWR<number[]>(
    isVisible ? 'subscribe/room-ids' : null,
    () => apiClient.getSubscribedRooms(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: [],
    }
  )

  const roomInfoKey =
    subscribedRoomIds.length > 0 ? `subscribe/details/${subscribedRoomIds.join(',')}` : null

  const {
    data: details = { roomInfos: {}, recordStatuses: [] },
    isLoading: isDetailsLoading,
    mutate: mutateDetails,
  } = useSWR<{ roomInfos: Record<string, RoomInfo>; recordStatuses: RecordInfo[] }>(
    roomInfoKey,
    async () => {
      const [roomInfos, recordStatuses] = await Promise.all([
        apiClient.getRoomInfos(subscribedRoomIds),
        Promise.all(
          subscribedRoomIds.map((id) =>
            apiClient.getRecordStatus(id).catch(() => ({ room_id: id, status: 'idle' as const }))
          )
        )
      ])

      return { roomInfos, recordStatuses }
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: { roomInfos: {}, recordStatuses: [] },
    }
  )

  const recordingRoomIds = useMemo(
    () => new Set(details.recordStatuses.filter((status) => status.status === 'recording').map((status) => status.room_id)),
    [details.recordStatuses]
  )

  const rooms = useMemo(() => {
    return Object.values(details.roomInfos).sort((a, b) => {
      if (pinnedRoomId !== undefined && pinnedRoomId !== null) {
        if (a.room_id === pinnedRoomId) return -1
        if (b.room_id === pinnedRoomId) return 1
      }
      if (a.live_status === 1 && b.live_status !== 1) return -1
      if (a.live_status !== 1 && b.live_status === 1) return 1
      return 0
    })
  }, [details.roomInfos, pinnedRoomId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 200)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const normalizeSearchText = useMemo(
    () => (value: string) => normalizeText(value).toLowerCase(),
    []
  )

  const roomSearchFields = useMemo(
    () => [
      {
        getValue: (room: RoomInfo) => room.room_id,
        exact: 140,
        startsWith: 90,
        includes: 70,
      },
      {
        getValue: (room: RoomInfo) => room.room_id,
        exact: 140,
        startsWith: 120,
        includes: 100,
        when: (normalizedQuery: string) => /^\d+$/.test(normalizedQuery),
      },
      {
        getValue: (room: RoomInfo) => room.uname,
        exact: 130,
        startsWith: 110,
        includes: 90,
      },
      {
        getValue: (room: RoomInfo) => room.title,
        exact: 80,
        startsWith: 80,
        includes: 60,
      },
      {
        getValue: (room: RoomInfo) => room.description,
        exact: 40,
        startsWith: 40,
        includes: 40,
      },
    ],
    []
  )

  const filteredRooms = useScoredSearch<RoomInfo>({
    items: rooms,
    query: searchQuery,
    fields: roomSearchFields,
    normalize: normalizeSearchText,
    minScore: 1,
  })

  const isLoading = isSubscribedRoomsLoading || (subscribedRoomIds.length > 0 && isDetailsLoading)

  useEffect(() => {
    if (subscribedRoomsError) {
      console.error('Failed to fetch subscribed rooms:', subscribedRoomsError)
      toast.error('無法載入訂閱列表')
    }
  }, [subscribedRoomsError])

  useEffect(() => {
    if (!scrollContainerRef.current) return
    if (pinnedRoomId != null) {
      scrollContainerRef.current.scrollTop = 0
    } else if (scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current
    }
  }, [rooms, pinnedRoomId])

  const handleConfirmSubscribe = async (roomInfo: RoomInfo) => {
    try {
      await apiClient.subscribeRoom(roomInfo.room_id)
    } catch (error: any) {
      console.error('Failed to subscribe room:', error)
      if (error.response?.status === 409) {
        toast.error('已訂閱此房間')
      } else if (error.response?.status === 400) {
        toast.error('無效的房間 ID')
      } else {
        toast.error(error.response?.data || '訂閱失敗')
      }
      throw error
    }
    toast.success('已成功訂閱房間')
    await mutateSubscribedRoomIds()
    onRefresh?.()
  }

  const handleUnsubscribe = async (roomId: number) => {
    try {
      await apiClient.unsubscribeRoom(roomId)
      toast.success('已取消訂閱')
      await mutateSubscribedRoomIds()
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
      await mutateDetails()
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
          {!isReadOnly && (
            <RoomIdInputWithConfirmDialog
              triggerLabel="訂閱"
              inputDialogTitle="訂閱直播間"
              confirmDialogTitle="確認訂閱對象"
              confirmDialogDescription="請確認這是你要訂閱的直播間。"
              confirmLabel="確認訂閱"
              confirmLoadingLabel="訂閱中..."
              onConfirm={handleConfirmSubscribe}
            />
          )}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <MagnifyingGlassIcon size={16} />
          </span>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋直播間 ID、主播名稱或標題"
            className="pl-9"
            aria-label="搜尋訂閱直播間"
          />
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
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon={
              <span className="text-muted-foreground">
                <MagnifyingGlassIcon size={40} />
              </span>
            }
            title="找不到符合條件的房間"
            description="請嘗試其他關鍵字"
          />
        ) : (
          <div className="cards-grid grid gap-4 w-full">
            {filteredRooms.map((room) => {
              const isPinned = room.room_id === pinnedRoomId
              return (
                <div
                  key={room.room_id}
                  className={`w-full rounded-lg transition-shadow duration-300 ${
                    isPinned ? 'ring-2 ring-primary shadow-md' : ''
                  }`}
                >
                  <SubscribeCard
                    roomInfo={room}
                    isRecording={recordingRoomIds.has(room.room_id)}
                    onUnsubscribe={handleUnsubscribe}
                    onStartRecord={handleStartRecord}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
