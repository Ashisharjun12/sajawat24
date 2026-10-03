import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BOOKING_STATUS_OPTIONS } from "@/module/bookings/lib/booking-status"
import { PAYOUT_STATUS_OPTIONS, formatPayoutStatus } from "@/module/payouts/lib/payout-format"

function PayoutSearchBar({ value, onChange, placeholder, label }) {
  return (
    <div className="relative min-w-0 w-full max-w-sm">
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 pl-9"
      />
    </div>
  )
}

export function CodPendingFilters({ q, status, onQ, onStatus }) {
  const statusLabel =
    BOOKING_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? "All statuses"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PayoutSearchBar
        value={q}
        onChange={onQ}
        placeholder="Search reference, customer, phone, or city"
        label="Search awaiting collection"
      />
      <Select value={status || "all"} onValueChange={(value) => onStatus(value === "all" ? "" : value)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses">{status ? statusLabel : "All statuses"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {BOOKING_STATUS_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function VendorLiabilityFilters({ q, onQ }) {
  return (
    <PayoutSearchBar
      value={q}
      onChange={onQ}
      placeholder="Search vendor name or phone"
      label="Search vendors"
    />
  )
}

export function PayoutRequestFilters({ q, status, onQ, onStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PayoutSearchBar
        value={q}
        onChange={onQ}
        placeholder="Search vendor name or phone"
        label="Search payout requests"
      />
      <Select value={status || "all"} onValueChange={(value) => onStatus(value === "all" ? "" : value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses">
            {status ? formatPayoutStatus(status) : "All statuses"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {PAYOUT_STATUS_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
