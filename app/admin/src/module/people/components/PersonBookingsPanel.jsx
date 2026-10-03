import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClockIcon } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { BookingSearchBar } from "@/module/bookings/components/BookingSearchBar"
import { BookingsTable } from "@/module/bookings/components/BookingsTable"
import { BookingFilters } from "@/module/bookings/filters/BookingFilters"
import { buildBookingFilterFields } from "@/module/bookings/filters/booking-filter-fields"
import {
  bookingFiltersActive,
  queryToBookingListParams,
} from "@/module/bookings/filters/booking-filter-query"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 10

export function PersonBookingsPanel({ userId, vendorId, title = "Bookings", description }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [])

  const filterParams = useMemo(() => queryToBookingListParams(filterQuery), [filterQuery])
  const fields = useMemo(() => buildBookingFilterFields({ cities }), [cities])
  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      sort: "created_at",
      ...(userId ? { userId } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...filterParams,
    }),
    [page, userId, vendorId, debouncedSearch, filterParams],
  )

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const data = await listBookings(listParams)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [listParams])

  useEffect(() => {
    load()
  }, [load])

  const searched = Boolean(debouncedSearch)
  const filtered = searched || bookingFiltersActive(filterQuery)
  const empty = !loading && items.length === 0

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  function onFilterChange(next) {
    setFilterQuery(next)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ??
            (userId
              ? "Orders placed by this customer."
              : "Jobs assigned to this vendor.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
              <EmptyTitle>{filtered ? "No bookings match" : "No bookings yet"}</EmptyTitle>
              <EmptyDescription>
                {filtered
                  ? "Try a different search term or filter."
                  : userId
                    ? "This customer has not placed any orders."
                    : "This vendor has not been assigned to any jobs."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            <BookingsTable items={items} loading={loading} />
            <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
