import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlayIcon, StopIcon, UserIcon, ClockIcon, DatabaseIcon } from '@phosphor-icons/react'
import { formatFileSize, formatDuration, cn } from '@/lib/utils'
import type { RecordTask } from '@/lib/types'

interface RecordCardProps {
  task: RecordTask
  onStop: (roomId: number) => void
}

export function RecordCard({ task, onStop }: RecordCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false)

  const confirmStop = async () => {
    setIsStopDialogOpen(false)
    setIsLoading(true)
    try {
      if (task.status === 'recording') {
        onStop(task.roomId)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = () => {
    setIsStopDialogOpen(true)
  }

  const getStatusBadge = () => {
    switch (task.status) {
      case 'recording':
        return (
          <Badge className="bg-accent text-accent-foreground animate-pulse-glow">
            錄製中
          </Badge>
        )
      case 'recovering':
        return (
          <Badge variant="outline" className="border-accent text-accent">
            恢復中
          </Badge>
        )
      case 'idle':
        return (
          <Badge variant="secondary">
            空閒
          </Badge>
        )
    }
  }

  return (
    <Card className="p-4 record-card transition-all hover:shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            {task.roomInfo?.cover ? (
              <div className="w-full sm:w-40 sm:h-24 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                <img
                  src={task.roomInfo.cover}
                  alt={task.roomInfo.title ?? task.roomInfo.uid.toString()}
                  referrerPolicy="no-referrer"
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full sm:w-40 sm:h-24 shrink-0 bg-muted rounded-md flex items-center justify-center p-4">
                <UserIcon size={20} />
              </div>
            )}

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-card-foreground record-title truncate">
                    { task.roomInfo?.uname ?? `直播間 ${task.roomInfo?.room_id}`}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {task.roomInfo?.title || '載入中...'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 ml-2 shrink-0">
                  {task.roomInfo?.online !== undefined && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon size={16} />
                      <span className="font-mono" title="在線人數">{(task.roomInfo.online ?? 0).toLocaleString()}</span>
                    </div>
                  )}

                  {/* status badge placed here to avoid covering the cover image (hidden on mobile) */}
                  <div className="hidden sm:block">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>

              {task.roomInfo?.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 wrap-break-word break-all whitespace-normal">
                  {task.roomInfo.description}
                </p>
              )}
            </div>
          </div>

          {/* viewers shown below on mobile */}
          {task.roomInfo?.online !== undefined && (
            <div className="mt-2 sm:hidden flex items-center gap-2 text-sm text-muted-foreground justify-between w-full">
              <div className="flex items-center gap-2">
                <UserIcon size={16} />
                <span className="font-mono" title="在線人數">{(task.roomInfo.online ?? 0).toLocaleString()}</span>
              </div>

              {/* show badge on mobile row too (aligned right) */}
              <div className="ml-2 shrink-0">
                {getStatusBadge()}
              </div>
            </div>
          )}
        </div>

        {task.status === 'recording' && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {task.recordedTime !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground" title="預計錄製時間">
                <ClockIcon size={16} />
                <span className="font-mono">{formatDuration(task.recordedTime)}</span>
              </div>
            )}
            {task.fileSize !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground" title="預計錄製檔案大小">
                <DatabaseIcon size={16} />
                <span className="font-mono">{formatFileSize(task.fileSize)}</span>
              </div>
            )}
          </div>
        )}

        {task.error && (
          <p className="text-sm text-destructive">
            {task.error}
          </p>
        )}

        {task.status === 'recording' ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-1/2 transition-colors hover:bg-muted/60 dark:hover:bg-accent/80"
            >
              <a
                href={`https://live.bilibili.com/${task.roomInfo?.room_id ?? task.roomId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                進入直播間
              </a>
            </Button>

            <Button
              onClick={handleStop}
              disabled={isLoading}
              variant="destructive"
              className="w-full sm:w-1/2 transition-all hover:bg-destructive/90 hover:shadow-md hover:ring-1 hover:ring-destructive/30"
            >
              <StopIcon size={20} />
              停止錄製
            </Button>
          </div>
        ) : null}

        <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認停止錄製</DialogTitle>
              <DialogDescription>
                確定要停止錄製「{task.roomInfo?.uname ?? `直播間 ${task.roomInfo?.room_id ?? task.roomId}`}」嗎？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsStopDialogOpen(false)} disabled={isLoading}>
                取消
              </Button>
              <Button variant="destructive" onClick={confirmStop} disabled={isLoading}>
                {isLoading ? '處理中…' : '確認停止'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}
