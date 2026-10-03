import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AddonThumb } from "@/module/catalog/components/AddonThumb"

function clipName(name, max = 40) {
  const text = String(name ?? "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export function CouponCategoryPickerTable({
  items,
  selectedIds,
  parentMap = {},
  onToggle,
  loading,
}) {
  if (loading && !items.length) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="w-14">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-28">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((category) => {
          const checked = selectedIds.has(category.id)
          const groupName = category.parentId
            ? parentMap[category.parentId] ?? "Subcategory"
            : "Top level"

          return (
            <TableRow
              key={category.id}
              className={cn("cursor-pointer", checked && "bg-primary/5")}
              onClick={() => onToggle(category)}
            >
              <TableCell onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggle(category)}
                  aria-label={`Select ${category.name}`}
                />
              </TableCell>
              <TableCell>
                <AddonThumb addon={category} className="rounded-lg" />
              </TableCell>
              <TableCell>
                <div className="font-medium">{clipName(category.name)}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{groupName}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    category.isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {category.isActive ? "Published" : "Draft"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {category.updatedAt
                  ? format(new Date(category.updatedAt), "d MMM yyyy")
                  : "—"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
