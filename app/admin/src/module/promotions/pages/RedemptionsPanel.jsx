import { useCallback, useEffect, useState } from "react"
import { SearchIcon, TicketPercentIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { listRedemptions } from "@/api/promotions.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { PromotionsRedemptionsTable } from "@/module/promotions/components/PromotionsRedemptionsTable"

const LIMIT = 20

export function RedemptionsPanel() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listRedemptions({
        page,
        limit: LIMIT,
        q: debouncedSearch || undefined,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const empty = !loading && items.length === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search coupon, order, or customer…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search redemptions"
        />
      </div>

      {empty ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TicketPercentIcon />
            </EmptyMedia>
            <EmptyTitle>
              {search.trim() ? "No redemptions match" : "No redemptions yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search.trim()
                ? "Try a different coupon code, order reference, or customer."
                : "Coupon usage will appear here after customers checkout with a code."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <PromotionsRedemptionsTable items={items} loading={loading} />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
