import { cn } from "@/lib/utils"
import iconSrc from "@/assets/icon.png"

export function DecoryLogo({ className }) {
  return (
    <span
      className={cn("relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%]", className)}
      role="img"
      aria-label="sajawat24"
    >
      <img src={iconSrc} alt="" className="size-full object-contain" />
    </span>
  )
}
