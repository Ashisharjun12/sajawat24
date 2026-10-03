import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { cn } from "@/lib/utils"

export function BookingPreviewThumb({ src, alt = "", size = "md", className }) {
  const sizeClass = size === "sm" ? "size-10" : "size-12"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-lg bg-muted",
        sizeClass,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <DecoryImageFallback />
      )}
    </span>
  )
}
