import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api'
import type { RoomConfig, RoomInfo } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface RoomConfigDialogProps {
  roomInfo: RoomInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomConfigDialog({ roomInfo, open, onOpenChange }: RoomConfigDialogProps) {
  const { t } = useTranslation()
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
        toast.error(error.response?.data || t('roomConfig.loadFailed'), { position: 'bottom-center' })
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
  }, [open, onOpenChange, roomInfo.room_id, t])

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

  const handleDurationChange = (value: string) => {
    setRoomConfig((current) => {
      if (!current) return current
      return {
        ...current,
        record_duration_minutes: Number(value),
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
        record_duration_minutes: roomConfig.record_duration_minutes,
      })
      setRoomConfig(updatedConfig)
      onOpenChange(false)
      toast.success(t('roomConfig.updateSuccess'), { position: 'bottom-center' })
    } catch (error: any) {
      console.error('Failed to update room config:', error)
      toast.error(error.response?.data || t('roomConfig.updateFailed'), { position: 'bottom-center' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('roomConfig.title')}</DialogTitle>
          <DialogDescription>
            {t('roomConfig.description', { name: roomInfo.uname ?? t('subscribeCard.roomFallback', { roomId: roomInfo.room_id }) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading || !roomConfig ? (
            <p className="text-sm text-muted-foreground">{t('roomConfig.loading')}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="space-y-1">
                  <Label htmlFor={`auto-record-${roomInfo.room_id}`}>{t('roomConfig.autoRecord')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('roomConfig.autoRecordHint')}
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
                  <Label htmlFor={`notify-${roomInfo.room_id}`}>{t('roomConfig.notify')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('roomConfig.notifyHint')}
                  </p>
                </div>
                <Switch
                  id={`notify-${roomInfo.room_id}`}
                  checked={roomConfig.notify}
                  onCheckedChange={(checked) => handleConfigToggle('notify', checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <div className="space-y-1">
                  <Label>{t('roomConfig.recordDuration')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('roomConfig.recordDurationHint')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={roomConfig.record_duration_minutes === 0 || roomConfig.record_duration_minutes === undefined || roomConfig.record_duration_minutes === null ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none border"
                    onClick={() => handleDurationChange('0')}
                    disabled={isSaving}
                  >
                    {t('roomConfig.recordDurationDefault')}
                  </Button>
                  <Button
                    variant={roomConfig.record_duration_minutes === -1 ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none border"
                    onClick={() => handleDurationChange('-1')}
                    disabled={isSaving}
                  >
                    {t('roomConfig.recordDurationUnlimited')}
                  </Button>
                  {[60, 180, 300, 600].map((n) => (
                    <Button
                      key={n}
                      variant={roomConfig.record_duration_minutes === n ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 sm:flex-none border"
                      onClick={() => handleDurationChange(String(n))}
                      disabled={isSaving}
                    >
                      {t('roomConfig.recordDurationHours', { n: n / 60 })}
                    </Button>
                  ))}
                </div>
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
            {t('roomConfig.cancel')}
          </Button>
          <Button
            onClick={handleSaveConfig}
            disabled={isLoading || isSaving || !roomConfig}
          >
            {isSaving ? t('roomConfig.saving') : t('roomConfig.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
