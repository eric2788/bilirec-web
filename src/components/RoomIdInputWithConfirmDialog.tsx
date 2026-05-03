import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon, UserIcon } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RoomInfo } from '@/lib/types'

interface RoomIdInputWithConfirmDialogProps {
  triggerLabel: string
  inputDialogTitle: string
  confirmDialogTitle: string
  confirmDialogDescription: string
  confirmLabel: string
  confirmLoadingLabel?: string
  /**
   * Called when user clicks confirm. Should resolve on success (dialog closes),
   * or throw after showing an error toast (dialog stays open).
   */
  onConfirm: (roomInfo: RoomInfo) => Promise<void>
}

export function RoomIdInputWithConfirmDialog({
  triggerLabel,
  inputDialogTitle,
  confirmDialogTitle,
  confirmDialogDescription,
  confirmLabel,
  confirmLoadingLabel = '處理中...',
  onConfirm,
}: RoomIdInputWithConfirmDialogProps) {
  const [roomId, setRoomId] = useState('')
  const [isInputDialogOpen, setIsInputDialogOpen] = useState(false)
  const [isFetchingRoomInfo, setIsFetchingRoomInfo] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmRoomInfo, setConfirmRoomInfo] = useState<RoomInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skipReopenInputDialog, setSkipReopenInputDialog] = useState(false)

  const handlePrepare = async () => {
    const id = parseInt(roomId.trim())
    if (!roomId.trim() || isNaN(id)) {
      toast.error('請輸入有效的房間 ID')
      return
    }

    setIsFetchingRoomInfo(true)
    try {
      const roomInfo = await apiClient.getRoomInfo(id)
      setConfirmRoomInfo(roomInfo)
      setIsInputDialogOpen(false)
      setSkipReopenInputDialog(false)
      setIsConfirmDialogOpen(true)
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('找不到此房間')
      } else if (error.response?.status === 400) {
        toast.error('無效的房間 ID')
      } else {
        toast.error(error.response?.data || '獲取房間資訊失敗')
      }
    } finally {
      setIsFetchingRoomInfo(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmRoomInfo) return
    setIsSubmitting(true)
    try {
      await onConfirm(confirmRoomInfo)
      // success: close confirm dialog and clear state
      setSkipReopenInputDialog(true)
      setIsConfirmDialogOpen(false)
      setConfirmRoomInfo(null)
      setRoomId('')
    } catch {
      // error toast already shown by the caller; keep confirm dialog open
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDialogOpenChange = (open: boolean) => {
    setIsConfirmDialogOpen(open)
    if (!open) {
      setConfirmRoomInfo(null)
      if (!skipReopenInputDialog) {
        setIsInputDialogOpen(true)
      }
      setSkipReopenInputDialog(false)
    }
  }

  return (
    <>
      <Dialog open={isInputDialogOpen} onOpenChange={setIsInputDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <PlusIcon size={20} />
            {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{inputDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="number"
              placeholder="輸入房間 ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePrepare()}
            />
            <Button onClick={handlePrepare} className="w-full" disabled={isFetchingRoomInfo}>
              {isFetchingRoomInfo ? '獲取房間資訊中...' : '下一步'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialogTitle}</DialogTitle>
            <DialogDescription>{confirmDialogDescription}</DialogDescription>
          </DialogHeader>

          {confirmRoomInfo && (
            <div className="space-y-3">
              {confirmRoomInfo.cover ? (
                <div className="overflow-hidden rounded-md bg-muted">
                  <img
                    src={confirmRoomInfo.cover}
                    alt={confirmRoomInfo.uname || `直播間 ${confirmRoomInfo.room_id}`}
                    referrerPolicy="no-referrer"
                    className="h-auto w-full"
                  />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center rounded-md bg-muted">
                  <UserIcon size={24} />
                </div>
              )}

              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">直播間 ID：</span>
                  <span className="font-medium">{confirmRoomInfo.room_id}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">主播名稱：</span>
                  <span className="font-medium">{confirmRoomInfo.uname || '未知主播'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">直播標題：</span>
                  <span className="font-medium">{confirmRoomInfo.title || '無標題'}</span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleConfirmDialogOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || !confirmRoomInfo}
            >
              {isSubmitting ? confirmLoadingLabel : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
