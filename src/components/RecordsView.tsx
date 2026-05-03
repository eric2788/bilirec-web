import { useState, useEffect, useRef } from 'react'
import { RecordCard } from './RecordCard'
import { EmptyState } from './EmptyState'
import { RoomIdInputWithConfirmDialog } from './RoomIdInputWithConfirmDialog'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RecordTask, RoomInfo } from '@/lib/types'
import { LoadingScreen } from './LoadingScreen'
import { usePageVisibility } from '@/hooks/use-visibility'
import { useRole } from '@/lib/role-context'
import useSWR from 'swr'
interface RecordsViewProps {
  onRefresh?: () => void
}

export function RecordsView({ onRefresh }: RecordsViewProps) {
  const { isReadOnly } = useRole()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  const isVisible = usePageVisibility()

  const {
    data: tasks = [],
    error,
    isLoading,
    mutate,
  } = useSWR<RecordTask[]>(
    isVisible ? 'record/tasks' : null,
    async () => {
      const recordTasks = await apiClient.getRecordTasks()
      const roomIds = Array.from(new Set(recordTasks.map((task) => task.roomId)))

      if (roomIds.length === 0) {
        return recordTasks
      }

      const roomInfoMap = await apiClient.getRoomInfos(roomIds)

      return recordTasks.map((task) => ({
        ...task,
        roomInfo: roomInfoMap[String(task.roomId)],
      }))
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: [],
    }
  )

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch tasks:', error)
      toast.error('無法載入錄製任務')
    }
  }, [error])

  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current
    }
  }, [tasks])

  const handleConfirmRecord = async (roomInfo: RoomInfo) => {
    try {
      await apiClient.startRecord({ roomId: roomInfo.room_id })
    } catch (error: any) {
      console.error('Failed to start record:', error)
      toast.error(error.response?.data || '啟動錄製失敗')
      throw error
    }
    toast.success('已開始錄製')
    await mutate()
    onRefresh?.()
  }

  const handleStop = async (roomId: number) => {
    try {
      await apiClient.stopRecord(roomId)
      toast.success('已停止錄製')
      await mutate()
      onRefresh?.()
    } catch (error: any) {
      console.error('Failed to stop record:', error)
      toast.error(error.response?.data || '停止錄製失敗')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">錄製管理</h2>
          {!isReadOnly && (
            <RoomIdInputWithConfirmDialog
              triggerLabel="添加"
              inputDialogTitle="添加錄製任務"
              confirmDialogTitle="確認錄製對象"
              confirmDialogDescription="請確認這是你要錄製的直播間。"
              confirmLabel="確認錄製"
              confirmLoadingLabel="添加中..."
              onConfirm={handleConfirmRecord}
            />
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <LoadingScreen />
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
          <div className="cards-grid grid gap-4">
            {tasks.map((task) => (
              <RecordCard
                key={task.roomId}
                task={task}
                onStop={handleStop}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
