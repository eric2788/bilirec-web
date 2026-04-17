import { CopySimpleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface RoomIdInlineProps {
  roomId: number
  className?: string
}

const triggerClassName = 'h-6 rounded-md border-border/70 bg-muted/40 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground hover:bg-muted/70'

export function RoomIdInline({ roomId, className }: RoomIdInlineProps) {
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(String(roomId))
      toast.success(`已複製 直播間 ID: ${roomId}`, { position: 'bottom-center' })
    } catch {
      toast.error('複製 直播間 ID 失敗', { position: 'bottom-center' })
    }
  }

  return (
    <HoverCard openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Badge
          variant="outline"
          className={cn(triggerClassName, className)}
          aria-label={`顯示 直播間 ID ${roomId}`}
        >
          ID
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" sideOffset={8} className="w-auto min-w-44 border-zinc-700/80 bg-zinc-950 text-zinc-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">直播間 ID</p>
            <p className="font-mono text-sm text-zinc-100">{roomId}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 gap-1.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            aria-label={`複製 直播間 ID ${roomId}`}
            onClick={copyRoomId}
          >
            <CopySimpleIcon size={12} />
            複製
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}