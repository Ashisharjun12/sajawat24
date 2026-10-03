import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutGridIcon, TableIcon } from "lucide-react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { listAdmin as listProducts } from "@/api/products.api"
import { listGlobalProductOccupancy } from "@/api/sections.api"
import { AdminInfoTip } from "@/components/admin-info-tip"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { ProductFilters } from "@/module/catalog/filters/ProductFilters"
import { buildProductFilterFields } from "@/module/catalog/filters/product-filter-fields"
import { queryToProductListParams } from "@/module/catalog/filters/product-filter-query"
import {
  coverImage,
  imageSrc,
  productCoverUrl,
} from "@/module/bookings/package-picker/package-picker.utils"
import { ListPagination } from "@/module/geo/components/ListPagination"

const PAGE_SIZE = 20

function clipName(name, max = 36) {
  const text = String(name ?? "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function productPickerStatus(product, excludeSet, occupancyByProduct, currentSectionId, enforceGlobalExclusive) {
  if (excludeSet.has(product.id)) return "In section"
  const occ = occupancyByProduct.get(product.id)
  if (enforceGlobalExclusive && occ && occ.sectionId !== currentSectionId) {
    return `In ${occ.sectionName}`
  }
  return product.isActive ? "Published" : "Draft"
}

function ProductGrid({ items, selectedIds, disabledIds, onToggle, loading, getStatusLabel }) {
  if (loading && !items.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!items.length) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((product) => {
        const checked = selectedIds.has(product.id)
        const disabled = disabledIds.has(product.id)
        const src = productCoverUrl(product)
        return (
          <div
            key={product.id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={() => {
              if (!disabled) onToggle(product)
            }}
            onKeyDown={(event) => {
              if (disabled) return
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onToggle(product)
              }
            }}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-colors",
              disabled && "cursor-not-allowed opacity-50",
              !disabled && checked && "ring-2 ring-primary",
              !disabled && !checked && "hover:bg-muted/40",
            )}
          >
            <span
              className="absolute top-2 left-2 z-10"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={checked || disabled}
                disabled={disabled}
                onCheckedChange={() => {
                  if (!disabled) onToggle(product)
                }}
                aria-label={`Select ${product.name}`}
              />
            </span>
            {disabled && getStatusLabel ? (
              <span className="absolute top-2 right-2 z-10 max-w-[45%] truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {getStatusLabel(product)}
              </span>
            ) : null}
            <span className="block aspect-square w-full bg-muted">
              {src ? (
                <img src={src} alt="" className="size-full object-cover" />
              ) : (
                <DecoryImageFallback />
              )}
            </span>
            <span className="block space-y-0.5 p-3">
              <span className="block truncate text-sm font-medium" title={product.name}>
                {clipName(product.name)}
              </span>
              {product.categoryName ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {product.categoryName}
                </span>
              ) : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ProductTable({ items, selectedIds, disabledIds, onToggle, loading, getStatusLabel }) {
  if (loading && !items.length) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="w-16" />
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-24">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => {
          const checked = selectedIds.has(product.id)
          const disabled = disabledIds.has(product.id)
          const cover = coverImage(product)
          const src = imageSrc(cover)
          return (
            <TableRow
              key={product.id}
              className={cn(
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                checked && "bg-primary/5",
              )}
              onClick={() => {
                if (!disabled) onToggle(product)
              }}
            >
              <TableCell onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={checked || disabled}
                  disabled={disabled}
                  onCheckedChange={() => {
                    if (!disabled) onToggle(product)
                  }}
                  aria-label={`Select ${product.name}`}
                />
              </TableCell>
              <TableCell>
                <span className="inline-flex size-14 overflow-hidden rounded-lg bg-muted">
                  {src ? (
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : (
                    <DecoryImageFallback />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium">{clipName(product.name, 48)}</div>
                {product.slug ? (
                  <div className="text-xs text-muted-foreground">{product.slug}</div>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {product.categoryName || "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {getStatusLabel ? getStatusLabel(product) : disabled ? "In section" : product.isActive ? "Published" : "Draft"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

const SECTION_PICKER_INFO =
  "One product per global section. Products already in another section cannot be added here."

export function SectionProductPickerDialog({
  open,
  onOpenChange,
  currentSectionId,
  enforceGlobalExclusive = false,
  excludeIds = [],
  maxAdd = 24,
  onConfirm,
}) {
  const [draft, setDraft] = useState([])
  const [view, setView] = useState("table")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [leaves, setLeaves] = useState([])
  const [cities, setCities] = useState([])
  const [occupancyItems, setOccupancyItems] = useState([])

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds])
  const occupancyByProduct = useMemo(
    () => new Map(occupancyItems.map((row) => [row.productId, row])),
    [occupancyItems],
  )
  const disabledIds = useMemo(() => {
    const set = new Set(excludeIds)
    if (enforceGlobalExclusive) {
      for (const row of occupancyItems) {
        if (row.sectionId !== currentSectionId) {
          set.add(row.productId)
        }
      }
    }
    return set
  }, [excludeIds, enforceGlobalExclusive, occupancyItems, currentSectionId])
  const getStatusLabel = useCallback(
    (product) =>
      productPickerStatus(
        product,
        excludeSet,
        occupancyByProduct,
        currentSectionId,
        enforceGlobalExclusive,
      ),
    [excludeSet, occupancyByProduct, currentSectionId, enforceGlobalExclusive],
  )
  const selectedIds = useMemo(() => new Set(draft.map((row) => row.id)), [draft])
  const filterFields = useMemo(
    () => buildProductFilterFields({ leaves, cities }),
    [leaves, cities],
  )
  const listParams = useMemo(() => {
    const params = queryToProductListParams(filterQuery)
    const search = debouncedProductSearch.trim()
    return {
      ...params,
      ...(search ? { q: search } : {}),
    }
  }, [filterQuery, debouncedProductSearch])

  const pageCount = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))
  const slotsLeft = Math.max(0, maxAdd)

  const loadLeaves = useCallback(async () => {
    const parents = await listCategories({ parentId: null, limit: 100 })
    const nested = await Promise.all(
      (parents.items ?? []).map(async (parent) => {
        const kids = await listCategories({ parentId: parent.id, limit: 100 })
        return (kids.items ?? []).map((child) => ({
          ...child,
          label: `${parent.name} / ${child.name}`,
        }))
      }),
    )
    setLeaves(nested.flat())
  }, [])

  useEffect(() => {
    if (!open) return
    setDraft([])
    setView("table")
    setPage(1)
    setProductSearch("")
    setDebouncedProductSearch("")
    setFilterQuery(createFilterQuery())
  }, [open])

  useEffect(() => {
    if (!open) return
    loadLeaves().catch(() => setLeaves([]))
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
    if (enforceGlobalExclusive) {
      listGlobalProductOccupancy()
        .then((data) => setOccupancyItems(data.items ?? []))
        .catch(() => setOccupancyItems([]))
    } else {
      setOccupancyItems([])
    }
  }, [open, loadLeaves, enforceGlobalExclusive])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  useEffect(() => {
    setPage(1)
  }, [debouncedProductSearch, filterQuery])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listProducts({ page, limit: PAGE_SIZE, ...listParams })
      .then((data) => {
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [open, page, listParams])

  function toggleItem(product) {
    if (disabledIds.has(product.id)) return
    const checked = selectedIds.has(product.id)
    if (checked) {
      setDraft((prev) => prev.filter((row) => row.id !== product.id))
      return
    }
    if (draft.length >= slotsLeft) {
      toast.add({
        title: `You can add at most ${slotsLeft} more product${slotsLeft === 1 ? "" : "s"}`,
        type: "error",
      })
      return
    }
    setDraft((prev) => [...prev, product])
  }

  function handleConfirm() {
    if (!draft.length) return
    onConfirm?.(draft)
    onOpenChange(false)
  }

  const empty = !loading && items.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-0.5">
            Add products
            {enforceGlobalExclusive ? <AdminInfoTip content={SECTION_PICKER_INFO} /> : null}
          </DialogTitle>
          <DialogDescription>Search catalog</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search by name or slug…"
              className="h-9 min-w-[14rem] flex-1"
              aria-label="Search products"
            />
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="table" aria-label="Table view">
                  <TableIcon />
                </TabsTrigger>
                <TabsTrigger value="grid" aria-label="Grid view">
                  <LayoutGridIcon />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ProductFilters
            fields={filterFields}
            query={filterQuery}
            onQueryChange={setFilterQuery}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No products match</EmptyTitle>
                <EmptyDescription>Try a different filter or search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-md border">
              {view === "grid" ? (
                <div className="p-3">
                  <ProductGrid
                    items={items}
                    selectedIds={selectedIds}
                    disabledIds={disabledIds}
                    getStatusLabel={getStatusLabel}
                    onToggle={toggleItem}
                    loading={loading}
                  />
                </div>
              ) : (
                <ProductTable
                  items={items}
                  selectedIds={selectedIds}
                  disabledIds={disabledIds}
                  getStatusLabel={getStatusLabel}
                  onToggle={toggleItem}
                  loading={loading}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
            {!loading && total > 0 ? ` · page ${page} of ${pageCount}` : ""}
            {!loading && slotsLeft < maxAdd ? ` · ${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left` : ""}
          </p>
          {pageCount > 1 ? (
            <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {draft.length
              ? `${draft.length} selected to add`
              : slotsLeft === 0
                ? "Section is full"
                : "Select products to add"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={draft.length === 0 || slotsLeft === 0}
            >
              Add{draft.length > 0 ? ` (${draft.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
