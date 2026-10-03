import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getBrandSite, patchBrandSite } from "@/api/brand.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

export function BrandProductTrustPanel() {
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

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

  function onPick(picked) {
    const row = picked[0] ? toGalleryItem(picked[0]) : null
    if (!row?.uploadId || !site) return
    setSite({
      ...site,
      productTrustGalleryUploadId: row.uploadId,
      productTrustGalleryUrl: row.url ?? site.productTrustGalleryUrl,
    })
    setPickerOpen(false)
  }

  async function onSave() {
    if (!site) return
    setSaving(true)
    try {
      const next = await patchBrandSite({
        productTrustGalleryEnabled: site.productTrustGalleryEnabled === true,
        productTrustGalleryUploadId: site.productTrustGalleryUploadId ?? null,
      })
      setSite(next)
      toast.add({ title: "Product trust slide saved", type: "success" })
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
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const preview = site?.productTrustGalleryUrl
  const enabled = site?.productTrustGalleryEnabled === true

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Product trust slide</CardTitle>
          <CardDescription>
            When enabled, this image is appended as the last slide on every product detail gallery. It is not stored
            per product and does not replace list or cart thumbnails.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="product-trust-enabled">Enabled</Label>
              <p className="text-sm text-muted-foreground">Show the trust slide on storefront product pages.</p>
            </div>
            <Switch
              id="product-trust-enabled"
              checked={enabled}
              onCheckedChange={(checked) => setSite({ ...site, productTrustGalleryEnabled: checked })}
            />
          </div>
          <div className="rounded-lg border border-border p-6">
            <p className="mb-3 text-sm font-medium text-zinc-900">Gallery image</p>
            <div className="flex min-h-24 items-center gap-4">
              {preview ? (
                <img src={preview} alt="" className="h-24 w-auto max-w-full rounded-md object-contain" />
              ) : (
                <span className="text-sm text-muted-foreground">No image selected</span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setPickerOpen(true)}
            >
              Choose image
            </Button>
          </div>
          <Button type="button" onClick={onSave} disabled={saving}>
            Save trust slide
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
