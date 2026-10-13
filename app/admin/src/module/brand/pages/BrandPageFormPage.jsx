import { useEffect, useState } from "react"
import { EyeIcon, PencilIcon, SparklesIcon } from "lucide-react"
import { suggestCmsBrandPage } from "@/api/ai.api"
import { useAiPolicy } from "@/providers/ai-policy-provider"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MarkdownContent } from "@/components/MarkdownContent"
import { getApiError } from "@/api/api"
import { getBrandPage, patchBrandPage } from "@/api/brand.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"
import { slugifyPageTitle } from "@/module/brand/lib/page-slug"
import { getBrandPageAiGenerateBlockReason } from "@/module/brand/lib/brand-page-ai-gate"

function aiErrorMessage(err) {
  const message = getApiError(err)
  if (message.includes("504") || message.toLowerCase().includes("timed out")) {
    return "AI request timed out. Try a shorter brief or try again."
  }
  if (message.includes("503") || message.toLowerCase().includes("unavailable")) {
    return "AI service is temporarily unavailable."
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached. Try again later."
  }
  return message
}

export function BrandPageFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === "new"
  const { policy: aiPolicy } = useAiPolicy()

  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("draft")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [showPreview, setShowPreview] = useState(false)
  const [aiBrief, setAiBrief] = useState("")
  const [aiTone, setAiTone] = useState("professional")
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    getBrandPage(id)
      .then((data) => {
        if (cancelled) return
        setTitle(data.title ?? "")
        setSlug(data.slug ?? "")
        setSlugTouched(true)
        setBody(data.body ?? "")
        setStatus(data.status ?? "draft")
        setPlatforms(websitePlatformsOnly(data.platforms))
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  useEffect(() => {
    if (!slugTouched && title) {
      setSlug(slugifyPageTitle(title))
    }
  }, [slugTouched, title])

  useEffect(() => {
    if (isNew) {
      navigate("/brand?tab=pages", { replace: true })
    }
  }, [isNew, navigate])

  const canPublish = Boolean(title.trim() && body.trim())

  const aiBlockReason = getBrandPageAiGenerateBlockReason(aiPolicy, {
    brief: aiBrief,
    title,
  })

  async function handleSuggestAi() {
    if (aiBlockReason) {
      toast.add({ title: aiBlockReason, type: "error" })
      return
    }
    const briefValue =
      aiBrief.trim() ||
      `Write a customer-facing page titled "${title.trim()}" for our decoration booking marketplace.`
    setAiLoading(true)
    setShowPreview(false)
    try {
      const data = await suggestCmsBrandPage({
        brief: briefValue,
        title: title.trim() || undefined,
        tone: aiTone,
      })
      if (data?.body) setBody(data.body)
      toast.add({ title: "Page draft ready — review before publishing", type: "success" })
    } catch (err) {
      toast.add({ title: aiErrorMessage(err), type: "error" })
    } finally {
      setAiLoading(false)
    }
  }

  async function save(nextStatus) {
    setSubmitting(true)
    const payload = {
      title,
      slug,
      body,
      status: nextStatus ?? status,
      platforms,
    }
    try {
      const data = await patchBrandPage(id, payload)
      setTitle(data.title ?? title)
      setSlug(data.slug ?? slug)
      setBody(data.body ?? body)
      setStatus(data.status ?? payload.status)
      setPlatforms(websitePlatformsOnly(data.platforms ?? platforms))
      toast.add({
        title: payload.status === "published" ? "Page published" : "Page saved",
        type: "success",
      })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (isNew || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-16">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" asChild>
          <Link to="/brand?tab=pages">Back to pages</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:-mx-6 lg:px-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/brand?tab=pages">Back to pages</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? <PencilIcon /> : <EyeIcon />}
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CMS_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting || aiLoading}
              onClick={() => void save()}
            >
              {submitting ? <Spinner className="size-4" /> : null}
              Save
            </Button>
            <Button
              type="button"
              disabled={submitting || aiLoading || !canPublish}
              onClick={() => void save("published")}
            >
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 py-8">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            className="border-0 bg-transparent px-0 font-heading text-3xl font-medium tracking-tight shadow-none focus-visible:ring-0"
            maxLength={200}
          />
          <p className="text-sm text-muted-foreground">/pages/{slug || "…"}</p>
        </div>

        <details className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Page settings</summary>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-slug">URL slug</Label>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                maxLength={80}
              />
            </div>
            <PlatformCheckboxes value={platforms} onChange={setPlatforms} />
          </div>
        </details>

        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="page-ai-brief">AI brief (optional)</Label>
              <Input
                id="page-ai-brief"
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                maxLength={500}
                placeholder="e.g. privacy policy — what data we collect for bookings"
                disabled={aiLoading || showPreview}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(aiBlockReason) || aiLoading || submitting || showPreview}
              onClick={() => void handleSuggestAi()}
              className="shrink-0"
            >
              {aiLoading ? <Spinner className="size-4" /> : <SparklesIcon className="size-4" />}
              Draft with AI
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label className="text-muted-foreground text-xs sm:w-24">AI tone</Label>
            <Select value={aiTone} onValueChange={setAiTone} disabled={aiLoading || showPreview}>
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

        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="page-body">
            {showPreview ? "Preview" : "Content (Markdown)"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {showPreview
              ? "This is how the page will look on the site. Use Edit in the toolbar to change Markdown."
              : "Write Markdown here, then use Preview in the toolbar before you publish."}
          </p>
          {showPreview ? (
            <div
              className="min-h-[min(70vh,560px)] w-full overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm"
            >
              {body.trim() ? (
                <MarkdownContent>{body}</MarkdownContent>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet. Switch to Edit and add content.</p>
              )}
            </div>
          ) : (
            <Textarea
              id="page-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={22}
              className="min-h-[min(70vh,560px)] w-full resize-y text-base leading-relaxed"
              placeholder="Start writing…"
              disabled={aiLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
