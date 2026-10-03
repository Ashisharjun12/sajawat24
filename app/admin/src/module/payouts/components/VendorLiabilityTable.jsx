import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
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

const SKELETON_ROWS = 6

export function VendorLiabilityTable({ items, loading }) {
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
            <TableHead className="w-[28%]">Vendor</TableHead>
            <TableHead className="w-[16%]">Pending</TableHead>
            <TableHead className="w-[16%]">Available</TableHead>
            <TableHead className="w-[16%]">COD dues</TableHead>
            <TableHead className="w-[24%]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.vendorId}>
              <TableCell>
                <Link
                  to={`/people/vendors/${row.vendorId}`}
                  className="font-medium hover:underline"
                >
                  {row.name}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">{row.phone}</p>
              </TableCell>
              <TableCell className="tabular-nums">{formatInr(row.pendingPaise)}</TableCell>
              <TableCell className="tabular-nums">{formatInr(row.availablePaise)}</TableCell>
              <TableCell className="tabular-nums">{formatInr(row.codDuesPaise)}</TableCell>
              <TableCell>
                {row.assignable ? (
                  <Badge variant="secondary">Assignable</Badge>
                ) : (
                  <Badge variant="destructive">COD cap exceeded</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
