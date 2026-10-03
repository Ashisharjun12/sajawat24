import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import {
  createVideoReview,
  deleteVideoReview,
  listVideoReviews,
  patchVideoReview,
} from "@/api/reviews.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { VideoReviewFormDialog } from "@/module/reviews/components/VideoReviewFormDialog"

const PAGE_SIZE = 20

function statusBadge(status) {
  if (status === "published") return <Badge>Published</Badge>
  if (status === "hidden") return <Badge variant="secondary">Hidden</Badge>
  return <Badge variant="outline">Draft</Badge>
}

export function VideoReviewsPanel() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listVideoReviews({
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
        ...(status !== "all" ? { status } : {}),
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(body) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        await patchVideoReview(editing.id, body)
        toast.add({ title: "Video review updated", type: "success" })
      } else {
        await createVideoReview(body)
        toast.add({ title: "Video review created", type: "success" })
      }
      setDialogOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(row) {
    try {
      await deleteVideoReview(row.id)
      toast.add({ title: "Video review deleted", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by caption…"
          className="h-9 min-w-56 flex-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <PlusIcon />
          Add video
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Video</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="size-14 overflow-hidden rounded-lg bg-muted">
                      {row.video?.thumbnailUrl ? (
                        <img src={row.video.thumbnailUrl} alt="" className="size-full object-cover" />
                      ) : row.video?.url ? (
                        <video src={row.video.url} className="size-full object-cover" muted playsInline />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate font-medium">{row.caption || "—"}</TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.updatedAt ? format(new Date(row.updatedAt), "d MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button type="button" variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(row)
                            setDialogOpen(true)
                          }}
                        >
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {total} video{total === 1 ? "" : "s"}
        </p>
        {total > PAGE_SIZE ? (
          <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
        ) : null}
      </div>

      <VideoReviewFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        review={editing}
        submitting={submitting}
        onSubmit={onSave}
      />
    </div>
  )
}
