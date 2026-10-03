import { useNavigate } from "react-router-dom"
import { formatPaise } from "@/lib/money"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BookingStatusBadge } from "@/module/bookings/components/BookingStatusBadge"
import {
  dispatchStatusLabel,
  dispatchStatusVariant,
  fulfillmentTypeLabel,
} from "@/module/bookings/lib/instant-dispatch-ui"
import {
  formatBookingSlot,
  formatPaymentMethodShort,
} from "@/module/bookings/lib/booking-format"

const SKELETON_ROWS = 6

function CellText({ children, title, className = "" }) {
  const text = children ?? "—"
  return (
    <span className={`block truncate ${className}`} title={title ?? (typeof text === "string" ? text : undefined)}>
      {text}
    </span>
  )
}

export function BookingsTable({ items, loading }) {
  const navigate = useNavigate()

  function openBooking(id) {
    navigate(`/bookings/${id}`)
  }

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
    <div className="w-full overflow-x-auto">
      <Table className="w-full min-w-[52rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[9.5rem]">Reference</TableHead>
            <TableHead className="min-w-[10rem] whitespace-nowrap">Setup slot</TableHead>
            <TableHead className="min-w-[7.5rem]">Type</TableHead>
            <TableHead className="min-w-[7rem]">City</TableHead>
            <TableHead className="min-w-[8.5rem]">Customer</TableHead>
            <TableHead className="min-w-[5rem]">Payment</TableHead>
            <TableHead className="min-w-[7rem]">Status</TableHead>
            <TableHead className="min-w-[5.5rem] text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((booking) => {
            const slotLabel = formatBookingSlot(booking.scheduledAt)
            const cityFull = [booking.cityName, booking.pincode].filter(Boolean).join(" · ")

            return (
              <TableRow
                key={booking.id}
                className="cursor-pointer"
                onClick={() => openBooking(booking.id)}
              >
                <TableCell className="max-w-[11rem] text-sm">
                  <CellText className="font-mono text-xs sm:text-sm" title={booking.reference}>
                    {booking.reference || "—"}
                  </CellText>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm" title={slotLabel}>
                  {slotLabel}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col items-start gap-1">
                    {booking.fulfillmentType === "instant" ? (
                      <Badge variant="outline" className="w-fit shrink-0 text-[10px] px-1.5 py-0">
                        {fulfillmentTypeLabel(booking.fulfillmentType)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs whitespace-nowrap">Scheduled</span>
                    )}
                    {booking.fulfillmentType === "instant" && booking.dispatchStatus !== "idle" ? (
                      <Badge
                        variant={dispatchStatusVariant(booking.dispatchStatus)}
                        className="w-fit max-w-full shrink-0 text-[10px] px-1.5 py-0"
                        title={dispatchStatusLabel(booking.dispatchStatus)}
                      >
                        <span className="truncate">{dispatchStatusLabel(booking.dispatchStatus)}</span>
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[9rem] text-sm" title={cityFull}>
                  <CellText>{cityFull || "—"}</CellText>
                </TableCell>
                <TableCell className="max-w-[10rem] text-sm">
                  <CellText className="font-medium" title={booking.customerName}>
                    {booking.customerName || "—"}
                  </CellText>
                  <CellText className="text-muted-foreground font-mono text-xs" title={booking.customerPhone}>
                    {booking.customerPhone || "—"}
                  </CellText>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  <div className="flex flex-wrap items-center gap-1">
                    <span>{formatPaymentMethodShort(booking.paymentMethod)}</span>
                    {booking.source === "admin" ? (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Admin
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} className="whitespace-nowrap" />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">
                  ₹{formatPaise(booking.subtotalPaise)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
