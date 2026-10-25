import { useMemo, useState } from "react"
import {
  BanknoteIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CreditCardIcon,
  HelpCircleIcon,
  ImageIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
  ZapIcon,
} from "lucide-react"
import { useThread } from "@openuidev/react-headless"
import { Renderer } from "@openuidev/react-lang"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { library } from "@/lib/openui"

function flattenContent(content) {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part
        if (part && typeof part === "object") {
          return part.text ?? part.content ?? JSON.stringify(part)
        }
        return ""
      })
      .join("\n")
  }
  if (content && typeof content === "object") return JSON.stringify(content)
  return ""
}

function messageText(message) {
  return flattenContent(message?.content).trim()
}

function parseJsonLoose(text) {
  if (typeof text !== "string") return null
  const trimmed = text.trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}

function asPayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  if (data.metric === "order_stats" && typeof data.empty === "boolean") {
    return data
  }
  if (Array.isArray(data.items) && data.items.length > 0 && typeof data.items[0] === "object") {
    return data
  }
  if (Array.isArray(data.columns) && Array.isArray(data.rows)) {
    return data
  }
  return null
}

function extractPayload(value, seen = new Set()) {
  const direct = asPayload(value)
  if (direct) return direct
  if (typeof value === "string") return extractPayload(parseJsonLoose(value), seen)
  if (!value || typeof value !== "object") return null
  if (seen.has(value)) return null
  seen.add(value)
  for (const key of ["result", "data", "output", "content"]) {
    if (key in value) {
      const found = extractPayload(value[key], seen)
      if (found) return found
    }
  }
  return null
}

function toolsAfterLastUser(messages) {
  let lastUser = -1
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      lastUser = index
      break
    }
  }
  return messages.slice(lastUser + 1).filter((message) => message?.role === "tool")
}

function getToolsForAssistantMessage(messages, targetMessage) {
  if (!Array.isArray(messages) || messages.length === 0) return []
  if (!targetMessage) return toolsAfterLastUser(messages)

  const targetIndex = messages.findIndex(
    (m) => m === targetMessage || (m?.id && targetMessage?.id && m.id === targetMessage.id),
  )

  if (targetIndex === -1) {
    return toolsAfterLastUser(messages)
  }

  let userIndex = -1
  for (let i = targetIndex - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      userIndex = i
      break
    }
  }

  let nextUserIndex = messages.length
  for (let i = targetIndex + 1; i < messages.length; i += 1) {
    if (messages[i]?.role === "user") {
      nextUserIndex = i
      break
    }
  }

  const turnSlice = messages.slice(userIndex + 1, nextUserIndex)
  return turnSlice.filter((m) => m?.role === "tool")
}

function collectToolPayloads(messages, targetMessage) {
  const tools = targetMessage
    ? getToolsForAssistantMessage(messages, targetMessage)
    : toolsAfterLastUser(messages)

  const payloads = tools
    .map(
      (message) =>
        extractPayload(message?.content) ??
        extractPayload(parseJsonLoose(flattenContent(message?.content))),
    )
    .filter(Boolean)

  if (targetMessage?.toolInvocations && Array.isArray(targetMessage.toolInvocations)) {
    for (const inv of targetMessage.toolInvocations) {
      const p = extractPayload(inv?.result ?? inv)
      if (p) payloads.push(p)
    }
  }

  return payloads
}

function labelValueSeries(payload) {
  if (!payload) return null
  if (payload.metric === "entity_totals" && Array.isArray(payload.labels) && Array.isArray(payload.values)) {
    return {
      labels: payload.labels.map(String),
      values: payload.values.map((value) => Number(value) || 0),
    }
  }
  const columns = Array.isArray(payload.columns) ? payload.columns.map((column) => String(column).toLowerCase()) : []
  const rows = Array.isArray(payload.rows) ? payload.rows : []
  if (columns.length < 2 || rows.length === 0) return null
  const labelIndex = columns.findIndex((column) => column === "label" || column === "name")
  const valueIndex = columns.findIndex((column) => column === "value" || column === "count" || column === "n")
  if (labelIndex < 0 || valueIndex < 0) return null
  const labels = []
  const values = []
  for (const row of rows) {
    const cells = Array.isArray(row) ? row : Object.values(row)
    const n = Number(cells[valueIndex])
    if (!Number.isFinite(n)) return null
    labels.push(String(cells[labelIndex] ?? ""))
    values.push(n)
  }
  return labels.length ? { labels, values } : null
}

