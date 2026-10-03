import { cn } from "@/lib/utils"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"

export function addonImageSrc(addon) {
  const image = addon?.image
  return image?.thumbnailUrl || image?.url || image?.publicUrl || image?.optimizedUrl || ""
}

export function AddonThumb({ addon, className }) {
  const src = addonImageSrc(addon)
  return (
    <span className={cn("relative inline-flex size-10 shrink-0 overflow-hidden rounded-lg", className)}>
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <DecoryImageFallback />
      )}
    </span>
  )
}
