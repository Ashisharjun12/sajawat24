import { useEffect, useRef, useState } from "react"
import ReactCrop from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { CROP_PRESETS, getCropPreset } from "@/lib/crop-presets"
import { cn } from "@/lib/utils"

function toPixelCrop(crop, image) {
  if (!crop?.width || !crop?.height || !image) return undefined
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const x = crop.unit === "%" ? (crop.x / 100) * image.naturalWidth : crop.x * scaleX
  const y = crop.unit === "%" ? (crop.y / 100) * image.naturalHeight : crop.y * scaleY
  const width = crop.unit === "%" ? (crop.width / 100) * image.naturalWidth : crop.width * scaleX
  const height = crop.unit === "%" ? (crop.height / 100) * image.naturalHeight : crop.height * scaleY
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

function buildOutput(width, height) {
  const w = Number.parseInt(String(width), 10)
  const h = Number.parseInt(String(height), 10)
  const output = {}
  if (Number.isFinite(w) && w > 0) output.width = w
  if (Number.isFinite(h) && h > 0) output.height = h
  return Object.keys(output).length ? output : undefined
}

export function MediaCropDialog({ open, onOpenChange, item, onConfirm, submitting }) {
  const imgRef = useRef(null)
  const [crop, setCrop] = useState(undefined)
  const [presetId, setPresetId] = useState("free")
  const [outputWidth, setOutputWidth] = useState("")
  const [outputHeight, setOutputHeight] = useState("")

  useEffect(() => {
    if (!open) {
      setCrop(undefined)
      setPresetId("free")
      setOutputWidth("")
      setOutputHeight("")
    }
  }, [open, item?.id])

  function onImageLoad(event) {
    setCrop({
      unit: "%",
      x: 5,
      y: 5,
      width: 90,
      height: 90,
    })
  }

  function selectPreset(id) {
    const preset = getCropPreset(id)
    setPresetId(preset.id)
    if (preset.outputWidth) setOutputWidth(String(preset.outputWidth))
    else setOutputWidth("")
    if (preset.outputHeight) setOutputHeight(String(preset.outputHeight))
    else setOutputHeight("")
  }

  async function handleConfirm() {
    const pixel = toPixelCrop(crop, imgRef.current)
    if (!pixel || pixel.width <= 0 || pixel.height <= 0) return
    const output = buildOutput(outputWidth, outputHeight)
    await onConfirm(pixel, output)
  }

  const activePreset = getCropPreset(presetId)
  const cropAspect = activePreset.aspect

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-10">
          <DialogTitle>Optimize image</DialogTitle>
          <DialogDescription>
            {item?.filename
              ? `Crop ${item.filename}, then convert to WebP.`
              : "Crop the image, then convert to WebP."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {CROP_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={presetId === preset.id ? "default" : "outline"}
                className={cn("rounded-full cursor-pointer", presetId === preset.id && "pointer-events-none")}
                onClick={() => selectPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="crop-output-width">Width</Label>
              <Input
                id="crop-output-width"
                type="number"
                min={1}
                max={4096}
                placeholder="Auto"
                value={outputWidth}
                onChange={(event) => setOutputWidth(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crop-output-height">Height</Label>
              <Input
                id="crop-output-height"
                type="number"
                min={1}
                max={4096}
                placeholder="Auto"
                value={outputHeight}
                onChange={(event) => setOutputHeight(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 max-h-[min(28rem,50vh)] flex-1 overflow-auto rounded-xl bg-muted p-3">
          {item?.publicUrl ? (
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              aspect={cropAspect}
              className="mx-auto block max-w-full"
            >
              <img
                ref={imgRef}
                src={item.publicUrl}
                alt={item.filename}
                onLoad={onImageLoad}
                className="block h-auto max-w-full"
              />
            </ReactCrop>
          ) : null}
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting || !crop}>
            {submitting ? <Spinner /> : null}
            Start optimizing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
