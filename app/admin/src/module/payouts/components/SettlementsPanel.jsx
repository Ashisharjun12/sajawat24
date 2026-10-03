import { useCallback, useEffect, useMemo, useState } from "react"
import { BanknoteIcon, WalletIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  getFinancialOverview,
  getPayoutRequests,
  getVendorLiabilities,
} from "@/api/payouts.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { PlatformOverviewCards } from "@/module/payouts/components/PlatformOverviewCards"
import { PayoutRequestDetailDialog } from "@/module/payouts/components/PayoutRequestDetailDialog"
import { PayoutRequestsTable } from "@/module/payouts/components/PayoutRequestsTable"
import { VendorLiabilityTable } from "@/module/payouts/components/VendorLiabilityTable"
import {
  PayoutRequestFilters,
  VendorLiabilityFilters,
} from "@/module/payouts/filters/payout-filters"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

export function SettlementsPanel({ sub = "liability", onSubChange }) {
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getFinancialOverview()
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: getApiError(err), type: "error" })
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PlatformOverviewCards overview={overview} loading={overviewLoading} />

      <Tabs value={sub} onValueChange={onSubChange}>
        <TabsList>
          <TabsTrigger value="liability">Vendor liability</TabsTrigger>
          <TabsTrigger value="requests">Payout requests</TabsTrigger>
        </TabsList>

        <TabsContent value="liability" className="pt-4">
          <VendorLiabilityList />
        </TabsContent>
        <TabsContent value="requests" className="pt-4">
          <PayoutRequestsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VendorLiabilityList() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getVendorLiabilities(listParams)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [listParams])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const searched = Boolean(debouncedSearch)
  const empty = !loading && items.length === 0

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <VendorLiabilityFilters q={search} onQ={onSearchChange} />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletIcon />
            </EmptyMedia>
            <EmptyTitle>{searched ? "No vendors match" : "No active vendors found"}</EmptyTitle>
            <EmptyDescription>
              {searched
                ? "Try a different vendor name or phone."
                : "Pending earnings, available balance, and COD dues appear here per vendor."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <VendorLiabilityTable items={items} loading={loading} />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

function PayoutRequestsList() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, status],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getPayoutRequests(listParams)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [listParams])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const searched = Boolean(debouncedSearch) || Boolean(status)
  const empty = !loading && items.length === 0

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  function onStatusChange(next) {
    setStatus(next)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <PayoutRequestFilters
        q={search}
        status={status}
        onQ={onSearchChange}
        onStatus={onStatusChange}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BanknoteIcon />
            </EmptyMedia>
            <EmptyTitle>{searched ? "No payouts match" : "No payout requests yet"}</EmptyTitle>
            <EmptyDescription>
              {searched
                ? "Try a different vendor or status."
                : "Vendor withdrawal requests appear here for manual payout processing."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <PayoutRequestsTable
            items={items}
            loading={loading}
            onRowClick={(row) => {
              setSelectedRequestId(row.id)
              setDetailOpen(true)
            }}
          />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}

      <PayoutRequestDetailDialog
        requestId={selectedRequestId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={load}
      />
    </div>
  )
}
