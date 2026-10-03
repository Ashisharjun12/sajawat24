import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PackageConfigurePanel } from "@/module/bookings/package-picker/PackageConfigurePanel"
import { PackageLocationPanel } from "@/module/bookings/package-picker/PackageLocationPanel"
import { PackageProductsPanel } from "@/module/bookings/package-picker/PackageProductsPanel"
import { usePackagePicker } from "@/module/bookings/package-picker/use-package-picker"

export function PackagePickerDialog({
  open,
  onOpenChange,
  initialCityId,
  initialSelection,
  onConfirm,
}) {
  const picker = usePackagePicker({ open, initialCityId, initialSelection })

  const cityId = picker.selectedCity?.id ?? ""
  const cityName = picker.selectedCity?.name ?? ""
  const showingProduct = Boolean(picker.selectedProductId)

  function handleConfirm() {
    const result = picker.confirmDraft()
    if (!result.ok) return
    onConfirm(result.selection)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Select package</DialogTitle>
          <DialogDescription>
            Pick state and city on the left, browse packages, then choose setup time and add-ons.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border">
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <PackageLocationPanel
                states={picker.states}
                statesLoading={picker.citiesLoading}
                selectedState={picker.selectedState}
                onSelectState={picker.selectState}
                stateCities={picker.stateCities}
                citiesLoading={picker.citiesLoading}
                selectedCity={picker.selectedCity}
                onSelectCity={picker.selectCity}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border">
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {showingProduct ? (
                <PackageConfigurePanel
                  cityId={cityId}
                  cityName={cityName}
                  selectedCity={picker.selectedCity}
                  selectedProductId={picker.selectedProductId}
                  productDetail={picker.productDetail}
                  detailLoading={picker.detailLoading}
                  detailError={picker.detailError}
                  draft={picker.draft}
                  slotError={picker.slotError}
                  onUpdateDraft={picker.updateDraft}
                  onToggleAddon={picker.toggleAddon}
                  onBack={picker.clearProduct}
                />
              ) : (
                <PackageProductsPanel
                  selectedState={picker.selectedState}
                  selectedCity={picker.selectedCity}
                  productSearch={picker.productSearch}
                  onProductSearchChange={picker.setProductSearch}
                  fields={picker.fields}
                  filterQuery={picker.filterQuery}
                  onFilterQueryChange={picker.setFilterQuery}
                  page={picker.page}
                  onPageChange={picker.setPage}
                  limit={picker.limit}
                  total={picker.total}
                  products={picker.products}
                  loading={picker.loading}
                  error={picker.error}
                  selectedProductId={picker.selectedProductId}
                  onSelectProduct={picker.selectProduct}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!picker.canConfirm}>
            Add to booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
