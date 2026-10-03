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
import { formatInr, formatPayoutStatus } from "@/module/payouts/lib/payout-format"

const SKELETON_ROWS = 6

function statusVariant(status) {
  if (status === "paid") return "secondary"
  if (status === "failed") return "destructive"
  if (status === "processing") return "outline"
  return "default"
}

export function PayoutRequestsTable({ items, loading, onRowClick }) {
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
            <TableHead className="w-[32%]">Vendor</TableHead>
            <TableHead className="w-[20%]">Amount</TableHead>
            <TableHead className="w-[24%]">Status</TableHead>
            <TableHead className="w-[24%]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow
              key={row.id}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}>
              <TableCell className="font-medium">
                {row.vendorId ? (
                  <Link to={`/people/vendors/${row.vendorId}`} className="hover:underline">
                    {row.vendorName}
                  </Link>
                ) : (
                  row.vendorName
                )}
              </TableCell>
              <TableCell className="tabular-nums">{formatInr(row.amountPaise)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>{formatPayoutStatus(row.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(row.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
