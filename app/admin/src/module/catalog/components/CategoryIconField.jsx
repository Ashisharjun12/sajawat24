import { useRef, useState } from "react"
import { UploadIcon, XIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { ingestUpload, mediaDisplayUrl } from "@/api/uploads.api"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const ACCEPT = "image/png,image/svg+xml,.png,.svg"
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Custom bar icon for a top-level category. Uploads go through the icon preset, so the backend
 * stores a 192×192 transparent WebP (SVG is rasterized, never stored raw).
 * `icon` is `{ uploadId, url }` or null.
 */
export function CategoryIconField({ icon, onIconChange, disabled }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const previewUrl = icon?.url || ""
  const busy = disabled || uploading

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setError("")
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name)
    const isPng = file.type === "image/png" || /\.png$/i.test(file.name)
    if (!isSvg && !isPng) {
      setError("Use a PNG or SVG file.")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 2 MB.")
      return
    }
    setUploading(true)
    try {
      const row = await ingestUpload(file, { preset: "icon" })
      onIconChange({ uploadId: row.id, url: mediaDisplayUrl(row) })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* Same 32px box the web top bar uses, so admins see the real size. */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex size-14 items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/40">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-8 object-contain" />
            ) : (
              <span className="text-muted-foreground text-[10px]">None</span>
            )}
          </div>
          <span className="text-muted-foreground text-[10px]">Actual size</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <UploadIcon />}
            {previewUrl ? "Replace" : "Upload PNG / SVG"}
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onIconChange(null)}
            >
              <XIcon />
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Square 256 × 256 px, transparent background, artwork filling about 85% of the canvas.
        PNG or SVG, under 200 KB. Shown at 32px, so use bold, simple shapes.
      </p>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}
