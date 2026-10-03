import { useEffect, useMemo, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"

const FORM_ID = "home-layout-form"

function emptyToNull(value) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const APP_DEFAULT_MAX_VISIBLE = 6
const APP_DEFAULT_VIEW_ALL = "/(app)/category"
const WEBSITE_DEFAULT_MAX_VISIBLE = 5
const WEBSITE_DEFAULT_VIEW_ALL = "/decorations"

export function HomeLayoutFormDialog({
  channel = "website",
  open,
  onOpenChange,
  item,
  cities = [],
  scopeCityId = "global",
  sections = [],
  categoryOptions = [],
  onSubmit,
  submitting,
}) {
  const isApp = channel === "app"
  const isEdit = Boolean(item?.id)
  const defaultMaxVisible = isApp ? APP_DEFAULT_MAX_VISIBLE : WEBSITE_DEFAULT_MAX_VISIBLE
  const defaultViewAll = isApp ? APP_DEFAULT_VIEW_ALL : WEBSITE_DEFAULT_VIEW_ALL
  const [type, setType] = useState("category_row")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [showTitle, setShowTitle] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [status, setStatus] = useState("draft")
  const [cityId, setCityId] = useState("global")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [sectionId, setSectionId] = useState("")
  const [categoryIds, setCategoryIds] = useState([])
  const [maxVisible, setMaxVisible] = useState(5)
  const [showViewAll, setShowViewAll] = useState(true)
  const [viewAllHref, setViewAllHref] = useState("/decorations")
  const [enableDrillDown, setEnableDrillDown] = useState(false)
  const [addCategoryId, setAddCategoryId] = useState("")

  useEffect(() => {
    if (!open) return
    setType(item?.type ?? "category_row")
    setTitle(item?.title ?? "")
    setSubtitle(item?.subtitle ?? "")
    setShowTitle(item?.showTitle ?? true)
    setShowSubtitle(item?.showSubtitle ?? true)
    setStatus(item?.status ?? "draft")
    setCityId(item?.cityId ?? scopeCityId ?? "global")
    setPlatforms(isApp ? ["android"] : websitePlatformsOnly(item?.platforms))
    setSectionId(item?.sectionId ?? "")
    setCategoryIds(item?.categoryIds ?? [])
    const config = item?.config ?? {}
    setMaxVisible(config.maxVisible ?? defaultMaxVisible)
    setShowViewAll(config.showViewAll ?? true)
    setViewAllHref(config.viewAllHref ?? defaultViewAll)
    setEnableDrillDown(config.enableDrillDown ?? false)
    setAddCategoryId("")
  }, [open, item, scopeCityId, isApp, defaultMaxVisible, defaultViewAll])

  const availableCategories = useMemo(
    () => categoryOptions.filter((cat) => !categoryIds.includes(cat.id)),
    [categoryOptions, categoryIds],
  )

  function addCategory() {
    if (!addCategoryId || categoryIds.includes(addCategoryId)) return
    setCategoryIds((prev) => [...prev, addCategoryId])
    setAddCategoryId("")
  }

  function removeCategory(id) {
    setCategoryIds((prev) => prev.filter((value) => value !== id))
  }

  function moveCategory(id, direction) {
    setCategoryIds((prev) => {
      const index = prev.indexOf(id)
      if (index < 0) return prev
      const next = [...prev]
      const swap = direction === "up" ? index - 1 : index + 1
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      type,
      title: emptyToNull(title),
      subtitle: emptyToNull(subtitle),
      showTitle,
      showSubtitle,
      status,
      cityId: cityId === "global" ? null : cityId,
      platforms: isApp ? ["android"] : platforms,
    }
    if (type === "product_rail") {
      payload.sectionId = sectionId
    } else {
      payload.categoryIds = categoryIds
      payload.config = {
        maxVisible: Number(maxVisible) || defaultMaxVisible,
        showViewAll,
        viewAllHref: emptyToNull(viewAllHref) ?? defaultViewAll,
        enableDrillDown: isApp ? false : enableDrillDown,
      }
    }
    onSubmit(payload)
  }

  const categoryLabelById = useMemo(
    () => new Map(categoryOptions.map((cat) => [cat.id, cat.label ?? cat.name])),
    [categoryOptions],
  )

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === sectionId),
    [sections, sectionId],
  )

  const scopeCityLabel =
    cityId === "global" ? "Global" : cities.find((city) => city.id === cityId)?.name

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit homepage block" : "Add homepage block"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : isEdit ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        {!isEdit ? (
          <div className="space-y-2">
            <Label>Block type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category_row">Category row</SelectItem>
                <SelectItem value="product_rail">Package rail (catalog section)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="layout-title">Title</Label>
            <Input id="layout-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="layout-subtitle">Subtitle</Label>
            <Input id="layout-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showTitle} onCheckedChange={setShowTitle} />
            Show title
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showSubtitle} onCheckedChange={setShowSubtitle} />
            Show subtitle
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>{isApp ? "Show this block in" : "Scope"}</Label>
            {isApp ? (
              <p className="text-xs text-muted-foreground">
                All cities by default. Pick one city only if this block is city-specific.
              </p>
            ) : null}
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger>
                <SelectValue placeholder={isApp ? "All cities" : "Scope"}>
                  {scopeCityLabel === "Global" && isApp ? "All cities" : scopeCityLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">{isApp ? "All cities" : "Global"}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isApp ? (
          <PlatformCheckboxes value={platforms} onChange={setPlatforms} />
        ) : null}

        {type === "product_rail" ? (
          <div className="space-y-2">
            <Label>Catalog section</Label>
            {isApp ? (
              <p className="text-xs text-muted-foreground">
                Products in this horizontal row come from the selected catalog section (same as website).
              </p>
            ) : null}
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select section">
                  {selectedSection
                    ? `${selectedSection.name} (${selectedSection.slug})`
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} ({section.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Label>Top-level categories (order = display order)</Label>
            <div className="flex flex-wrap gap-2">
              <Select value={addCategoryId} onValueChange={setAddCategoryId}>
                <SelectTrigger className="h-9 min-w-[200px]">
                  <SelectValue placeholder="Add category">
                    {addCategoryId ? categoryLabelById.get(addCategoryId) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label ?? cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={addCategory} disabled={!addCategoryId}>
                Add
              </Button>
            </div>
            <ul className="space-y-1">
              {categoryIds.map((id, index) => (
                <li key={id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{categoryLabelById.get(id) ?? id}</span>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => moveCategory(id, "up")} aria-label="Move up">
                    <ChevronUpIcon className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === categoryIds.length - 1} onClick={() => moveCategory(id, "down")} aria-label="Move down">
                    <ChevronDownIcon className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeCategory(id)} aria-label="Remove">
                    <XIcon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-visible">Max visible on home</Label>
                <Input
                  id="max-visible"
                  type="number"
                  min={1}
                  max={10}
                  value={maxVisible}
                  onChange={(e) => setMaxVisible(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-all-href">View all link</Label>
                <Input id="view-all-href" value={viewAllHref} onChange={(e) => setViewAllHref(e.target.value)} />
                {isApp ? (
                  <p className="text-xs text-muted-foreground">
                    Use /(app)/category to open the Category tab when home shows fewer tiles than selected.
                  </p>
                ) : null}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={showViewAll} onCheckedChange={setShowViewAll} />
              Show View all when more categories than max
            </label>
            {!isApp ? (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={enableDrillDown} onCheckedChange={setEnableDrillDown} />
                Enable subcategory drill-down
              </label>
            ) : null}
          </div>
        )}

      </form>
    </CmsFormDialogShell>
  )
}
