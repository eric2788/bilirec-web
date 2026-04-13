import { useMemo, useState } from 'react'
import type { DiskUsage } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HardDrivesIcon } from '@phosphor-icons/react'

interface DiskUsageDisplayProps {
  diskUsage: DiskUsage | null
  compact?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function DiskUsageDisplay({ diskUsage, compact = false }: DiskUsageDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)

  const usagePercent = useMemo(() => {
    if (!diskUsage || diskUsage.total === 0) return 0
    return Math.round((diskUsage.used / diskUsage.total) * 100)
  }, [diskUsage])

  const getColorClass = (percent: number) => {
    if (percent >= 90) return 'bg-destructive'
    if (percent >= 75) return 'bg-yellow-500'
    return 'bg-primary'
  }

  if (!diskUsage) {
    return null
  }

  const usedFormatted = formatBytes(diskUsage.used)
  const totalFormatted = formatBytes(diskUsage.total)
  const freeFormatted = formatBytes(diskUsage.free)

  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex lg:hidden items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer active:scale-95"
        >
          <HardDrivesIcon size={16} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {usagePercent}%
          </span>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="w-[90vw] max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardDrivesIcon size={20} className="text-muted-foreground" />
                磁碟空間
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">使用率</span>
                  <span className="text-sm font-semibold text-primary">{usagePercent}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getColorClass(usagePercent)} transition-all duration-300`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">已用</p>
                  <p className="font-semibold">{usedFormatted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">可用</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{freeFormatted}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">總計</p>
                <p className="font-semibold">{totalFormatted}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <HardDrivesIcon size={16} className="text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground">
                {usagePercent}% ({usedFormatted} / {totalFormatted})
              </span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${getColorClass(usagePercent)} transition-all duration-300`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p>已用: {usedFormatted}</p>
            <p>可用: {freeFormatted}</p>
            <p>總計: {totalFormatted}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
