import { cn } from '@/lib/utils'
import { VideoCamera, File } from '@phosphor-icons/react'

type LeftSidebarProps = {
  activeTab: 'records' | 'files'
  onTabChange: (t: 'records' | 'files') => void
}

export function LeftSidebar({ activeTab, onTabChange }: LeftSidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col w-56 h-full p-4 border-r border-border bg-card/95">
      <nav className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => onTabChange('records')}
          aria-pressed={activeTab === 'records'}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
            activeTab === 'records'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-primary hover:bg-secondary/10'
          )}
        >
          <span className="shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </span>
          <span>錄製管理</span>
        </button>

        <button
          onClick={() => onTabChange('files')}
          aria-pressed={activeTab === 'files'}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
            activeTab === 'files'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-primary hover:bg-secondary/10'
          )}
        >
          <span className="shrink-0"><File size={18} weight="bold" /></span>
          <span>錄製檔案</span>
        </button>
      </nav>
    </aside>
  )
} 
