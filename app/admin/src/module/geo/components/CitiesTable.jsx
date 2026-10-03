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

export function CitiesTable({ items, loading, onEdit, onToggleActive }) {
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
          <TableHead className="w-14">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((city) => (
          <TableRow key={city.id}>
            <TableCell>
              {city.image?.url ? (
                <img
                  src={city.image.url}
                  alt=""
                  className="size-10 rounded-lg object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell className="font-medium">{city.name}</TableCell>
            <TableCell className="text-muted-foreground">{city.slug}</TableCell>
            <TableCell>{city.state}</TableCell>
            <TableCell>
              <Switch
                checked={city.isActive}
                onCheckedChange={(checked) => onToggleActive(city, checked)}
                aria-label={`Set ${city.name} ${city.isActive ? "inactive" : "active"}`}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {city.updatedAt ? format(new Date(city.updatedAt), "d MMM yyyy") : "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${city.name}`}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(city)}>
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
