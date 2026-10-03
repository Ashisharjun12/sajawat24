import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

export function VideoReviewFormDialog({ open, onOpenChange, review, onSubmit, submitting }) {
  const [caption, setCaption] = useState("")
  const [status, setStatus] = useState("draft")
  const [video, setVideo] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setCaption(review?.caption ?? "")
    setStatus(review?.status ?? "draft")
    setVideo(review?.video ?? null)
  }, [open, review])

  function handleSubmit(event) {
    event.preventDefault()
    const uploadId = video?.uploadId || video?.id
    if (!uploadId || !caption.trim()) return
    onSubmit?.({
      uploadId,
      caption: caption.trim(),
      status,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{review ? "Edit video" : "Add video"}</DialogTitle>
            <DialogDescription>
              General platform video — caption and upload only. Not tied to a product.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Caption</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Short label for this video"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Video</p>
                <p className="truncate text-xs text-muted-foreground">
                  {video?.filename || "Select an uploaded video"}
                </p>
              </div>
              <div className="flex gap-2">
                {video ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setVideo(null)}>
                    Remove
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Choose video
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !video || !caption.trim()}>
                {submitting ? <Spinner className="size-4" /> : review ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ProductMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attached={video ? [video] : []}
        max={1}
        kinds={["video"]}
        onAdd={(picked) => {
          const row = picked[0] ? toGalleryItem(picked[0]) : null
          setVideo(row)
        }}
        disabled={submitting}
      />
    </>
  )
}
