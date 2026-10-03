import { useEffect, useMemo, useState } from "react"
import { PaletteIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AddonColorFormDialog } from "@/module/catalog/components/AddonColorFormDialog"
import { AddonColorsTable, ColorSwatch } from "@/module/catalog/components/AddonColorsTable"
import { ListPagination } from "@/module/geo/components/ListPagination"

export { ColorSwatch }

const LIMIT = 20

export function AddonColorField({
  colors,
  colorIds = [],
  onColorIdsChange,
  onCreated,
  onUpdated,
  multiple = false,
  disabled,
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const items = useMemo(() => colors ?? [], [colors])
  const matched = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (color) => color.name.toLowerCase().includes(term) || (color.hex || "").toLowerCase().includes(term),
    )
  }, [items, q])
  const paged = useMemo(() => {
    const start = (page - 1) * LIMIT
    return matched.slice(start, start + LIMIT)
  }, [matched, page])
  const dialogOpen = createOpen || Boolean(editing)
  const empty = matched.length === 0

  useEffect(() => {
    setPage(1)
  }, [q])

  function toggleColor(id) {
    if (disabled) return
    if (multiple) {
      onColorIdsChange(colorIds.includes(id) ? colorIds.filter((row) => row !== id) : [...colorIds, id])
      return
    }
    onColorIdsChange(colorIds[0] === id ? [] : [id])
  }

  function closeDialog() {
    setCreateOpen(false)
    setEditing(null)
  }

  return (
    <Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel>Color</FieldLabel>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Create color
        </Button>
      </div>
      {items.length ? (
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search colors"
          aria-label="Search colors"
          disabled={disabled}
        />
      ) : null}
      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PaletteIcon />
            </EmptyMedia>
            <EmptyTitle>{q.trim() ? "No colors match" : "No colors yet"}</EmptyTitle>
            <EmptyDescription>
              {q.trim()
                ? "Try a different name or hex."
                : "Create a color, then select it. Leave none selected for cake."}
            </EmptyDescription>
          </EmptyHeader>
          {q.trim() ? null : (
            <EmptyContent>
              <Button type="button" disabled={disabled} onClick={() => setCreateOpen(true)}>
                Create color
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <AddonColorsTable
            items={paged}
            selectedIds={colorIds}
            multiple={multiple}
            disabled={disabled}
            onToggle={toggleColor}
            onEdit={setEditing}
          />
          <ListPagination page={page} limit={LIMIT} total={matched.length} onPageChange={setPage} />
        </div>
      )}
      <FieldDescription>
        {multiple
          ? "Leave none selected for cake. Each selected color creates its own add-on."
          : "Leave none selected for cake. Pick one color for this add-on."}
      </FieldDescription>
      <AddonColorFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
        color={editing}
        colors={items}
        disabled={disabled}
        onSaved={(saved) => {
          if (editing) {
            onUpdated?.(saved)
          } else {
            onCreated(saved)
            if (multiple) {
              onColorIdsChange([...colorIds, saved.id])
            } else {
              onColorIdsChange([saved.id])
            }
          }
        }}
      />
    </Field>
  )
}
