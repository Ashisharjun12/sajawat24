import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon, UsersIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { listCustomers, patchCustomerStatus } from "@/api/customers.api"
import { listAdmin as listCities } from "@/api/cities.api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { toast } from "@/components/ui/toast"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { CustomersTable } from "@/module/people/components/CustomersTable"
import { PeopleFilters } from "@/module/people/components/PeopleFilters"
import { CUSTOMER_STATUS_TABS } from "@/module/people/lib/customer-status"
import {
  customerFiltersActive,
  customerTabToStatus,
  queryToCustomerListParams,
} from "@/module/people/filters/customer-filter-query"
import { buildCustomerFilterFields } from "@/module/people/filters/people-filter-fields"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

const EMPTY_COPY = {
  all: {
    title: "No customers yet",
    description: "Customers appear here after they sign up and book.",
  },
  active: {
    title: "No active customers",
    description: "Active customers can browse and place bookings.",
  },
  blocked: {
    title: "No blocked customers",
    description: "Blocked customers cannot log in or book.",
  },
  search: {
    title: "No customers match",
    description: "Try a different name or phone number.",
  },
  filtered: {
    title: "No customers match",
    description: "Try different filter values.",
  },
}

export function CustomersPanel() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState("all")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingBlock, setPendingBlock] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [])

  const filterParams = useMemo(() => queryToCustomerListParams(filterQuery), [filterQuery])
  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status: customerTabToStatus(tab) ?? undefined,
      search: debouncedSearch || undefined,
      ...filterParams,
    }),
    [page, tab, debouncedSearch, filterParams],
  )

  const fields = useMemo(() => buildCustomerFilterFields({ cities }), [cities])

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const data = await listCustomers(listParams)
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
  const filtered = searched || customerFiltersActive(filterQuery)
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

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  function onFilterChange(next) {
    setFilterQuery(next)
    setPage(1)
  }

  function onView(customer) {
    navigate(`/people/customers/${customer.id}`)
  }

  function onToggleBlock(customer, nextStatus) {
    if (nextStatus === "blocked") {
      setPendingBlock(customer)
      return
    }
    void confirmStatusChange(customer, nextStatus)
  }

  async function confirmStatusChange(customer, nextStatus) {
    setSubmitting(true)
    try {
      await patchCustomerStatus(customer.id, nextStatus)
      toast.add({
        title: nextStatus === "blocked" ? `${customer.name} blocked` : `${customer.name} unblocked`,
        type: "success",
      })
      setPendingBlock(null)
      await load({ silent: true })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          {CUSTOMER_STATUS_TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
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

      <PeopleFilters fields={fields} query={filterQuery} onQueryChange={onFilterChange} />

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
          <CustomersTable
            items={items}
            loading={loading}
            onView={onView}
            onToggleBlock={onToggleBlock}
          />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingBlock)}
        onOpenChange={(open) => {
          if (!open && !submitting) setPendingBlock(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBlock
                ? `${pendingBlock.name} will not be able to log in or place new bookings.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={submitting}
              onClick={() => pendingBlock && confirmStatusChange(pendingBlock, "blocked")}
            >
              {submitting ? "Saving…" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
