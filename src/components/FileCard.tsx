import { useState, useDeferredValue } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import MoreVerticalIcon from 'lucide-react/dist/esm/icons/more-vertical'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { DownloadSimpleIcon, FileVideoIcon, FolderIcon, TrashSimpleIcon, XIcon, ShareNetworkIcon, SwapIcon } from '@phosphor-icons/react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select' 
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
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total?: number } | null>(null)
  const deferredProgress = useDeferredValue(downloadProgress)
  const [downloadController, setDownloadController] = useState<AbortController | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Normalize incoming file shape and guard against missing data
  const name = typeof file.name === 'string' ? file.name : '未命名'
  const isDir = 'is_dir' in file ? !!(file as any).is_dir : !!(file as any).isDir
  const sizeVal = typeof file.size === 'number' ? file.size : Number((file as any).size) || 0
  const extension = file.name.split('.').pop()?.toUpperCase()

  const isRecording = 'is_recording' in file ? !!(file as any).is_recording : false

  const fullPath = currentPath ? `${currentPath}/${name}` : name

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetIsDir, setDeleteTargetIsDir] = useState(false)

  const openDeleteDialog = (directory = false) => {
    setDeleteTargetIsDir(directory)
    setIsDeleteDialogOpen(true)
  }

  const performDelete = async (directory = false) => {
    // Guard: prevent deleting while file is currently recording
    if (isRecording) {
      setIsDeleteDialogOpen(false)
      toast.error('檔案正在錄製中，無法刪除')
      return
    }

    setIsDeleteDialogOpen(false)
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
      await apiClient.downloadFileToDisk(fullPath, {
        signal: controller.signal,
        suggestedName: name,
        onProgress: (loaded, total) => {
          total = total || file.size
          setDownloadProgress({ loaded, total })
        }
      })
      // If browser handled the download in a new tab or File System Access API finished writing,
      // notify the user that the download was initiated/finished.
      toast.success('下載已啟動或完成（請檢查下載管理員或選擇的儲存位置）')
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

  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [deleteSourceAfterConvert, setDeleteSourceAfterConvert] = useState(false)
  const [convertFormat, setConvertFormat] = useState<string>('mp4')

  const openConvertDialog = () => {
    if (isDir) {
      toast.error('無法轉換')
      return
    }

    if (isRecording) {
      toast.error('檔案正在錄製中，無法轉換')
      return
    }

    // default: do not delete source unless user checks
    setDeleteSourceAfterConvert(false)
    setConvertFormat('mp4')
    setIsConvertDialogOpen(true)
  }

  const confirmConvert = async () => {
    setIsConvertDialogOpen(false)
    setIsConverting(true)
    try {
      const fullPath = currentPath ? `${currentPath}/${name}` : name
      await apiClient.enqueueConvertTask(fullPath, deleteSourceAfterConvert, convertFormat)
      toast.success('已加入轉換佇列')
    } catch (error: any) {
      console.error('Enqueue convert failed:', error)
      toast.error('加入轉換佇列失敗' + (error.response?.data ? `: ${error.response?.data}` : ''))
    } finally {
      setIsConverting(false)
    }
  }
const handleShare = async () => {
    if (isRecording) {
      toast.error('檔案正在錄製中，無法分享')
      return
    }

    setIsSharing(true)
    try {
      const fullPath = currentPath ? `${currentPath}/${name}` : name
      const shareInfo = await apiClient.shareFile(fullPath)
      
      // Copy URL to clipboard
      await navigator.clipboard.writeText(shareInfo.url)
      toast.success(`分享連結已複製到剪貼簿（有效期 ${shareInfo.expires_in} 秒）`)
    } catch (error: any) {
      console.error('Share failed:', error)
      toast.error('產生分享連結失敗' + (error.response?.data ? `: ${error.response.data}` : ''))
    } finally {
      setIsSharing(false)
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
                openDeleteDialog(true)
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
                {extension}
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

              {/* Desktop actions: show share, convert & delete on sm+ */}
              <div className="hidden sm:flex items-center gap-2">
                {extension?.toLowerCase() !== 'mp4' && (
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center shrink-0", isConverting ? 'cursor-wait' : '')}
                    disabled={isConverting || isDownloading || isDeleting || isRecording}
                    onClick={openConvertDialog}
                    aria-label={`轉換 ${name}`}
                    title={isConverting ? '轉換中…' : '轉換'}
                  >
                    <span className={isConverting ? 'animate-ping' : ''} aria-hidden>
                      <SwapIcon size={16} />
                    </span>
                  </Button>
                )}
                {/* Hide share button while recording or downloading */}
                {!isRecording && !isDownloading && (
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", isSharing ? 'cursor-wait' : '')}
                    disabled={isSharing || isDeleting}
                    onClick={handleShare}
                    aria-label={`分享檔案 ${name}`}
                    title={isSharing ? '產生分享連結中' : '分享'}
                  >
                    <span className={isSharing ? 'animate-ping' : ''} aria-hidden>
                      <ShareNetworkIcon size={16} />
                    </span>
                  </Button>
                )}
                {!isRecording && (
                  <Button
                    size="icon"
                    variant="destructive-ghost"
                    className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", isDeleting ? 'opacity-50 pointer-events-none' : '')}
                    disabled={isDeleting || (isDownloading && !downloadController)}
                    onClick={() => { if (isDownloading) { downloadController?.abort(); } else { openDeleteDialog(false); } }}
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
                )}
              </div>

              {/* Mobile: three-dots menu */}
              <div className="sm:hidden flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn("p-2 rounded-md h-8 w-8 flex items-center justify-center", (isDeleting || isRecording) ? 'opacity-50 pointer-events-none' : '')}
                      disabled={isDeleting || isRecording || (isDownloading && !downloadController)}
                      aria-label="更多操作"
                    >
                      <MoreVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Show share item only when not recording or downloading */}
                    {!isRecording && !isDownloading && (
                      <DropdownMenuItem onSelect={() => { handleShare(); }} disabled={isSharing || isDeleting}>
                        {isSharing ? '產生分享連結中…' : '分享'}
                      </DropdownMenuItem>
                    )}
                    {extension?.toLowerCase() !== 'mp4' && (
                      <DropdownMenuItem onSelect={() => { openConvertDialog(); }} disabled={isConverting || isDownloading || isDeleting || isRecording}>
                        {isConverting ? '轉換中…' : '轉換'}
                      </DropdownMenuItem>
                    )}
                    {!isRecording && (
                      <DropdownMenuItem variant="destructive" onSelect={() => { if (isDownloading) { downloadController?.abort(); } else { openDeleteDialog(false); } }} disabled={isDeleting || (isDownloading && !downloadController)}>
                        {isDownloading ? '取消下載' : '刪除'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>

            {/* Convert confirmation dialog */}
            <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>確認轉換</DialogTitle>
                  <DialogDescription>是否要將 "{name}" 加入轉換佇列（輸出格式: {convertFormat.toUpperCase()}）？可選擇在轉換完成後刪除原檔。</DialogDescription>
                </DialogHeader>

                <div className="mt-3">
                  <span className="text-sm">輸出格式</span>
                  <div className="mt-2">
                    <Select value={convertFormat} onValueChange={(v) => setConvertFormat(v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="MP4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4</SelectItem>
                        {/* <SelectItem value="mkv" disabled>MKV（即將支援）</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Checkbox checked={deleteSourceAfterConvert} onCheckedChange={(v) => setDeleteSourceAfterConvert(!!v)} />
                  <div className="flex flex-col">
                    <span className="text-sm">轉換完成後刪除原檔</span>
                    <span className="text-xs text-muted-foreground">取消勾選會保留原始檔案</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsConvertDialogOpen(false)}>取消</Button>
                  <Button onClick={confirmConvert} disabled={isConverting}>{isConverting ? `轉換 ${convertFormat.toUpperCase()} 中…` : `確定轉換 ${convertFormat.toUpperCase()}`}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>確認刪除</DialogTitle>
                  <DialogDescription>{deleteTargetIsDir ? `確定要刪除資料夾 "${name}" 及其內容嗎？此操作無法復原。` : `確定要刪除檔案 "${name}" 嗎？此操作無法復原。`}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
                  <Button variant="destructive" onClick={() => performDelete(deleteTargetIsDir)} disabled={isDeleting}>{isDeleting ? '刪除中…' : '確定刪除'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>
    </Card>
  )
} 
