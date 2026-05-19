import { useState } from 'react'
import { MagnifyingGlassIcon, SpinnerGapIcon } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSearching?: boolean
  searchingLabel?: string
  /** Label for the mobile search submit button. */
  searchLabel?: string
  /** Accessible title for the mobile search dialog (sr-only). */
  dialogTitle: string
  /** Extra classes applied to the outermost wrapper div. */
  containerClassName?: string
  /** Width class(es) applied to the desktop input wrapper, e.g. "w-[280px]". */
  inputWidth?: string
  /** aria-label forwarded to the desktop input. */
  ariaLabel?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  isSearching = false,
  searchingLabel,
  searchLabel,
  dialogTitle,
  containerClassName,
  inputWidth,
  ariaLabel,
}: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [dialogInput, setDialogInput] = useState('')

  const handleOpenChange = (next: boolean) => {
    if (next) setDialogInput(value)
    setOpen(next)
  }

  const handleMobileSearch = () => {
    onChange(dialogInput)
    setOpen(false)
  }

  const spinnerOverlay = (
    <div
      className={cn(
        'pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200',
        isSearching ? 'opacity-100' : 'opacity-0'
      )}
    >
      <span className="animate-spin">
        <SpinnerGapIcon size={14} />
      </span>
      {searchingLabel && <span>{searchingLabel}</span>}
    </div>
  )

  return (
    <div className={cn('flex items-center', containerClassName)}>
      {/* Mobile: icon button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative sm:hidden"
        onClick={() => handleOpenChange(true)}
        aria-label={dialogTitle}
      >
        <MagnifyingGlassIcon size={20} />
        {value.trim() && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Button>

      {/* Desktop: inline input */}
      <div className={cn('relative hidden sm:block', inputWidth)}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <MagnifyingGlassIcon size={16} />
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          clearable={!isSearching}
          onClear={() => onChange('')}
          clearAriaLabel="Clear search"
          className="pl-9 pr-24"
          aria-label={ariaLabel}
          aria-busy={isSearching}
        />
        {spinnerOverlay}
      </div>

      {/* Mobile: search dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-4 px-5 py-6 sm:hidden bg-card border-border shadow-xl">
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            {dialogTitle}
          </DialogTitle>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MagnifyingGlassIcon size={16} />
            </span>
            <Input
              autoFocus
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMobileSearch()}
              placeholder={placeholder}
              clearable={!isSearching}
              onClear={() => setDialogInput('')}
              clearAriaLabel="Clear search"
              className="pl-9"
              aria-busy={isSearching}
            />
          </div>
          <Button className="w-full" onClick={handleMobileSearch}>
            <MagnifyingGlassIcon size={16} />
            {searchLabel ?? dialogTitle}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
