import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import MoreVerticalIcon from 'lucide-react/dist/esm/icons/more-vertical'
import { XIcon, SwapIcon } from '@phosphor-icons/react'
import type { ConvertQueue } from '@/lib/types' 
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface ConvertCardProps {
  task: ConvertQueue
  onCancel?: () => void
}

export function ConvertCard({ task, onCancel }: ConvertCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  const baseInput = task.input_path.split(/[\\\/]/).pop() || task.input_path

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
    <Card className="p-4 convert-card transition-all hover:shadow-lg relative">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
          <SwapIcon size={20} /> 
        </div>
        {/* Mobile: three-dots at top-right */}
        <div className="absolute right-3 top-3 sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="更多操作" className={isCancelling ? 'opacity-50 pointer-events-none' : ''}>
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => { handleCancel(); }} disabled={isCancelling}>
                取消轉換
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0">
              <p className="font-semibold text-lg text-card-foreground wrap-break-word">{baseInput}</p>
              <p className="text-sm text-muted-foreground wrap-break-word sm:truncate">{task.input_path}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
              <Badge variant="outline" className="shrink-0 text-sm sm:order-2 sm:text-xs ring-[0.2px] ring-gray-900 dark:ring-gray-200">{task.input_format.toUpperCase()} → {task.output_format.toUpperCase()}</Badge>
              {task.delete_source && (
                <Badge variant="destructive" className="shrink-0 text-sm sm:order-1 sm:text-xs border border-transparent">轉後刪源</Badge>
              )} 
              {/* Desktop: show cancel button */}
              <div className="hidden sm:inline-flex order-3">
                <Button
                  size="icon"
                  variant="destructive-ghost"
                  className={isCancelling ? 'opacity-50 pointer-events-none' : ''}
                  onClick={handleCancel}
                  disabled={isCancelling}
                  aria-label={`取消轉換 ${task.task_id}`}
                  title="取消"
                >
                  <XIcon size={16} />
                </Button>
              </div>

              {/* mobile menu moved to top-right */}
            </div>
          </div>


        </div>
      </div>
    </Card>
  )
}
