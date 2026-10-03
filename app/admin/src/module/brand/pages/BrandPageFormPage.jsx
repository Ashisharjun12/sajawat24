import { useEffect, useState } from "react"
import { EyeIcon, PencilIcon } from "lucide-react"
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

export function BrandPageFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === "new"

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
              disabled={submitting}
              onClick={() => void save()}
            >
              {submitting ? <Spinner className="size-4" /> : null}
              Save
            </Button>
            <Button
              type="button"
              disabled={submitting || !canPublish}
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
            />
          )}
        </div>
      </div>
    </div>
  )
}
