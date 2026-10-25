import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createLibrary, defineComponent } from "@openuidev/react-lang"
import { useThread } from "@openuidev/react-headless"
import { z } from "zod"
import { HeartIcon, MapPinIcon, ZapIcon } from "lucide-react"
import Map, { Marker, Popup } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "@/components/ui/theme-provider"
import { INDIA_CENTER, resolveCoordinates } from "@/data/state-coords"
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "@/lib/map-styles"
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
import { AreaChart, BarChart, LineChart, PieChart } from "@/lib/openui-charts"

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

function isImageColumn(columnName) {
  if (typeof columnName !== "string") return false
  return /^(image|imageUrl|photo|img|pic|thumbnail)$/i.test(columnName.trim())
}

function formatColumnHeader(col) {
  if (typeof col !== "string") return ""
  const trimmed = col.trim()
  if (/^(image|imageUrl)$/i.test(trimmed)) return "Photo"
  if (/^name$/i.test(trimmed)) return "City"
  if (/^slug$/i.test(trimmed)) return "Slug"
  if (/^state$/i.test(trimmed)) return "State"
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

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
    /\/uploads\/(image|images)\//i.test(src) ||
    /https?:\/\/.*\/uploads\//i.test(src) ||
    /https?:\/\/.*(r2\.dev|cloudflarestorage|amazonaws|cloudinary)/i.test(src)
  )
}

