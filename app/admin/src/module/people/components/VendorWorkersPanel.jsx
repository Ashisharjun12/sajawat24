import { useCallback, useEffect, useMemo, useState } from "react"
import { SearchIcon, UsersIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { listVendorWorkers } from "@/api/vendors.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { VendorWorkersTable } from "@/module/people/components/VendorWorkersTable"
import {
  VENDOR_WORKER_STATUS_TABS,
  workerTabToStatus,
} from "@/module/people/lib/vendor-worker-status"

const LIMIT = 20

const EMPTY_COPY = {
  all: {
    title: "No workers yet",
    description: "This shop has not invited any field workers in the partner app.",
  },
  active: {
    title: "No active workers",
    description: "Workers who completed staff login appear here.",
  },
  invited: {
    title: "No invited workers",
    description: "Pending invites show up until they sign in with staff login.",
  },
  disabled: {
    title: "No disabled workers",
    description: "Workers removed by the owner appear here.",
  },
  search: {
    title: "No workers match",
    description: "Try a different name or phone number.",
  },
}

function tabCount(tab, counts) {
  if (!counts) return null
  if (tab === "all") return counts.all
  return counts[tab] ?? 0
}

export function VendorWorkersPanel({ vendorId }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState(null)
  const [tab, setTab] = useState("all")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
      status: workerTabToStatus(tab),
    }),
    [page, tab, debouncedSearch],
  )

  const load = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    setError("")
    try {
      const data = await listVendorWorkers(vendorId, listParams)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setStatusCounts(data.statusCounts ?? null)
    } catch (err) {
      setError(getApiError(err))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [vendorId, listParams])

  useEffect(() => {
    void load()
  }, [load])

  const searched = Boolean(debouncedSearch)
  const empty = !loading && items.length === 0
  const emptyCopy = searched ? EMPTY_COPY.search : EMPTY_COPY[tab] ?? EMPTY_COPY.all

  function onTabChange(next) {
    setTab(next)
    setPage(1)
  }

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line" className="flex-wrap">
          {VENDOR_WORKER_STATUS_TABS.map((item) => {
            const count = tabCount(item.value, statusCounts)
            return (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
                {count != null ? (
                  <span className="ms-1.5 text-muted-foreground tabular-nums">({count})</span>
                ) : null}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={onSearchChange}
          placeholder="Search name or phone"
          className="pl-9"
        />
      </div>

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyCopy.title}</EmptyTitle>
            <EmptyDescription>{emptyCopy.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <VendorWorkersTable items={items} loading={loading} />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
