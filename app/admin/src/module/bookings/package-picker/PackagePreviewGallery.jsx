import { useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { cn } from "@/lib/utils"
import { imageSrc } from "@/module/bookings/package-picker/package-picker.utils"

export function PackagePreviewGallery({ images, title }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? images[0] ?? null
  const src = imageSrc(selected)

  useEffect(() => {
    setSelectedIndex((index) => {
      if (!images.length) return 0
      return Math.min(index, images.length - 1)
    })
  }, [images])

  function step(delta) {
    if (images.length < 2) return
    setSelectedIndex((index) => (index + delta + images.length) % images.length)
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative min-w-0 overflow-hidden rounded-2xl bg-muted">
        {src ? (
          <img src={src} alt={title} className="aspect-square w-full max-w-full object-cover" />
        ) : (
          <DecoryImageFallback className="aspect-square min-h-48" />
        )}
        {images.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 left-2 -translate-y-1/2"
              onClick={() => step(-1)}
              aria-label="Previous image"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => step(1)}
              aria-label="Next image"
            >
              <ChevronRightIcon />
            </Button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex min-w-0 w-full gap-2 overflow-x-auto">
          {images.map((item, index) => {
            const thumb = imageSrc(item)
            return (
              <button
                key={item.uploadId || item.url || index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === selectedIndex}
                className={cn(
                  "size-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-2 ring-transparent",
                  index === selectedIndex && "ring-primary",
                )}
              >
                {thumb ? (
                  <img src={thumb} alt="" className="size-full object-cover" />
                ) : (
                  <DecoryImageFallback />
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
