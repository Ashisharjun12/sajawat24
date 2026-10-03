import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getBrandSite, patchBrandSite } from "@/api/brand.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"

export function BrandCompanyPanel() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrandSite()
      .then((data) => {
        if (!cancelled) {
          setForm({
            companyName: data.companyName ?? "",
            footerDescription: data.footerDescription ?? "",
            contactPhone: data.contactPhone ?? "",
            contactEmail: data.contactEmail ?? "",
            whatsappUrl: data.whatsappUrl ?? "",
          })
        }
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
    if (!form) return
    setSaving(true)
    try {
      const next = await patchBrandSite({
        companyName: form.companyName,
        footerDescription: form.footerDescription,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        whatsappUrl: form.whatsappUrl || null,
      })
      setForm({
        companyName: next.companyName ?? "",
        footerDescription: next.footerDescription ?? "",
        contactPhone: next.contactPhone ?? "",
        contactEmail: next.contactEmail ?? "",
        whatsappUrl: next.whatsappUrl ?? "",
      })
      toast.add({ title: "Company details saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company</CardTitle>
        <CardDescription>
          Company name, footer text, and contact details for the web storefront and partner app Help
          &amp; support.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company-name">Company name</Label>
          <Input
            id="company-name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="footer-desc">Footer description</Label>
          <Textarea
            id="footer-desc"
            rows={4}
            value={form.footerDescription}
            onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="whatsapp">WhatsApp link</Label>
          <Input
            id="whatsapp"
            placeholder="https://wa.me/..."
            value={form.whatsappUrl}
            onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
          />
        </div>
        <Button type="button" onClick={onSave} disabled={saving}>
          Save
        </Button>
      </CardContent>
    </Card>
  )
}
