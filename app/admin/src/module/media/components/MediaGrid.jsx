import { DownloadIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { mediaDisplayUrl } from "@/api/uploads.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { downloadMedia, viewMediaInNewTab } from "@/lib/media"

function MediaCard({ item, onOptimize, onDelete, onRename }) {
  const optimized = item.optimizeStatus === "completed"
  const queued = item.optimizeStatus === "queued"
  const src = mediaDisplayUrl(item)
  const canOptimize =
    item.kind === "image" && item.status === "completed" && item.optimizeStatus === "none" && !queued

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        className="relative block aspect-square w-full cursor-pointer bg-muted"
        onClick={() => viewMediaInNewTab(item)}
        aria-label={`View ${item.filename}`}
      >
        {item.kind === "video" ? (
          <video src={src} className="size-full object-cover" muted />
        ) : (
          <img src={src} alt={item.filename} className="size-full object-cover" />
        )}
        <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs capitalize">
          {item.kind}
        </span>
        {optimized ? (
          <Badge className="absolute top-2 right-10 border-transparent bg-emerald-600 text-white hover:bg-emerald-600">
            Optimized
          </Badge>
        ) : queued ? (
          <Badge variant="secondary" className="absolute top-2 right-10">
            <Spinner />
            Optimizing…
          </Badge>
        ) : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2 cursor-pointer bg-background/90 shadow-sm"
              aria-label={`Actions for ${item.filename}`}
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => viewMediaInNewTab(item)}>
            <ExternalLinkIcon />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRename(item)}>
            <PencilIcon />
            Edit filename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadMedia(item)}>
            <DownloadIcon />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-col gap-2 p-3">
        <p
          className="cursor-pointer truncate text-sm font-medium hover:underline"
          title={item.filename}
          onClick={() => viewMediaInNewTab(item)}
        >
          {item.filename}
        </p>
        {canOptimize ? (
          <Button type="button" size="sm" className="w-full" onClick={() => onOptimize(item)}>
            Optimize
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MediaGrid({ items, loading, onOptimize, onDelete, onRename }) {
  if (loading) {
    return <MediaGridSkeleton />
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onOptimize={onOptimize}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </div>
  )
}
