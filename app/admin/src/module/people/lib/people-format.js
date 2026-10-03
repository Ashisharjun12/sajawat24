import { format } from "date-fns"

export { clipText } from "@/module/bookings/lib/booking-format"

export function formatJoinedDate(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "d MMM yyyy")
  } catch {
    return "—"
  }
}
