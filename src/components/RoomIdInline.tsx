import { CopySimpleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useTranslation } from 'react-i18next'

interface RoomIdInlineProps {
  roomId: number
  className?: string
}

const triggerClassName = 'h-6 rounded-md border-border/70 bg-muted/40 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground hover:bg-muted/70'

export function RoomIdInline({ roomId, className }: RoomIdInlineProps) {
  const { t } = useTranslation()

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(String(roomId))
      toast.success(t('toast.copyRoomIdSuccess', { roomId }), { position: 'bottom-center' })
    } catch {
      toast.error(t('toast.copyRoomIdFailed'), { position: 'bottom-center' })
    }
  }

  return (
    <HoverCard openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Badge
          variant="outline"
          className={cn(triggerClassName, className)}
          aria-label={t('roomIdInline.showAria', { roomId })}
        >
          ID
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" sideOffset={8} className="w-auto min-w-44 border-zinc-700/80 bg-zinc-950 text-zinc-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{t('roomIdInline.label')}</p>
            <p className="font-mono text-sm text-zinc-100">{roomId}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 gap-1.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            aria-label={t('roomIdInline.copyAria', { roomId })}
            onClick={copyRoomId}
          >
            <CopySimpleIcon size={12} />
            {t('roomIdInline.copy')}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}