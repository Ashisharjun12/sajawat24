import { AvatarBadge } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function PresenceDot({ online, className }) {
  if (!online) return null
  return (
    <AvatarBadge
      className={cn("size-2.5 bg-emerald-500 p-0 ring-2 ring-background", className)}
      aria-label="Online"
    />
  )
}
