import { useCallback, useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { listRefundRequests, patchRefundRequest } from "@/api/financials.api"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { RefundRequestsTable } from "@/module/payouts/components/RefundRequestsTable"
import { REFUND_STATUS_LABELS } from "@/module/payouts/lib/refund-format"

const LIMIT = 20

const STATUS_FILTERS = ["requested", "processing", "completed", "rejected", "all"]

export function RefundRequestsPanel({ userId, title, description, showCustomer = true }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("requested")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [filter, debouncedSearch, userId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listRefundRequests({
        page,
        limit: LIMIT,
        status: filter === "all" ? undefined : filter,
        userId: userId || undefined,
        q: debouncedSearch || undefined,
      })
      setItems(Array.isArray(data?.items) ? data.items : [])
      setTotal(data?.total ?? 0)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, filter, debouncedSearch, userId])

  useEffect(() => {
    void load()
  }, [load])

  async function onAction(id, action) {
    setActingId(id)
    try {
      await patchRefundRequest(id, { action })
      toast.add({ title: "Refund updated", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setActingId(null)
    }
  }

  const emptyTitle = debouncedSearch
    ? "No refunds match your search"
    : filter === "requested"
      ? "No pending refund requests"
      : "No refund requests in this filter"

  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <div>
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search booking, customer, product, reason…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : REFUND_STATUS_LABELS[value] ?? value}
            </Button>
          ))}
        </div>
      </div>

      <RefundRequestsTable
        items={items}
        loading={loading}
        actingId={actingId}
        onAction={onAction}
        showCustomer={showCustomer}
      />

      {!loading && items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>
              Customer refund requests appear here after a cancelled or disputed booking.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  )
}
