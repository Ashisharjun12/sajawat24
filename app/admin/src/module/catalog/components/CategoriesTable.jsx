import { format } from "date-fns"
import { MoreHorizontalIcon, PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AddonThumb } from "@/module/catalog/components/AddonThumb"

export function CategoriesTable({ items, loading, onOpen, onEdit, onToggleActive }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((category) => (
          <TableRow
            key={category.id}
            className={onOpen ? "cursor-pointer" : undefined}
            onClick={onOpen ? () => onOpen(category) : undefined}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <AddonThumb addon={category} className="rounded-full" />
                <span className="font-medium">{category.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{category.slug}</TableCell>
            <TableCell>
              <Switch
                checked={category.isActive}
                onCheckedChange={(checked) => onToggleActive(category, checked)}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Set ${category.name} ${category.isActive ? "inactive" : "active"}`}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {category.updatedAt ? format(new Date(category.updatedAt), "d MMM yyyy") : "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${category.name}`}
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
                      onEdit(category)
                    }}
                  >
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
