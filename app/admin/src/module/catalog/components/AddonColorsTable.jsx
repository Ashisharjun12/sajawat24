import { format } from "date-fns"
import { MoreHorizontalIcon, PencilIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function ColorSwatch({ hex, className }) {
  if (!hex) return null
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-sm border border-black/15 dark:border-white/20", className)}
      style={{ backgroundColor: hex }}
      aria-hidden
    />
  )
}

export function AddonColorsTable({
  items,
  loading,
  selectedIds = [],
  multiple = false,
  disabled,
  onToggle,
  onEdit,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="w-14">Swatch</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Hex</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((color) => {
          const checked = selectedIds.includes(color.id)
          return (
            <TableRow
              key={color.id}
              className={cn("cursor-pointer", checked && "bg-muted/40")}
              onClick={() => {
                if (!disabled) onToggle(color.id)
              }}
            >
              <TableCell>
                <span onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={() => onToggle(color.id)}
                    aria-label={`Select ${color.name}`}
                  />
                </span>
              </TableCell>
              <TableCell>
                <ColorSwatch hex={color.hex} className="size-5 rounded-full" />
              </TableCell>
              <TableCell className="font-medium">{color.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{color.hex}</TableCell>
              <TableCell className="text-muted-foreground">
                {color.updatedAt ? format(new Date(color.updatedAt), "d MMM yyyy") : "—"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled}
                        aria-label={`Actions for ${color.name}`}
                        onClick={(event) => event.stopPropagation()}
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(color)
                      }}
                    >
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
