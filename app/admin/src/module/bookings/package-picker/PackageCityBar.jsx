import { MapPinIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function PackageCityBar({ selectedCity }) {
  const cityLabel = selectedCity?.name?.trim() || "Select city on the left"

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-4xl bg-emerald-600/10 px-4 py-3">
      <MapPinIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="truncate font-medium">{cityLabel}</span>
      {selectedCity ? (
        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
          Available
        </Badge>
      ) : null}
    </div>
  )
}
