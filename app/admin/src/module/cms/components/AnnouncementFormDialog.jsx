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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { AccentColorField } from "@/module/cms/components/AccentColorField"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import {
  CMS_STATUSES,
  CMS_TONES,
  PLACEMENT_LABELS,
  websitePlatformsOnly,
} from "@/module/cms/lib/cms-constants"

const FORM_ID = "announcement-form"

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  onSubmit,
  submitting,
}) {
  const [message, setMessage] = useState("")
  const [href, setHref] = useState("")
  const [tone, setTone] = useState("promo")
  const [accentColor, setAccentColor] = useState("#ca8a04")
  const [status, setStatus] = useState("draft")
  const [cityId, setCityId] = useState("global")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [dismissible, setDismissible] = useState(true)

  useEffect(() => {
    if (!open) return
    setMessage(item?.message ?? "")
    setHref(item?.href ?? "")
    setTone(item?.tone ?? "promo")
    setAccentColor(item?.accentColor ?? "#ca8a04")
    setStatus(item?.status ?? "draft")
    setCityId(item?.cityId ?? "global")
    setPlatforms(websitePlatformsOnly(item?.platforms))
    setDismissible(item?.dismissible ?? true)
  }, [open, item])

  function handleSubmit(event) {
    event.preventDefault()
    const city = cityId === "global" ? null : cityId
    const cityName = cities.find((row) => row.id === city)?.name ?? item?.cityName ?? null
    onSubmit?.({
      placement: "announcement_bar",
      message: message.trim(),
      href: href.trim() || null,
      tone,
      accentColor: accentColor || null,
      status,
      cityId: city,
      cityName,
      platforms,
      dismissible,
      sortIndex: item?.sortIndex ?? 0,
      priority: 0,
    })
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit announcement" : "Add announcement"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : item ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid w-full min-w-0 gap-4">
        <p className="text-xs text-muted-foreground">
          {PLACEMENT_LABELS.announcement_bar}. Multiple published messages scroll horizontally with dot separators. Drag rows in the table to set order.
        </p>
        <div className="grid gap-2">
          <Label>
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            required
            placeholder="New booking in your city"
          />
        </div>
        <div className="grid gap-2">
          <Label>Link (optional)</Label>
          <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/decorations" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CMS_TONES.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <AccentColorField
          id="announcement-accent"
          value={accentColor}
          onChange={setAccentColor}
        />
        <div className="grid gap-2">
          <Label>Scope</Label>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (all cities)</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Platforms</Label>
          <PlatformCheckboxes value={platforms} onChange={setPlatforms} />
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CMS_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-xl border px-3 py-2">
          <Label>Dismissible</Label>
          <Switch checked={dismissible} onCheckedChange={setDismissible} />
        </div>
      </form>
    </CmsFormDialogShell>
  )
}
