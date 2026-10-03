import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  customerStatusBadgeClass,
  customerStatusLabel,
} from "@/module/people/lib/customer-status"

export function CustomerStatusBadge({ status, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-transparent font-medium",
        customerStatusBadgeClass(status),
        className,
      )}
    >
      {customerStatusLabel(status)}
    </Badge>
  )
}
