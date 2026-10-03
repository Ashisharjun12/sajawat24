import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutGridIcon, TableIcon, XIcon } from "lucide-react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { listAdmin as listProducts } from "@/api/products.api"
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
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { ProductFilters } from "@/module/catalog/filters/ProductFilters"
import { buildProductFilterFields } from "@/module/catalog/filters/product-filter-fields"
import { queryToProductListParams } from "@/module/catalog/filters/product-filter-query"
import {
  coverImage,
  imageSrc,
  productCoverUrl,
} from "@/module/bookings/package-picker/package-picker.utils"
import { CouponCategoryPickerTable } from "@/module/promotions/components/CouponCategoryPickerTable"
import { ListPagination } from "@/module/geo/components/ListPagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE = 20

function clipName(name, max = 36) {
  const text = String(name ?? "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function ProductGrid({ items, selectedIds, onToggle, loading }) {
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
        const src = productCoverUrl(product)
        return (
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(product)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onToggle(product)
              }
            }}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-colors",
              checked ? "ring-2 ring-primary" : "hover:bg-muted/40",
            )}
          >
            <span
              className="absolute top-2 left-2 z-10"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(product)}
                aria-label={`Select ${product.name}`}
              />
            </span>
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

function ProductTable({ items, selectedIds, onToggle, loading }) {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => {
          const checked = selectedIds.has(product.id)
          const cover = coverImage(product)
          const src = imageSrc(cover)
          return (
            <TableRow
              key={product.id}
              className={cn("cursor-pointer", checked && "bg-primary/5")}
              onClick={() => onToggle(product)}
            >
              <TableCell onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggle(product)}
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
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function CouponTargetPickerDialog({
  open,
  onOpenChange,
  mode,
  value = [],
  labels = [],
  onConfirm,
}) {
  const isProducts = mode === "products"
  const title = isProducts ? "Choose products" : "Choose categories"
  const description = isProducts
    ? "Browse packages with filters — same as catalog. Select all products this coupon applies to."
    : "Browse categories in a table — search, filter by group and status, then select subcategories."

  const [draftIds, setDraftIds] = useState(value)
  const [draftLabels, setDraftLabels] = useState(labels)
  const [view, setView] = useState("table")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("")
  const [categoryStatus, setCategoryStatus] = useState("published")
  const [categoryParentId, setCategoryParentId] = useState("all")
  const [parentCategories, setParentCategories] = useState([])
  const [parentMap, setParentMap] = useState({})
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [leaves, setLeaves] = useState([])
  const [cities, setCities] = useState([])

  const selectedIds = useMemo(() => new Set(draftIds), [draftIds])
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
      isActive: params.isActive ?? "true",
    }
  }, [filterQuery, debouncedProductSearch])

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
    setDraftIds(value)
    setDraftLabels(labels)
    setView("table")
    setPage(1)
    setProductSearch("")
    setDebouncedProductSearch("")
    setCategorySearch("")
    setDebouncedCategorySearch("")
    setCategoryStatus("published")
    setCategoryParentId("all")
    setFilterQuery(createFilterQuery())
  }, [open, value, labels])

  useEffect(() => {
    if (!open || !isProducts) return
    loadLeaves().catch(() => setLeaves([]))
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [open, isProducts, loadLeaves])

  useEffect(() => {
    if (!open || isProducts) return
    listCategories({ parentId: null, limit: 100, isActive: "true" })
      .then((data) => {
        const parents = data.items ?? []
        setParentCategories(parents)
        setParentMap(Object.fromEntries(parents.map((row) => [row.id, row.name])))
      })
      .catch(() => {
        setParentCategories([])
        setParentMap({})
      })
  }, [open, isProducts])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCategorySearch(categorySearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [categorySearch])

  useEffect(() => {
    setPage(1)
  }, [debouncedProductSearch, filterQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedCategorySearch, categoryStatus, categoryParentId])

  useEffect(() => {
    if (!open) return
    setLoading(true)

    const request = isProducts
      ? listProducts({ page, limit: PAGE_SIZE, ...listParams })
      : listCategories({
          page,
          limit: PAGE_SIZE,
          ...(categoryStatus === "published"
            ? { isActive: "true" }
            : categoryStatus === "draft"
              ? { isActive: "false" }
              : {}),
          ...(debouncedCategorySearch ? { q: debouncedCategorySearch } : {}),
          ...(categoryParentId === "all"
            ? {}
            : categoryParentId === "top"
              ? { parentId: "null" }
              : { parentId: categoryParentId }),
        })

    request
      .then((data) => {
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [
    open,
    isProducts,
    page,
    listParams,
    debouncedCategorySearch,
    categoryStatus,
    categoryParentId,
  ])

  function toggleItem(item) {
    const checked = selectedIds.has(item.id)
    if (checked) {
      setDraftIds((prev) => prev.filter((id) => id !== item.id))
      setDraftLabels((prev) => prev.filter((row) => row.id !== item.id))
    } else {
      setDraftIds((prev) => [...prev, item.id])
      setDraftLabels((prev) => [
        ...prev.filter((row) => row.id !== item.id),
        { id: item.id, name: item.name },
      ])
    }
  }

  function removeChip(id) {
    setDraftIds((prev) => prev.filter((rowId) => rowId !== id))
    setDraftLabels((prev) => prev.filter((row) => row.id !== id))
  }

  function handleConfirm() {
    onConfirm?.({ ids: draftIds, labels: draftLabels })
    onOpenChange(false)
  }

  const empty = !loading && items.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col gap-4 overflow-hidden",
          "sm:max-w-4xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {draftLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {draftLabels.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
              >
                <span className="truncate">{chip.name}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-0.5 hover:bg-muted"
                  onClick={() => removeChip(chip.id)}
                  aria-label={`Remove ${chip.name}`}
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {isProducts ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search products by name or slug…"
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
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories by name or slug…"
              className="h-9 min-w-56 flex-1"
              aria-label="Search categories"
            />
            <Select value={categoryParentId} onValueChange={setCategoryParentId}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                <SelectItem value="top">Top-level only</SelectItem>
                {parentCategories.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryStatus} onValueChange={setCategoryStatus}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="all">All status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>
                  {isProducts ? "No products match" : "No categories found"}
                </EmptyTitle>
                <EmptyDescription>
                  {isProducts
                    ? "Try a different filter or search term."
                    : "Try a different category name."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : isProducts ? (
            <div className="overflow-hidden rounded-md border">
              {view === "grid" ? (
                <div className="p-3">
                  <ProductGrid
                    items={items}
                    selectedIds={selectedIds}
                    onToggle={toggleItem}
                    loading={loading}
                  />
                </div>
              ) : (
                <ProductTable
                  items={items}
                  selectedIds={selectedIds}
                  onToggle={toggleItem}
                  loading={loading}
                />
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <CouponCategoryPickerTable
                items={items}
                selectedIds={selectedIds}
                parentMap={parentMap}
                onToggle={toggleItem}
                loading={loading}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : isProducts
                ? `${total} product${total === 1 ? "" : "s"}`
                : `${total} categor${total === 1 ? "y" : "ies"}`}
            {!loading && total > 0 ? ` · page ${page} of ${pageCount}` : ""}
          </p>
          {pageCount > 1 ? (
            <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {draftIds.length ? `${draftIds.length} selected` : "Select items to add"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={draftIds.length === 0}>
              Add{draftIds.length > 0 ? ` (${draftIds.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
