import { useEffect, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { listBrandPagesPicker } from "@/api/brand.api"
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

const FORM_ID = "footer-column-form"

function formatPageOptionLabel(page) {
  return `${page.title} (/pages/${page.slug})`
}

function pageLabelForId(pageId, pageOptions) {
  if (!pageId) return null
  const page = pageOptions.find((row) => row.id === pageId)
  return page ? formatPageOptionLabel(page) : null
}

const emptyLink = () => ({
  label: "",
  linkType: "custom",
  href: "",
  pageId: "",
})

function normalizeLinkFromApi(link) {
  if (link.linkType === "page" && link.pageId) {
    return {
      label: link.label ?? "",
      linkType: "page",
      pageId: link.pageId,
      href: "",
    }
  }
  return {
    label: link.label ?? "",
    linkType: "custom",
    href: link.href ?? "",
    pageId: "",
  }
}

export function FooterColumnFormDialog({ open, onOpenChange, item, onSubmit, submitting }) {
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("draft")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [links, setLinks] = useState([emptyLink()])
  const [pageOptions, setPageOptions] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? "")
    setStatus(item?.status ?? "draft")
    setPlatforms(websitePlatformsOnly(item?.platforms))
    const existing = item?.links ?? []
    setLinks(existing.length ? existing.map(normalizeLinkFromApi) : [emptyLink()])
    setPickerLoading(true)
    listBrandPagesPicker()
      .then((data) => setPageOptions(data.items ?? []))
      .catch(() => setPageOptions([]))
      .finally(() => setPickerLoading(false))
  }, [open, item])

  function updateLink(index, field, value) {
    setLinks((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function setLinkType(index, linkType) {
    setLinks((prev) =>
      prev.map((row, i) =>
        i === index
          ? linkType === "page"
            ? { ...row, linkType: "page", href: "", pageId: row.pageId || "" }
            : { ...row, linkType: "custom", pageId: "", href: row.href || "" }
          : row,
      ),
    )
  }

  function addLink() {
    setLinks((prev) => [...prev, emptyLink()])
  }

  function removeLink(index) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const cleaned = links
      .map((row) => {
        const label = row.label.trim()
        if (!label) return null
        if (row.linkType === "page" && row.pageId) {
          return { label, linkType: "page", pageId: row.pageId }
        }
        const href = row.href.trim()
        if (row.linkType === "custom" && href) {
          return { label, linkType: "custom", href }
        }
        return null
      })
      .filter(Boolean)
    onSubmit?.({
      title,
      status,
      platforms,
      links: cleaned,
    })
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit footer column" : "Add footer column"}
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
      <form id={FORM_ID} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="col-title">Column title</Label>
          <Input id="col-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Links</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLink}>
              <PlusIcon className="size-4" />
              Add link
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {links.map((row, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Input
                  placeholder="Label"
                  value={row.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                />
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">Link type</Label>
                  <Select value={row.linkType} onValueChange={(value) => setLinkType(index, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Site page</SelectItem>
                      <SelectItem value="custom">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {row.linkType === "page" ? (
                  <Select
                    value={row.pageId || null}
                    onValueChange={(value) => updateLink(index, "pageId", value)}
                    disabled={pickerLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={pickerLoading ? "Loading pages…" : "Select page"}>
                        {pageLabelForId(row.pageId, pageOptions)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {formatPageOptionLabel(page)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="/path or https://..."
                    value={row.href}
                    onChange={(e) => updateLink(index, "href", e.target.value)}
                  />
                )}
                {links.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(index)}>
                    <Trash2Icon className="size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </form>
    </CmsFormDialogShell>
  )
}
