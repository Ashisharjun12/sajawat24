import { createLibrary, defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { HeartIcon, ZapIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Metric = defineComponent({
  name: "Metric",
  description: "A KPI. value is preformatted text such as \"128\" or \"₹12,400\".",
  props: z.object({
    label: z.string(),
    value: z.string(),
    hint: z.string().optional(),
  }),
  component: ({ props }) => (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{props.label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{props.value}</CardTitle>
      </CardHeader>
      {props.hint ? (
        <CardContent className="text-xs text-muted-foreground">{props.hint}</CardContent>
      ) : null}
    </Card>
  ),
})

const DataTable = defineComponent({
  name: "DataTable",
  description: "A compact table. columns is header labels. rows is an array of string arrays aligned to columns.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  component: ({ props }) => (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            {props.columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>
                  <TableCellValue value={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
})

const Callout = defineComponent({
  name: "Callout",
  description: "A note. tone info for empty results or explanations, warning for refusals or clamp notices.",
  props: z.object({
    title: z.string(),
    body: z.string(),
    tone: z.enum(["info", "warning"]).optional(),
  }),
  component: ({ props }) => (
    <Alert variant={props.tone === "warning" ? "destructive" : "default"}>
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription>{props.body}</AlertDescription>
    </Alert>
  ),
})

function safeImageUrl(url) {
  if (typeof url !== "string") return ""
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed
  return ""
}

function isImageUrlCell(value) {
  const src = safeImageUrl(value)
  if (!src) return false
  return (
    /\.(webp|png|jpe?g|gif|avif|svg)(\?|#|$)/i.test(src) ||
    /\/uploads\/image\//i.test(src)
  )
}

function TableCellValue({ value }) {
  const text = value == null ? "" : String(value)
  if (!isImageUrlCell(text)) return text
  const src = safeImageUrl(text)
  return (
    <img src={src} alt="" className="size-8 rounded-full object-cover ring-1 ring-border" />
  )
}

const ProductCard = defineComponent({
  name: "ProductCard",
  description:
    "Storefront-style product card. Copy imageUrl, priceLabel, compareAtLabel, percentOff, instantLabel, badgeLabel from the tool. gmvLabel and quantity are optional sales extras. Empty strings hide those chips.",
  props: z.object({
    name: z.string(),
    imageUrl: z.string(),
    gmvLabel: z.string().optional(),
    quantity: z.number().optional(),
    priceLabel: z.string().optional(),
    compareAtLabel: z.string().optional(),
    percentOff: z.number().optional(),
    instantLabel: z.string().optional(),
    badgeLabel: z.string().optional(),
  }),
  component: ({ props }) => {
    const src = safeImageUrl(props.imageUrl)
    const price = props.priceLabel?.trim() || ""
    const compare = props.compareAtLabel?.trim() || ""
    const instant = props.instantLabel?.trim() || ""
    const badge = props.badgeLabel?.trim() || ""
    const off = Number(props.percentOff) > 0 ? Math.round(Number(props.percentOff)) : 0
    const sold =
      [props.gmvLabel, props.quantity != null && props.quantity > 0 ? `Qty ${props.quantity}` : null]
        .filter((part) => part && String(part).trim())
        .join(" · ")
    return (
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-[var(--radius-card)] bg-muted">
          {badge ? (
            <span className="absolute top-2 right-2 z-10 max-w-[85%] truncate rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold leading-tight text-primary-foreground shadow-sm sm:text-[11px]">
              {badge}
            </span>
          ) : null}
          <span
            className="absolute top-2 left-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-background/95 text-muted-foreground shadow-sm ring-1 ring-border/60"
            aria-hidden
          >
            <HeartIcon className="size-4" />
          </span>
          {src ? (
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
          <h3
            className="line-clamp-2 min-h-[2.75em] font-heading text-[13px] font-bold leading-snug tracking-tight text-foreground"
            title={props.name}
          >
            {props.name}
          </h3>
          <div className="mt-1.5 flex h-5 shrink-0 items-center justify-end">
            {instant ? (
              <div className="flex min-w-0 max-w-[70%] items-center gap-1 text-xs font-semibold text-[#e11d48] dark:text-[#fb7185]">
                <ZapIcon className="size-3 shrink-0 fill-current" aria-hidden />
                <span className="truncate leading-none">{instant}</span>
              </div>
            ) : null}
          </div>
          {price ? (
            <div className="mt-auto flex min-h-6 min-w-0 flex-nowrap items-center justify-between gap-2 pt-1.5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                <span className="shrink-0 text-sm font-extrabold tracking-tight tabular-nums text-foreground">
                  {price}
                </span>
                {compare ? (
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground line-through tabular-nums">
                    {compare}
                  </span>
                ) : null}
              </div>
              {off > 0 ? (
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-primary">{off}% off</span>
              ) : null}
            </div>
          ) : null}
          {sold ? <p className="mt-1 text-[11px] text-muted-foreground">{sold}</p> : null}
        </div>
      </article>
    )
  },
})

const AddonCard = defineComponent({
  name: "AddonCard",
  description:
    "Storefront-style add-on card (image, name, price). Copy imageUrl, priceLabel, compareAtLabel, percentOff, colorName, colorHex from catalog_addons. Never use for products.",
  props: z.object({
    name: z.string(),
    imageUrl: z.string(),
    priceLabel: z.string().optional(),
    compareAtLabel: z.string().optional(),
    percentOff: z.number().optional(),
    colorName: z.string().optional(),
    colorHex: z.string().optional(),
  }),
  component: ({ props }) => {
    const src = safeImageUrl(props.imageUrl)
    const price = props.priceLabel?.trim() || ""
    const compare = props.compareAtLabel?.trim() || ""
    const off = Number(props.percentOff) > 0 ? Math.round(Number(props.percentOff)) : 0
    const colorName = props.colorName?.trim() || ""
    const hex = /^#[0-9a-fA-F]{3,8}$/.test(props.colorHex?.trim() || "") ? props.colorHex.trim() : ""
    return (
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="relative aspect-square w-full bg-muted">
          {src ? (
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2.5">
          <h3
            className="line-clamp-2 min-h-[2.35rem] text-[11px] font-semibold leading-snug text-foreground"
            title={props.name}
          >
            {props.name}
          </h3>
          {price ? (
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                <p
                  className={
                    price.toLowerCase() === "free"
                      ? "text-sm font-bold text-emerald-600"
                      : "text-sm font-extrabold tabular-nums text-foreground"
                  }
                >
                  {price}
                </p>
                {compare ? (
                  <span className="text-[10px] font-medium text-muted-foreground line-through tabular-nums">
                    {compare}
                  </span>
                ) : null}
              </div>
              {off > 0 ? (
                <p className="text-[10px] font-semibold text-emerald-600">{off}% OFF</p>
              ) : null}
            </div>
          ) : null}
          {hex || colorName ? (
            <div className="mt-auto flex items-center gap-1.5 border-t border-border/50 pt-2">
              {hex ? (
                <span
                  className="size-3.5 shrink-0 rounded-full border border-background shadow-sm"
                  style={{ backgroundColor: hex }}
                  aria-hidden
                />
              ) : null}
              {colorName ? (
                <span className="truncate text-[10px] font-medium text-muted-foreground">{colorName}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    )
  },
})

const AddonGrid = defineComponent({
  name: "AddonGrid",
  description: "A wrap of AddonCard items for list-addons answers. Never use ProductCard here. Never use when empty: true.",
  props: z.object({
    title: z.string(),
    children: z.array(AddonCard.ref),
  }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{props.title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {renderNode(props.children)}
      </div>
    </div>
  ),
})

const MediaCard = defineComponent({
  name: "MediaCard",
  description:
    "Media-library file. Copy name, imageUrl, kind, sizeLabel, dimensions from catalog_media. Never use for products or addons.",
  props: z.object({
    name: z.string(),
    imageUrl: z.string(),
    kind: z.string().optional(),
    sizeLabel: z.string().optional(),
    dimensions: z.string().optional(),
  }),
  component: ({ props }) => {
    const src = safeImageUrl(props.imageUrl)
    const meta = [props.kind, props.dimensions, props.sizeLabel]
      .map((part) => (part && String(part).trim()) || "")
      .filter(Boolean)
      .join(" · ")
    return (
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="relative aspect-square w-full bg-muted">
          {src ? (
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2.5">
          <h3 className="line-clamp-2 min-h-[2.35rem] text-[11px] font-semibold leading-snug text-foreground" title={props.name}>
            {props.name}
          </h3>
          {meta ? <p className="text-[10px] text-muted-foreground">{meta}</p> : null}
        </div>
      </article>
    )
  },
})

const MediaGrid = defineComponent({
  name: "MediaGrid",
  description: "A wrap of MediaCard items for list-media answers. Never use when empty: true.",
  props: z.object({
    title: z.string(),
    children: z.array(MediaCard.ref),
  }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{props.title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {renderNode(props.children)}
      </div>
    </div>
  ),
})

const ProductGrid = defineComponent({
  name: "ProductGrid",
  description: "A wrap of ProductCard items. Use for top sold products or catalog lists. Never use when the tool returned empty: true. Never use for addons.",
  props: z.object({
    title: z.string(),
    children: z.array(ProductCard.ref),
  }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{props.title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {renderNode(props.children)}
      </div>
    </div>
  ),
})

const BarChart = defineComponent({
  name: "BarChart",
  description: "Horizontal bars. labels and values are parallel arrays of the same length.",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
  }),
  component: ({ props }) => {
    const max = Math.max(1, ...props.values)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {props.labels.map((label, index) => {
            const value = props.values[index] ?? 0
            const width = `${Math.max(4, Math.round((value / max) * 100))}%`
            return (
              <div key={`${label}-${index}`} className="grid gap-1">
                <div className="flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="tabular-nums text-muted-foreground">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  },
})

const block = z.union([
  Metric.ref,
  DataTable.ref,
  Callout.ref,
  BarChart.ref,
  ProductGrid.ref,
  ProductCard.ref,
  AddonGrid.ref,
  AddonCard.ref,
  MediaGrid.ref,
  MediaCard.ref,
])

const Panel = defineComponent({
  name: "Panel",
  description: "Root vertical stack for every analytics answer.",
  props: z.object({
    children: z.array(block),
  }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-4">{renderNode(props.children)}</div>
  ),
})

export const library = createLibrary({
  id: "sajawat-analytics",
  root: "Panel",
  components: [
    Panel,
    Metric,
    DataTable,
    Callout,
    BarChart,
    ProductGrid,
    ProductCard,
    AddonGrid,
    AddonCard,
    MediaGrid,
    MediaCard,
  ],
})
