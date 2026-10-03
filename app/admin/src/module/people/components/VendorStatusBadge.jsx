import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  vendorStatusBadgeClass,
  vendorStatusLabel,
} from "@/module/people/lib/vendor-status"

export function VendorStatusBadge({ status, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-transparent font-medium",
        vendorStatusBadgeClass(status),
        className,
      )}
    >
      {vendorStatusLabel(status)}
    </Badge>
  )
}
