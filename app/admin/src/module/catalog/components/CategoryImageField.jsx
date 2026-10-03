import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ImageIcon, XIcon } from "lucide-react"

export function CategoryImageField({ image, onImageChange, onSelect, disabled }) {
  const previewUrl = image?.url || image?.publicUrl || ""

  function handleRemove(event) {
    event.stopPropagation()
    onImageChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group/avatar relative h-24 w-24 overflow-hidden rounded-full border border-dashed transition-colors",
            disabled ? "pointer-events-none opacity-70" : "cursor-pointer",
            "border-muted-foreground/25 hover:border-muted-foreground/20",
            previewUrl && "border-solid",
          )}
          onClick={onSelect}
          aria-label={previewUrl ? "Change image" : "Select image"}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Category" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
          )}
        </button>

        {previewUrl ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute end-0.5 top-0.5 z-10 size-6 rounded-full dark:bg-zinc-800 hover:dark:bg-zinc-700"
            aria-label="Remove image"
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-0.5 text-center">
        <p className="text-sm font-medium">{previewUrl ? "Image selected" : "Select image"}</p>
        <p className="text-muted-foreground text-xs">Choose from the media library</p>
      </div>
    </div>
  )
}
