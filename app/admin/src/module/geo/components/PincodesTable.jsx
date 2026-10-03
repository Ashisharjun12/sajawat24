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

export function PincodesTable({ items, citiesById, loading, onEdit, onToggleServiceable }) {
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
          <TableHead>Code</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Locality</TableHead>
          <TableHead>Serviceable</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.code}</TableCell>
            <TableCell>{citiesById.get(row.cityId)?.name || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{row.locality || "—"}</TableCell>
            <TableCell>
              <Switch
                checked={row.isServiceable}
                onCheckedChange={(checked) => onToggleServiceable(row, checked)}
                aria-label={`Set ${row.code} ${row.isServiceable ? "unserviceable" : "serviceable"}`}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {row.updatedAt ? format(new Date(row.updatedAt), "d MMM yyyy") : "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${row.code}`}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(row)}>
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
