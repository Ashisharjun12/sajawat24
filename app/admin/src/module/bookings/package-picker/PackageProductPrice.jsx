import { Badge } from "@/components/ui/badge"
import { formatInr } from "@/module/bookings/package-picker/package-picker.utils"

export function PackageProductPrice({ pricePaise, compareAtPaise, cityName, compact = false }) {
  if (pricePaise == null) {
    return (
      <p className="text-sm text-muted-foreground">
        {cityName ? `No price for ${cityName}` : "Select a city to see pricing"}
      </p>
    )
  }

  const savedPaise =
    compareAtPaise != null && compareAtPaise > pricePaise ? compareAtPaise - pricePaise : 0
  const percentOff =
    compareAtPaise != null && compareAtPaise > pricePaise
      ? Math.round((1 - pricePaise / compareAtPaise) * 100)
      : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className={
            compact
              ? "font-heading text-lg font-semibold tracking-tight tabular-nums"
              : "font-heading text-2xl font-medium tracking-tight tabular-nums"
          }
        >
          {formatInr(pricePaise)}
        </span>
        {compareAtPaise != null && compareAtPaise > pricePaise ? (
          <span className="font-normal text-muted-foreground line-through tabular-nums">
            {formatInr(compareAtPaise)}
          </span>
        ) : null}
        {percentOff > 0 ? (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
            {percentOff}% off
          </Badge>
        ) : null}
      </div>
      {!compact && savedPaise > 0 ? (
        <p className="text-sm">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            You save {formatInr(savedPaise)}
          </span>
          <span className="text-muted-foreground"> · Inclusive of all charges and setup</span>
        </p>
      ) : !compact ? (
        <p className="text-sm text-muted-foreground">Inclusive of all charges and setup</p>
      ) : null}
    </div>
  )
}
