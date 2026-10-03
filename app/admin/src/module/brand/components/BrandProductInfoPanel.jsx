import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getBrandSite, patchBrandSite } from "@/api/brand.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ProductAdditionalInfo } from "@/module/catalog/components/ProductAdditionalInfo"
import { fromFaqRows, toFaqRows } from "@/module/catalog/components/FaqListEditor"

function copyFromSite(site) {
  return {
    includes: site?.defaultIncludes ?? [],
    deliverySetup: site?.defaultDeliverySetup ?? [],
    careInstructions: site?.defaultCareInstructions ?? [],
    faqs: toFaqRows(site?.defaultFaqs ?? []),
  }
}

export function BrandProductInfoPanel() {
  const [includes, setIncludes] = useState([])
  const [deliverySetup, setDeliverySetup] = useState([])
  const [careInstructions, setCareInstructions] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrandSite()
      .then((site) => {
        if (cancelled) return
        const copy = copyFromSite(site)
        setIncludes(copy.includes)
        setDeliverySetup(copy.deliverySetup)
        setCareInstructions(copy.careInstructions)
        setFaqs(copy.faqs)
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

  async function onSave() {
    setSaving(true)
    try {
      const site = await patchBrandSite({
        defaultIncludes: includes,
        defaultDeliverySetup: deliverySetup,
        defaultCareInstructions: careInstructions,
        defaultFaqs: fromFaqRows(faqs),
      })
      const copy = copyFromSite(site)
      setIncludes(copy.includes)
      setDeliverySetup(copy.deliverySetup)
      setCareInstructions(copy.careInstructions)
      setFaqs(copy.faqs)
      toast.add({ title: "Product defaults saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  async function onClearAll() {
    if (!window.confirm("Clear all default product copy? New products will start with empty sections.")) {
      return
    }
    setSaving(true)
    try {
      const site = await patchBrandSite({
        defaultIncludes: [],
        defaultDeliverySetup: [],
        defaultCareInstructions: [],
        defaultFaqs: [],
      })
      const copy = copyFromSite(site)
      setIncludes(copy.includes)
      setDeliverySetup(copy.deliverySetup)
      setCareInstructions(copy.careInstructions)
      setFaqs(copy.faqs)
      toast.add({ title: "Defaults cleared", type: "success" })
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
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default product copy</CardTitle>
        <CardDescription>
          Pre-fills the Additional info sections when you create a new catalog product. Existing products keep
          their own copy until you edit them on the product form.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ProductAdditionalInfo
          includes={includes}
          onIncludesChange={setIncludes}
          deliverySetup={deliverySetup}
          onDeliverySetupChange={setDeliverySetup}
          careInstructions={careInstructions}
          onCareInstructionsChange={setCareInstructions}
          faqs={faqs}
          onFaqsChange={setFaqs}
          disabled={saving}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onSave} disabled={saving}>
            Save defaults
          </Button>
          <Button type="button" variant="outline" onClick={onClearAll} disabled={saving}>
            Clear all defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
