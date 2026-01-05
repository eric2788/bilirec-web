import { useState, useDeferredValue } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select' 
import { DownloadSimpleIcon, FileVideoIcon, FolderIcon, TrashSimpleIcon, XIcon } from '@phosphor-icons/react'
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
  const [downloadFormat, setDownloadFormat] = useState<'flv' | 'mp4'>('flv')
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total?: number } | null>(null)
  const deferredProgress = useDeferredValue(downloadProgress)
  const [downloadController, setDownloadController] = useState<AbortController | null>(null)

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
    setDownloadProgress(null)

    const controller = new AbortController()
    setDownloadController(controller)

    try {
      const fullPath = currentPath ? `${currentPath}/${name}` : name
      const blob = await apiClient.downloadFile(fullPath, {
        format: downloadFormat,
        signal: controller.signal,
        onProgress: (loaded, total) => {
          total = total || file.size
          setDownloadProgress({ loaded, total })
        }
      })
      const href = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      const baseName = (name.split('/').pop() || name).replace(/\.[^/.]+$/, '')
      a.download = `${baseName}.${downloadFormat}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(href)
      toast.success('下載已完成')
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        toast.warning('下載已取消')
      } else {
        console.error('Download failed:', error)
        toast.error('下載失敗' + (error.response?.data ? `: ${error.response?.data}` : ''))
      }
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
      setDownloadController(null)
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

          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <Button
                size="sm"
                className={cn("flex-1 relative overflow-hidden", isDownloading ? 'cursor-wait' : '')}
                disabled={isDownloading || isRecording || isDeleting}
                onClick={handleDownload}
                title={isRecording ? '檔案正在錄製中，無法下載' : undefined}
                aria-disabled={isRecording || isDownloading || isDeleting}
              >
                

                <span className={isDownloading ? 'animate-ping relative z-10' : 'relative z-10'} aria-hidden>
                  <DownloadSimpleIcon size={16} />
                </span>
                <span className="relative z-10">
                  {isRecording ? '錄製中' : isDownloading ? `下載中${deferredProgress?.total ? ` (${Math.round((deferredProgress.loaded / (deferredProgress.total || 1)) * 100)}%)` : ''}` : '下載'}
                </span>

                {/* Progress background inside button */}
                {isDownloading && (
                  deferredProgress?.loaded ? (
                    <div className="absolute left-0 top-0 h-full w-full bg-primary/20 z-50">
                      <div className="h-full bg-muted/20 transition-all" style={{ width: `${Math.max(2, Math.round((deferredProgress.loaded / (deferredProgress.total || 1)) * 100))}%`, transition: 'width 160ms linear' }} />
                    </div>
                  ) : (
                    <div className="absolute left-0 top-0 h-full w-full overflow-hidden z-50">
                      <div className="progress-indeterminate h-full rounded" />
                    </div>
                  )
                )}

              </Button>

              {!isDownloading && (
                <Select value={downloadFormat} onValueChange={(v) => setDownloadFormat(v as 'flv' | 'mp4')}>
                  <SelectTrigger size="sm" className="px-2 py-1 rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="flv">FLV</SelectItem>
                    <SelectItem value="mp4">MP4</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                size="icon"
                variant="destructive-ghost"
                className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", (isDeleting || isRecording) ? 'opacity-50 pointer-events-none' : '')}
                disabled={isDeleting || isRecording || (isDownloading && !downloadController)}
                onClick={() => { if (isDownloading) { downloadController?.abort(); } else { handleDelete(false); } }}
                aria-label={isDownloading ? '取消下載' : `刪除檔案 ${name}`}
                title={isDownloading ? '取消下載' : '刪除'}
              >
                {isDownloading ? (
                  <span aria-hidden>
                    <XIcon size={16} />
                  </span>
                ) : (
                  <span className={isDeleting ? 'animate-ping' : ''} aria-hidden>
                    <TrashSimpleIcon size={16} />
                  </span>
                )}
              </Button>
          </div>
        </div>
      </div>
      </div>
    </Card>
  )
}
