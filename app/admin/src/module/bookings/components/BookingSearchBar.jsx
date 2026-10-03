import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function BookingSearchBar({ value, onChange, className }) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={onChange}
        placeholder="Search reference, order ID, phone, name, or pincode"
        aria-label="Search bookings"
        className="h-10 w-full pl-9"
      />
    </div>
  )
}
