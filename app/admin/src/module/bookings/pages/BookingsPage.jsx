import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClockIcon, PlusIcon } from "lucide-react"
import { listBookings } from "@/api/bookings.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { getApiError } from "@/api/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { BookingSearchBar } from "@/module/bookings/components/BookingSearchBar"
import { BookingsTable } from "@/module/bookings/components/BookingsTable"
import { BookingFilters } from "@/module/bookings/filters/BookingFilters"
import { buildBookingFilterFields } from "@/module/bookings/filters/booking-filter-fields"
import {
  bookingFiltersActive,
  queryToBookingListParams,
  tabToBookingListParams,
} from "@/module/bookings/filters/booking-filter-query"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { Button } from "@/components/ui/button"

const LIMIT = 20

const TABS = [
  { value: "needs-assign", label: "Needs assign" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
]

const EMPTY_COPY = {
  "needs-assign": {
    title: "No bookings need assignment",
    description: "Confirmed bookings waiting for a decorator will show up here.",
  },
  assigned: {
    title: "No assigned bookings",
    description: "Bookings with an assigned decorator appear in this tab.",
  },
  completed: {
    title: "No completed bookings",
    description: "Finished setups will appear here once marked complete.",
  },
  all: {
    title: "No bookings yet",
    description: "Customer bookings will appear here after checkout.",
  },
  search: {
    title: "No bookings match",
    description: "Try a different reference, order ID, phone, name, or pincode.",
  },
  filtered: {
    title: "No bookings match",
    description: "Try a different city, payment method, or status filter.",
  },
}

export function BookingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("needs-assign")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [cities, setCities] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const filterParams = useMemo(() => queryToBookingListParams(filterQuery), [filterQuery])
  const tabParams = useMemo(() => tabToBookingListParams(tab), [tab])
  const listParams = useMemo(
    () => ({
      ...tabParams,
      ...filterParams,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    }),
    [tabParams, filterParams, debouncedSearch],
  )
  const searched = Boolean(debouncedSearch)
  const filtered = searched || bookingFiltersActive(filterQuery)
  const fields = useMemo(() => buildBookingFilterFields({ cities }), [cities])

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const data = await listBookings({
        page,
        limit: LIMIT,
        ...listParams,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page, listParams])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch((err) => setError(getApiError(err)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const empty = !loading && items.length === 0
  const emptyCopy = searched
    ? EMPTY_COPY.search
    : filtered
      ? EMPTY_COPY.filtered
      : EMPTY_COPY[tab] ?? EMPTY_COPY.all

  function onTabChange(next) {
    setTab(next)
    setPage(1)
  }

  function onFilterChange(next) {
    setPage(1)
    setFilterQuery(next)
  }

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review customer bookings, filter by city or payment, and open a booking to assign a
            decorator.
          </p>
        </div>
        <Button type="button" onClick={() => navigate("/bookings/new")}>
          <PlusIcon />
          Add booking
        </Button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0" variant="line">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto pt-4">
          <BookingSearchBar value={search} onChange={onSearchChange} />
          <BookingFilters fields={fields} query={filterQuery} onQueryChange={onFilterChange} />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {empty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClockIcon />
                </EmptyMedia>
                <EmptyTitle>{emptyCopy.title}</EmptyTitle>
                <EmptyDescription>{emptyCopy.description}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <BookingsTable items={items} loading={loading} />
              <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
