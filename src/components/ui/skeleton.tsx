import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("w-full bg-muted/50 dark:bg-muted/30 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
