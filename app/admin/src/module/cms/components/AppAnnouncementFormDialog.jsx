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
import { AppBannerLinkField } from "@/module/cms/components/AppBannerLinkField"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import {
  CMS_ANNOUNCEMENT_PLATFORMS,
  CMS_STATUSES,
  CMS_TONES,
  announcementPlatformsForEdit,
  announcementPlatformsForSave,
} from "@/module/cms/lib/cms-constants"
import { getAnnouncementAiGenerateBlockReason } from "@/module/cms/lib/announcement-ai-gate"
import { toast } from "@/components/ui/toast"

const FORM_ID = "app-announcement-form"

function emptyToNull(value) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

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

export function AppAnnouncementFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  submitting,
  onSubmit,
  onPickImage,
  imagePreview,
  imageUploadId: pickedUploadId,
}) {
  const { policy: aiPolicy } = useAiPolicy()
  const [topic, setTopic] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [tag, setTag] = useState("")
  const [href, setHref] = useState("")
  const [ctaLabel, setCtaLabel] = useState("")
  const [tone, setTone] = useState("promo")
  const [accentColor, setAccentColor] = useState("#ca8a04")
  const [status, setStatus] = useState("draft")
  const [cityId, setCityId] = useState("global")
  const [dismissible, setDismissible] = useState(true)
  const [platforms, setPlatforms] = useState(["android"])
  const [imageUploadId, setImageUploadId] = useState(null)
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (!open) return
    setTopic("")
    setAiLoading(false)
    setMessage(item?.message ?? "")
    setTitle(item?.title ?? "")
    setSubtitle(item?.subtitle ?? "")
    setTag(item?.tag ?? "")
    setHref(item?.href ?? "")
    setCtaLabel(item?.ctaLabel ?? "")
    setTone(item?.tone ?? "promo")
    setAccentColor(item?.accentColor ?? "#ca8a04")
    setStatus(item?.status ?? "draft")
    setCityId(item?.cityId ?? "global")
    setDismissible(item?.dismissible ?? true)
    setPlatforms(announcementPlatformsForEdit(item?.platforms, ["android"]))
    const preview = item?.mobileImageUrl || item?.imageUrl || imagePreview || ""
    setImageUrl(preview)
    setImageUploadId(
      pickedUploadId ?? item?.mobileImageUploadId ?? item?.imageUploadId ?? null,
    )
  }, [open, item, imagePreview, pickedUploadId])

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
    if (!savedPlatforms.includes("android")) {
      toast.add({ title: "Android app must be selected for announcements in this tab", type: "error" })
      return
    }
    const city = cityId === "global" ? null : cityId
    const cityName = cities.find((row) => row.id === city)?.name ?? item?.cityName ?? null
    const resolvedUploadId =
      imageUploadId ?? pickedUploadId ?? item?.mobileImageUploadId ?? item?.imageUploadId ?? null
    onSubmit?.({
      placement: "announcement_bar",
      message: message.trim(),
      title: emptyToNull(title),
      subtitle: emptyToNull(subtitle),
      tag: emptyToNull(tag),
      href: emptyToNull(href),
      ctaLabel: emptyToNull(ctaLabel) || "Try it now",
      tone,
      accentColor: accentColor || null,
      status,
      cityId: city,
      cityName,
      platforms: savedPlatforms,
      dismissible,
      sortIndex: item?.sortIndex ?? 0,
      priority: 0,
      ...(resolvedUploadId
        ? { imageUploadId: resolvedUploadId, mobileImageUploadId: resolvedUploadId }
        : {}),
    })
  }

  const heroPreview = imagePreview || imageUrl

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit app announcement" : "Add app announcement"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting || aiLoading}>
            {submitting ? <Spinner className="size-4" /> : item ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid w-full min-w-0 gap-4">
        <p className="text-xs text-muted-foreground">
          Shown as a launch bottom sheet when customers open the Android app. With a hero image, the
          sheet uses the photo; without one, accent color and tag (e.g. NEW) fill the top block.
        </p>
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="app-announcement-ai-topic">AI topic (optional)</Label>
              <Input
                id="app-announcement-ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                placeholder="e.g. live vendor tracking launch"
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
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label>
            Short message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            required
            placeholder="🎉 Fallback line if title/subtitle empty"
            disabled={aiLoading}
            maxLength={500}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Sheet title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Live vendor tracking is here"
              maxLength={120}
            />
          </div>
          <div className="grid gap-2">
            <Label>Tag (no image)</Label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="NEW"
              maxLength={24}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Sheet description</Label>
          <Textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            placeholder="See your decorator on the map…"
            maxLength={500}
          />
        </div>
        <div className="grid gap-2">
          <Label>Hero image (optional)</Label>
          {onPickImage ? (
            <Button type="button" variant="outline" onClick={onPickImage}>
              Choose from media
            </Button>
          ) : null}
          {heroPreview ? (
            <img
              src={heroPreview}
              alt=""
              className="mx-auto h-40 max-w-full rounded-xl object-cover"
            />
          ) : (
            <p className="text-xs text-muted-foreground">No image — accent block + tag is used.</p>
          )}
        </div>
        <AppBannerLinkField value={href} onChange={setHref} />
        <div className="grid gap-2">
          <Label>Primary button label</Label>
          <Input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Try it now"
            maxLength={40}
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
          id="app-announcement-accent"
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
            Android app is required here. You can also enable Website / Mobile web. Unchecked
            platforms will not receive this announcement.
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
          <Label>Allow “Maybe later”</Label>
          <Switch checked={dismissible} onCheckedChange={setDismissible} />
        </div>
        <p className="text-xs text-muted-foreground">
          Only rows with <span className="font-medium">Android app</span> checked appear in this
          tab’s list. First published item in sort order opens on app launch.
        </p>
      </form>
    </CmsFormDialogShell>
  )
}
