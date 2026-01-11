import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileArrowDownIcon, TrashSimpleIcon } from '@phosphor-icons/react'
import type { ConvertQueue } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface ConvertCardProps {
  task: ConvertQueue
  onCancel?: () => void
}

export function ConvertCard({ task, onCancel }: ConvertCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    const ok = window.confirm(`確定要取消轉換任務 ${task.task_id} 嗎？`)
    if (!ok) return

    setIsCancelling(true)
    try {
      await apiClient.deleteConvertTask(task.task_id)
      toast.success('已取消轉換任務')
      onCancel?.()
    } catch (error: any) {
      console.error('Failed to cancel convert task:', error)
      toast.error(error.response?.data || '取消轉換任務失敗')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card className="p-4 convert-card transition-all hover:shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
          <FileArrowDownIcon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground truncate">{task.task_id}</p>
              <p className="text-sm text-muted-foreground truncate">{task.input_path} → {task.output_path}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{task.input_format.toUpperCase()} → {task.output_format.toUpperCase()}</Badge>
              {task.delete_source && (
                <Badge variant="destructive">刪除來源</Badge>
              )}

              <Button
                size="icon"
                variant="destructive-ghost"
                className={isCancelling ? 'opacity-50 pointer-events-none' : ''}
                onClick={handleCancel}
                disabled={isCancelling}
                aria-label={`取消轉換 ${task.task_id}`}
                title="取消"
              >
                <TrashSimpleIcon size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground break-all">
            <div>輸入: <span className="font-mono">{task.input_path}</span></div>
            <div>輸出: <span className="font-mono">{task.output_path}</span></div>
          </div>
        </div>
      </div>
    </Card>
  )
}
