import { CopyIcon, MoreHorizontalIcon, PencilIcon, PowerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { PromotionStatusBadge } from "@/module/promotions/components/PromotionStatusBadge"
import {
  formatDiscount,
  formatUsage,
  formatValidity,
} from "@/module/promotions/lib/promotion-format"
import { formatInr } from "@/module/payouts/lib/payout-format"

const SKELETON_ROWS = 5

export function PromotionsTable({
  items,
  loading = false,
  onEdit,
  onToggleStatus,
  onCopyCode,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[11%]">Code</TableHead>
            <TableHead className="w-[18%]">Name</TableHead>
            <TableHead className="w-[10%]">Discount</TableHead>
            <TableHead className="w-[10%]">Min order</TableHead>
            <TableHead className="w-[9%]">Usage</TableHead>
            <TableHead className="w-[11%]">City</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="w-[17%]">Validity</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-sm font-medium">{row.code}</TableCell>
              <TableCell className="truncate font-medium" title={row.name}>
                <span className="block truncate">{row.name}</span>
                <span
                  className="block truncate text-xs text-muted-foreground"
                  title={row.description || row.eligibilitySummary}
                >
                  {row.description || row.eligibilitySummary || "—"}
                </span>
              </TableCell>
              <TableCell>{formatDiscount(row)}</TableCell>
              <TableCell className="tabular-nums">
                {row.minOrderPaise ? formatInr(row.minOrderPaise) : "—"}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatUsage(row)}
              </TableCell>
              <TableCell className="truncate text-muted-foreground" title={row.cityName}>
                {row.cityName}
              </TableCell>
              <TableCell>
                <PromotionStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatValidity(row)}</TableCell>
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
                    <DropdownMenuItem onClick={() => onEdit?.(row)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyCode?.(row.code)}>
                      <CopyIcon />
                      Copy code
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleStatus?.(row)}>
                      <PowerIcon />
                      {row.status === "disabled" ? "Enable" : "Disable"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
