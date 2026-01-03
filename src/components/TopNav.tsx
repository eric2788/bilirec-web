import { cn } from '@/lib/utils'
import { VideoCamera, File } from '@phosphor-icons/react'

interface TopNavProps {
  activeTab: 'records' | 'files'
  onTabChange: (tab: 'records' | 'files') => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <nav className="hidden md:flex items-center gap-3">
      <button
        onClick={() => onTabChange('records')}
        aria-pressed={activeTab === 'records'}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium',
          activeTab === 'records' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-secondary/10'
        )}
      >
        <span className="shrink-0"><VideoCamera size={16} weight="bold" /></span>
        <span>錄製管理</span>
      </button>

      <button
        onClick={() => onTabChange('files')}
        aria-pressed={activeTab === 'files'}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium',
          activeTab === 'files' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-secondary/10'
        )}
      >
        <span className="shrink-0"><File size={16} weight="bold" /></span>
        <span>錄製檔案</span>
      </button>
    </nav>
  )
}
