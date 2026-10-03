import { Badge } from "@/components/ui/badge"
import { formatInr } from "@/module/bookings/package-picker/package-picker.utils"

export function PackageAddonPrice({ pricePaise, compareAtPaise }) {
  const isFree = pricePaise == null || pricePaise === 0

  if (isFree) {
    return (
      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Free</span>
    )
  }

  const percentOff =
    compareAtPaise != null && compareAtPaise > pricePaise
      ? Math.round((1 - pricePaise / compareAtPaise) * 100)
      : 0

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-sm font-semibold tabular-nums">{formatInr(pricePaise)}</span>
      {compareAtPaise != null && compareAtPaise > pricePaise ? (
        <span className="text-sm font-normal text-muted-foreground line-through tabular-nums">
          {formatInr(compareAtPaise)}
        </span>
      ) : null}
      {percentOff > 0 ? (
        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
          {percentOff}% off
        </Badge>
      ) : null}
    </div>
  )
}
