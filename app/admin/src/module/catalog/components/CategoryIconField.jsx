import { ImageIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Custom bar icon for a top-level category. "Select from media" opens the media library
 * (Category icons folder); new uploads there use the icon preset, so the backend stores a
 * 192×192 transparent WebP (SVG is rasterized, never stored raw).
 * `icon` is `{ uploadId, url }` or null.
 */
export function CategoryIconField({ icon, onIconChange, onSelect, disabled }) {
  const previewUrl = icon?.url || ""

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* Same 32px box the web top bar uses, so admins see the real size. */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            aria-label={previewUrl ? "Change bar icon" : "Select bar icon"}
            className="flex size-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/40 transition-colors hover:border-muted-foreground/40 disabled:pointer-events-none disabled:opacity-70"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-8 object-contain" />
            ) : (
              <span className="text-muted-foreground text-[10px]">None</span>
            )}
          </button>
          <span className="text-muted-foreground text-[10px]">Actual size</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onSelect}
          >
            <ImageIcon />
            {previewUrl ? "Change" : "Select from media"}
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onIconChange(null)}
            >
              <XIcon />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Pick from the media library, or upload there (PNG or SVG). Square 256 × 256 px,
        transparent background, artwork filling about 85% of the canvas, under 200 KB. Shown at
        32px, so use bold, simple shapes.
      </p>
    </div>
  )
}
