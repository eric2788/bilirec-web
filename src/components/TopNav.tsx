import { cn } from '@/lib/utils'
import { VideoCameraIcon, FileIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

interface TopNavProps {
  activeTab: 'records' | 'files'
  onTabChange: (tab: 'records' | 'files') => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const { t } = useTranslation()

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
        <span className="shrink-0"><VideoCameraIcon size={16} weight="bold" /></span>
        <span>{t('nav.records')}</span>
      </button>

      <button
        onClick={() => onTabChange('files')}
        aria-pressed={activeTab === 'files'}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium',
          activeTab === 'files' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-secondary/10'
        )}
      >
        <span className="shrink-0"><FileIcon size={16} weight="bold" /></span>
        <span>{t('nav.files')}</span>
      </button>
    </nav>
  )
}
