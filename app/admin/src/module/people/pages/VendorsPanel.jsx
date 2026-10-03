import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon, StoreIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { listAdmin as listCities } from "@/api/cities.api"
import { listVendors, patchVendorStatus } from "@/api/vendors.api"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
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
import { PeopleFilters } from "@/module/people/components/PeopleFilters"
import { VendorsTable } from "@/module/people/components/VendorsTable"
import {
  queryToVendorListParams,
  vendorFiltersActive,
} from "@/module/people/filters/vendor-filter-query"
import { buildVendorFilterFields } from "@/module/people/filters/people-filter-fields"
import { VENDOR_STATUS_TABS, vendorTabToStatus } from "@/module/people/lib/vendor-status"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

const EMPTY_COPY = {
  pending: {
    title: "No vendors awaiting approval",
    description: "New vendor registrations will appear here for review.",
  },
  active: {
    title: "No active vendors",
    description: "Approved vendors who can receive assignments appear here.",
  },
  rejected: {
    title: "No rejected vendors",
    description: "Declined vendor applications appear here.",
  },
  blocked: {
    title: "No blocked vendors",
    description: "Blocked vendors cannot receive new assignments.",
  },
  all: {
    title: "No vendors yet",
    description: "Vendors appear here after they register on the mobile app.",
  },
  search: {
    title: "No vendors match",
    description: "Try a different name, phone, or city.",
  },
  filtered: {
    title: "No vendors match",
    description: "Try different filter values.",
  },
}

export function VendorsPanel() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState("pending")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialog, setDialog] = useState(null)
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

  const filterParams = useMemo(() => queryToVendorListParams(filterQuery), [filterQuery])
  const fields = useMemo(() => buildVendorFilterFields({ cities }), [cities])
  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status: vendorTabToStatus(tab) ?? undefined,
      search: debouncedSearch || undefined,
      ...filterParams,
    }),
    [page, tab, debouncedSearch, filterParams],
  )

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const data = await listVendors(listParams)
      setItems(
        (data.items ?? []).map((vendor) => ({
          ...vendor,
          city: vendor.cityName,
        })),
      )
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
  const filtered = searched || vendorFiltersActive(filterQuery)
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

  function onView(vendor) {
    navigate(`/people/vendors/${vendor.id}`)
  }

  function onApprove(vendor) {
    setDialog({ type: "approve", vendor })
  }

  function onReject(vendor) {
    setDialog({ type: "reject", vendor })
  }

  function onBlock(vendor) {
    setDialog({ type: "block", vendor })
  }

  async function confirmDialog() {
    if (!dialog?.vendor) return
    const { vendor, type } = dialog
    const statusMap = {
      approve: "ACTIVE",
      reject: "REJECTED",
      block: "BLOCKED",
    }
    const nextStatus = statusMap[type]
    if (!nextStatus) return

    setSubmitting(true)
    try {
      await patchVendorStatus(vendor.id, nextStatus)
      toast.add({
        title:
          type === "approve"
            ? `${vendor.name} approved`
            : type === "reject"
              ? `${vendor.name} rejected`
              : `${vendor.name} blocked`,
        type: "success",
      })
      setDialog(null)
      await load({ silent: true })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const dialogCopy = {
    approve: {
      title: "Approve this vendor?",
      description: (name) =>
        `${name} will become active and can be assigned to bookings.`,
      action: "Approve",
      destructive: false,
    },
    reject: {
      title: "Reject this vendor?",
      description: (name) =>
        `${name} will not be able to receive assignments unless approved later.`,
      action: "Reject",
      destructive: true,
    },
    block: {
      title: "Block this vendor?",
      description: (name) =>
        `${name} will be blocked from receiving new assignments.`,
      action: "Block",
      destructive: true,
    },
  }

  const activeDialog = dialog ? dialogCopy[dialog.type] : null

  return (
    <div className="flex flex-col gap-4 pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          {VENDOR_STATUS_TABS.map((item) => (
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
          placeholder="Search name, phone, or city"
          className="pl-9"
        />
      </div>

      <PeopleFilters fields={fields} query={filterQuery} onQueryChange={onFilterChange} />

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <StoreIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyCopy.title}</EmptyTitle>
            <EmptyDescription>{emptyCopy.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <VendorsTable
            items={items}
            loading={loading}
            onView={onView}
            onApprove={onApprove}
            onReject={onReject}
            onBlock={onBlock}
          />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open && !submitting) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{activeDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.vendor && activeDialog
                ? activeDialog.description(dialog.vendor.name)
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={activeDialog?.destructive ? "destructive" : "default"}
              disabled={submitting}
              onClick={confirmDialog}
            >
              {submitting ? "Saving…" : activeDialog?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
