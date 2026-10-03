import { useCallback, useEffect, useMemo, useState } from "react"
import { PlusIcon, PackageIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { deleteProduct, listAdmin as listProducts, patchProduct } from "@/api/products.api"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { getApiError } from "@/api/api"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { toast } from "@/components/ui/toast"
import { ProductFilters } from "@/module/catalog/filters/ProductFilters"
import { buildProductFilterFields } from "@/module/catalog/filters/product-filter-fields"
import { productFiltersActive, queryToProductListParams } from "@/module/catalog/filters/product-filter-query"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { ProductsTable } from "@/module/catalog/components/ProductsTable"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

export function ProductsPanel() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterQuery, setFilterQuery] = useState(() => createFilterQuery())
  const [leaves, setLeaves] = useState([])
  const [cities, setCities] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(null)

  const listParams = useMemo(() => queryToProductListParams(filterQuery), [filterQuery])
  const filtered = productFiltersActive(filterQuery)
  const fields = useMemo(() => buildProductFilterFields({ leaves, cities }), [leaves, cities])

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

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
        const data = await listProducts({
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
    loadLeaves().catch((err) => setError(getApiError(err)))
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch((err) => setError(getApiError(err)))
  }, [loadLeaves])

  useEffect(() => {
    load()
  }, [load])

  async function onTogglePublished(product, nextActive) {
    const previous = items
    setItems((rows) =>
      rows.map((row) => (row.id === product.id ? { ...row, isActive: nextActive } : row)),
    )
    try {
      await patchProduct(product.id, { isActive: nextActive })
      toast.add({
        title: nextActive ? "Product published" : "Product moved to draft",
        type: "success",
      })
      await load({ silent: true })
    } catch (err) {
      setItems(previous)
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteProduct(deleting.id)
      toast.add({ title: "Product deleted", type: "success" })
      setDeleting(null)
      if (items.length === 1 && page > 1) {
        setPage(page - 1)
        return
      }
      await load({ silent: true })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  const empty = !loading && items.length === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ProductFilters
            fields={fields}
            query={filterQuery}
            onQueryChange={(next) => {
              setPage(1)
              setFilterQuery(next)
            }}
          />
        </div>
        <Button type="button" onClick={() => navigate("/catalog/products/new")}>
          <PlusIcon />
          Add product
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>{filtered ? "No products match" : "No products yet"}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try a different name, status, category, city, or price."
                : "Create a decoration with media, a subcategory, and city prices."}
            </EmptyDescription>
          </EmptyHeader>
          {filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={() => navigate("/catalog/products/new")}>
                Add product
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <ProductsTable
            items={items}
            loading={loading}
            onTogglePublished={onTogglePublished}
            onDelete={setDeleting}
          />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.name} will be removed, including its images, city prices, and add-on mappings. Media files stay in the library.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
