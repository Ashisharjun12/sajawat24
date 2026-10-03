import { useCallback, useEffect, useState } from "react"
import { MessageSquareQuoteIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createCmsTestimonial,
  deleteCmsTestimonial,
  listCmsTestimonials,
  patchCmsTestimonial,
} from "@/api/cms.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { toast } from "@/components/ui/toast"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { TestimonialFormDialog } from "@/module/cms/components/TestimonialFormDialog"
import { CMS_PAGE_SIZE } from "@/module/cms/lib/cms-pagination"
import { ListPagination } from "@/module/geo/components/ListPagination"

function statusBadge(status) {
  if (status === "published") return <Badge className="text-xs">Published</Badge>
  if (status === "hidden") return <Badge variant="secondary" className="text-xs">Hidden</Badge>
  return <Badge variant="outline" className="text-xs">Draft</Badge>
}

export function TestimonialsPanel({ cities }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listCmsTestimonials({ page, limit: CMS_PAGE_SIZE })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setItems([])
      setTotal(0)
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleSave(body) {
    setSubmitting(true)
    try {
      const { avatarUrl, cityName, avatar, ...payload } = body
      if (editing?.id) {
        await patchCmsTestimonial(editing.id, payload)
        toast.add({ title: "Testimonial saved", type: "success" })
      } else {
        await createCmsTestimonial(payload)
        toast.add({ title: "Testimonial created", type: "success" })
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

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteCmsTestimonial(deleting.id)
      toast.add({ title: "Testimonial deleted", type: "success" })
      setDeleting(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setDeletingBusy(false)
    }
  }

  const empty = !loading && !error && total === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!empty ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={openCreate}>
            <PlusIcon />
            Add testimonial
          </Button>
        </div>
      ) : null}

      {empty ? (
        <CmsEmptyState
          icon={MessageSquareQuoteIcon}
          title="No testimonials yet"
          description="Add customer quotes to showcase on your homepage."
          actionLabel="Create testimonial"
          onAction={openCreate}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-md border">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.reviewerName}</div>
                      <div className="text-xs text-muted-foreground">{row.reviewerCity}</div>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">{row.quote}</TableCell>
                    <TableCell>{row.cityName ?? "Global"}</TableCell>
                    <TableCell>{row.rating} ★</TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(row); setDialogOpen(true) }}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row)}>
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
          <ListPagination page={page} limit={CMS_PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      <TestimonialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        cities={cities}
        submitting={submitting}
        onSubmit={handleSave}
      />

      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete this testimonial?"
        description="This removes the quote from the storefront."
        confirming={deletingBusy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
