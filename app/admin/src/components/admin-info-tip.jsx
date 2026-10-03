import { InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Short labels on the form; full guidance on hover. Reuse anywhere in admin.
 */
export function AdminInfoTip({
  content,
  className,
  contentClassName,
  side = "top",
  align = "start",
}) {
  if (!content) return null

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
          aria-label="More information"
        >
          <InfoIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "max-w-xs text-left text-xs leading-relaxed whitespace-normal",
            contentClassName,
          )}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
