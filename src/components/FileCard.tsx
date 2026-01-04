import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadSimpleIcon, FileVideoIcon, FolderIcon, TrashSimpleIcon } from '@phosphor-icons/react'
import { formatFileSize } from '@/lib/utils'
import type { RecordFile } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '../lib/utils';

interface FileCardProps {
  file: RecordFile
  onNavigate?: (fileName: string) => void
  onDelete?: () => void
  currentPath?: string
}

export function FileCard({ file, onNavigate, onDelete, currentPath = '' }: FileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Normalize incoming file shape and guard against missing data
  const name = typeof file.name === 'string' ? file.name : '未命名'
  const isDir = 'is_dir' in file ? !!(file as any).is_dir : !!(file as any).isDir
  const sizeVal = typeof file.size === 'number' ? file.size : Number((file as any).size) || 0

  const isRecording = 'is_recording' in file ? !!(file as any).is_recording : false

  const fullPath = currentPath ? `${currentPath}/${name}` : name

  const handleDelete = async (directory = false) => {
    const confirmed = window.confirm(
      directory ? `確定要刪除資料夾 "${name}" 及其內容嗎？此操作無法復原。` : `確定要刪除檔案 "${name}" 嗎？此操作無法復原。`
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      if (directory) {
        await apiClient.deleteDir(fullPath)
      } else {
        await apiClient.deleteFiles([fullPath])
      }
      toast.success('刪除成功')
      onDelete?.()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error('刪除失敗' + (error.response?.data ? `: ${error.response.data}` : ''))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (isDir) {
      const path = currentPath ? `${currentPath}/${name}` : name
      onNavigate?.(path)
      return
    }

    if (isRecording) {
      toast.error('檔案正在錄製中，無法下載')
      return
    }

    setIsDownloading(true)
    try {
      const fullPath = currentPath ? `${currentPath}/${name}` : name
      const blob = await apiClient.downloadFile(fullPath)
      const href = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = name.split('/').pop() || name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(href)
    } catch (error: any) {
      console.error('Download failed:', error)
      toast.error('下載失敗' + (error.response?.data ? `: ${error.response.data}` : ''))
    } finally {
      setIsDownloading(false)
    }
  }

  if (isDir) {
    return (
      <Card
        className="p-4 file-card transition-all hover:shadow-lg cursor-pointer active:scale-[0.98]"
        onClick={() => onNavigate?.(currentPath ? `${currentPath}/${name}` : name)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
            <FolderIcon weight="fill" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground file-name truncate">{name}</p>
            <p className="text-sm text-muted-foreground">資料夾</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={"destructive-ghost"}
              className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", isDeleting ? 'opacity-50 pointer-events-none' : '')}
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(true)
              }}
              aria-label={`刪除資料夾 ${name}`}
              title="刪除"
            >
              <span className={isDeleting ? 'animate-ping' : ''} aria-hidden>
                <TrashSimpleIcon size={16} />
              </span>
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 file-card transition-all hover:shadow-lg">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
          <FileVideoIcon weight="fill" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground file-name wrap-break-word">
                {name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0">
                {file.name.split('.').pop()?.toUpperCase()}
              </Badge>
              {isRecording && (
                <Badge variant="destructive" className="shrink-0">
                  錄製中
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="font-mono">{sizeVal ? formatFileSize(sizeVal) : '—'}</span>
            <span>{file.path ?? '—'}</span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={isDownloading || isRecording || isDeleting}
              onClick={handleDownload}
              title={isRecording ? '檔案正在錄製中，無法下載' : undefined}
              aria-disabled={isRecording || isDownloading || isDeleting}
            >
              <span className={isDownloading ? 'animate-ping' : ''} aria-hidden>
                <DownloadSimpleIcon size={16} />
              </span>
              {isRecording ? '錄製中' : isDownloading ? '下載中' : '下載'}
            </Button>

            <Button
              size="icon"
              variant={'destructive-ghost'}
              className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", (isDeleting || isRecording) ? 'opacity-50 pointer-events-none' : '')}
              disabled={isDeleting || isRecording}
              onClick={() => handleDelete(false)}
              aria-label={`刪除檔案 ${name}`}
              title="刪除"
            >
              <span className={isDeleting ? 'animate-ping' : ''} aria-hidden>
                <TrashSimpleIcon size={16} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
