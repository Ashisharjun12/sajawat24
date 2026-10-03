import { useEffect, useState } from "react"
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
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

const PRESETS = ["instagram", "facebook", "youtube", "whatsapp", "x", "linkedin", "custom"]

const FORM_ID = "social-link-form"

export function SocialLinkFormDialog({ open, onOpenChange, item, onSubmit, submitting }) {
  const [label, setLabel] = useState("")
  const [href, setHref] = useState("")
  const [iconPreset, setIconPreset] = useState("instagram")
  const [iconUploadId, setIconUploadId] = useState(null)
  const [iconUrl, setIconUrl] = useState("")
  const [status, setStatus] = useState("draft")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLabel(item?.label ?? "")
    setHref(item?.href ?? "")
    setIconPreset(item?.iconPreset ?? "instagram")
    setIconUploadId(item?.iconUploadId ?? null)
    setIconUrl(item?.iconUrl ?? "")
    setStatus(item?.status ?? "draft")
    setPlatforms(websitePlatformsOnly(item?.platforms))
  }, [open, item])

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({
      label,
      href,
      iconPreset: iconPreset === "custom" ? "custom" : iconPreset,
      iconUploadId: iconPreset === "custom" ? iconUploadId : null,
      status,
      platforms,
    })
  }

  return (
    <>
      <CmsFormDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={item ? "Edit social link" : "Add social link"}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} disabled={submitting}>
              {submitting ? <Spinner className="size-4" /> : null}
              Save
            </Button>
          </>
        }
      >
        <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-label">Label</Label>
            <Input id="social-label" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-href">Link URL</Label>
            <Input id="social-href" value={href} onChange={(e) => setHref(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Icon</Label>
            <Select value={iconPreset} onValueChange={setIconPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Preset" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {iconPreset === "custom" ? (
              <div className="flex items-center gap-3 pt-2">
                {iconUrl ? <img src={iconUrl} alt="" className="size-8 rounded object-cover" /> : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Choose icon image
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
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
          <PlatformCheckboxes value={platforms} onChange={setPlatforms} />
        </form>
      </CmsFormDialogShell>
      <ProductMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attached={[]}
        max={1}
        kinds={["image"]}
        onAdd={(picked) => {
          const row = picked[0] ? toGalleryItem(picked[0]) : null
          if (row?.uploadId) setIconUploadId(row.uploadId)
          if (row?.url) setIconUrl(row.url)
          setPickerOpen(false)
        }}
      />
    </>
  )
}