function bestToolPayload(messages, targetMessage) {
  const payloads = collectToolPayloads(messages, targetMessage)
  if (payloads.length === 0) return null
  return (
    payloads.find((payload) => payload.metric === "product_details") ||
    payloads.find((payload) => payload.metric === "entity_totals") ||
    payloads.find((payload) => payload.metric === "order_stats" && payload.empty === true) ||
    payloads.find((payload) => labelValueSeries(payload)) ||
    payloads[payloads.length - 1]
  )
}

function comparisonLang(title, labels, values) {
  const labelLit = JSON.stringify(labels)
  const valueLit = JSON.stringify(values)
  const rowsLit = JSON.stringify(labels.map((label, index) => [label, String(values[index])]))
  return `root = Panel([bars, pie, tbl])
bars = BarChart(${JSON.stringify(title)}, ${labelLit}, ${valueLit})
pie = PieChart("Share", ${labelLit}, ${valueLit})
tbl = DataTable(["Metric", "Total"], ${rowsLit})`
}

function dailyCountsLang(payload) {
  if (!Array.isArray(payload?.labels) || !Array.isArray(payload?.seriesNames) || !Array.isArray(payload?.seriesValues)) {
    return null
  }
  return `root = Panel([chart])
chart = LineChart("Users vs products vs orders", ${JSON.stringify(payload.labels)}, ${JSON.stringify(payload.seriesNames)}, ${JSON.stringify(payload.seriesValues)})`
}

function catalogCitiesLang(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  if (items.length === 0) return null

  const markerLines = items.map((item, index) => {
    const id = `c${index + 1}`
    const name = JSON.stringify(item.name || "")
    const state = JSON.stringify(item.state || "")
    const img = JSON.stringify(item.imageUrl || "")
    const numLat = Number(item.latitude)
    const numLng = Number(item.longitude)
    const hasCoords =
      typeof item.latitude === "number" &&
      typeof item.longitude === "number" &&
      !Number.isNaN(numLat) &&
      !Number.isNaN(numLng)
    const coordsStr = hasCoords ? `, ${numLat}, ${numLng}` : ""
    return `${id} = CityMarker(${name}, ${state}, ${img}${coordsStr})`
  })

  const markerIds = items.map((_, index) => `c${index + 1}`).join(", ")
  const rowsLit = JSON.stringify(
    items.map((item) => [item.imageUrl || "", item.name, item.slug || "", item.state || ""]),
  )

  return `root = Panel([map, tbl])
map = CityMap("Active Service Cities", [${markerIds}])
${markerLines.join("\n")}
tbl = DataTable(["image", "name", "slug", "state"], ${rowsLit})`
}

function isImageUrl(value) {
  if (typeof value !== "string") return false
  const src = value.trim()
  if (src.startsWith("/") && !src.startsWith("//")) return true
  if (!/^https?:\/\//i.test(src)) return false
  return (
    /\.(webp|png|jpe?g|gif|avif|svg)(\?|#|$)/i.test(src) ||
    /\/uploads\/(image|images)\//i.test(src) ||
    /https?:\/\/.*\/uploads\//i.test(src) ||
    /https?:\/\/.*(r2\.dev|cloudflarestorage|amazonaws|cloudinary)/i.test(src)
  )
}

function CityThumb({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!isImageUrl(src) || failed) {
    return (
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-border text-muted-foreground shadow-2xs"
        aria-hidden
      >
        <MapPinIcon className="size-4 text-primary/70" />
      </span>
    )
  }
  return (
    <div className="relative size-9 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border shadow-2xs">
      <img
        src={src}
        alt={alt || ""}
        className="size-full object-cover transition-transform hover:scale-110"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function CategoryNameCell({ name, imageUrl }) {
  const hasImage = typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl.trim())
  return (
    <span className="inline-flex items-center gap-2">
      {hasImage ? (
        <img src={imageUrl} alt="" className="size-8 shrink-0 rounded-md object-cover ring-1 ring-border" />
      ) : null}
      <span>{name}</span>
    </span>
  )
}

function cellValue(value) {
  const text = value == null ? "" : String(value)
  if (isImageUrl(text)) return <CityThumb src={text} alt="" />
  return text
}

function ResultTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column === "image" || column === "imageUrl" ? "" : column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cellValue(cell)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function MediaFallbackGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id || item.imageUrl || item.name}
          className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card"
        >
          <div className="aspect-square bg-muted">
            {isImageUrl(item.imageUrl) ? (
              <img src={item.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>
          <p className="line-clamp-2 p-2.5 text-[11px] font-semibold">{item.name}</p>
        </article>
      ))}
    </div>
  )
}

