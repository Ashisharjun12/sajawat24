import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { listAdmin as listAddons } from "@/api/addons.api"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { PackageAddonRow } from "@/module/bookings/package-picker/PackageAddonRow"
import { PackageCityBar } from "@/module/bookings/package-picker/PackageCityBar"
import { PackagePreviewAccordion } from "@/module/bookings/package-picker/PackagePreviewAccordion"
import { PackagePreviewGallery } from "@/module/bookings/package-picker/PackagePreviewGallery"
import { PackageProductPrice } from "@/module/bookings/package-picker/PackageProductPrice"
import { PackageSchedulePicker } from "@/module/bookings/package-picker/PackageSchedulePicker"
import { formatProductPrice, galleryImages } from "@/module/bookings/package-picker/package-picker.utils"

export function PackageConfigurePanel({
  cityId,
  cityName,
  selectedCity,
  selectedProductId,
  productDetail,
  detailLoading,
  detailError,
  draft,
  slotError,
  onUpdateDraft,
  onToggleAddon,
  onBack,
}) {
  const [addonOptions, setAddonOptions] = useState([])
  const [addonsLoading, setAddonsLoading] = useState(false)

  const images = useMemo(() => galleryImages(productDetail), [productDetail])
  const price = useMemo(
    () => (productDetail && cityId ? formatProductPrice(productDetail, cityId) : null),
    [productDetail, cityId],
  )

  const handleScheduleChange = useCallback(
    (iso) => {
      onUpdateDraft({ scheduledAt: iso })
    },
    [onUpdateDraft],
  )

  useEffect(() => {
    if (!productDetail?.addonIds?.length) {
      setAddonOptions([])
      return
    }

    let cancelled = false
    setAddonsLoading(true)

    listAddons({ page: 1, limit: 100, isActive: "true" })
      .then((data) => {
        if (cancelled) return
        const mapped = (data.items ?? []).filter((row) =>
          productDetail.addonIds.includes(row.id),
        )
        setAddonOptions(mapped)
      })
      .catch(() => {
        if (!cancelled) setAddonOptions([])
      })
      .finally(() => {
        if (!cancelled) setAddonsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productDetail])

  if (!selectedProductId) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Select a package from the list to preview details, pick a slot, and add-ons.
      </div>
    )
  }

  if (detailLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full max-w-xs rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (detailError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{detailError}</AlertDescription>
      </Alert>
    )
  }

  if (!productDetail) return null

  const title = productDetail.name?.trim() || "Package"
  const description = productDetail.description?.trim()
  const selectedAddonIds = new Set(draft.addonIds ?? [])

  return (
    <div className="flex flex-col gap-4">
      {onBack ? (
        <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Back to packages
        </Button>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,200px)_1fr]">
        <PackagePreviewGallery images={images} title={title} />
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h3 className="font-heading text-lg font-medium tracking-tight">{title}</h3>
            {description ? (
              <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <PackageProductPrice
            pricePaise={price?.pricePaise ?? null}
            compareAtPaise={price?.compareAtPaise ?? null}
            cityName={cityName}
          />

          <PackageCityBar selectedCity={selectedCity} />
        </div>
      </div>

      <PackagePreviewAccordion product={productDetail} />

      <PackageSchedulePicker
        value={draft.scheduledAt}
        onChange={handleScheduleChange}
        error={slotError}
      />

      {productDetail.addonIds?.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-3">
          <h4 className="font-heading text-base font-medium">We suggest to add this</h4>
          {addonsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <ul className="flex flex-col gap-3">
              {addonOptions.map((addon) => (
                <PackageAddonRow
                  key={addon.id}
                  addon={addon}
                  selected={selectedAddonIds.has(addon.id)}
                  onToggle={onToggleAddon}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
