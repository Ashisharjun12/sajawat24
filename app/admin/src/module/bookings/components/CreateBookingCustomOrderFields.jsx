import { useCallback, useEffect, useMemo, useState } from "react"
import { ImageIcon, ImagesIcon, XIcon } from "lucide-react"
import { listAdmin as listCities } from "@/api/cities.api"
import { mediaDisplayUrl } from "@/api/uploads.api"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BookingPreviewThumb } from "@/module/bookings/components/BookingPreviewThumb"
import { ensureCustomBookingsFolder } from "@/module/bookings/lib/ensure-custom-bookings-folder"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { PackageLocationPanel } from "@/module/bookings/package-picker/PackageLocationPanel"
import { PackageSchedulePicker } from "@/module/bookings/package-picker/PackageSchedulePicker"

export function CreateBookingCustomOrderFields({ form, onPackageCityChange }) {
  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState(null)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const scheduledAt = form.watch("scheduledAt")
  const customImagePreviewUrl = form.watch("customImagePreviewUrl")
  const customImageUploadId = form.watch("customImageUploadId")

  const mediaAttached = useMemo(() => {
    if (!customImageUploadId?.trim() || !customImagePreviewUrl) return []
    const id = customImageUploadId.trim()
    const url = customImagePreviewUrl
    return [{ id, uploadId: id, publicUrl: url, url }]
  }, [customImageUploadId, customImagePreviewUrl])

  const states = useMemo(() => {
    const unique = new Set(cities.map((city) => city.state).filter(Boolean))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [cities])

  const stateCities = useMemo(
    () => cities.filter((city) => city.state === selectedState),
    [cities, selectedState],
  )

  useEffect(() => {
    let cancelled = false

    async function loadAllCities() {
      setCitiesLoading(true)
      const items = []
      let page = 1
      let total = Number.POSITIVE_INFINITY
      try {
        while (items.length < total) {
          const data = await listCities({ page, limit: 100, isActive: "true" })
          const batch = data.items ?? []
          items.push(...batch)
          total = data.total ?? items.length
          if (!batch.length) break
          page += 1
        }
        if (!cancelled) setCities(items)
      } catch {
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled) setCitiesLoading(false)
      }
    }

    void loadAllCities()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const cityId = form.getValues("delivery.cityId")
    if (!cityId || !cities.length) return
    const city = cities.find((row) => row.id === cityId)
    if (!city) return
    setSelectedState(city.state ?? "")
    setSelectedCity(city)
  }, [cities, form])

  const deliveryCityId = form.watch("delivery.cityId")

  const handleSelectCity = useCallback(
    (city) => {
      if (!city?.id) return
      setSelectedCity(city)
      form.clearErrors("delivery.cityId")
      form.setValue("delivery.cityId", city.id, { shouldValidate: true, shouldDirty: true })
      void form.trigger("delivery.cityId")
      onPackageCityChange?.({ id: city.id, name: city.name })
    },
    [form, onPackageCityChange],
  )

  function applyPickedImage(picked) {
    const item = picked[0]
    if (!item) return
    const id = item.uploadId || item.id
    if (!id) return
    const url = mediaDisplayUrl(item)
    form.setValue("customImageUploadId", id, { shouldValidate: true })
    form.setValue("customImagePreviewUrl", url, { shouldValidate: true })
  }

  function clearImage() {
    form.setValue("customImageUploadId", "", { shouldValidate: true })
    form.setValue("customImagePreviewUrl", "", { shouldValidate: true })
  }

  return (
    <FieldGroup className="space-y-6">
      <PackageLocationPanel
        states={states}
        statesLoading={citiesLoading}
        selectedState={selectedState}
        onSelectState={(state) => {
          setSelectedState(state)
          setSelectedCity(null)
          form.setValue("delivery.cityId", "", { shouldValidate: true })
        }}
        stateCities={stateCities}
        citiesLoading={citiesLoading}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />

      {form.formState.errors.delivery?.cityId && !deliveryCityId ? (
        <Field data-invalid>
          <FieldError errors={[form.formState.errors.delivery.cityId]} />
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="custom-package-name">Package name</FieldLabel>
        <Input
          id="custom-package-name"
          placeholder="e.g. Rose gold birthday setup"
          {...form.register("customName")}
        />
        {form.formState.errors.customName ? (
          <FieldError errors={[form.formState.errors.customName]} />
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="custom-package-price">Agreed price (₹)</FieldLabel>
        <Input
          id="custom-package-price"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          placeholder="8999"
          {...form.register("customPriceRupees")}
        />
        {form.formState.errors.customPriceRupees ? (
          <FieldError errors={[form.formState.errors.customPriceRupees]} />
        ) : null}
      </Field>

      <div className="space-y-2">
        <FieldLabel>Reference image (optional)</FieldLabel>
        <div className="flex flex-wrap items-center gap-3">
          {customImagePreviewUrl ? (
            <BookingPreviewThumb src={customImagePreviewUrl} alt="Custom package" size="md" />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-lg border border-dashed bg-muted/40">
              <ImageIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)}>
              <ImagesIcon className="size-4" />
              {customImagePreviewUrl ? "Change image" : "Choose from media"}
            </Button>
            {customImagePreviewUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
                <XIcon className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Opens the media library in Custom bookings — pick an existing image or upload a new one.
        </p>
      </div>

      <ProductMediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        attached={mediaAttached}
        max={1}
        kinds={["image"]}
        resolveRootFolder={ensureCustomBookingsFolder}
        dialogTitle="Custom booking reference image"
        dialogDescription="Upload a new image to Custom bookings or select one already in this folder."
        onAdd={applyPickedImage}
      />

      <PackageSchedulePicker
        value={scheduledAt}
        onChange={(value) => form.setValue("scheduledAt", value, { shouldValidate: true })}
        error={form.formState.errors.scheduledAt?.message}
      />
      {form.formState.errors.scheduledAt ? (
        <Field data-invalid>
          <FieldError errors={[form.formState.errors.scheduledAt]} />
        </Field>
      ) : null}
    </FieldGroup>
  )
}
