import { useState, useEffect } from 'react'
import { FileCard } from './FileCard'
import { EmptyState } from './EmptyState'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RecordFile } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function FilesView() {
  const [files, setFiles] = useState<RecordFile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFiles = async () => {
    try {
      const data = await apiClient.getFiles()
      setFiles(data)
    } catch (error: any) {
      console.error('Failed to fetch files:', error)
      toast.error('無法載入檔案列表')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <h2 className="text-xl font-bold">錄製檔案</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            title="還沒有錄製檔案"
            description="完成錄製後檔案會出現在這裡"
          />
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
