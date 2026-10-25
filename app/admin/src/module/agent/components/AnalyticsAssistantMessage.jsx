import { useMemo } from "react"
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

function latestToolPayload(messages) {
  const tools = toolsAfterLastUser(messages)
  for (let index = tools.length - 1; index >= 0; index -= 1) {
    const message = tools[index]
    const found =
      extractPayload(message?.content) ?? extractPayload(parseJsonLoose(flattenContent(message?.content)))
    if (found) return found
  }
  return null
}

function isImageUrl(value) {
  if (typeof value !== "string") return false
  const src = value.trim()
  if (!/^https?:\/\//i.test(src)) return false
  return /\.(webp|png|jpe?g|gif|avif|svg)(\?|#|$)/i.test(src) || /\/uploads\/image\//i.test(src)
}

function CityThumb({ src, alt }) {
  if (!isImageUrl(src)) {
    return <span className="inline-block size-8 shrink-0 rounded-full bg-muted ring-1 ring-border" aria-hidden />
  }
  return (
    <img src={src} alt={alt || ""} className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border" />
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

function ToolResultView({ payload }) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const isMedia =
    payload.metric === "catalog_media" ||
    (items.length > 0 && items.some((item) => item.imageUrl) && items.every((item) => !item.state && !item.slug))
  const isCities =
    payload.metric === "catalog_cities" ||
    (items.length > 0 && items.every((item) => item.name && item.state != null))

  if (payload.empty === true || (items.length === 0 && (!payload.rows || payload.rows.length === 0))) {
    return (
      <Alert>
        <AlertTitle>No data</AlertTitle>
        <AlertDescription>{payload.emptyMessage || "Nothing matched this question."}</AlertDescription>
      </Alert>
    )
  }

  if (isMedia && items.length > 0) {
    return <MediaFallbackGrid items={items} />
  }

  if (isCities && items.length > 0) {
    return (
      <ResultTable
        columns={["image", "name", "slug", "state"]}
        rows={items.map((item) => [item.imageUrl || "", item.name, item.slug || "", item.state || ""])}
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

export function AnalyticsAssistantMessage({ message, isStreaming }) {
  const messages = useThread((state) => state.messages)
  const content = messageText(message)
  const payload = useMemo(() => latestToolPayload(messages), [messages])
  const fallback = payload ? <ToolResultView payload={payload} /> : null

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
