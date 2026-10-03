import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  promotionStatusBadgeClass,
  promotionStatusLabel,
} from "@/module/promotions/lib/promotion-status"

export function PromotionStatusBadge({ status, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-transparent font-medium",
        promotionStatusBadgeClass(status),
        className,
      )}
    >
      {promotionStatusLabel(status)}
    </Badge>
  )
}
