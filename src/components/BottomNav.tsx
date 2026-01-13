import { cn } from '@/lib/utils'
import { SwapIcon } from '@phosphor-icons/react'

interface BottomNavProps {
  activeTab: 'records' | 'files' | 'converts'
  onTabChange: (tab: 'records' | 'files' | 'converts') => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom z-50 md:hidden select-none"
      style={{ touchAction: 'none', userSelect: 'none', overscrollBehavior: 'contain' }}
    >
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => onTabChange('records')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            activeTab === 'records' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium">錄製管理</span>
        </button>
        <button
          onClick={() => onTabChange('files')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            activeTab === 'files' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-medium">錄製檔案</span>
        </button>
        <button
          onClick={() => onTabChange('converts')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            activeTab === 'converts' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <span className="w-6 h-6 flex items-center justify-center">
            <SwapIcon size={18} weight="bold" />
          </span>
          <span className="text-xs font-medium">轉換任務</span>
        </button>
      </div>
    </nav>
  )
}
