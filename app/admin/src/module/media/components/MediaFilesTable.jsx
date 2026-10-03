import { format } from "date-fns"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { downloadMedia, viewMediaInNewTab } from "@/lib/media"

function StatusBadge({ item }) {
  const optimized = item.optimizeStatus === "completed"
  const queued = item.optimizeStatus === "queued"

  if (optimized) {
    return (
      <Badge className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600">
        Optimized
      </Badge>
    )
  }
  if (queued) {
    return (
      <Badge variant="secondary">
        <Spinner />
        Optimizing…
      </Badge>
    )
  }
  if (item.kind === "image") {
    return <span className="text-muted-foreground">Raw</span>
  }
  return <span className="text-muted-foreground">—</span>
}

function MediaRowActions({ item, onOptimize, onDelete, onRename }) {
  const queued = item.optimizeStatus === "queued"
  const canOptimize =
    item.kind === "image" && item.status === "completed" && item.optimizeStatus === "none" && !queued

  return (
    <div className="flex items-center justify-end gap-1">
      {canOptimize ? (
        <Button type="button" size="sm" onClick={() => onOptimize(item)}>
          Optimize
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${item.filename}`}
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
    </div>
  )
}

export function MediaFilesTable({ items, loading, onOptimize, onDelete, onRename }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">Preview</TableHead>
          <TableHead>Filename</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const src = mediaDisplayUrl(item)

          return (
            <TableRow key={item.id}>
              <TableCell>
                <button
                  type="button"
                  className="relative size-10 cursor-pointer overflow-hidden rounded-lg bg-muted"
                  onClick={() => viewMediaInNewTab(item)}
                  aria-label={`View ${item.filename}`}
                >
                  {item.kind === "video" ? (
                    <video src={src} className="size-full object-cover" muted />
                  ) : (
                    <img src={src} alt="" className="size-full object-cover" />
                  )}
                </button>
              </TableCell>
              <TableCell
                className="max-w-48 cursor-pointer truncate font-medium hover:underline"
                title={item.filename}
                onClick={() => viewMediaInNewTab(item)}
              >
                {item.filename}
              </TableCell>
              <TableCell className="capitalize">{item.kind}</TableCell>
              <TableCell>
                <StatusBadge item={item} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.createdAt ? format(new Date(item.createdAt), "d MMM yyyy") : "—"}
              </TableCell>
              <TableCell>
                <MediaRowActions item={item} onOptimize={onOptimize} onDelete={onDelete} onRename={onRename} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
