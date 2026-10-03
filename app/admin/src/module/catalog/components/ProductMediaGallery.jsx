import { useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, ImagesIcon, LayoutGridIcon, PlayIcon, TableIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"

export function toGalleryItem(item) {
  return {
    uploadId: item.uploadId || item.id,
    kind: item.kind,
    url: item.url || item.optimizedUrl || item.publicUrl,
    publicUrl: item.publicUrl || item.url,
    thumbnailUrl: item.thumbnailUrl ?? null,
    filename: item.filename,
  }
}

export function firstCoverIndex(items) {
  return items.findIndex((item) => item.kind === "image")
}

function MediaPreview({ item, className }) {
  if (item.kind === "video") {
    if (item.thumbnailUrl) {
      return <img src={item.thumbnailUrl} alt={item.filename || "Video"} className={className} />
    }
    return <video src={item.publicUrl || item.url} className={className} muted playsInline />
  }
  return <img src={item.url} alt={item.filename || "Image"} className={className} />
}

function SortableMediaItem({ item, view, disabled, onPreview, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uploadId,
    disabled,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (view === "table") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-3 rounded-2xl border bg-card p-2",
          isDragging ? "opacity-60" : "",
        )}
      >
        <button
          type="button"
          className={cn("shrink-0 rounded-lg p-1", disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing")}
          aria-label="Reorder"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"
          onClick={() => onPreview(item)}
          aria-label={`Preview ${item.filename || item.kind}`}
        >
          <MediaPreview item={item} className="size-full object-cover" />
          {item.kind === "video" ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <PlayIcon className="size-4 text-white" />
            </span>
          ) : null}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.filename || item.kind}</p>
          <Badge variant="secondary" className="mt-1 capitalize">
            {item.kind}
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove} aria-label="Remove" disabled={disabled}>
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative overflow-hidden rounded-2xl border bg-muted", isDragging ? "opacity-60" : "")}
    >
      <button
        type="button"
        className={cn(
          "absolute top-2 left-2 z-10 rounded-lg bg-background/90 p-1",
          disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
        aria-label="Reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4 text-muted-foreground" />
      </button>
      <button
        type="button"
        className="block aspect-square w-full"
        onClick={() => onPreview(item)}
        aria-label={`Preview ${item.filename || item.kind}`}
      >
        <MediaPreview item={item} className="size-full object-cover" />
        {item.kind === "video" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <PlayIcon className="size-8 text-white" />
          </span>
        ) : null}
      </button>
      <Badge variant="secondary" className="absolute top-2 right-10 capitalize">
        {item.kind}
      </Badge>
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        className="absolute top-2 right-2"
        onClick={onRemove}
        aria-label="Remove"
        disabled={disabled}
      >
        <XIcon />
      </Button>
    </div>
  )
}

export function ProductMediaGallery({ items, onChange, disabled }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [view, setView] = useState("grid")
  const ids = items.map((item) => item.uploadId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addFromPicker(picked) {
    const existing = new Set(items.map((item) => item.uploadId))
    const next = [...items]
    for (const item of picked) {
      const row = toGalleryItem(item)
      if (!row.uploadId || existing.has(row.uploadId)) continue
      existing.add(row.uploadId)
      next.push(row)
    }
    onChange(next)
  }

  function onDragEnd(event) {
    const { active, over } = event
    if (disabled || !over || active.id === over.id) return
    const from = items.findIndex((item) => item.uploadId === active.id)
    const to = items.findIndex((item) => item.uploadId === over.id)
    if (from < 0 || to < 0) return
    onChange(arrayMove(items, from, to))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {items.length ? (
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="table" aria-label="List view">
                <TableIcon />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGridIcon />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}
        <Button type="button" disabled={disabled} onClick={() => setPickerOpen(true)}>
          <ImagesIcon />
          Select media
        </Button>
      </div>

      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={ids}
            strategy={view === "table" ? verticalListSortingStrategy : rectSortingStrategy}
          >
            <div className={view === "table" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
              {items.map((item, index) => (
                <SortableMediaItem
                  key={item.uploadId}
                  item={item}
                  view={view}
                  disabled={disabled}
                  onPreview={setPreview}
                  onRemove={() => onChange(items.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImagesIcon />
            </EmptyMedia>
            <EmptyTitle>No media yet</EmptyTitle>
            <EmptyDescription>Pick images or videos from the media library.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <ProductMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attached={items}
        onAdd={addFromPicker}
        disabled={disabled}
      />

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.filename || (preview?.kind === "video" ? "Video preview" : "Image preview")}</DialogTitle>
            <DialogDescription>
              {preview?.kind === "video" ? "Play the attached video." : "Product image."}
            </DialogDescription>
          </DialogHeader>
          {preview?.kind === "video" ? (
            <video
              src={preview.publicUrl || preview.url}
              className="max-h-[70vh] w-full rounded-xl bg-black"
              controls
              playsInline
            />
          ) : preview ? (
            <img src={preview.url} alt={preview.filename || "Image"} className="max-h-[70vh] w-full rounded-xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
