import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api'
import type { RoomConfig, RoomInfo } from '@/lib/types'
import { toast } from 'sonner'

interface RoomConfigDialogProps {
  roomInfo: RoomInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomConfigDialog({ roomInfo, open, onOpenChange }: RoomConfigDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let isMounted = true

    const loadRoomConfig = async () => {
      setIsLoading(true)
      try {
        const config = await apiClient.getRoomConfig(roomInfo.room_id)
        if (isMounted) {
          setRoomConfig(config)
        }
      } catch (error: any) {
        console.error('Failed to load room config:', error)
        toast.error(error.response?.data || '載入房間配置失敗', { position: 'bottom-center' })
        if (isMounted) {
          onOpenChange(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRoomConfig()

    return () => {
      isMounted = false
    }
  }, [open, onOpenChange, roomInfo.room_id])

  const handleConfigToggle = (key: 'auto_record' | 'notify', checked: boolean) => {
    setRoomConfig((current) => {
      if (!current) {
        return {
          room_id: roomInfo.room_id,
          auto_record: key === 'auto_record' ? checked : false,
          notify: key === 'notify' ? checked : false,
        }
      }

      return {
        ...current,
        [key]: checked,
      }
    })
  }

  const handleSaveConfig = async () => {
    if (!roomConfig) {
      return
    }

    setIsSaving(true)
    try {
      const updatedConfig = await apiClient.updateRoomConfig(roomInfo.room_id, {
        auto_record: roomConfig.auto_record,
        notify: roomConfig.notify,
      })
      setRoomConfig(updatedConfig)
      onOpenChange(false)
      toast.success('房間配置已更新', { position: 'bottom-center' })
    } catch (error: any) {
      console.error('Failed to update room config:', error)
      toast.error(error.response?.data || '更新房間配置失敗', { position: 'bottom-center' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>房間配置</DialogTitle>
          <DialogDescription>
            管理「{roomInfo.uname ?? `直播間 ${roomInfo.room_id}`}」的自動錄製與開播通知設定。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading || !roomConfig ? (
            <p className="text-sm text-muted-foreground">載入配置中...</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="space-y-1">
                  <Label htmlFor={`auto-record-${roomInfo.room_id}`}>自動錄製</Label>
                  <p className="text-sm text-muted-foreground">
                    開播後自動啓動錄製。
                  </p>
                </div>
                <Switch
                  id={`auto-record-${roomInfo.room_id}`}
                  checked={roomConfig.auto_record}
                  onCheckedChange={(checked) => handleConfigToggle('auto_record', checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="space-y-1">
                  <Label htmlFor={`notify-${roomInfo.room_id}`}>開播通知</Label>
                  <p className="text-sm text-muted-foreground">
                    收到直播檢測或自動錄製啓動通知。
                  </p>
                </div>
                <Switch
                  id={`notify-${roomInfo.room_id}`}
                  checked={roomConfig.notify}
                  onCheckedChange={(checked) => handleConfigToggle('notify', checked)}
                  disabled={isSaving}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || isSaving}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveConfig}
            disabled={isLoading || isSaving || !roomConfig}
          >
            {isSaving ? '儲存中…' : '儲存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
