import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInr } from "@/module/payouts/lib/payout-format"
import { formatRedeemedAt } from "@/module/promotions/lib/promotion-format"

const SKELETON_ROWS = 5

export function PromotionsRedemptionsTable({ items, loading = false }) {
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
            <TableHead className="w-[22%]">Redeemed at</TableHead>
            <TableHead className="w-[14%]">Coupon</TableHead>
            <TableHead className="w-[14%]">Order</TableHead>
            <TableHead className="w-[22%]">Customer</TableHead>
            <TableHead className="w-[14%]">Phone</TableHead>
            <TableHead className="w-[14%]">Discount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground">
                {formatRedeemedAt(row.redeemedAt)}
              </TableCell>
              <TableCell className="font-mono text-sm font-medium">{row.couponCode}</TableCell>
              <TableCell className="font-mono text-sm">{row.orderReference}</TableCell>
              <TableCell className="font-medium">{row.customerName}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {row.customerPhone}
              </TableCell>
              <TableCell className="tabular-nums">{formatInr(row.discountPaise)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