function emptyResultTitle(payload) {
  if (payload.metric === "product_details") return "Product not found"
  if (payload.metric !== "order_stats") return "No data"
  if (payload.status === "PENDING_PAYMENT") return "No pending orders"
  return payload.status ? "No matching orders" : "No orders"
}

function ProductDetailCard({ product, columns, rows }) {
  const allImages = useMemo(() => {
    const list = []
    if (Array.isArray(product?.images)) {
      for (const img of product.images) {
        if (isImageUrl(img) && !list.includes(img)) list.push(img)
      }
    }
    if (isImageUrl(product?.imageUrl) && !list.includes(product.imageUrl)) {
      list.push(product.imageUrl)
    }
    return list
  }, [product])

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  const [showRawTable, setShowRawTable] = useState(false)
  const [imageError, setImageError] = useState(false)

  const activeImage = allImages[activeImageIndex] || allImages[0] || ""
  const addons = Array.isArray(product?.addons) ? product.addons : []
  const cityPrices = Array.isArray(product?.cityPrices) ? product.cityPrices : []
  const includes = Array.isArray(product?.includes) ? product.includes : []
  const deliverySetup = Array.isArray(product?.deliverySetup) ? product.deliverySetup : []
  const careInstructions = Array.isArray(product?.careInstructions) ? product.careInstructions : []
  const faqs = Array.isArray(product?.faqs) ? product.faqs : []

  const instant = product?.instant || {}
  const scheduled = product?.scheduled || {}
  const payments = product?.payments || {}
  const hasDiscount = product?.percentOff && Number(product.percentOff) > 0

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur-xs sm:p-5">
      {/* Header with Title & Badges */}
      <div className="space-y-2 border-b border-border/80 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {product?.categoryName ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <PackageIcon className="size-3" />
              {product.categoryName}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              product?.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${product?.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`}
            />
            {product?.isActive ? "Active" : "Inactive"}
          </span>
          {product?.ratingAvg != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <StarIcon className="size-3 fill-current" />
              {product.ratingAvg} {product.reviewCount ? `(${product.reviewCount})` : ""}
            </span>
          ) : null}
          {product?.slug ? (
            <span className="font-mono text-[11px] text-muted-foreground">/{product.slug}</span>
          ) : null}
        </div>
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-2xl">
          {product?.name}
        </h2>
      </div>

      {/* Gallery & Pricing / Booking Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column: Multi-Image Gallery */}
        <div className="space-y-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-xs">
            {instant.enabled ? (
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                <ZapIcon className="size-3 fill-current" />
                <span>
                  {instant.badgeLabel || "Instant"}
                  {instant.etaMinutes ? ` · ~${instant.etaMinutes} min` : ""}
                </span>
              </div>
            ) : null}
            {hasDiscount ? (
              <div className="absolute top-2.5 right-2.5 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                {product.percentOff}% OFF
              </div>
            ) : null}
            {activeImage && !imageError ? (
              <img
                src={activeImage}
                alt={product?.name || ""}
                className="size-full object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                <ImageIcon className="size-8 opacity-40" />
                <span className="text-xs">No image available</span>
              </div>
            )}
            {allImages.length > 1 ? (
              <div className="absolute bottom-2.5 right-2.5 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                {activeImageIndex + 1} / {allImages.length}
              </div>
            ) : null}
          </div>

          {/* Thumbnails Strip */}
          {allImages.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx)
                    setImageError(false)
                  }}
                  className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activeImageIndex === idx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/70 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right Column: Pricing & Booking Fulfillment */}
        <div className="flex flex-col justify-between space-y-3">
          {/* Price Box */}
          <div className="rounded-2xl border border-border/80 bg-background/70 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Package Price</span>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {product?.priceLabel || "Free"}
              </span>
              {product?.compareAtLabel ? (
                <span className="text-sm font-medium text-muted-foreground line-through">
                  {product.compareAtLabel}
                </span>
              ) : null}
              {hasDiscount ? (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Save {product.percentOff}%
                </span>
              ) : null}
            </div>

            {/* Payment methods */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
              {payments.cod ? (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <BanknoteIcon className="size-3.5 text-emerald-600" /> Cash on delivery
                </span>
              ) : null}
              {payments.online ? (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <CreditCardIcon className="size-3.5 text-blue-600" /> Online payment
                </span>
              ) : null}
              {!payments.cod && !payments.online ? (
                <span>Payment: Inquire for details</span>
              ) : null}
            </div>
          </div>

          {/* Booking Cards (Instant & Scheduled) */}
          <div className="space-y-2">
            {/* Instant Booking Card */}
            <div
              className={`rounded-xl border p-2.5 transition ${
                instant.enabled
                  ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10"
                  : "border-border/60 bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ZapIcon
                    className={`size-3.5 ${
                      instant.enabled ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
                    }`}
                  />
                  <span>Instant Booking</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    instant.enabled ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                  }`}
                >
                  {instant.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {instant.enabled ? (
                <div className="mt-1 space-y-1 text-xs">
                  {instant.etaMinutes ? (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <ClockIcon className="size-3 text-rose-500" />
                      Ready in ~<strong className="text-foreground">{instant.etaMinutes} mins</strong>
                    </p>
                  ) : null}
                  {instant.pdpNote ? (
                    <p className="rounded-md border border-rose-500/20 bg-background/80 p-1.5 text-[11px] italic text-muted-foreground">
                      "{instant.pdpNote}"
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Scheduled Booking Card */}
            <div
              className={`rounded-xl border p-2.5 transition ${
                scheduled.enabled ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <CalendarIcon
                    className={`size-3.5 ${
                      scheduled.enabled ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span>Scheduled Booking</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    scheduled.enabled ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {scheduled.enabled ? "Available" : "Disabled"}
                </span>
              </div>
              {scheduled.enabled && Array.isArray(scheduled.slots) && scheduled.slots.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {scheduled.slots.map((slot, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-primary/20 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      {addons.length > 0 ? (
        <div className="space-y-2.5 rounded-2xl border border-border/80 bg-background/50 p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-heading text-xs font-bold text-foreground">
              <SparklesIcon className="size-3.5 text-primary" />
              Related Add-ons ({addons.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">Attachable accessories</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <div
                key={addon.id || addon.slug || addon.name}
                className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-card p-2 transition hover:border-primary/40"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {isImageUrl(addon.imageUrl) ? (
                    <img src={addon.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[9px] text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="truncate text-xs font-bold text-foreground" title={addon.name}>
                      {addon.name}
                    </h4>
                    {addon.colorHex ? (
                      <span
                        className="size-2.5 shrink-0 rounded-full ring-1 ring-border shadow-2xs"
                        style={{ backgroundColor: addon.colorHex }}
                        title={addon.colorName || ""}
                      />
                    ) : null}
                  </div>
                  {addon.description ? (
                    <p className="line-clamp-1 text-[10px] text-muted-foreground">{addon.description}</p>
                  ) : null}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{addon.priceLabel}</span>
                    {addon.maxQuantity > 1 ? (
                      <span className="text-[10px] text-muted-foreground">Max {addon.maxQuantity}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Available Cities & Pricing */}
      {cityPrices.length > 0 ? (
        <div className="space-y-2.5 rounded-2xl border border-border/80 bg-background/50 p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-heading text-xs font-bold text-foreground">
              <MapPinIcon className="size-3.5 text-primary" />
              Serviceable Cities & Pricing ({cityPrices.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {cityPrices.map((cp) => (
              <div
                key={cp.cityId || cp.cityName}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{cp.cityName}</p>
                  <p className="text-[10px] text-muted-foreground">{cp.state}</p>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1 border-t border-border/50 pt-1">
                  <span className="text-xs font-bold text-primary">{cp.priceLabel}</span>
                  {cp.compareAtLabel ? (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {cp.compareAtLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Package Specifications: Tabs (Overview, Includes, Delivery, Care, FAQs) */}
      <div className="rounded-2xl border border-border/80 bg-background/50 p-3.5">
        <div className="flex flex-wrap gap-1 border-b border-border/70 pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Description
          </button>
          {includes.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("includes")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "includes"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              What's Included ({includes.length})
            </button>
          ) : null}
          {deliverySetup.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("delivery")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "delivery"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Delivery & Setup ({deliverySetup.length})
            </button>
          ) : null}
          {careInstructions.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("care")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "care"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Care Guidelines ({careInstructions.length})
            </button>
          ) : null}
          {faqs.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("faqs")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                activeTab === "faqs"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              FAQs ({faqs.length})
            </button>
          ) : null}
        </div>

        {/* Tab Content */}
        <div className="pt-2.5">
          {activeTab === "overview" ? (
            <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
              {product?.description || "No package description provided."}
            </div>
          ) : null}

          {activeTab === "includes" ? (
            <ul className="space-y-1.5 text-xs text-foreground">
              {includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === "delivery" ? (
            <ul className="space-y-1.5 text-xs text-foreground">
              {deliverySetup.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <TruckIcon className="size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === "care" ? (
            <ul className="space-y-1.5 text-xs text-foreground">
              {careInstructions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ShieldCheckIcon className="size-4 shrink-0 text-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === "faqs" ? (
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-border/70 bg-card p-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <HelpCircleIcon className="size-3.5 shrink-0 text-primary" />
                    {faq.question}
                  </p>
                  <p className="mt-1 pl-5 text-xs text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Raw Data Collapsible Table */}
      {Array.isArray(columns) && Array.isArray(rows) && rows.length > 0 ? (
        <div className="border-t border-border/60 pt-2.5">
          <button
            type="button"
            onClick={() => setShowRawTable((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showRawTable ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
            <span>{showRawTable ? "Hide Raw Specifications Table" : "Show Raw Specifications Table"}</span>
          </button>
          {showRawTable ? (
            <div className="mt-2.5">
              <ResultTable
                columns={columns.map(String)}
                rows={rows.map((row) =>
                  (Array.isArray(row) ? row : Object.values(row)).map((cell) =>
                    cell == null ? "" : String(cell),
                  ),
                )}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ToolResultView({ payload }) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const isProductDetails = payload.metric === "product_details"
  const isMedia =
    payload.metric === "catalog_media" ||
    (items.length > 0 && items.some((item) => item.imageUrl) && items.every((item) => !item.state && !item.slug))
  const isCities =
    payload.metric === "catalog_cities" ||
    (items.length > 0 && items.every((item) => item.name && item.state != null))
  const isCategories = payload.metric === "catalog_categories"

  if (payload.empty === true || (items.length === 0 && (!payload.rows || payload.rows.length === 0))) {
    return (
      <Alert>
        <AlertTitle>{emptyResultTitle(payload)}</AlertTitle>
        <AlertDescription>{payload.emptyMessage || "Nothing matched this question."}</AlertDescription>
      </Alert>
    )
  }

  if (isMedia && items.length > 0) {
    return <MediaFallbackGrid items={items} />
  }

  if (isProductDetails && (items.length > 0 || payload.detail)) {
    const product = payload.detail || items[0] || {}
    return (
      <ProductDetailCard
        product={product}
        columns={payload.columns || []}
        rows={payload.rows || []}
      />
    )
  }

  if (isCities && items.length > 0) {
    const lang = catalogCitiesLang(payload)
    if (lang) {
      return <Renderer response={lang} library={library} isStreaming={false} />
    }
    return (
      <ResultTable
        columns={["image", "name", "slug", "state"]}
        rows={items.map((item) => [item.imageUrl || "", item.name, item.slug || "", item.state || ""])}
      />
    )
  }

  if (isCategories && Array.isArray(payload.columns) && Array.isArray(payload.rows)) {
    return (
      <div className="overflow-hidden rounded-2xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category / subcategory</TableHead>
              <TableHead>Parent category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || `${item.name}-${index}`}>
                <TableCell>
                  <CategoryNameCell name={item.name} imageUrl={item.imageUrl} />
                </TableCell>
                <TableCell>{item.parentCategory}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const series = labelValueSeries(payload)
  if (series) {
    return (
      <Renderer
        response={comparisonLang("Totals", series.labels, series.values)}
        library={library}
        isStreaming={false}
      />
    )
  }

  if (Array.isArray(payload.columns) && Array.isArray(payload.rows) && payload.rows.length > 0) {
    return (
      <ResultTable
        columns={payload.columns.map(String)}
        rows={payload.rows.map((row) =>
          (Array.isArray(row) ? row : Object.values(row)).map((cell) => (cell == null ? "" : String(cell))),
        )}
      />
    )
  }

  return null
}

function hasLangSyntax(content) {
  return Boolean(content) && (content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content))
}

function enrichCityImagesInContent(content, payload) {
  if (!content || !payload?.items || payload.items.length === 0) return content
  const isCities =
    payload.metric === "catalog_cities" ||
    payload.items.every((item) => item.name && item.state != null)
  if (!isCities) return content

  let result = content
  for (const item of payload.items) {
    if (!item.name || !item.imageUrl) continue
    const escaped = item.name.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")
    const pattern = new RegExp(`\\[\\s*(?:["']{2}|null)\\s*,\\s*(["']${escaped}["'])`, "g")
    result = result.replace(pattern, `[${JSON.stringify(item.imageUrl)}, $1`)
  }
  return result
}

export function AnalyticsAssistantMessage({ message, isStreaming }) {
  const messages = useThread((state) => state.messages)
  const content = messageText(message)
  const payload = useMemo(() => bestToolPayload(messages, message), [messages, message])
  const displayContent = useMemo(
    () => enrichCityImagesInContent(content, payload),
    [content, payload],
  )
  const series = labelValueSeries(payload)
  const fallback = payload ? <ToolResultView payload={payload} /> : null
  const trendLang = payload?.metric === "daily_counts" ? dailyCountsLang(payload) : null
  const isCategories = payload?.metric === "catalog_categories"
  const isProductDetails = payload?.metric === "product_details"
  const emptyOrderStats = payload?.metric === "order_stats" && payload.empty === true
  const citiesLang =
    payload?.metric === "catalog_cities" ||
    (payload?.items?.length > 0 && payload.items.every((item) => item.name && item.state != null))
      ? catalogCitiesLang(payload)
      : null

  if (emptyOrderStats) {
    return fallback
  }

  if (series) {
    return (
      <Renderer
        response={comparisonLang("Totals", series.labels, series.values)}
        library={library}
        isStreaming={false}
      />
    )
  }

  if (trendLang) {
    return <Renderer response={trendLang} library={library} isStreaming={false} />
  }

  if (isCategories && fallback) {
    return fallback
  }

  if (isProductDetails && fallback) {
    return fallback
  }

  if (displayContent && hasLangSyntax(displayContent)) {
    return <Renderer response={displayContent} library={library} isStreaming={isStreaming} />
  }

  if (citiesLang) {
    return <Renderer response={citiesLang} library={library} isStreaming={false} />
  }

  if (fallback) {
    return fallback
  }

  if (!isStreaming && !content) {
    return (
      <Alert>
        <AlertTitle>No data</AlertTitle>
        <AlertDescription>Nothing matched this question. Try another date range or a different metric.</AlertDescription>
      </Alert>
    )
  }

  if (!content) {
    return null
  }

  return <Renderer response={content} library={library} isStreaming={isStreaming} />
}
