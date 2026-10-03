import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { ProductFilters } from "@/module/catalog/filters/ProductFilters"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { PackageList } from "@/module/bookings/package-picker/PackageList"

export function PackageProductsPanel({
  selectedState,
  selectedCity,
  productSearch,
  onProductSearchChange,
  fields,
  filterQuery,
  onFilterQueryChange,
  page,
  onPageChange,
  limit,
  total,
  products,
  loading,
  error,
  selectedProductId,
  onSelectProduct,
}) {
  if (!selectedState) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a state on the left to browse packages.
      </div>
    )
  }

  if (!selectedCity) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a city in {selectedState} to see packages.
      </div>
    )
  }

  const cityId = selectedCity.id

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Packages in {selectedCity.name}</p>
        <p className="text-xs text-muted-foreground">
          Search and filter — results are paginated.
        </p>
      </div>

      <Input
        value={productSearch}
        onChange={(event) => onProductSearchChange(event.target.value)}
        placeholder="Search packages…"
        className="h-9"
      />

      <ProductFilters
        fields={fields}
        query={filterQuery}
        onQueryChange={(next) => {
          onPageChange(1)
          onFilterQueryChange(next)
        }}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <PackageList
        items={products}
        cityId={cityId}
        selectedProductId={selectedProductId}
        loading={loading}
        onSelect={onSelectProduct}
      />

      <ListPagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  )
}
