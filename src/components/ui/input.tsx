import { ComponentProps } from "react"
import { XIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

type InputProps = ComponentProps<"input"> & {
  clearable?: boolean
  onClear?: () => void
  clearAriaLabel?: string
}

function Input({ className, type, clearable, onClear, clearAriaLabel = "Clear input", value, ...props }: InputProps) {
  const hasClearValue = typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null && `${value}`.length > 0
  const showClearButton = Boolean(clearable && onClear && hasClearValue)

  return (
    <div className="relative flex w-full items-center">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          showClearButton && "pr-10",
          className
        )}
        value={value}
        {...props}
      />
      {showClearButton && (
        <button
          type="button"
          className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          aria-label={clearAriaLabel}
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}

export { Input }
