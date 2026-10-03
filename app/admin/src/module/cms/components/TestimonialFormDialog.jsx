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
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { AccentColorField } from "@/module/cms/components/AccentColorField"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"

const FORM_ID = "testimonial-form"

export function TestimonialFormDialog({
  open,
  onOpenChange,
  item,
  cities = [],
  onSubmit,
  submitting,
}) {
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
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : item ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid w-full min-w-0 gap-4">
        <div className="grid gap-2">
          <Label>Quote</Label>
          <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={4} required minLength={10} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>City / role line</Label>
            <Input value={reviewerCity} onChange={(e) => setReviewerCity(e.target.value)} />
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
