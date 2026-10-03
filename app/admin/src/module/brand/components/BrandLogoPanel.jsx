import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getBrandSite, patchBrandSite } from "@/api/brand.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

export function BrandLogoPanel() {
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState("light")

  useEffect(() => {
    let cancelled = false
    getBrandSite()
      .then((data) => {
        if (!cancelled) setSite(data)
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: getApiError(err), type: "error" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function openPicker(target) {
    setPickerTarget(target)
    setPickerOpen(true)
  }

  function onPick(picked) {
    const row = picked[0] ? toGalleryItem(picked[0]) : null
    if (!row?.uploadId || !site) return
    if (pickerTarget === "light") {
      setSite({ ...site, logoLightUploadId: row.uploadId, logoLightUrl: row.url ?? site.logoLightUrl })
    } else {
      setSite({ ...site, logoDarkUploadId: row.uploadId, logoDarkUrl: row.url ?? site.logoDarkUrl })
    }
    setPickerOpen(false)
  }

  async function onSave() {
    if (!site) return
    setSaving(true)
    try {
      const next = await patchBrandSite({
        logoLightUploadId: site.logoLightUploadId ?? null,
        logoDarkUploadId: site.logoDarkUploadId ?? null,
      })
      setSite(next)
      toast.add({ title: "Logos saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const lightPreview = site?.logoLightUrl
  const darkPreview = site?.logoDarkUrl

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Store logos</CardTitle>
          <CardDescription>
            Light and dark variants appear in the site header, footer, and anywhere the brand mark is shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-6">
              <p className="mb-3 text-sm font-medium text-zinc-900">Light mode</p>
              <div className="flex min-h-20 items-center gap-4">
                {lightPreview ? (
                  <img src={lightPreview} alt="" className="h-12 w-auto max-w-[160px] object-contain" />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo selected</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => openPicker("light")}
              >
                Choose image
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-zinc-950 p-6">
              <p className="mb-3 text-sm font-medium text-zinc-100">Dark mode</p>
              <div className="flex min-h-20 items-center gap-4">
                {darkPreview ? (
                  <img src={darkPreview} alt="" className="h-12 w-auto max-w-[160px] object-contain" />
                ) : (
                  <span className="text-sm text-zinc-400">No logo selected</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => openPicker("dark")}
              >
                Choose image
              </Button>
            </div>
          </div>
          <Button type="button" onClick={onSave} disabled={saving}>
            Save logos
          </Button>
        </CardContent>
      </Card>
      <ProductMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attached={[]}
        max={1}
        kinds={["image"]}
        onAdd={onPick}
      />
    </>
  )
}
