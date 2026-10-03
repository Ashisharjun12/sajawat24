import { useRef, useState } from "react"
import { CloudUploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MediaDropzone({
  accept,
  disabled,
  onFiles,
  description = "or drag a file to upload to this folder",
}) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)

  function takeFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    onFiles(files)
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/40 px-6 py-10 text-center transition-colors",
        over ? "border-primary bg-muted/70" : "border-border",
        disabled ? "pointer-events-none opacity-60" : "",
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        takeFiles(event.dataTransfer.files)
      }}
    >
      <CloudUploadIcon className="size-10 text-primary" />
      <Button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Browse
      </Button>
      <p className="text-sm text-muted-foreground">{description}</p>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={(event) => {
          takeFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </div>
  )
}
