import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DownloadSimple, User, Clock, Database, FileVideo, CaretDown } from '@phosphor-icons/react'
import { formatFileSize, formatDuration, formatDateTime } from '@/lib/utils'
import type { RecordFile } from '@/lib/types'
import { apiClient } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileCardProps {
  file: RecordFile
}

export function FileCard({ file }: FileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = (format: 'flv' | 'mp4') => {
    setIsDownloading(true)
    const url = apiClient.getDownloadUrl(file.id, format)
    window.open(url, '_blank')
    setTimeout(() => setIsDownloading(false), 1000)
  }

  return (
    <Card className="p-4 bg-card text-card-foreground transition-all hover:shadow-lg">
      <div className="flex gap-3">
        <div className="shrink-0">
          {file.room_info?.face ? (
            <Avatar className="w-14 h-14">
              <AvatarImage src={file.room_info.face} alt={file.room_info.uname} />
              <AvatarFallback>
                <User weight="fill" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <FileVideo className="w-7 h-7 text-secondary-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground truncate">
                {file.room_info?.uname || `房間 ${file.room_id}`}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {file.room_info?.title || file.filename}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {file.format.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">{formatDuration(file.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">{formatFileSize(file.file_size)}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            {formatDateTime(file.created_at)}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className="w-full"
                disabled={isDownloading}
              >
                <DownloadSimple className="w-4 h-4" />
                下載
                <CaretDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('flv')}>
                下載 FLV 格式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('mp4')}>
                下載 MP4 格式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
