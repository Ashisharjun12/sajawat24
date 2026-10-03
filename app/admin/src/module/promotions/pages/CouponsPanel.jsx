import { useCallback, useEffect, useState } from "react"
import { PlusIcon, SearchIcon, TicketPercentIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createCoupon,
  getPromotionsOverview,
  listCoupons,
  setCouponStatus,
  updateCoupon,
} from "@/api/promotions.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { PromotionFormDialog } from "@/module/promotions/components/PromotionFormDialog"
import { PromotionsOverviewCards } from "@/module/promotions/components/PromotionsOverviewCards"
import { CouponsGrid } from "@/module/promotions/components/CouponsGrid"

const LIMIT = 9

export function CouponsPanel() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [overview, setOverview] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const [couponsData, overviewData] = await Promise.all([
        listCoupons({
          page,
          limit: LIMIT,
          q: debouncedSearch || undefined,
        }),
        getPromotionsOverview(),
      ])
      setItems(couponsData.items ?? [])
      setTotal(couponsData.total ?? 0)
      setOverview(overviewData)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditingCoupon(null)
    setDialogOpen(true)
  }

  function openEdit(coupon) {
    setEditingCoupon(coupon)
    setDialogOpen(true)
  }

  async function handleSave(payload) {
    setSubmitting(true)
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload)
        toast.add({ title: "Coupon updated", type: "success" })
      } else {
        await createCoupon(payload)
        toast.add({ title: "Coupon created", type: "success" })
      }
      setDialogOpen(false)
      await load({ silent: true })
    } catch (err) {
      toast.add({ title: "Could not save coupon", description: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(coupon) {
    const isActive = coupon.status === "disabled"
    try {
      await setCouponStatus(coupon.id, isActive)
      toast.add({
        title: isActive ? "Coupon enabled" : "Coupon disabled",
        type: "success",
      })
      await load({ silent: true })
    } catch (err) {
      toast.add({ title: "Could not update status", description: getApiError(err), type: "error" })
    }
  }

  async function handleCopyCode(code) {
    try {
      await navigator.clipboard.writeText(code)
      toast.add({ title: "Copied", description: code, type: "success" })
    } catch {
      toast.add({ title: "Could not copy", type: "error" })
    }
  }

  const empty = !loading && items.length === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      <PromotionsOverviewCards overview={overview} loading={loading && !overview} />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search code or name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search coupons"
          />
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Create coupon
        </Button>
      </div>

      {empty ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TicketPercentIcon />
            </EmptyMedia>
            <EmptyTitle>{search.trim() ? "No coupons match" : "No coupons yet"}</EmptyTitle>
            <EmptyDescription>
              {search.trim()
                ? "Try a different code or name."
                : "Create a coupon to get started."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <CouponsGrid
            items={items}
            loading={loading}
            onEdit={openEdit}
            onToggleStatus={handleToggleStatus}
            onCopyCode={handleCopyCode}
          />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={editingCoupon}
        onSubmit={handleSave}
        submitting={submitting}
      />
    </div>
  )
}
