import { useEffect, useState } from "react"
import { SparklesIcon } from "lucide-react"
import { suggestCmsTestimonial } from "@/api/ai.api"
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
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { AccentColorField } from "@/module/cms/components/AccentColorField"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"
import { getTestimonialAiGenerateBlockReason } from "@/module/cms/lib/testimonial-ai-gate"
import { toast } from "@/components/ui/toast"

const FORM_ID = "testimonial-form"

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

export function TestimonialFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  onSubmit,
  submitting,
}) {
  const { policy: aiPolicy } = useAiPolicy()
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("friendly")
  const [aiLoading, setAiLoading] = useState(false)
  const [quote, setQuote] = useState("")
  const [reviewerName, setReviewerName] = useState("")
  const [reviewerCity, setReviewerCity] = useState("")
  const [rating, setRating] = useState(5)
  const [accentColor, setAccentColor] = useState("#7c5c12")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [status, setStatus] = useState("draft")
  const [sortIndex, setSortIndex] = useState(0)
  const [cityId, setCityId] = useState("global")
  const [platforms, setPlatforms] = useState(["web", "mobile"])

  useEffect(() => {
    if (!open) return
    setTopic("")
    setTone("friendly")
    setAiLoading(false)
    setQuote(item?.quote ?? "")
    setReviewerName(item?.reviewerName ?? "")
    setReviewerCity(item?.reviewerCity ?? "")
    setRating(item?.rating ?? 5)
    setAccentColor(item?.accentColor ?? "#7c5c12")
    setAvatarUrl(item?.avatarUrl ?? "")
    setStatus(item?.status ?? "draft")
    setSortIndex(Math.max(0, item?.sortIndex ?? 0))
    setCityId(item?.cityId ?? "global")
    setPlatforms(websitePlatformsOnly(item?.platforms))
  }, [open, item])

  const aiBlockReason = getTestimonialAiGenerateBlockReason(aiPolicy, { topic, quote })

  async function handleSuggestAi() {
    if (aiBlockReason) {
      toast.add({ title: aiBlockReason, type: "error" })
      return
    }
    const topicValue = topic.trim() || quote.trim().slice(0, 200)
    setAiLoading(true)
    try {
      const data = await suggestCmsTestimonial({
        topic: topicValue,
        quote: quote.trim() || undefined,
        reviewerName: reviewerName.trim() || undefined,
        reviewerCity: reviewerCity.trim() || undefined,
        tone,
      })
      if (data?.quote) setQuote(data.quote)
      if (data?.reviewerName) setReviewerName(data.reviewerName)
      if (data?.reviewerCity) setReviewerCity(data.reviewerCity)
      toast.add({
        title: "Testimonial draft ready — verify with a real customer before publishing",
        type: "success",
      })
    } catch (err) {
      toast.add({ title: aiErrorMessage(err), type: "error" })
    } finally {
      setAiLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const city = cityId === "global" ? null : cityId
    const cityName = cities.find((row) => row.id === city)?.name ?? item?.cityName ?? null
    onSubmit?.({
      quote,
      reviewerName,
      reviewerCity,
      rating: Number(rating) || 5,
      accentColor,
      avatarUrl: avatarUrl || null,
      avatarUploadId: item?.avatarUploadId ?? null,
      status,
      sortIndex: Math.max(0, Number(sortIndex) || 0),
      cityId: city,
      cityName,
      platforms,
    })
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit testimonial" : "Add testimonial"}
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
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="testimonial-ai-topic">AI topic (optional)</Label>
              <Input
                id="testimonial-ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                placeholder="e.g. anniversary decoration at home"
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label className="text-muted-foreground text-xs sm:w-24">AI tone</Label>
            <Select value={tone} onValueChange={setTone} disabled={aiLoading}>
              <SelectTrigger className="sm:max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {aiBlockReason ? (
            <p className="text-muted-foreground text-xs">{aiBlockReason}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label>Quote</Label>
          <Textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={4}
            required
            minLength={10}
            disabled={aiLoading}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              required
              disabled={aiLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>City / role line</Label>
            <Input
              value={reviewerCity}
              onChange={(e) => setReviewerCity(e.target.value)}
              disabled={aiLoading}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Rating</Label>
            <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Sort</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={sortIndex}
              onChange={(e) => setSortIndex(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>
        <AccentColorField value={accentColor} onChange={setAccentColor} />
        <div className="grid gap-2">
          <Label>Avatar URL</Label>
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        </div>
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
      </form>
    </CmsFormDialogShell>
  )
}
