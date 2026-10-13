import { useEffect, useState } from "react"
import { SparklesIcon } from "lucide-react"
import { suggestCmsAnnouncement } from "@/api/ai.api"
import { getApiError } from "@/api/api"
import { useAiPolicy } from "@/providers/ai-policy-provider"
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
  CMS_ANNOUNCEMENT_PLATFORMS,
  CMS_STATUSES,
  CMS_TONES,
  DEFAULT_ANNOUNCEMENT_PLATFORMS,
  PLACEMENT_LABELS,
  announcementPlatformsForEdit,
  announcementPlatformsForSave,
} from "@/module/cms/lib/cms-constants"
import { getAnnouncementAiGenerateBlockReason } from "@/module/cms/lib/announcement-ai-gate"
import { toast } from "@/components/ui/toast"

const FORM_ID = "announcement-form"

function aiErrorMessage(err) {
  const message = getApiError(err)
  if (message.includes("504") || message.toLowerCase().includes("timed out")) {
    return "AI request timed out. Try again."
  }
  if (message.includes("503") || message.toLowerCase().includes("unavailable")) {
    return "AI service is temporarily unavailable."
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached. Try again later."
  }
  return message
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  onSubmit,
  submitting,
}) {
  const { policy: aiPolicy } = useAiPolicy()
  const [topic, setTopic] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [href, setHref] = useState("")
  const [tone, setTone] = useState("promo")
  const [accentColor, setAccentColor] = useState("#ca8a04")
  const [status, setStatus] = useState("draft")
  const [cityId, setCityId] = useState("global")
  const [platforms, setPlatforms] = useState(DEFAULT_ANNOUNCEMENT_PLATFORMS)
  const [dismissible, setDismissible] = useState(true)

  useEffect(() => {
    if (!open) return
    setTopic("")
    setAiLoading(false)
    setMessage(item?.message ?? "")
    setHref(item?.href ?? "")
    setTone(item?.tone ?? "promo")
    setAccentColor(item?.accentColor ?? "#ca8a04")
    setStatus(item?.status ?? "draft")
    setCityId(item?.cityId ?? "global")
    setPlatforms(announcementPlatformsForEdit(item?.platforms))
    setDismissible(item?.dismissible ?? true)
  }, [open, item])

  const aiBlockReason = getAnnouncementAiGenerateBlockReason(aiPolicy, { topic, message })

  async function handleSuggestAi() {
    if (aiBlockReason) {
      toast.add({ title: aiBlockReason, type: "error" })
      return
    }
    const topicValue = topic.trim() || message.trim().slice(0, 200)
    setAiLoading(true)
    try {
      const data = await suggestCmsAnnouncement({
        topic: topicValue,
        message: message.trim() || undefined,
        href: href.trim() || undefined,
        tone,
      })
      if (data?.message) setMessage(data.message)
      if (data?.href) setHref(data.href)
      if (data?.tone) setTone(data.tone)
      toast.add({ title: "Announcement draft ready — review before publishing", type: "success" })
    } catch (err) {
      toast.add({ title: aiErrorMessage(err), type: "error" })
    } finally {
      setAiLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const savedPlatforms = announcementPlatformsForSave(platforms)
    if (!savedPlatforms.length) {
      toast.add({ title: "Select at least one platform", type: "error" })
      return
    }
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
      platforms: savedPlatforms,
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
          <Button type="submit" form={FORM_ID} disabled={submitting || aiLoading}>
            {submitting ? <Spinner className="size-4" /> : item ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid w-full min-w-0 gap-4">
        <p className="text-xs text-muted-foreground">
          {PLACEMENT_LABELS.announcement_bar}. Multiple published messages scroll horizontally with dot separators. Drag rows in the table to set order.
        </p>
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="announcement-ai-topic">AI topic (optional)</Label>
              <Input
                id="announcement-ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                placeholder="e.g. festive season booking reminder"
                disabled={aiLoading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(aiBlockReason) || aiLoading || submitting}
              onClick={() => void handleSuggestAi()}
              className="shrink-0"
            >
              {aiLoading ? <Spinner className="size-4" /> : <SparklesIcon className="size-4" />}
              Draft with AI
            </Button>
          </div>
          {aiBlockReason ? (
            <p className="text-muted-foreground text-xs">{aiBlockReason}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              AI adds one leading emoji (e.g. 🎉 ❤️ ✨) based on your topic.
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label>
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            required
            placeholder="🎉 Book home decoration in your city"
            disabled={aiLoading}
            maxLength={500}
          />
        </div>
        <div className="grid gap-2">
          <Label>Link (optional)</Label>
          <Input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/decorations"
            disabled={aiLoading}
            maxLength={500}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone} disabled={aiLoading}>
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
          <Label>Show on</Label>
          <PlatformCheckboxes
            value={platforms}
            onChange={setPlatforms}
            options={CMS_ANNOUNCEMENT_PLATFORMS}
            allowEmpty
          />
          <p className="text-xs text-muted-foreground">
            All channels are selected by default. Uncheck a platform to hide this announcement
            there. Android uses the customer app launch sheet and notifications (short message
            from here; rich image sheets under Content → Android).
          </p>
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
