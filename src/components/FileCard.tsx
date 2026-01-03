import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadSimpleIcon, FileVideoIcon, FolderIcon } from '@phosphor-icons/react'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import type { RecordFile } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface FileCardProps {
  file: RecordFile
  onNavigate?: (fileName: string) => void
  currentPath?: string
}

export function FileCard({ file, onNavigate, currentPath = '' }: FileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (file.isDir) {
      const path = currentPath ? `${currentPath}/${file.name}` : file.name
      onNavigate?.(path)
      return
    }

    setIsDownloading(true)
    try {
      const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name
      const blob = await apiClient.downloadFile(fullPath)
      const href = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = file.name.split('/').pop() || file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(href)
    } catch (error: any) {
      console.error('Download failed:', error)
      toast.error('下載失敗')
    } finally {
      setIsDownloading(false)
    }
  }

  if (file.isDir) {
    return (
      <Card 
        className="p-4 bg-card text-card-foreground transition-all hover:shadow-lg cursor-pointer active:scale-[0.98]"
        onClick={() => onNavigate?.(file.name)}
      >
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
            <FolderIcon weight="fill" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">資料夾</p>
          </div>
        </div>
      </Card>
    )
  }

  const isVideo = file.name.endsWith('.flv') || file.name.endsWith('.mp4')

  return (
    <Card className="p-4 bg-card text-card-foreground transition-all hover:shadow-lg">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
          <FileVideoIcon weight="fill" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground wrap-break-word">
                {file.name}
              </p>
            </div>
            {isVideo && (
              <Badge variant="outline" className="shrink-0">
                {file.name.split('.').pop()?.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="font-mono">{formatFileSize(file.size)}</span>
            <span>{formatDateTime(new Date(file.time).toISOString())}</span>
          </div>

          <Button 
            size="sm" 
            className="w-full"
            disabled={isDownloading}
            onClick={handleDownload}
          >
            <DownloadSimpleIcon size={16} />
            下載
          </Button>
        </div>
      </div>
    </Card>
  )
}
