import { useCallback, useEffect, useMemo, useState } from "react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { getApiError } from "@/api/api"
import { listAdmin as listProducts } from "@/api/products.api"
import { Button } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { cn } from "@/lib/utils"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { ProductFilters } from "@/module/catalog/filters/ProductFilters"
import { buildProductFilterFields } from "@/module/catalog/filters/product-filter-fields"
import { queryToProductListParams } from "@/module/catalog/filters/product-filter-query"
import { productCoverUrl } from "@/module/bookings/package-picker/package-picker.utils"
import { ListPagination } from "@/module/geo/components/ListPagination"

const PAGE_SIZE = 20

function clipName(name, max = 40) {
  const text = String(name ?? "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function ProductPickGrid({ items, selectedId, onSelect, loading }) {
  if (loading && !items.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((product) => {
        const src = productCoverUrl(product)
        const isSelected = selectedId === product.id
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-colors hover:bg-muted/40",
              isSelected ? "border-primary ring-2 ring-primary" : "border-border",
            )}
          >
            <span className="block aspect-square w-full bg-muted">
              {src ? (
                <img src={src} alt="" className="size-full object-cover" />
              ) : (
                <DecoryImageFallback />
              )}
            </span>
            <span className="block space-y-0.5 p-3">
              <span className="line-clamp-2 text-sm font-medium leading-snug" title={product.name}>
                {clipName(product.name, 56)}
              </span>
              {product.categoryName ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {product.categoryName}
                </span>
              ) : null}
              {isSelected ? (
                <span className="block text-xs font-medium text-primary">Selected</span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function AppBannerProductPickerDialog({ open, onOpenChange, onSelect, selectedId }) {
  const [productSearch, setProductSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [leaves, setLeaves] = useState([])
  const [cities, setCities] = useState([])
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filterFields = useMemo(
    () => buildProductFilterFields({ leaves, cities }),
    [leaves, cities],
  )

  const listParams = useMemo(() => {
    const params = queryToProductListParams(filterQuery)
    const search = debouncedSearch.trim()
    return {
      ...params,
      ...(search ? { q: search } : {}),
      isActive: params.isActive ?? "true",
    }
  }, [filterQuery, debouncedSearch])

  const pageCount = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))

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
    loadLeaves().catch(() => setLeaves([]))
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [open, loadLeaves])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(productSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  useEffect(() => {
    if (!open) return
    setPage(1)
  }, [debouncedSearch, filterQuery, open])

  useEffect(() => {
    if (!open) {
      setProductSearch("")
      setDebouncedSearch("")
      setFilterQuery(createFilterQuery())
      setPage(1)
      setError("")
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError("")
    listProducts({ page, limit: PAGE_SIZE, ...listParams })
      .then((data) => {
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((err) => {
        setItems([])
        setTotal(0)
        setError(getApiError(err))
      })
      .finally(() => setLoading(false))
  }, [open, page, listParams])

  function handleSelect(product) {
    onSelect?.(product)
    onOpenChange(false)
  }

  const empty = !loading && items.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-4 overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Search product</DialogTitle>
          <DialogDescription>
            Use search and catalog filters — same as Products. Tap a card to select.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search by name or slug…"
            className="h-9"
            autoFocus
            aria-label="Search products"
          />
          <ProductFilters
            fields={filterFields}
            query={filterQuery}
            onQueryChange={setFilterQuery}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No products match</EmptyTitle>
                <EmptyDescription>Try a different filter or search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-md border p-3">
              <ProductPickGrid
                items={items}
                selectedId={selectedId}
                onSelect={handleSelect}
                loading={loading}
              />
              {loading && items.length > 0 ? (
                <div className="flex justify-center py-4">
                  <Spinner className="size-5" />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {loading && !items.length
              ? "Loading…"
              : `${total} product${total === 1 ? "" : "s"}`}
            {!loading && total > 0 ? ` · page ${page} of ${pageCount}` : ""}
          </p>
          {pageCount > 1 ? (
            <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
