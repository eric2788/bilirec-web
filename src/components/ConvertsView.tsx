import { useState, useEffect, useRef } from 'react'
import { ConvertCard } from './ConvertCard'
import { EmptyState } from './EmptyState'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { ConvertQueue } from '@/lib/types'
import { LoadingScreen } from './LoadingScreen'
import { SwapIcon } from '@phosphor-icons/react'
export function ConvertsView() {
  const [tasks, setTasks] = useState<ConvertQueue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  const fetchTasks = async (isInitial = false) => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer && !isInitial) {
      scrollPositionRef.current = scrollContainer.scrollTop
    }
    
    if (isInitial) {
      setIsLoading(true)
    }
    
    try {
      const data = await apiClient.getConvertTasks()
      setTasks(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Failed to fetch convert tasks:', error)
      toast.error('無法載入轉換任務')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(true)
    const interval = setInterval(() => fetchTasks(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current
    }
  }, [tasks])

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">轉換任務</h2>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <LoadingScreen />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={(
              <span className="text-muted-foreground">
                <SwapIcon size={40} />
              </span>
            )}
            title="沒有正在轉換的任務"
            description="當有轉換任務執行時，會在此處顯示"
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <ConvertCard key={t.task_id} task={t} onCancel={fetchTasks} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
