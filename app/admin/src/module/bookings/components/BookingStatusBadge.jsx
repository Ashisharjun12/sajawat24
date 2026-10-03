import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  bookingStatusBadgeClass,
  bookingStatusLabel,
} from "@/module/bookings/lib/booking-status"

export function BookingStatusBadge({ status, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-transparent font-medium",
        bookingStatusBadgeClass(status),
        className,
      )}
    >
      {bookingStatusLabel(status)}
    </Badge>
  )
}
