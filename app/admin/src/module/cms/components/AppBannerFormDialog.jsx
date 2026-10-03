import { useCallback, useEffect, useState } from "react"
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
import { AppBannerLinkField } from "@/module/cms/components/AppBannerLinkField"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { CMS_STATUSES } from "@/module/cms/lib/cms-constants"
import { linkPreviewLabel } from "@/module/cms/lib/app-banner-link"
import { CMS_BANNER_APP_HERO_HINT } from "@/module/cms/lib/cms-banner-media"

const FORM_ID = "app-banner-form"
const PLACEMENT = "home_hero"

function emptyToNull(value) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function AppBannerFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  onSubmit,
  submitting,
  onPickImage,
  imagePreview,
  imageUploadId: pickedUploadId,
  onPreviewChange,
}) {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [href, setHref] = useState("")
  const [ctaLabel, setCtaLabel] = useState("")
  const [status, setStatus] = useState("draft")
  const [cityId, setCityId] = useState("global")
  const [imageUploadId, setImageUploadId] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [imageError, setImageError] = useState("")

  const pushPreview = useCallback(
    (patch) => {
      onPreviewChange?.({
        title,
        subtitle,
        ctaLabel,
        href,
        linkLabel: linkPreviewLabel(href),
        imageUrl: imagePreview || imageUrl,
        ...patch,
      })
    },
    [title, subtitle, ctaLabel, href, imagePreview, imageUrl, onPreviewChange],
  )

  useEffect(() => {
    if (!open) return
    const nextHref = item?.href ?? ""
    setTitle(item?.title ?? "")
    setSubtitle(item?.subtitle ?? "")
    setHref(nextHref)
    setCtaLabel(item?.ctaLabel ?? "")
    setStatus(item?.status ?? "draft")
    setCityId(item?.cityId ?? "global")
    const preview =
      item?.mobileImageUrl || item?.imageUrl || imagePreview || ""
    setImageUrl(preview)
    setImageUploadId(
      pickedUploadId ?? item?.mobileImageUploadId ?? item?.imageUploadId ?? null,
    )
    setImageError("")
    onPreviewChange?.({
      title: item?.title ?? "",
      subtitle: item?.subtitle ?? "",
      ctaLabel: item?.ctaLabel ?? "",
      href: nextHref,
      linkLabel: linkPreviewLabel(nextHref),
      imageUrl: preview,
    })
  }, [open, item, imagePreview, pickedUploadId, onPreviewChange])

  useEffect(() => {
    if (!open) return
    pushPreview({})
  }, [open, title, subtitle, ctaLabel, href, imageUrl, imagePreview, pushPreview])

  function handleSubmit(event) {
    event.preventDefault()
    const resolvedUploadId =
      imageUploadId ?? pickedUploadId ?? item?.mobileImageUploadId ?? item?.imageUploadId ?? null
    if (!resolvedUploadId) {
      setImageError("Pick a hero image from media.")
      return
    }
    setImageError("")
    const city = cityId === "global" ? null : cityId
    const cityName = cities.find((row) => row.id === city)?.name ?? item?.cityName ?? null
    onSubmit?.({
      placement: PLACEMENT,
      title: emptyToNull(title),
      subtitle: emptyToNull(subtitle),
      imageUploadId: resolvedUploadId,
      mobileImageUploadId: resolvedUploadId,
      href: emptyToNull(href),
      ctaLabel: emptyToNull(ctaLabel),
      status,
      sortIndex: item?.sortIndex ?? 0,
      cityId: city,
      cityName,
      platforms: ["android"],
      priority: 0,
    })
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit app hero" : "Add app hero"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : item ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid w-full min-w-0 gap-4">
        <div className="grid gap-2">
          <Label>
            Hero image <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Recommended: {CMS_BANNER_APP_HERO_HINT}. Marketing text usually lives in the image.
          </p>
          {onPickImage ? (
            <Button type="button" variant="outline" onClick={onPickImage}>
              Choose from media
            </Button>
          ) : null}
          {imagePreview || imageUrl ? (
            <img
              src={imagePreview || imageUrl}
              alt=""
              className="mx-auto h-48 max-w-[12rem] rounded-lg object-cover"
            />
          ) : (
            <p className="text-xs text-muted-foreground">Hero image is required.</p>
          )}
          {imageError ? <p className="text-sm text-destructive">{imageError}</p> : null}
        </div>

        <AppBannerLinkField value={href} onChange={setHref} />

        <div className="grid gap-2">
          <Label>Accessibility label (optional)</Label>
          <Input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="e.g. Shop birthday decor"
          />
          <p className="text-xs text-muted-foreground">
            Screen readers when the banner is tappable. Usually matches the promo in your image.
          </p>
        </div>

        <details className="rounded-lg border border-dashed border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Optional CMS text overlay</summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Not shown on the Android home hero (image-only). Leave empty unless you reuse this banner elsewhere.
          </p>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label>Subtitle</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </details>

        <div className="grid gap-2">
          <Label>Show this hero in</Label>
          <p className="text-xs text-muted-foreground">
            All cities by default. Pick one city only if this slide is city-specific.
          </p>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">All cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <p className="text-xs text-muted-foreground">
          Saved for the Android customer app only (<code className="text-xs">platforms: android</code>).
        </p>
      </form>
    </CmsFormDialogShell>
  )
}
