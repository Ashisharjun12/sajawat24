import { useCallback, useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import {
  createCustomerReview,
  deleteCustomerReview,
  listCustomerReviews,
  patchCustomerReview,
} from "@/api/reviews.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { CustomerReviewFormDialog } from "@/module/reviews/components/CustomerReviewFormDialog"
import { CustomerReviewsTable } from "@/module/reviews/components/CustomerReviewsTable"

const PAGE_SIZE = 20

export function CustomerReviewsPanel({ productId, productName } = {}) {
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
      const data = await listCustomerReviews({
        page,
        limit: PAGE_SIZE,
        ...(productId ? { productId } : {}),
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
  }, [page, productId, debouncedSearch, status])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, productId])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(body) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        await patchCustomerReview(editing.id, body)
        toast.add({ title: "Review updated", type: "success" })
      } else {
        await createCustomerReview(body)
        toast.add({ title: "Review created", type: "success" })
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
      await deleteCustomerReview(row.id)
      toast.add({ title: "Review deleted", type: "success" })
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
          placeholder="Search reviewer, text, product…"
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
          Add review
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <CustomerReviewsTable
          items={items}
          loading={loading}
          productId={productId}
          onEdit={(row) => {
            setEditing(row)
            setDialogOpen(true)
          }}
          onDelete={onDelete}
        />
        {!loading ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {total} review{total === 1 ? "" : "s"}
            </p>
            <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        ) : null}
      </div>

      <CustomerReviewFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        review={editing}
        productId={productId}
        productName={productName}
        submitting={submitting}
        onSubmit={onSave}
      />
    </div>
  )
}
