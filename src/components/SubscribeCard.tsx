import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlayIcon, UserIcon, TrashIcon } from '@phosphor-icons/react'
import type { RoomInfo } from '@/lib/types'

interface SubscribeCardProps {
  roomInfo: RoomInfo
  isRecording?: boolean
  onUnsubscribe: (roomId: number) => Promise<void>
  onStartRecord: (roomId: number) => Promise<void>
}

export function SubscribeCard({ roomInfo, isRecording = false, onUnsubscribe, onStartRecord }: SubscribeCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUnsubDialogOpen, setIsUnsubDialogOpen] = useState(false)
  const [isStartRecordDialogOpen, setIsStartRecordDialogOpen] = useState(false)

  const confirmUnsubscribe = async () => {
    setIsUnsubDialogOpen(false)
    setIsLoading(true)
    try {
      await onUnsubscribe(roomInfo.room_id)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmStartRecord = async () => {
    setIsStartRecordDialogOpen(false)
    setIsLoading(true)
    try {
      await onStartRecord(roomInfo.room_id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartRecord = () => {
    setIsStartRecordDialogOpen(true)
  }

  const getLiveStatusBadge = () => {
    if (roomInfo.lock_status === 1) {
      return (
        <Badge variant="destructive">
          已封禁
        </Badge>
      )
    }
    if (roomInfo.live_status === 1) {
      return (
        <Badge className="bg-accent text-accent-foreground animate-pulse-glow">
          直播中
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        未開播
      </Badge>
    )
  }

  return (
    <Card className="p-4 transition-all hover:shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            {roomInfo.cover ? (
              <div className="w-full sm:w-40 sm:h-24 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                <img
                  src={roomInfo.cover}
                  alt={roomInfo.title ?? roomInfo.uid.toString()}
                  referrerPolicy="no-referrer"
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full sm:w-40 sm:h-24 shrink-0 bg-muted rounded-md flex items-center justify-center p-4">
                <UserIcon size={20} />
              </div>
            )}

            <div className="flex flex-col flex-1 min-w-0 w-full">
              <div className="flex items-start gap-3 w-full">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-card-foreground truncate">
                    {roomInfo.uname ?? `直播間 ${roomInfo.room_id}`}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {roomInfo.title || '載入中...'}
                  </p>
                </div>

                {/* Desktop: Show online count and status badge */}
                <div className="hidden sm:flex flex-col items-end gap-2 ml-2 shrink-0">
                  {roomInfo.online !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon size={16} />
                      <span className="font-mono" title="在線人數">
                        {roomInfo.online.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {getLiveStatusBadge()}
                  </div>
                </div>
              </div>

              {/* Mobile: online + badge on one row */}
              <div className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground mt-2 w-full justify-between">
                {roomInfo.online !== undefined && (
                  <div className="flex items-center gap-2">
                    <UserIcon size={16} />
                    <span className="font-mono" title="在線人數">
                      {roomInfo.online.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="ml-2 shrink-0">
                  {getLiveStatusBadge()}
                </div>
              </div>

              {roomInfo.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 wrap-break-word break-all whitespace-normal">
                  {roomInfo.description}
                </p>
              )}
            </div>
          </div>

          {/* Mobile viewers handled above in single row */}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
          {roomInfo.live_status === 1 && (
            <>
              <Button
                asChild
                variant="outline"
                className="w-full transition-colors hover:bg-muted/60 dark:hover:bg-accent/80"
              >
                <a
                  href={`https://live.bilibili.com/${roomInfo.room_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  進入直播間
                </a>
              </Button>

              <Button
                onClick={handleStartRecord}
                disabled={isLoading || isRecording}
                className="w-full transition-all hover:shadow-md"
                variant={isRecording ? "secondary" : "default"}
              >
                <PlayIcon size={20} />
                {isRecording ? '錄製中' : '啓動錄製'}
              </Button>
            </>
          )}

          <Button
            onClick={() => setIsUnsubDialogOpen(true)}
            disabled={isLoading}
            variant="destructive"
            className={`w-full transition-all hover:shadow-md ${roomInfo.live_status === 1 ? '' : 'sm:col-span-3'}`}
          >
            <TrashIcon size={18} />
            停止訂閱
          </Button>
        </div>

        <Dialog open={isUnsubDialogOpen} onOpenChange={setIsUnsubDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認取消訂閱</DialogTitle>
              <DialogDescription>
                確定要取消訂閱「{roomInfo.uname ?? `直播間 ${roomInfo.room_id}`}」嗎？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsUnsubDialogOpen(false)} disabled={isLoading}>
                取消
              </Button>
              <Button variant="destructive" onClick={confirmUnsubscribe} disabled={isLoading}>
                {isLoading ? '處理中…' : '確認取消'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isStartRecordDialogOpen} onOpenChange={setIsStartRecordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認啓動錄製</DialogTitle>
              <DialogDescription>
                確定要啓動錄製「{roomInfo.uname ?? `直播間 ${roomInfo.room_id}`}」嗎？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsStartRecordDialogOpen(false)} disabled={isLoading}>
                取消
              </Button>
              <Button onClick={confirmStartRecord} disabled={isLoading}>
                {isLoading ? '處理中…' : '確認啓動'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}
