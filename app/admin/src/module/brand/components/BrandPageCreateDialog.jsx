import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { createBrandPage } from "@/api/brand.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES } from "@/module/cms/lib/cms-constants"
import { slugifyPageTitle } from "@/module/brand/lib/page-slug"

const FORM_ID = "brand-page-create-form"

function emptyForm() {
  return {
    title: "",
    slug: "",
    slugTouched: false,
    status: "draft",
    platforms: ["web", "mobile"],
  }
}

export function BrandPageCreateDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(emptyForm())
    }
  }, [open])

  useEffect(() => {
    if (!form.slugTouched && form.title) {
      setForm((prev) => ({ ...prev, slug: slugifyPageTitle(prev.title) }))
    }
  }, [form.title, form.slugTouched])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const page = await createBrandPage({
        title: form.title.trim(),
        slug: form.slug.trim(),
        body: "",
        status: form.status,
        platforms: form.platforms,
      })
      toast.add({ title: "Page created", type: "success" })
      onOpenChange(false)
      onCreated?.(page)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="New page"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : null}
            Create page
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4 pr-1" onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground">
          Set title and URL slug here. You will write the page content on the next screen.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="create-page-title">Title</Label>
          <Input
            id="create-page-title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
            maxLength={200}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="create-page-slug">URL slug</Label>
          <Input
            id="create-page-slug"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slugTouched: true, slug: e.target.value }))
            }
            required
            maxLength={80}
            placeholder="privacy"
          />
          <p className="text-xs text-muted-foreground">Public path: /pages/{form.slug || "…"}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CMS_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PlatformCheckboxes
          value={form.platforms}
          onChange={(platforms) => setForm((prev) => ({ ...prev, platforms }))}
        />
      </form>
    </CmsFormDialogShell>
  )
}
