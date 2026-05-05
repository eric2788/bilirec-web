import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVerticalIcon } from 'lucide-react'
import { XIcon, SwapIcon } from '@phosphor-icons/react'
import type { ConvertQueue } from '@/lib/types' 
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useRole } from '@/lib/role-context'
import { formatFileSize } from "@/lib/utils";
import { useTranslation } from 'react-i18next'

interface ConvertCardProps {
  task: ConvertQueue
  onCancel?: () => void
}

export function ConvertCard({ task, onCancel }: ConvertCardProps) {
  const { t } = useTranslation()
  const { isReadOnly } = useRole()
  const [isCancelling, setIsCancelling] = useState(false)

  const baseInput = task.input_path.split(/[\\\/]/).pop() || task.input_path

  const handleCancel = async () => {
    const ok = window.confirm(t('convertCard.cancelConfirm', { taskId: task.task_id }))
    if (!ok) return

    setIsCancelling(true)
    try {
      await apiClient.deleteConvertTask(task.task_id)
      toast.success(t('convertCard.cancelSuccess'))
      onCancel?.()
    } catch (error: any) {
      console.error('Failed to cancel convert task:', error)
      toast.error(error.response?.data || t('convertCard.cancelFailed'))
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
        {!isReadOnly && (
        <div className="absolute right-3 top-3 sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={t('convertCard.moreActions')} className={isCancelling ? 'opacity-50 pointer-events-none' : ''}>
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => { handleCancel(); }} disabled={isCancelling}>
                {t('convertCard.cancelConvert')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0">
              <p className="font-semibold text-lg text-card-foreground wrap-break-word">{baseInput}</p>
              <p className="text-sm text-muted-foreground wrap-break-word sm:truncate">{task.input_path}</p>
            </div>
            <div className="flex flex-row items-center gap-2 flex-wrap mt-2 sm:mt-0">
              {task.input_file_size !== undefined && (
                <Badge variant="text" className="shrink-0 w-full sm:w-auto text-sm sm:text-xs justify-start">{formatFileSize(task.input_file_size)}</Badge>
              )}
              {task.provider && (
                <Badge variant="secondary" className="shrink-0 text-sm sm:text-xs">{task.provider === 'cloudconvert' ? 'CloudConvert' : 'FFmpeg'}</Badge>
              )}
              {task.delete_source && (
                <Badge variant="destructive" className="shrink-0 text-sm sm:text-xs border border-transparent">{t('convertCard.deleteAfterConvert')}</Badge>
              )} 
              <Badge variant="outline" className="shrink-0 text-sm sm:text-xs ring-[0.2px] ring-gray-900 dark:ring-gray-200">{task.input_format.toUpperCase()} → {task.output_format.toUpperCase()}</Badge>
              {/* Desktop: show cancel button */}
              {!isReadOnly && (
              <div className="hidden sm:inline-flex">
                <Button
                  size="icon"
                  variant="destructive-ghost"
                  className={isCancelling ? 'opacity-50 pointer-events-none' : ''}
                  onClick={handleCancel}
                  disabled={isCancelling}
                  aria-label={t('convertCard.cancelAria', { taskId: task.task_id })}
                  title={t('convertCard.cancelTitle')}
                >
                  <XIcon size={16} />
                </Button>
              </div>
              )}

              {/* mobile menu moved to top-right */}
            </div>
          </div>


        </div>
      </div>
    </Card>
  )
}
