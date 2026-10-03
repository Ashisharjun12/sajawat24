import { useNavigate } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingStatusBadge } from "@/module/bookings/components/BookingStatusBadge"
import { clipText, formatBookingSlot } from "@/module/bookings/lib/booking-format"
import { formatInr } from "@/module/payouts/lib/payout-format"

const SKELETON_ROWS = 6

export function CodPendingOrdersTable({ items, loading }) {
  const navigate = useNavigate()

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
            <TableHead className="w-[16%]">Booking</TableHead>
            <TableHead className="w-[22%]">Customer</TableHead>
            <TableHead className="w-[16%]">City</TableHead>
            <TableHead className="w-[14%]">Amount</TableHead>
            <TableHead className="w-[16%]">Status</TableHead>
            <TableHead className="w-[16%]">Scheduled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const slotFull = formatBookingSlot(row.scheduledAt)
            const cityFull = row.pincode ? `${row.cityName} · ${row.pincode}` : row.cityName

            return (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/bookings/${row.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  <span title={row.reference}>{clipText(row.reference, 14)}</span>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{clipText(row.customerName, 12)}</div>
                  {row.customerPhone ? (
                    <div className="font-mono text-xs text-muted-foreground">
                      {row.customerPhone}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm" title={cityFull}>
                  {clipText(cityFull, 14)}
                </TableCell>
                <TableCell className="tabular-nums text-sm">{formatInr(row.subtotalPaise)}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={row.status} className="max-w-full truncate" />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground" title={slotFull}>
                  {clipText(slotFull, 16)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
