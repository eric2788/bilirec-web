import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Play, Stop, User, Clock, Database } from '@phosphor-icons/react'
import { formatFileSize, formatDuration, cn } from '@/lib/utils'
import type { RecordTask } from '@/lib/types'

interface RecordCardProps {
  task: RecordTask
  onStart: (roomId: number) => void
  onStop: (roomId: number) => void
}

export function RecordCard({ task, onStart, onStop }: RecordCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    setIsLoading(true)
    try {
      if (task.status === 'recording') {
        await onStop(task.roomId)
      } else {
        await onStart(task.roomId)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (task.status) {
      case 'recording':
        return (
          <Badge className="bg-accent text-accent-foreground animate-pulse-glow">
            錄製中
          </Badge>
        )
      case 'idle':
        return (
          <Badge variant="secondary">
            空閒
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            錯誤
          </Badge>
        )
    }
  }

  return (
    <Card className="p-4 bg-card text-card-foreground transition-all hover:shadow-lg active:scale-[0.98]">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {task.roomInfo?.face && (
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={task.roomInfo.face} alt={task.roomInfo.uname} />
                <AvatarFallback>
                  <User weight="fill" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground truncate">
                {task.roomInfo?.uname || `房間 ${task.roomId}`}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {task.roomInfo?.title || '載入中...'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {task.status === 'recording' && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {task.recordedTime !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="font-mono">{formatDuration(task.recordedTime)}</span>
              </div>
            )}
            {task.fileSize !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="w-4 h-4 shrink-0" />
                <span className="font-mono">{formatFileSize(task.fileSize)}</span>
              </div>
            )}
          </div>
        )}

        {task.status === 'error' && task.error && (
          <p className="text-sm text-destructive">
            {task.error}
          </p>
        )}

        <Button
          onClick={handleAction}
          disabled={isLoading}
          className={cn(
            'w-full',
            task.status === 'recording' ? 'bg-destructive hover:bg-destructive/90' : ''
          )}
        >
          {task.status === 'recording' ? (
            <>
              <Stop className="w-5 h-5" />
              停止錄製
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              開始錄製
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