function TableImageCell({ src, alt }) {
  const [failed, setFailed] = useState(false)
  const validSrc = safeImageUrl(src)

  if (!validSrc || failed) {
    return (
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-border text-muted-foreground shadow-2xs"
        title={alt || "Location"}
      >
        <MapPinIcon className="size-4 text-primary/70" />
      </div>
    )
  }

  return (
    <div className="relative size-9 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border shadow-2xs">
      <img
        src={validSrc}
        alt={alt || ""}
        className="size-full object-cover transition-transform hover:scale-110"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function TableCellValue({ value, column, row }) {
  const text = value == null ? "" : String(value)
  const isImgCol = isImageColumn(column)

  if (isImgCol) {
    return <TableImageCell src={text} alt={row?.[1] || row?.[0] || ""} />
  }

  if (isImageUrlCell(text)) {
    return <TableImageCell src={text} alt="" />
  }

  return text
}

const DataTable = defineComponent({
  name: "DataTable",
  description: "A compact table. columns is header labels. rows is an array of string arrays aligned to columns.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  component: ({ props }) => (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {props.columns.map((column, colIdx) => (
              <TableHead key={colIdx} className={isImageColumn(column) ? "w-16" : ""}>
                {formatColumnHeader(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((row, index) => (
            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="align-middle">
                  <TableCellValue
                    value={cell}
                    column={props.columns[cellIndex]}
                    row={row}
                  />
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

function ProductCardImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
        No image
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      className="size-full object-cover transition-transform duration-300 hover:scale-105"
      onError={() => setFailed(true)}
    />
  )
}

const ProductCard = defineComponent({
  name: "ProductCard",
  description:
    "Clickable storefront-style product card. Always copy productId, name, imageUrl, priceLabel, compareAtLabel, percentOff, instantLabel, and badgeLabel from the tool. Clicking asks the analytics agent for details of this exact product. gmvLabel and quantity are optional sales extras.",
  props: z.object({
    name: z.string(),
    imageUrl: z.string(),
    productId: z.string().uuid(),
    priceLabel: z.string().optional(),
    compareAtLabel: z.string().optional(),
    percentOff: z.number().optional(),
    instantLabel: z.string().optional(),
    badgeLabel: z.string().optional(),
    gmvLabel: z.string().optional(),
    quantity: z.number().optional(),
  }),
  component: function ProductCardView({ props }) {
    const { processMessage, isRunning } = useThread()
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
    const productId = props.productId?.trim() || ""
    return (
      <button
        type="button"
        disabled={!productId || isRunning}
        title={productId ? `Show details for ${props.name}` : "Product details are unavailable"}
        onClick={() => {
          void processMessage({
            role: "user",
            content: `Show the details for the exact product "${props.name}" with product ID ${productId}. Use the product_details metric.`,
          })
        }}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card text-left shadow-[var(--shadow-card)] transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
      >
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
          <ProductCardImage src={src} alt={props.name} />
        </div>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
          <h3
            className="line-clamp-2 min-h-[2.75em] font-heading text-[13px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary"
            title={props.name}
          >
            {props.name}
          </h3>
          <div className="mt-1.5 flex h-5 shrink-0 items-center justify-start">
            {instant ? (
              <div className="flex min-w-0 max-w-[90%] items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#e11d48] dark:text-[#fb7185]">
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
      </button>
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

const CityMapContext = createContext(null)

const CityMarker = defineComponent({
  name: "CityMarker",
  description:
    "Marker on the city map. Copy name, state, and imageUrl from catalog_cities. latitude and longitude are optional coordinates.",
  props: z.object({
    name: z.string(),
    state: z.string(),
    imageUrl: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  component: function CityMarkerView({ props }) {
    const context = useContext(CityMapContext)
    const coords = resolveCoordinates(props.name, props.state, props.latitude, props.longitude)
    if (!coords) return null

    const isSelected = context?.selectedCity?.name === props.name

    return (
      <Marker
        latitude={coords[0]}
        longitude={coords[1]}
        anchor="bottom"
        onClick={(event) => {
          event.originalEvent?.stopPropagation?.()
          context?.setSelectedCity?.({
            name: props.name,
            state: props.state,
            imageUrl: props.imageUrl,
            latitude: coords[0],
            longitude: coords[1],
          })
        }}
      >
        <button
          type="button"
          title={`${props.name}, ${props.state}`}
          aria-label={`${props.name}, ${props.state}`}
          className={`flex size-7 items-center justify-center rounded-full border shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isSelected
              ? "border-primary bg-primary text-primary-foreground scale-110 ring-2 ring-primary ring-offset-1"
              : "border-primary/50 bg-background text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <MapPinIcon className="size-3.5" />
        </button>
      </Marker>
    )
  },
})

const CityMap = defineComponent({
  name: "CityMap",
  description:
    "Interactive map with pins for catalog cities. Pass CityMarker items for each city. Never use when empty: true.",
  props: z.object({
    title: z.string(),
    children: z.array(CityMarker.ref),
  }),
  component: function CityMapView({ props, renderNode }) {
    const mapRef = useRef(null)
    const { resolvedTheme } = useTheme()
    const [selectedCity, setSelectedCity] = useState(null)

    const mapStyle = useMemo(
      () => (resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT),
      [resolvedTheme],
    )

    useEffect(() => {
      function resize() {
        mapRef.current?.resize()
      }
      resize()
      const t1 = window.setTimeout(resize, 150)
      const t2 = window.setTimeout(resize, 400)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }, [mapStyle])

    const cityCount = Array.isArray(props.children) ? props.children.length : 0

    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{props.title}</h3>
            <p className="text-xs text-muted-foreground">Interactive map of active service cities</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <MapPinIcon className="size-3.5 text-primary" />
            <span>{cityCount} {cityCount === 1 ? "city" : "cities"}</span>
          </div>
        </div>
        <div className="relative h-72 w-full overflow-hidden bg-muted sm:h-84">
          <CityMapContext.Provider value={{ selectedCity, setSelectedCity }}>
            <Map
              ref={mapRef}
              key={resolvedTheme}
              initialViewState={{
                latitude: INDIA_CENTER[0],
                longitude: INDIA_CENTER[1],
                zoom: 4.6,
              }}
              mapStyle={mapStyle}
              style={{ width: "100%", height: "100%" }}
              attributionControl={{ compact: true }}
              onClick={() => setSelectedCity(null)}
            >
              {renderNode(props.children)}

              {selectedCity ? (
                <Popup
                  latitude={selectedCity.latitude}
                  longitude={selectedCity.longitude}
                  anchor="bottom"
                  offset={14}
                  closeButton
                  closeOnClick={false}
                  onClose={() => setSelectedCity(null)}
                >
                  <div className="flex items-center gap-2.5 p-1 min-w-36">
                    {selectedCity.imageUrl ? (
                      <img
                        src={safeImageUrl(selectedCity.imageUrl)}
                        alt=""
                        className="size-10 rounded-md object-cover ring-1 ring-border shrink-0"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-xs text-foreground leading-tight">{selectedCity.name}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedCity.state}</p>
                    </div>
                  </div>
                </Popup>
              ) : null}
            </Map>
          </CityMapContext.Provider>
        </div>
      </div>
    )
  },
})

const block = z.union([
  Metric.ref,
  DataTable.ref,
  Callout.ref,
  BarChart.ref,
  LineChart.ref,
  AreaChart.ref,
  PieChart.ref,
  ProductGrid.ref,
  ProductCard.ref,
  AddonGrid.ref,
  AddonCard.ref,
  MediaGrid.ref,
  MediaCard.ref,
  CityMap.ref,
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
    LineChart,
    AreaChart,
    PieChart,
    ProductGrid,
    ProductCard,
    AddonGrid,
    AddonCard,
    MediaGrid,
    MediaCard,
    CityMap,
    CityMarker,
  ],
})
